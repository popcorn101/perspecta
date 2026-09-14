import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let cachedClient: SupabaseClient | null = null;

/**
 * Returns a configured Supabase client if URL and API Key are provided in the environment.
 * If credentials are missing, returns null so operations can proceed safely with graceful no-op logging.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  if (
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseKey.includes('your-anon-key')
  ) {
    try {
      cachedClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });
      return cachedClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export interface StoredArticle {
  id?: string;
  title: string;
  publisher?: string;
  url?: string;
  raw_text: string;
  created_at?: string;
}

export interface StoredPrismSignal {
  id?: string;
  article_id: string;
  category: string;
  quoted_text: string;
  explanation: string;
  confidence: number;
  is_verified?: boolean;
  created_at?: string;
}

export interface StoredEvaluationTrace {
  id?: string;
  article_id: string;
  model: string;
  latency_ms?: number;
  signal_count: number;
  status?: string;
  created_at?: string;
}

/**
 * Persist an analyzed article along with verified signals and evaluation trace to Supabase.
 */
export async function persistAnalysisRun({
  article,
  signals,
  model,
  latencyMs,
}: {
  article: { id?: string; title: string; publisher?: string; url?: string; text: string };
  signals: Array<{
    category: string;
    quoted_text: string;
    explanation: string;
    confidence: number;
    is_verified?: boolean;
  }>;
  model: string;
  latencyMs: number;
}): Promise<{ articleId?: string; success: boolean }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false };
  }

  try {
    // 1. Insert article
    const { data: artData, error: artError } = await supabase
      .from('articles')
      .insert({
        title: article.title || 'Untitled Monitored Story',
        publisher: article.publisher || 'Direct Submission',
        url: article.url || null,
        raw_text: article.text,
      })
      .select('id')
      .single();

    if (artError || !artData) {
      console.error('Supabase article insert error:', artError);
      return { success: false };
    }

    const articleId = artData.id;

    // 2. Insert signals if any
    if (signals.length > 0) {
      const formattedSignals = signals.map((s) => ({
        article_id: articleId,
        category: s.category,
        quoted_text: s.quoted_text,
        explanation: s.explanation,
        confidence: s.confidence,
        is_verified: s.is_verified ?? true,
      }));

      const { error: sigError } = await supabase
        .from('prism_signals')
        .insert(formattedSignals);

      if (sigError) {
        console.error('Supabase prism_signals insert error:', sigError);
      }
    }

    // 3. Insert evaluation trace
    const { error: traceError } = await supabase
      .from('evaluation_traces')
      .insert({
        article_id: articleId,
        model,
        latency_ms: latencyMs,
        signal_count: signals.length,
        status: 'completed',
      });

    if (traceError) {
      console.error('Supabase evaluation_traces insert error:', traceError);
    }

    return { articleId, success: true };
  } catch (err) {
    console.error('Error persisting analysis run to Supabase:', err);
    return { success: false };
  }
}
