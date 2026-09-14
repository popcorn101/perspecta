import {
  ArticleAnalysis,
  ArticleInput,
  ComparativeFinding,
  FramingSignal,
  PrismCategory,
} from './types';

interface PatternRule {
  pattern: RegExp | string;
  category: PrismCategory;
  explanation: string;
  framing_effect: string;
  alternative_phrasing?: string;
  confidence: number;
}

const PRISM_HEURISTIC_PATTERNS: PatternRule[] = [
  // Attribution & Sourcing
  {
    pattern: /officials close to the mission/i,
    category: 'attribution',
    explanation: 'Uses anonymous insider framing to bestow official authority on optimistic forecasts without on-the-record accountability.',
    framing_effect: 'Grants unverified authority without named responsibility',
    alternative_phrasing: 'Mission planners stated in their flight itinerary',
    confidence: 0.88,
  },
  {
    pattern: /anonymous sources within the finance ministry/i,
    category: 'attribution',
    explanation: 'Relies on unnamed departmental sources to introduce speculative budget freeze rumors without direct attribution.',
    framing_effect: 'Introduces unverified institutional friction',
    alternative_phrasing: 'Departmental budget memos currently under review',
    confidence: 0.91,
  },
  {
    pattern: /critics argue/i,
    category: 'attribution',
    explanation: 'Employs generalized passive attribution ("critics argue") to introduce dissenting viewpoints without identifying specific stakeholder groups or credentials.',
    framing_effect: 'Creates an impression of widespread dissent without identifying actors',
    alternative_phrasing: 'Several fiscal policy institutes have raised questions',
    confidence: 0.82,
  },
  {
    pattern: /industry leaders rightly pointed out/i,
    category: 'attribution',
    explanation: 'Editorializes the validity of corporate claims by prepending the affirmative adverb "rightly".',
    framing_effect: 'Pre-validates industry claims as indisputable truth',
    alternative_phrasing: 'Industry representatives stated',
    confidence: 0.94,
  },
  {
    pattern: /defense strategists view/i,
    category: 'attribution',
    explanation: 'Frames a scientific event strictly through military security lenses by foregrounding defense analysts as the primary interpretive authority.',
    framing_effect: 'Militarizes civilian scientific endeavors',
    alternative_phrasing: 'Aerospace analysts observing regional defense developments noted',
    confidence: 0.85,
  },

  // Evaluative & Loaded Language
  {
    pattern: /monumental triumph/i,
    category: 'evaluative',
    explanation: 'Uses celebratory superlatives to prime the reader with patriotic pride rather than focusing purely on operational flight telemetry.',
    framing_effect: 'Evokes nationalistic prestige and uncritical celebration',
    alternative_phrasing: 'Successful orbital insertion',
    confidence: 0.95,
  },
  {
    pattern: /unprecedented display of scientific ingenuity/i,
    category: 'evaluative',
    explanation: 'Employs hyperbolic praise to elevate the engineering feat to a historic, epochal level.',
    framing_effect: 'Amplifies heroic narrative tone',
    alternative_phrasing: 'Complex multi-stage separation maneuver',
    confidence: 0.92,
  },
  {
    pattern: /soaring state expenditures/i,
    category: 'evaluative',
    explanation: 'Adopts alarmist fiscal language ("soaring expenditures") to frame program costs as financially destabilizing.',
    framing_effect: 'Primes reader concern regarding government overspending',
    alternative_phrasing: 'Total government capital appropriations',
    confidence: 0.87,
  },
  {
    pattern: /exorbitant capital drain/i,
    category: 'evaluative',
    explanation: 'Uses pejorative terminology ("exorbitant capital drain") depicting space research funding as wasteful resource hemorrhage.',
    framing_effect: 'Frames investment as direct economic harm',
    alternative_phrasing: 'Significant capital allocation',
    confidence: 0.96,
  },
  {
    pattern: /catastrophic blow/i,
    category: 'evaluative',
    explanation: 'Employs dramatic doom phrasing to portray statutory oversight as an existential threat to commerce.',
    framing_effect: 'Instills acute urgency and commercial panic',
    alternative_phrasing: 'Substantial regulatory adjustment',
    confidence: 0.93,
  },
  {
    pattern: /draconian compliance mandates/i,
    category: 'evaluative',
    explanation: 'Utilizes historically severe adjectives ("draconian") to characterize standard corporate audit requirements.',
    framing_effect: 'Depicts statutory regulation as punitive oppression',
    alternative_phrasing: 'Strict statutory compliance requirements',
    confidence: 0.95,
  },
  {
    pattern: /reckless corporate experimentation/i,
    category: 'evaluative',
    explanation: 'Applies morally loaded condemnations to frame technology deployment as reckless endangering of public safety.',
    framing_effect: 'Casts corporate actors as villains compromising human safety',
    alternative_phrasing: 'Deployment of commercial algorithmic models',
    confidence: 0.91,
  },
  {
    pattern: /long-overdue victory/i,
    category: 'evaluative',
    explanation: 'Frames legislative action as an emotional triumph for citizens over entrenched corporate adversaries.',
    framing_effect: 'Validates regulatory expansion as moral justice',
    alternative_phrasing: 'Passage of updated legislative standards',
    confidence: 0.89,
  },
  {
    pattern: /dirty fossil power/i,
    category: 'evaluative',
    explanation: 'Uses moralized terminology ("dirty fossil power") to reinforce stigma around legacy thermal power generation.',
    framing_effect: 'Heightens moral urgency for immediate decommissioning',
    alternative_phrasing: 'Conventional carbon-based generation',
    confidence: 0.9,
  },

  // Certainty & Speculation
  {
    pattern: /undoubtedly cements/i,
    category: 'certainty',
    explanation: 'Asserts absolute certainty regarding long-term geopolitical supremacy based on a single satellite launch.',
    framing_effect: 'Overstates certainty and long-term implications',
    alternative_phrasing: 'Strengthens the country\'s standing',
    confidence: 0.89,
  },
  {
    pattern: /guaranteed to proceed without complication/i,
    category: 'certainty',
    explanation: 'Projects infallible technical success, downplaying intrinsic risks associated with orbital orbital maneuvers.',
    framing_effect: 'Suppresses awareness of engineering uncertainty and risk',
    alternative_phrasing: 'Is scheduled according to nominal parameters',
    confidence: 0.92,
  },
  {
    pattern: /will inevitably force/i,
    category: 'certainty',
    explanation: 'Presents a speculative corporate migration scenario as an unavoidable, mathematical certainty.',
    framing_effect: 'Manufactures fatalistic anticipation',
    alternative_phrasing: 'May encourage some firms to consider',
    confidence: 0.91,
  },
  {
    pattern: /will inevitably monitor/i,
    category: 'certainty',
    explanation: 'Treats strategic military escalation and surveillance as preordained.',
    framing_effect: 'Reinforces zero-sum geopolitical determinism',
    alternative_phrasing: 'Are expected to monitor',
    confidence: 0.84,
  },
  {
    pattern: /utterly incapable/i,
    category: 'certainty',
    explanation: 'Dismisses renewable technological capabilities with definitive, absolute finality.',
    framing_effect: 'Precludes consideration of grid modernization solutions',
    alternative_phrasing: 'Currently faces significant engineering hurdles',
    confidence: 0.93,
  },

  // Claims vs. Evidence
  {
    pattern: /exceeded initial projections by 38 percent/i,
    category: 'claims',
    explanation: 'Cites an exact statistical variance metric ("38 percent") to provide mathematical credibility to claims of fiscal mismanagement.',
    framing_effect: 'Anchors reader perception on concrete financial overrun numbers',
    confidence: 0.86,
  },
  {
    pattern: /voluntary safety benchmarks were already functioning seamlessly/i,
    category: 'claims',
    explanation: 'Asserts flawless industry self-regulation without citing independent safety audit data or empirical failure rates.',
    framing_effect: 'Claims efficacy of self-regulation without independent proof',
    confidence: 0.88,
  },
  {
    pattern: /increase operational expenses for tier-one foundation model developers by an estimated 4 to 6 percent/i,
    category: 'claims',
    explanation: 'Employs financial modeling percentages to establish a pragmatic, analytical economic baseline.',
    framing_effect: 'Normalizes regulatory overhead as manageable cost of business',
    confidence: 0.9,
  },

  // Structural Primacy
  {
    pattern: /The nation celebrated a monumental triumph yesterday/i,
    category: 'primacy',
    explanation: 'Leads the article with national celebration, ensuring the reader views technical progress through a patriotic lens before any operational details.',
    framing_effect: 'Primes reader with patriotic sentiment as primary lens',
    confidence: 0.92,
  },
  {
    pattern: /intensifying debate over soaring state expenditures/i,
    category: 'primacy',
    explanation: 'Frames the launch event immediately as a catalyst for fiscal conflict in the lead paragraph rather than a scientific accomplishment.',
    framing_effect: 'Foregrounds economic grievance as the dominant story angle',
    confidence: 0.91,
  },
  {
    pattern: /marks a strategic counter-maneuver in the escalating geopolitical contest/i,
    category: 'primacy',
    explanation: 'Establishes international superpower conflict as the primary framework in the very opening sentence.',
    framing_effect: 'Frames scientific endeavor primarily as military competition',
    confidence: 0.93,
  },

  // Emotional Framing
  {
    pattern: /jubilant citizens gathered outside the space center, waving national flags/i,
    category: 'emotional',
    explanation: 'Vividly depicts collective euphoria and flag-waving crowds to stimulate tribal belonging and patriotic validation.',
    framing_effect: 'Evokes communal pride and emotional solidarity',
    confidence: 0.94,
  },
  {
    pattern: /desperately underfunded/i,
    category: 'emotional',
    explanation: 'Uses emotive distress adjectives ("desperately underfunded") to evoke moral guilt over space exploration spending.',
    framing_effect: 'Triggers moral indignation over perceived resource misallocation',
    alternative_phrasing: 'Faces funding constraints',
    confidence: 0.9,
  },
  {
    pattern: /bureaucratic political theater/i,
    category: 'emotional',
    explanation: 'Invokes cynicism and resentment toward public institutions by characterizing legislative processes as sham theater.',
    framing_effect: 'Elicits contempt toward regulatory governance',
    confidence: 0.93,
  },
  {
    pattern: /generational ecocide/i,
    category: 'emotional',
    explanation: 'Employs extreme moral and legal horror terminology ("ecocide") to evoke intense moral outrage and existential urgency.',
    framing_effect: 'Drives maximum moral indignation and acute crisis framing',
    confidence: 0.97,
  },
  {
    pattern: /civilizational collapse/i,
    category: 'emotional',
    explanation: 'Frames policy deadlines as a binary choice between statutory adoption and complete societal extinction.',
    framing_effect: 'Induces existential fear to compel immediate compliance',
    confidence: 0.96,
  },
  {
    pattern: /devastating industrial blackouts/i,
    category: 'emotional',
    explanation: 'Appeals to consumer and worker panic by raising the specter of widespread power collapse and economic paralysis.',
    framing_effect: 'Stirs public anxiety over energy security and job losses',
    confidence: 0.95,
  },
];

