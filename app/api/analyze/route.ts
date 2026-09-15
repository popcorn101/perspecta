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
    const runSessionId = `perspecta-session-${Date.now()}`;
    let totalVerified = 0;
    let totalRejected = 0;

    // 1. Groq LLM Pathway with JSON Mode (if GROQ_API_KEY is configured)
    if (groqApiKey && !groqApiKey.includes('gsk_...')) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });
        // Priority candidate models: includes available high-capacity models on Groq
        const requestedModel = process.env.GROQ_MODEL?.trim();
        const candidateModels = Array.from(
          new Set(
            [
              requestedModel,
              'qwen/qwen3.8-27b',
              'openai/gpt-oss-20b',
              'openai/gpt-oss-120b',
              'llama-3.3-70b-versatile',
              'llama-3.1-8b-instant',
            ].filter(Boolean) as string[]
          )
        );

        // Strict token budget to prevent 429 TPM Rate Limit on free tiers:
        // Cap article excerpt length to 1,500 characters so combined prompt stays under 1,800 tokens
        const tokenConstrainedArticles = articles.map((art) => ({
          id: art.id,
          title: art.title,
          publisher: art.publisher,
          text: art.text.length > 1500 ? `${art.text.slice(0, 1500)}` : art.text,
        }));

        const promptContent = `Decompose each article into PRISM framing signals.
CRITICAL: Every 'quoted_text' MUST be an exact verbatim substring from target text.

Articles:
${JSON.stringify(tokenConstrainedArticles, null, 2)}
`;

        let completion = null;
        let modelName: string = requestedModel || candidateModels[0] || 'qwen/qwen3.8-27b';

        // Try candidate models sequentially (handles 404 model not found and 429 rate limits gracefully)
        for (const candidate of candidateModels) {
          try {
            completion = await groq.chat.completions.create({
              model: candidate,
              temperature: 0.15,
              max_tokens: 1400, // Reduced to prevent exceeding output token budget
              response_format: { type: 'json_object' },
              messages: [
                {
                  role: 'system',
                  content:
                    'You are PERSPECTA PRISM. Decompose news text into framing signals (attribution, evaluative, certainty, claims, primacy, omission, emotional). Quoted_text must be exact verbatim substring. Respond with strict JSON matching schema: {"articles": [{"article_id": "string", "title": "string", "publisher": "string", "primary_framing": "string", "dominant_tone": "string", "highlighted_actors": ["string"], "omitted_perspectives": ["string"], "signals": [{"quoted_text": "verbatim text", "category": "attribution"|"evaluative"|"certainty"|"claims"|"primacy"|"omission"|"emotional", "explanation": "string", "confidence": 0.85, "framing_effect": "string", "alternative_phrasing": "string"}]}], "comparative_findings": [{"category": "string", "title": "string", "description": "string", "contrast_table": [{"publisher": "string", "approach": "string"}]}], "summary": "string"}',
                },
                {
                  role: 'user',
                  content: promptContent,
                },
              ],
            });

            if (completion?.choices?.[0]?.message?.content) {
              modelName = candidate;
              break;
            }
          } catch (modelErr: any) {
            const isRateLimit = modelErr?.status === 429 || modelErr?.message?.includes('Rate limit') || modelErr?.error?.error?.code === 'rate_limit_exceeded';
            const isNotFound = modelErr?.status === 404 || modelErr?.message?.includes('model_not_found');
            console.warn(
              `Model ${candidate} encountered ${isRateLimit ? '429 Rate Limit' : isNotFound ? '404 Not Found' : 'error'}. Attempting next fallback model in cascade...`
            );
            // Continue loop to next candidate
          }
        }

        const rawJsonString = completion?.choices?.[0]?.message?.content;
        if (rawJsonString) {
          const parsedContent = JSON.parse(rawJsonString);

          // VERIFICATION LAYER: Check every signal against source text
          const verifiedArticles: ArticleAnalysis[] = [];

          for (let artIdx = 0; artIdx < (parsedContent.articles || []).length; artIdx++) {
            const rawArt = parsedContent.articles[artIdx];
            // Robust matching: by id, or positional index fallback
            const originalArticle =
              articles.find((a) => a.id === rawArt.article_id) ||
              articles[artIdx] ||
              articles[0];
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

            // Fallback to heuristic signals if LLM paraphrased rather than exact verbatim
            if (verifiedSignals.length === 0) {
              const heuristicRun = analyzeArticleWithHeuristics(originalArticle);
              verifiedSignals.push(...heuristicRun.signals);
              totalVerified += heuristicRun.signals.length;
            }

            verifiedArticles.push({
              article_id: originalArticle.id,
              title: originalArticle.title || rawArt.title || 'Untitled Article',
              publisher: originalArticle.publisher || rawArt.publisher || 'Source Perspective',
              primary_framing: rawArt.primary_framing || 'General Framing',
              dominant_tone: rawArt.dominant_tone || 'Standard',
              highlighted_actors: rawArt.highlighted_actors || [],
              omitted_perspectives: rawArt.omitted_perspectives || [],
              signals: verifiedSignals,
            });
          }

          if (verifiedArticles.length > 0) {
            const latencyMs = Date.now() - startTime;

            // Await Supabase and PRISM Observability so serverless does not kill execution prematurely
            const tracePromises: Promise<any>[] = [];
            for (let i = 0; i < articles.length; i++) {
              const originalArt = articles[i];
              const matchingAnalysis =
                verifiedArticles.find((va) => va.article_id === originalArt.id) ||
                verifiedArticles[i];
              if (matchingAnalysis) {
                tracePromises.push(
                  persistAnalysisRun({
                    article: originalArt,
                    signals: matchingAnalysis.signals,
                    model: modelName,
                    latencyMs,
                  }).catch((e) => console.warn('Background Supabase persistence error:', e))
                );

                tracePromises.push(
                  sendPrismTrace({
                    model: modelName,
                    articleTitle: originalArt.title || 'Untitled Article',
                    publisher: originalArt.publisher || 'Unknown Publisher',
                    inputText: originalArt.text,
                    outputText: `Analyzed ${matchingAnalysis.signals.length} verified signals. Primary framing: ${matchingAnalysis.primary_framing}. Dominant tone: ${matchingAnalysis.dominant_tone}`,
                    latencyMs,
                    signalsCount: matchingAnalysis.signals.length,
                    verifiedCount: matchingAnalysis.signals.length,
                    primaryFraming: matchingAnalysis.primary_framing,
                    dominantTone: matchingAnalysis.dominant_tone,
                    sessionId: runSessionId,
                  }).catch((e) => console.warn('Background PRISM trace error:', e))
                );
              }
            }
            await Promise.allSettled(tracePromises);

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

    // Await Supabase and PRISM Observability traces for heuristic run
    const heuristicTracePromises: Promise<any>[] = [];
    for (let i = 0; i < articles.length; i++) {
      const originalArt = articles[i];
      const matchingAnalysis = analyzedArticles[i];
      if (matchingAnalysis) {
        heuristicTracePromises.push(
          persistAnalysisRun({
            article: originalArt,
            signals: matchingAnalysis.signals,
            model: 'prism-heuristic-engine-v4',
            latencyMs,
          }).catch((e) => console.warn('Background Supabase persistence error:', e))
        );

        heuristicTracePromises.push(
          sendPrismTrace({
            model: 'prism-heuristic-engine-v4',
            articleTitle: originalArt.title || 'Untitled Article',
            publisher: originalArt.publisher || 'Unknown Publisher',
            inputText: originalArt.text,
            outputText: `Analyzed ${matchingAnalysis.signals.length} verified signals. Primary framing: ${matchingAnalysis.primary_framing}. Dominant tone: ${matchingAnalysis.dominant_tone}`,
            latencyMs,
            signalsCount: matchingAnalysis.signals.length,
            verifiedCount: matchingAnalysis.signals.length,
            primaryFraming: matchingAnalysis.primary_framing,
            dominantTone: matchingAnalysis.dominant_tone,
            sessionId: runSessionId,
          }).catch((e) => console.warn('Background PRISM trace error:', e))
        );
      }
    }
    await Promise.allSettled(heuristicTracePromises);

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
