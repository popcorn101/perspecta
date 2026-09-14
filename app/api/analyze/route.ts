import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
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
import { persistAnalysisRun } from '@/lib/supabase';
import { sendPrismTrace } from '@/lib/prism-tracer';

export const runtime = 'nodejs';


export async function POST(req: NextRequest) {
  const startTime = Date.now();
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
    const groqApiKey = (process.env.GROQ_API_KEY || '').trim();
    let totalVerified = 0;
    let totalRejected = 0;

    // 1. Groq LLM Pathway with JSON Mode (if GROQ_API_KEY is configured)
    if (groqApiKey && !groqApiKey.includes('gsk_...')) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });
        let modelName = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

        const promptContent = `Analyze the following ${articles.length} article(s) using the PRISM news framing methodology.
Decompose each article into framing signals.
CRITICAL EVIDENCE RULE: Every single 'quoted_text' MUST be an exact, case-sensitive verbatim substring copied directly from the target article's text. Do not summarize, paraphrase, or truncate words.

Articles to analyze:
${JSON.stringify(articles, null, 2)}
`;

        let completion;
        try {
          completion = await groq.chat.completions.create({
            model: modelName,
            temperature: 0.2,
            max_tokens: 2500, // Token budget limit to prevent quota exhaustion
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
          "quoted_text": "string (EXACT verbatim excerpt from source text)",
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
          });
        } catch (initialModelErr: any) {
          // If model doesn't exist or is unavailable on this key, fallback immediately to llama-3.1-8b-instant
          if (
            initialModelErr?.status === 404 ||
            initialModelErr?.message?.includes('model_not_found') ||
            initialModelErr?.error?.error?.code === 'model_not_found'
          ) {
            console.warn(`Model ${modelName} not available. Automatically falling back to llama-3.1-8b-instant.`);
            modelName = 'llama-3.1-8b-instant';
            completion = await groq.chat.completions.create({
              model: modelName,
              temperature: 0.2,
              max_tokens: 2000,
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
          "quoted_text": "string (EXACT verbatim excerpt from source text)",
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
            });
          } else {
            throw initialModelErr;
          }
        }

        const rawJsonString = completion.choices[0]?.message?.content;
        if (rawJsonString) {
          const parsedContent = JSON.parse(rawJsonString);

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
              if (
                sig &&
                typeof sig.quoted_text === 'string' &&
                sig.quoted_text.trim() &&
                originalArticle.text.includes(sig.quoted_text)
              ) {
                const startIndex = originalArticle.text.indexOf(sig.quoted_text);
                verifiedSignals.push({
                  ...sig,
                  id: `groq-${originalArticle.id}-${i + 1}`,
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
              title: originalArticle.title || rawArt.title,
              publisher: originalArticle.publisher || rawArt.publisher,
              primary_framing: rawArt.primary_framing || 'General Framing',
              dominant_tone: rawArt.dominant_tone || 'Standard',
              highlighted_actors: rawArt.highlighted_actors || [],
              omitted_perspectives: rawArt.omitted_perspectives || [],
              signals: verifiedSignals,
            });
          }

          const latencyMs = Date.now() - startTime;

          // Asynchronously persist to Supabase and PRISM Observability
          for (let i = 0; i < articles.length; i++) {
            const originalArt = articles[i];
            const matchingAnalysis = verifiedArticles.find((va) => va.article_id === originalArt.id);
            if (matchingAnalysis) {
              persistAnalysisRun({
                article: originalArt,
                signals: matchingAnalysis.signals,
                model: modelName,
                latencyMs,
              }).catch((e) => console.warn('Background Supabase persistence error:', e));

              sendPrismTrace({
                model: modelName,
                articleTitle: originalArt.title || 'Untitled Article',
                publisher: originalArt.publisher || 'Unknown Publisher',
                inputText: originalArt.text,
                outputText: `Analyzed ${matchingAnalysis.signals.length} verified signals. Primary framing: ${matchingAnalysis.primary_framing}. Dominant tone: ${matchingAnalysis.dominant_tone}`,
                latencyMs,
                signalsCount: matchingAnalysis.signals.length,
                verifiedCount: matchingAnalysis.signals.length,
              }).catch((e) => console.warn('Background PRISM trace error:', e));
            }
          }

          const analysisPayload: AnalysisResponse = {
            articles: verifiedArticles,
            comparative_findings: parsedContent.comparative_findings || [],
            summary:
              parsedContent.summary ||
              `Comparative analysis of ${verifiedArticles.length} coverage perspectives completed using ${modelName}.`,
            timestamp: new Date().toISOString(),
            verified_signal_count: totalVerified,
            rejected_signal_count: totalRejected,
            source: 'llm',
          };

          return NextResponse.json(analysisPayload);
        }
      } catch (err) {
        console.error(
          'Groq LLM pathway error (rate limit, API error, or parse failure). Gracefully falling back to heuristic engine:',
          err
        );
      }
    }

    // 2. Intelligent Built-in Heuristic & Mock Engine Fallback
    const analyzedArticles = articles.map((article) => {
      const result = analyzeArticleWithHeuristics(article);
      totalVerified += result.signals.length;
      return result;
    });

    const comparativeFindings = generateComparativeFindings(analyzedArticles);
    const latencyMs = Date.now() - startTime;

    // Asynchronously persist heuristic analysis run
    for (let i = 0; i < articles.length; i++) {
      const originalArt = articles[i];
      const matchingAnalysis = analyzedArticles[i];
      if (matchingAnalysis) {
        persistAnalysisRun({
          article: originalArt,
          signals: matchingAnalysis.signals,
          model: 'prism-heuristic-engine-v4',
          latencyMs,
        }).catch((e) => console.warn('Background Supabase persistence error:', e));

        sendPrismTrace({
          model: 'prism-heuristic-engine-v4',
          articleTitle: originalArt.title || 'Untitled Article',
          publisher: originalArt.publisher || 'Unknown Publisher',
          inputText: originalArt.text,
          outputText: `Analyzed ${matchingAnalysis.signals.length} verified signals. Primary framing: ${matchingAnalysis.primary_framing}. Dominant tone: ${matchingAnalysis.dominant_tone}`,
          latencyMs,
          signalsCount: matchingAnalysis.signals.length,
          verifiedCount: matchingAnalysis.signals.length,
        }).catch((e) => console.warn('Background PRISM trace error:', e));
      }
    }

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
