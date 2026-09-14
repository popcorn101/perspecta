/**
 * PRISM Observability Dispatcher
 * Sends real evaluation traces from PERSPECTA runs directly to the PRISM API
 * so they appear in your PRISM Observability dashboard & traces table.
 */

const PRISM_HOST =
  process.env.PRISMTRACE_HOST || 'https://prism-api-prod.up.railway.app';
const PRISM_PROJECT_ID =
  process.env.PRISMTRACE_PROJECT_ID || '06b0abd9-4df1-40f0-87ff-c33212e3a973';
const PRISM_API_KEY =
  process.env.PRISMTRACE_API_KEY || 'pt-sk-b1b4b8a16763406f999f1b2098c30621';

export interface SendPrismTraceParams {
  model: string;
  articleTitle: string;
  publisher?: string;
  inputText: string;
  outputText: string;
  latencyMs: number;
  signalsCount: number;
  verifiedCount: number;
}

export async function sendPrismTrace({
  model,
  articleTitle,
  publisher = 'PERSPECTA Feed',
  inputText,
  outputText,
  latencyMs,
  signalsCount,
  verifiedCount,
}: SendPrismTraceParams): Promise<boolean> {
  if (!PRISM_API_KEY || !PRISM_PROJECT_ID) {
    return false;
  }

  try {
    const payload = {
      project_id: PRISM_PROJECT_ID,
      model: model || 'llama-3.3-70b-versatile',
      agent_name: 'perspecta-framing-engine',
      agent_id: 'perspecta-analyzer-v1',
      input_messages: [
        {
          role: 'user',
          content: `Headline: ${articleTitle} [${publisher}]\n\nExcerpt: ${inputText.slice(0, 300)}...`,
        },
      ],
      output_message: outputText.slice(0, 500),
      latency_ms: Math.max(50, Math.round(latencyMs)),
      token_count_input: Math.round(inputText.length / 4),
      token_count_output: Math.round(outputText.length / 4),
      metadata: {
        article_title: articleTitle,
        publisher,
        signals_detected: signalsCount,
        signals_verified: verifiedCount,
        framework: 'PRISM 7-Dimension Rubric',
      },
    };

    const res = await fetch(`${PRISM_HOST}/api/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PRISMtrace-Key': PRISM_API_KEY,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.warn('PRISM trace ingestion returned non-200:', res.status, err);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Failed to dispatch trace to PRISM:', err);
    return false;
  }
}
