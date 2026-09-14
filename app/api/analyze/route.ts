import { NextRequest, NextResponse } from 'next/server';
import {
  AnalysisRequestSchema,
  AnalysisResponse,
  ArticleAnalysis,
  FramingSignal,
} from '@/lib/types';
import { PRISM_SYSTEM_PROMPT } from '@/lib/prism-rubric';
import {
  analyzeArticleWithHeuristics,
  generateComparativeFindings,
} from '@/lib/mock-engine';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validationResult = AnalysisRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { articles } = validationResult.data;
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    let totalVerified = 0;
    let totalRejected = 0;

    // 1. LLM Pathway (if API Key provided)
    if (apiKey) {
      try {
        const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

        const promptContent = `Analyze the following ${articles.length} article(s) using the PRISM news framing methodology.
Decompose each article into framing signals. Remember the STRICT RULE: Every 'quoted_text' MUST be an exact verbatim substring from the source article.

Articles to analyze:
${JSON.stringify(articles, null, 2)}
`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: PRISM_SYSTEM_PROMPT },
              {
                role: 'user',
                content: `${promptContent}

Respond strictly with valid JSON conforming to this schema:
{
  "articles": [
    {
      "article_id": "string",
      "title": "string",
      "publisher": "string",
      "primary_framing": "string",
      "dominant_tone": "string",
      "highlighted_actors": ["string"],
      "omitted_perspectives": ["string"],
      "signals": [
        {
          "quoted_text": "string (EXACT verbatim excerpt)",
          "category": "attribution" | "evaluative" | "certainty" | "claims" | "primacy" | "omission" | "emotional",
          "explanation": "string",
          "confidence": number,
          "framing_effect": "string",
          "alternative_phrasing": "string"
        }
      ]
    }
  ],
  "comparative_findings": [
    {
      "category": "string",
      "title": "string",
      "description": "string",
      "contrast_table": [
        { "publisher": "string", "approach": "string" }
      ]
    }
  ],
  "summary": "string"
}`,
              },
            ],
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          const parsedContent = JSON.parse(
            completion.choices[0].message.content
          );

          // VERIFICATION LAYER: Check every signal against source text
          const verifiedArticles: ArticleAnalysis[] = [];

          for (const rawArt of parsedContent.articles || []) {
            const originalArticle = articles.find(
              (a) => a.id === rawArt.article_id
            );
            if (!originalArticle) continue;

            const verifiedSignals: FramingSignal[] = [];
            for (let i = 0; i < (rawArt.signals || []).length; i++) {
              const sig = rawArt.signals[i];
              if (originalArticle.text.includes(sig.quoted_text)) {
                const startIndex = originalArticle.text.indexOf(sig.quoted_text);
                verifiedSignals.push({
                  ...sig,
                  id: `llm-${originalArticle.id}-${i + 1}`,
                  start_index: startIndex,
                  end_index: startIndex + sig.quoted_text.length,
                });
                totalVerified++;
              } else {
                totalRejected++;
              }
            }

            verifiedArticles.push({
              article_id: originalArticle.id,
              title: originalArticle.title,
              publisher: originalArticle.publisher,
              primary_framing: rawArt.primary_framing || 'General Framing',
              dominant_tone: rawArt.dominant_tone || 'Standard',
              highlighted_actors: rawArt.highlighted_actors || [],
              omitted_perspectives: rawArt.omitted_perspectives || [],
              signals: verifiedSignals,
            });
          }

          const analysisPayload: AnalysisResponse = {
            articles: verifiedArticles,
            comparative_findings: parsedContent.comparative_findings || [],
            summary:
              parsedContent.summary ||
              `Comparative analysis of ${verifiedArticles.length} coverage perspectives completed.`,
            timestamp: new Date().toISOString(),
            verified_signal_count: totalVerified,
            rejected_signal_count: totalRejected,
            source: 'llm',
          };

          return NextResponse.json(analysisPayload);
        }
      } catch (err) {
        console.error('LLM pathway error, falling back to heuristic engine:', err);
      }
    }

    // 2. Intelligent Built-in Heuristic & Mock Engine Fallback
    const analyzedArticles = articles.map((article) => {
      const result = analyzeArticleWithHeuristics(article);
      totalVerified += result.signals.length;
      return result;
    });

    const comparativeFindings = generateComparativeFindings(analyzedArticles);

    const payload: AnalysisResponse = {
      articles: analyzedArticles,
      comparative_findings: comparativeFindings,
      summary: `PERSPECTA PRISM analysis of ${analyzedArticles.length} publication source(s) completed with ${totalVerified} verified framing signals.`,
      timestamp: new Date().toISOString(),
      verified_signal_count: totalVerified,
      rejected_signal_count: 0,
      source: 'heuristic_mock',
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Fatal API error in /api/analyze:', error);
    return NextResponse.json(
      { error: 'Internal server error while analyzing framing signals' },
      { status: 500 }
    );
  }
}
