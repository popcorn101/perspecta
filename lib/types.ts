import { z } from 'zod';

export type PrismCategory =
  | 'attribution'
  | 'evaluative'
  | 'certainty'
  | 'claims'
  | 'primacy'
  | 'omission'
  | 'emotional';

export interface CategoryMeta {
  key: PrismCategory;
  name: string;
  shortDesc: string;
  description: string;
  color: string;
  bgWash: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  example: string;
  whyItMatters: string;
}

export const FramingSignalSchema = z.object({
  id: z.string().optional(),
  quoted_text: z.string().min(1, 'Quoted text must not be empty'),
  category: z.enum([
    'attribution',
    'evaluative',
    'certainty',
    'claims',
    'primacy',
    'omission',
    'emotional',
  ]),
  explanation: z.string().min(1, 'Neutral explanation required'),
  confidence: z.number().min(0).max(1),
  framing_effect: z.string().optional(),
  alternative_phrasing: z.string().optional(),
  start_index: z.number().optional(),
  end_index: z.number().optional(),
});

export type FramingSignal = z.infer<typeof FramingSignalSchema>;

export const ArticleInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Article title is required'),
  publisher: z.string().min(1, 'Publisher name is required'),
  url: z.string().url().optional().or(z.literal('')),
  text: z.string().min(10, 'Article body text must be at least 10 characters'),
  date: z.string().optional(),
  author: z.string().optional(),
});

export type ArticleInput = z.infer<typeof ArticleInputSchema>;

export const ArticleAnalysisSchema = z.object({
  article_id: z.string(),
  title: z.string(),
  publisher: z.string(),
  primary_framing: z.string(),
  dominant_tone: z.string(),
  highlighted_actors: z.array(z.string()),
  omitted_perspectives: z.array(z.string()),
  signals: z.array(FramingSignalSchema),
});

export type ArticleAnalysis = z.infer<typeof ArticleAnalysisSchema>;

export const ComparativeFindingSchema = z.object({
  category: z.string(),
  title: z.string(),
  description: z.string(),
  contrast_table: z.array(
    z.object({
      publisher: z.string(),
      approach: z.string(),
    })
  ),
});

export type ComparativeFinding = z.infer<typeof ComparativeFindingSchema>;

export const AnalysisRequestSchema = z.object({
  articles: z.array(ArticleInputSchema).min(1).max(3),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export const AnalysisResponseSchema = z.object({
  articles: z.array(ArticleAnalysisSchema),
  comparative_findings: z.array(ComparativeFindingSchema),
  summary: z.string(),
  timestamp: z.string(),
  verified_signal_count: z.number(),
  rejected_signal_count: z.number(),
  source: z.enum(['llm', 'heuristic_mock']),
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

export interface DemoCase {
  id: string;
  title: string;
  topic: string;
  tagline: string;
  date: string;
  articles: ArticleInput[];
  cachedAnalysis?: AnalysisResponse;
}
