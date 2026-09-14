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

/**
 * Searches the web via public search endpoints and extracts relevant editorial evidence.
 */
async function searchWebSources(query: string) {
  try {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PERSPECTA/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return [];
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const items: Array<{ title: string; url: string; snippet: string; domain: string }> = [];

    $('.result').each((i, el) => {
      if (items.length >= 4) return;
      const title = $(el).find('.result__title a').text().trim();
      let rawUrl = $(el).find('.result__url').attr('href') || $(el).find('.result__title a').attr('href') || '';
      const snippet = $(el).find('.result__snippet').text().trim();

      // Clean redirect URLs if DuckDuckGo wrapped
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
          domain: domain || 'news-archive',
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
    const category = body.category || 'claims';

    // Formulate a precise corroboration search query
    const searchQuery = `${quote} ${context}`.slice(0, 120).trim();

    // 1. Fetch live web results
    const webSources = await searchWebSources(searchQuery);

    // 2. Synthesize using Groq if available, or structured heuristic synthesis
    const groqKey = process.env.GROQ_API_KEY?.trim();
    let verdict: 'corroborated' | 'contested' | 'unverified' = 'unverified';
    let summary = '';

    if (groqKey && !groqKey.includes('gsk_...')) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

        const completion = await groq.chat.completions.create({
          model,
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are PERSPECTA's Empirical Corroboration Engine.
Your task is to examine the provided target quote from a news article alongside real-time web search results.
Synthesize whether the empirical claim is corroborated by primary documentation/news records, contested by counter-sources, or unverified.
STRICT RULE: Do NOT declare political bias or express partisan opinions. Focus strictly on factual corroboration and citing domain sources.

Respond strictly in valid JSON:
{
  "verdict": "corroborated" | "contested" | "unverified",
  "summary": "1 to 2 concise sentences explaining what web records state regarding this claim and noting corroborating/counter-acting figures if any."
}`,
            },
            {
              role: 'user',
              content: `Target Quote: "${quote}"
Category: ${category}
Context: "${context}"

Live Search Results:
${JSON.stringify(webSources, null, 2)}`,
            },
          ],
        });

        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        verdict = parsed.verdict || 'unverified';
        summary = parsed.summary || 'Live web sources reviewed for independent corroboration.';
      } catch (llmErr) {
        console.warn('Groq synthesis error in /api/corroborate:', llmErr);
      }
    }

    if (!summary) {
      if (webSources.length > 0) {
        verdict = 'corroborated';
        summary = `Independent reporting across ${webSources.length} external sources discusses this subject. Review the cited sources below for primary figures and context.`;
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

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Fatal error in /api/corroborate:', error);
    return NextResponse.json(
      { error: 'Failed to complete web corroboration.' },
      { status: 500 }
    );
  }
}
