import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';

export const runtime = 'nodejs';

export interface WebCorroborationResult {
  query: string;
  verdict: 'corroborated' | 'contested' | 'unverified';
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
}

import { tavily } from '@tavily/core';

// In-memory cache to save 100% of tokens on repeated queries
const corroborationCache = new Map<string, WebCorroborationResult>();

/**
 * Searches the web via Tavily Search API or fallback search scraper and extracts relevant editorial evidence.
 */
async function searchWebSources(query: string) {
  const tavilyApiKey = process.env.TAVILY_API_KEY?.trim();

  // 1. Tavily AI Search (Preferred agentic search)
  if (tavilyApiKey && !tavilyApiKey.includes('tvly-...')) {
    try {
      const tvly = tavily({ apiKey: tavilyApiKey });
      const searchResults = await tvly.search(query, {
        topic: 'news',
        maxResults: 3,
        searchDepth: 'basic',
      });

      if (searchResults && searchResults.results && searchResults.results.length > 0) {
        return searchResults.results.map((r: any) => {
          let domain = '';
          try {
            domain = new URL(r.url).hostname.replace(/^www\./, '');
          } catch {}
          return {
            title: r.title || 'Referenced Source',
            url: r.url,
            snippet: r.content || '',
            domain: domain || 'news-source',
          };
        });
      }
    } catch (tavilyErr) {
      console.warn('Tavily Search API encountered error, falling back to web scraper:', tavilyErr);
    }
  }

  // 2. Resilient Fallback Search Scraper
  try {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PERSPECTA/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const items: Array<{ title: string; url: string; snippet: string; domain: string }> = [];

    $('.result').each((i, el) => {
      if (items.length >= 3) return;
      const title = $(el).find('.result__title a').text().trim();
      let rawUrl = $(el).find('.result__url').attr('href') || $(el).find('.result__title a').attr('href') || '';
      const snippet = $(el).find('.result__snippet').text().trim();

      if (rawUrl.includes('uddg=')) {
        try {
          const match = rawUrl.match(/uddg=([^&]+)/);
          if (match) rawUrl = decodeURIComponent(match[1]);
        } catch {}
      }

      let domain = '';
      try {
        if (rawUrl.startsWith('http')) {
          domain = new URL(rawUrl).hostname.replace(/^www\./, '');
        }
      } catch {}

      if (title && snippet) {
        items.push({
          title,
          url: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
          snippet,
          domain: domain || 'news-source',
        });
      }
    });

    return items;
  } catch (err) {
    console.warn('Live search fetch error:', err);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.quote) {
      return NextResponse.json(
        { error: 'Quote text is required for web corroboration.' },
        { status: 400 }
      );
    }

    const quote = String(body.quote).trim();
    const context = body.context ? String(body.context).trim() : '';

    // Formulate a compact search query
    const searchQuery = `${quote}`.slice(0, 80).trim();
    const cacheKey = searchQuery.toLowerCase();

    // Check cache first (0 tokens spent!)
    if (corroborationCache.has(cacheKey)) {
      return NextResponse.json(corroborationCache.get(cacheKey));
    }

    // 1. Fetch live web results
    const webSources = await searchWebSources(searchQuery);

    const groqKey = process.env.GROQ_API_KEY?.trim();
    let verdict: 'corroborated' | 'contested' | 'unverified' = 'unverified';
    let summary = '';

    // 2. Token-efficient synthesis using llama-3.1-8b-instant (15x cheaper & lighter than 70B!)
    if (groqKey && !groqKey.includes('gsk_...')) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        // Use high-throughput lightweight 8B model to save tokens and avoid quota limits
        const fastModel = 'llama-3.1-8b-instant';

        const completion = await groq.chat.completions.create({
          model: fastModel,
          temperature: 0.1,
          max_tokens: 150, // Hard limit to save tokens
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are PERSPECTA's Empirical Corroboration Engine.
Synthesize if the excerpt is corroborated, contested, or unverified based on search results. Do not express political bias.
JSON schema:
{
  "verdict": "corroborated" | "contested" | "unverified",
  "summary": "1 concise sentence explaining what live news/records state."
}`,
            },
            {
              role: 'user',
              content: `Quote: "${quote}"
Search snippets:
${webSources.map((s, i) => `${i + 1}. [${s.domain}] ${s.snippet}`).join('\n')}`,
            },
          ],
        });

        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        verdict = parsed.verdict || 'unverified';
        summary = parsed.summary || '';
      } catch (llmErr) {
        console.warn('Groq fast corroboration error, falling back to zero-token heuristic:', llmErr);
      }
    }

    // Zero-token heuristic fallback if Groq quota is exhausted or missing
    if (!summary) {
      if (webSources.length > 0) {
        verdict = 'corroborated';
        summary = `Identified ${webSources.length} external news records referencing this topic. Review the sources below for primary figures and context.`;
      } else {
        verdict = 'unverified';
        summary = 'No immediate corroborating press releases or statistical databases were matched for this specific excerpt.';
      }
    }

    const payload: WebCorroborationResult = {
      query: searchQuery,
      verdict,
      summary,
      sources: webSources,
    };

    // Cache result
    corroborationCache.set(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Fatal error in /api/corroborate:', error);
    return NextResponse.json(
      { error: 'Failed to complete web corroboration.' },
      { status: 500 }
    );
  }
}