// Fallback generic heuristic extractor for custom text
function extractGenericSignals(text: string): FramingSignal[] {
  const genericIndicators: { regex: RegExp; category: PrismCategory; explanation: string; effect: string }[] = [
    {
      regex: /\b(critics argue|sources claim|officials say|unnamed sources|insiders reveal|widely reported)\b/gi,
      category: 'attribution',
      explanation: 'Employs generalized or anonymous sourcing that obscures specific institutional accountability.',
      effect: 'Distances attribution from verified individuals',
    },
    {
      regex: /\b(reckless|historic|shocking|stunning|unprecedented|disastrous|glorious|heroic|catastrophic|suffocating)\b/gi,
      category: 'evaluative',
      explanation: 'Uses value-laden adjectives that convey emotional verdict rather than neutral observation.',
      effect: 'Primes reader sentiment emotionally',
    },
    {
      regex: /\b(will inevitably|undoubtedly|guaranteed to|impossible to|will definitely|must certainly)\b/gi,
      category: 'certainty',
      explanation: 'Projects unearned absolute certainty regarding complex future outcomes.',
      effect: 'Manufactures an impression of inevitable destiny',
    },
    {
      regex: /\b(could potentially|might suggest|may indicate|allegedly|reportedly|speculation points to)\b/gi,
      category: 'certainty',
      explanation: 'Uses speculative hedging to introduce uncorroborated hypotheses into the news record.',
      effect: 'Plants unverified assertions via modal hedging',
    },
    {
      regex: /\b(\d+ percent|\$\d+ (?:billion|million)|studies prove|statistics demonstrate)\b/gi,
      category: 'claims',
      explanation: 'Makes empirical claims or data citations that should be cross-referenced with primary methodology.',
      effect: 'Anchors perception using quantitative authority',
    },
    {
      regex: /\b(panic|chaos|nightmare|crisis|threatens to destroy|crush|triumph|ecocide|disaster)\b/gi,
      category: 'emotional',
      explanation: 'Deploys affective vocabulary designed to provoke fear, anger, or moral euphoria.',
      effect: 'Hijacks deliberative processing with emotional cues',
    },
  ];

  const signals: FramingSignal[] = [];
  let signalCounter = 1;

  for (const ind of genericIndicators) {
    let match: RegExpExecArray | null;
    const re = new RegExp(ind.regex.source, ind.regex.flags);
    while ((match = re.exec(text)) !== null) {
      const matchIndex = match.index;
      // Expand to include 2-3 words around match for context
      const start = Math.max(0, text.lastIndexOf(' ', matchIndex - 1));
      const end = text.indexOf(' ', matchIndex + match[0].length + 10);
      const quotedSpan = text.substring(
        start === -1 ? matchIndex : start + 1,
        end === -1 ? matchIndex + match[0].length : end
      ).trim();

      // Guardrail: must be inside text
      if (text.includes(quotedSpan) && quotedSpan.length > 3) {
        // avoid duplicates
        if (!signals.some((s) => s.quoted_text === quotedSpan)) {
          signals.push({
            id: `gen-sig-${signalCounter++}`,
            quoted_text: quotedSpan,
            category: ind.category,
            explanation: ind.explanation,
            confidence: 0.82,
            framing_effect: ind.effect,
            start_index: text.indexOf(quotedSpan),
            end_index: text.indexOf(quotedSpan) + quotedSpan.length,
          });
        }
      }
    }
  }

  return signals;
}

