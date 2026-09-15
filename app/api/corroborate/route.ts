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

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do',
  'does', 'did', 'over', 'against', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'under', 'following', 'that', 'this', 'these',
  'those', 'and', 'or', 'but', 'if', 'while', 'because', 'such', 'regarding',
  'alleged', 'allegedly', 'reportedly', 'according'
]);

function buildSearchQuery(title: string, quote: string): string {
  const cleanTitle = (title || '')
    .replace(/\s*[-|–—:]\s*(The Hindu|Times of India|NDTV|Indian Express|Hindustan Times|BBC|Reuters|CNN|Livemint|Scroll|Wire|Deccan Herald|News18|India Today).*$/i, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();

  const titleWords = cleanTitle
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()));

  if (titleWords.length >= 3) {
    return titleWords.slice(0, 6).join(' ');
  }

  const cleanQuote = (quote || '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();
  const quoteWords = cleanQuote
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));

  const combined = Array.from(new Set([...titleWords, ...quoteWords]));
  return (combined.length > 0 ? combined.slice(0, 6).join(' ') : cleanQuote.slice(0, 70)).trim();
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
    const rawTitle = body.articleTitle ? String(body.articleTitle).trim() : '';
    const publisher = body.articlePublisher ? String(body.articlePublisher).trim() : '';

    // Formulate a high-relevance search query using key subject terms
    const searchQuery = buildSearchQuery(rawTitle, quote);
    const cacheKey = `${searchQuery}_${rawTitle}`.toLowerCase();

    // Check cache first (0 tokens spent!)
    if (corroborationCache.has(cacheKey)) {
      return NextResponse.json(corroborationCache.get(cacheKey));
    }

    // 1. Fetch live web results with intelligent fallback
    let webSources = await searchWebSources(searchQuery);

    // If specific combination returned 0 results, retry with cleaned raw title or quote
    if (webSources.length === 0 && rawTitle) {
      const fallbackQuery = rawTitle.slice(0, 70).replace(/["'“”‘’]/g, ' ').trim();
      webSources = await searchWebSources(fallbackQuery);
    }

    const groqKey = process.env.GROQ_API_KEY?.trim();
    let verdict: 'corroborated' | 'contested' | 'unverified' = 'unverified';
    let summary = '';

    // 2. Token-efficient synthesis using qwen/qwen3.8-27b
    if (groqKey && !groqKey.includes('gsk_...')) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const candidateModels = ['qwen/qwen3.8-27b', 'groq/compound-mini'];

        for (const fastModel of candidateModels) {
          try {
            const completion = await groq.chat.completions.create({
              model: fastModel,
              temperature: 0.1,
              max_tokens: 180, // Hard limit to save tokens
              response_format: { type: 'json_object' },
              messages: [
                {
                  role: 'system',
                  content: `You are PERSPECTA's Empirical Corroboration Engine.
Synthesize if the excerpt is corroborated, contested, or unverified based on the live search results. Do not express political bias.
JSON schema:
{
  "verdict": "corroborated" | "contested" | "unverified",
  "summary": "1 concise sentence explaining what live news/records state regarding this topic."
}`,
                },
                {
                  role: 'user',
                  content: `Article Topic: ${rawTitle || 'News Topic'}
Claim/Excerpt Under Review: "${quote}"
Context: ${context || 'Editorial framing analysis'}
Search snippets:
${webSources.map((s, i) => `${i + 1}. [${s.domain}] ${s.snippet}`).join('\n')}`,
                },
              ],
            });

            const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
            if (parsed.verdict || parsed.summary) {
              verdict = parsed.verdict || 'unverified';
              summary = parsed.summary || '';
              break;
            }
          } catch (modelErr) {
            console.warn(`Corroboration synthesis with ${fastModel} failed, trying next:`, modelErr);
          }
        }
      } catch (llmErr) {
        console.warn('Groq fast corroboration error, falling back to heuristic:', llmErr);
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
