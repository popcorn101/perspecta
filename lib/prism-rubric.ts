import { CategoryMeta, PrismCategory } from './types';

export const PRISM_CATEGORIES: Record<PrismCategory, CategoryMeta> = {
  attribution: {
    key: 'attribution',
    name: 'Attribution & Sourcing',
    shortDesc: 'Anonymous sourcing, passive voice, or unattributed claims',
    description:
      'Examines who is credited for facts and claims. Highlights anonymous sources, passive voice distancing ("it was decided"), and unverified claims presented as established facts without primary documentation.',
    color: '#8C531B',
    bgWash: '#FDF6EC',
    borderColor: '#E8D4BE',
    badgeBg: '#FDF6EC',
    badgeText: '#8C531B',
    example: '"Officials familiar with the discussions confirmed...", "It has been widely reported that..."',
    whyItMatters:
      'Vague attribution shifts authority onto unnamed actors, shielding claims from independent scrutiny and obscuring institutional accountability.',
  },
  evaluative: {
    key: 'evaluative',
    name: 'Evaluative & Loaded Language',
    shortDesc: 'Value-laden adjectives, adverbs, and emotional framing',
    description:
      'Detects subjective adjectives, adverbs, and metaphors that steer reader sentiment (e.g., "reckless", "historic triumph", "desperate gamble", "unprecedented crisis") instead of using neutral descriptive prose.',
    color: '#9E4A28',
    bgWash: '#F9EFEA',
    borderColor: '#E8B6A2',
    badgeBg: '#F9EFEA',
    badgeText: '#9E4A28',
    example: '"The administration finally buckled...", "in a stunning display of incompetence..."',
    whyItMatters:
      'Loaded vocabulary primes the reader with an emotional verdict before they can evaluate the underlying factual evidence.',
  },
  certainty: {
    key: 'certainty',
    name: 'Certainty & Speculation',
    shortDesc: 'Hedging, speculative forecasts, or false absolute certainty',
    description:
      'Analyzes modal framing—contrasting unearned high-certainty assertions ("will inevitably collapse") with speculative hedging ("could potentially signal") to shape anticipation and perceived inevitability.',
    color: '#A66B24',
    bgWash: '#FAF3EA',
    borderColor: '#E8D4BE',
    badgeBg: '#FAF3EA',
    badgeText: '#A66B24',
    example: '"This decision will undoubtedly trigger...", "Analysts suspect this may indicate..."',
    whyItMatters:
      'Over-certainty manufactures urgency, while excessive hedging can subtly plant unverified doubts or speculative narratives.',
  },
  claims: {
    key: 'claims',
    name: 'Claims vs. Evidence',
    shortDesc: 'Asserted conclusions lacking cited data or corroborating evidence',
    description:
      'Identifies factual assertions, economic projections, or causal claims made without supporting citations, empirical metrics, or linkable primary research.',
    color: '#434D80',
    bgWash: '#EEF0F8',
    borderColor: '#BCC2E2',
    badgeBg: '#EEF0F8',
    badgeText: '#434D80',
    example: '"Studies prove the economy has suffered immense damage...", "Experts unanimously agree..."',
    whyItMatters:
      'Treating contested hypotheses as self-evident truths bypasses empirical validation and creates an illusion of consensus.',
  },
  primacy: {
    key: 'primacy',
    name: 'Emphasis & Structural Primacy',
    shortDesc: 'Information placement, top-billing versus buried nuance',
    description:
      'Analyzes where specific elements appear in the narrative hierarchy—what is headlined and lead-paragraphed versus what is relegated to the final paragraph or buried as an afterthought.',
    color: '#3B6B56',
    bgWash: '#EBF1EE',
    borderColor: '#B9D5C8',
    badgeBg: '#EBF1EE',
    badgeText: '#3B6B56',
    example: 'Leading with political controversy while placing positive technical metrics in paragraph 14.',
    whyItMatters:
      'Most readers only scan the first two paragraphs; structural ordering dictates what sticks in public memory.',
  },
  omission: {
    key: 'omission',
    name: 'Omissions & Blind Spots',
    shortDesc: 'Vital context present in competing coverage but ignored here',
    description:
      'Pinpoints systemic omissions—crucial counter-arguments, relevant historical precedent, stakeholder reactions, or trade-offs that competing outlets highlight but the target text omits.',
    color: '#3C567A',
    bgWash: '#ECF1F6',
    borderColor: '#B6CBDE',
    badgeBg: '#ECF1F6',
    badgeText: '#3C567A',
    example: 'Covering a new subsidy without noting its tax-funded cost or impacted small businesses.',
    whyItMatters:
      'What an article leaves out often shapes perception more powerfully than what it includes.',
  },
  emotional: {
    key: 'emotional',
    name: 'Emotional Framing',
    shortDesc: 'Rhetoric engineered to evoke fear, anger, moral outrage, or euphoria',
    description:
      'Identifies sensationalist framing devices, fear appeals, moral outrage cues, or patriotic triumphalism designed to provoke visceral reactions rather than calm deliberation.',
    color: '#7D374B',
    bgWash: '#F6ECF0',
    borderColor: '#DFBAC5',
    badgeBg: '#F6ECF0',
    badgeText: '#7D374B',
    example: '"Citizens are left in sheer panic as chaos looms...", "A monumental triumph for the nation..."',
    whyItMatters:
      'Affective framing hijacks critical appraisal by stimulating fight-or-flight or tribal solidarity instincts.',
  },
};