export function analyzeArticleWithHeuristics(article: ArticleInput): ArticleAnalysis {
  const foundSignals: FramingSignal[] = [];
  let sigId = 1;

  // 1. Check curated domain patterns
  for (const rule of PRISM_HEURISTIC_PATTERNS) {
    if (typeof rule.pattern === 'string') {
      if (article.text.toLowerCase().includes(rule.pattern.toLowerCase())) {
        const idx = article.text.toLowerCase().indexOf(rule.pattern.toLowerCase());
        const exactSlice = article.text.substring(idx, idx + rule.pattern.length);
        foundSignals.push({
          id: `sig-${article.id}-${sigId++}`,
          quoted_text: exactSlice,
          category: rule.category,
          explanation: rule.explanation,
          framing_effect: rule.framing_effect,
          alternative_phrasing: rule.alternative_phrasing,
          confidence: rule.confidence,
          start_index: idx,
          end_index: idx + exactSlice.length,
        });
      }
    } else {
      const match = rule.pattern.exec(article.text);
      if (match) {
        const exactSlice = article.text.substring(match.index, match.index + match[0].length);
        foundSignals.push({
          id: `sig-${article.id}-${sigId++}`,
          quoted_text: exactSlice,
          category: rule.category,
          explanation: rule.explanation,
          framing_effect: rule.framing_effect,
          alternative_phrasing: rule.alternative_phrasing,
          confidence: rule.confidence,
          start_index: match.index,
          end_index: match.index + exactSlice.length,
        });
      }
    }
  }

  // 2. Always blend domain patterns with generic linguistic indicators to guarantee high signal density
  const generic = extractGenericSignals(article.text);
  for (const g of generic) {
    if (!foundSignals.some((s) => s.quoted_text.toLowerCase().includes(g.quoted_text.toLowerCase()) || g.quoted_text.toLowerCase().includes(s.quoted_text.toLowerCase()))) {
      foundSignals.push({
        ...g,
        id: `sig-${article.id}-${sigId++}`,
      });
    }
  }

  // 3. STRICT VERIFICATION GUARDRAIL: Filter out any signal where quoted_text is not in source text
  const verifiedSignals = foundSignals.filter((s) => article.text.includes(s.quoted_text));

  // Determine framing summary profile based on text & signals
  const textLower = article.text.toLowerCase();
  let primaryFraming = 'Objective Reporting';
  let dominantTone = 'Measured & Descriptive';
  const highlightedActors: string[] = [];
  const omittedPerspectives: string[] = [];

  if (textLower.includes('triumph') || textLower.includes('milestone') || textLower.includes('sovereign')) {
    primaryFraming = 'Nationalist & Technological Prestige';
    dominantTone = 'Triumphant, Patriotic, Optimistic';
    highlightedActors.push('Domestic Aerospace Engineers', 'Government Ministers', 'Jubilant Citizens');
    omittedPerspectives.push('Program budget overruns', 'Competing social welfare needs', 'Regional military reactions');
  } else if (textLower.includes('budget') || textLower.includes('expenditures') || textLower.includes('capital drain') || textLower.includes('taxpayer')) {
    primaryFraming = 'Fiscal Scrutiny & Resource Allocation';
    dominantTone = 'Critical, Urgent, Skeptical';
    highlightedActors.push('Finance Ministry Insiders', 'Fiscal Analysts', 'Taxpayers');
    omittedPerspectives.push('Long-term scientific returns', 'Commercial satellite revenue potential', 'National engineering pride');
  } else if (textLower.includes('rivalry') || textLower.includes('geopolitical') || textLower.includes('dual-use') || textLower.includes('beijing')) {
    primaryFraming = 'Great-Power Competition & Security Strategy';
    dominantTone = 'Calculated, Realpolitik, Strategic';
    highlightedActors.push('Defense Strategists', 'Regional Military Commands', 'Diplomatic Envoys');
    omittedPerspectives.push('Domestic scientific education impact', 'Fiscal budget trade-offs', 'Civic public enthusiasm');
  } else if (textLower.includes('crush') || textLower.includes('bureaucracy') || textLower.includes('draconian')) {
    primaryFraming = 'Market Deregulation & Startup Threat';
    dominantTone = 'Alarmist, Anti-regulatory, Urgent';
    highlightedActors.push('Startup Founders', 'Venture Capitalists', 'Industry Lobbyists');
    omittedPerspectives.push('Consumer privacy harms', 'Algorithmic bias victims', 'Public accountability');
  } else if (textLower.includes('consumer') || textLower.includes('safeguards') || textLower.includes('unaccountable')) {
    primaryFraming = 'Consumer Protection & Corporate Accountability';
    dominantTone = 'Vindicated, Reformist, Principled';
    highlightedActors.push('Civil Liberties Advocates', 'Consumer Coalitions', 'Public Citizens');
    omittedPerspectives.push('Compliance cost burdens on small startups', 'International competitive drag');
  } else {
    primaryFraming = 'Institutional & Strategic Analysis';
    dominantTone = 'Analytical, Pragmatic';
    highlightedActors.push('Key Stakeholders', 'Industry Observers');
    omittedPerspectives.push('Alternative policy counterfactuals');
  }

  return {
    article_id: article.id,
    title: article.title,
    publisher: article.publisher,
    primary_framing: primaryFraming,
    dominant_tone: dominantTone,
    highlighted_actors: highlightedActors,
    omitted_perspectives: omittedPerspectives,
    signals: verifiedSignals,
  };
}

export function generateComparativeFindings(articles: ArticleAnalysis[]): ComparativeFinding[] {
  if (articles.length <= 1) {
    return [
      {
        category: 'Single-Source Framing Profile',
        title: 'Primary Narrative Strategy',
        description: `This article establishes a central framing of "${articles[0].primary_framing}", employing a ${articles[0].dominant_tone.toLowerCase()} register.`,
        contrast_table: [
          {
            publisher: articles[0].publisher,
            approach: articles[0].primary_framing,
          },
        ],
      },
    ];
  }

  return [
    {
      category: 'Narrative Framing Angle',
      title: 'Central Event Interpretation',
      description:
        'Each outlet frames the identical core occurrence through fundamentally divergent thematic lenses, directing reader attention to contrasting consequences.',
      contrast_table: articles.map((a) => ({
        publisher: a.publisher,
        approach: a.primary_framing,
      })),
    },
    {
      category: 'Primary Actors & Heroes/Adversaries',
      title: 'Attributed Agency and Focus',
      description:
        'The selection of who is quoted and granted voice directly impacts perceived legitimacy and authority.',
      contrast_table: articles.map((a) => ({
        publisher: a.publisher,
        approach: a.highlighted_actors.join(', ') || 'General sources',
      })),
    },
    {
      category: 'Systemic Blind Spots & Omissions',
      title: 'Context Present in Competing Coverage but Ignored Here',
      description:
        'Cross-article comparison reveals what contextual information each publication chose not to disclose to its audience.',
      contrast_table: articles.map((a) => ({
        publisher: a.publisher,
        approach: a.omitted_perspectives.join('; ') || 'Standard contextual omissions',
      })),
    },
  ];
}