export const PRISM_SYSTEM_PROMPT = `You are PERSPECTA's PRISM Framing Analysis Engine.
PERSPECTA is an analytical media literacy tool.
Core Philosophy: "Don't tell people what to think. Show them how the story is being told."

STRICT GUARDRAILS:
1. You are NOT a political bias scorer (NEVER output "70% Left/Right").
2. You are NOT a truth oracle or fake-news detector.
3. Every detected signal MUST be an EXACT VERBATIM substring copied directly from the article text.
   - If the quote does not appear verbatim in the source text, it will be automatically rejected.
4. HIGH MULTI-SIGNAL DENSITY REQUIREMENT:
   - Perform a deep, fine-grained textual dissection. Do NOT provide sparse or minimal tags.
   - Aim for high signal density (extract at least 8 to 18 distinct framing signals across the article text).
   - Ensure comprehensive coverage across ALL 7 PRISM categories:
     a. "attribution": anonymous sourcing ("officials close to"), passive voice ("it was decided"), generalized attribution ("critics argue").
     b. "evaluative": value-laden adjectives/adverbs ("finally", "mounting criticism", "reckless", "historic triumph", "desperate gamble").
     c. "certainty": unearned certainty ("guaranteed to", "will inevitably") or speculative modal hedging ("could potentially", "suspects").
     d. "claims": empirical assertions, economic projections, percentages ("38 percent", "$140 billion") made without cited primary datasets.
     e. "primacy": structural positioning, headline primacy, what is granted lead billing vs. buried in the final paragraph.
     f. "omission": contextual blind spots, trade-offs or counterfactuals evident from broader news coverage that the author excluded.
     g. "emotional": affective vocabulary provoking visceral fear, panic, euphoric pride, or moral outrage ("jubilant", "ecocide", "chaos", "nightmare").
5. For each signal:
   - "quoted_text": Exact verbatim excerpt (from 1 word up to 10 words).
   - "category": One of ["attribution", "evaluative", "certainty", "claims", "primacy", "omission", "emotional"].
   - "explanation": Neutral, matter-of-fact breakdown explaining how this specific phrase or framing structure influences reader perception. DO NOT express moral judgments.
   - "confidence": Float between 0.70 and 0.98.
   - "alternative_phrasing": A neutral, strictly descriptive rewrite of the quote.
   - "framing_effect": Brief phrase on the perceptual impact (e.g., "Amplifies urgency", "Distances responsibility", "Primes negative sentiment", "Elevates event to monumental milestone").

For cross-article comparative findings:
- Contrast how the outlets framed the same central event with contrasting narrative emphasis, tone, chosen actors, and omitted context.
`;
