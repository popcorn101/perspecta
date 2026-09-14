# TASK SPECIFICATION: Build PERSPECTA (Media Literacy & Framing Analysis Platform)

Build a full-stack, production-ready web application named **PERSPECTA**.
Tagline: "See beyond the story."
Core Philosophy: "Don't tell people what to think. Show them how the story is being told."

---

## 1. TECH STACK & REQUIREMENTS
- **Framework:** Next.js (App Router, latest), TypeScript
- **Styling:** Tailwind CSS + Lucide Icons (lucide-react)
- **Deployment Target:** Vercel-ready (no external database required; mockable or API-key driven)
- **Validation & Types:** Zod for API schemas and runtime contract validation
- **Aesthetic:** Editorial, vintage broadsheet meets clean modern AI. Cream/off-white background (`bg-[#fcfbf9]`), dark charcoal typography (`text-zinc-900`), subtle double rules, muted amber/gold highlighter accents (`bg-amber-100` / `border-amber-300`), serif headers (`font-serif`), and clean monospace metadata badges. Avoid generic neon SaaS styles.

---

## 2. CORE DOMAIN & PHILOSOPHY (STRICT GUARDRAILS)
- PERSPECTA is **NOT** a political bias score generator (no "73% Left/Right" meters), **NOT** a truth oracle, and **NOT** a fake-news detector.
- PERSPECTA decomposes news articles into inspectable framing signals using the **PRISM** methodology:
  1. **Attribution & Sourcing:** Anonymous claims, passive voice distancing, unattributed quotes.
  2. **Evaluative & Loaded Language:** Emotionally charged adjectives/adverbs (e.g., "finally", "reckless", "historic").
  3. **Certainty & Speculation:** High-certainty assertions vs. speculative hedging.
  4. **Claims vs. Evidence:** Concrete asserted claims lacking cited data or corroboration.
  5. **Emphasis & Structural Primacy:** Details given top billing vs. buried facts.
  6. **Omissions & Blind Spots:** Context present in competing coverage but ignored in the target text.
  7. **Emotional Framing:** Rhetoric crafted to evoke fear, urgency, or outrage.
- **Strict Evidence Guardrail:** The system must NEVER flag an abstract opinion. Every detected signal MUST include:
  - `quoted_text`: The exact verbatim phrase from the source text.
  - `category`: One of the PRISM signal categories.
  - `explanation`: A neutral explanation of how this word/structure can influence reader perception.
  - `confidence`: Floating number between 0.0 and 1.0.

---

## 3. ARCHITECTURE & WORKFLOW

### A. Backend API Routes
1. `POST /api/analyze`
   - Accepts: `{ articles: [{ id: string, title: string, publisher: string, url?: string, text: string }] }` (Supports 1 to 3 articles).
   - If `OPENAI_API_KEY` (or compatible LLM key) is present in `.env`, call the model using Structured Outputs / strict JSON mode.
   - If no API key is provided, gracefully fallback to an intelligent built-in heuristic/mock engine with pre-loaded demo news coverage (e.g., comparing coverage of a space mission, government budget, or technology launch across 3 distinct perspectives).
   - **Verification Layer:** Run server-side verification with Zod and string verification:
     ```typescript
     // Filter out any hallucinated quote not present in the source text
     signals = signals.filter(s => article.text.includes(s.quoted_text));
     ```
   - Returns structured JSON containing the validated signals per article and cross-article comparative findings.

2. `GET /api/demos`
   - Returns pre-loaded 3-source comparative datasets so judges/users can test the platform instantly without pasting long articles.
   - Example demo: "Space Mission Launch"
     - Source A (Nationalist/Triumphant): "India achieves another historic milestone in space exploration."
     - Source B (Fiscal Critique): "India launches expensive new space mission amid budget concerns."
     - Source C (Geopolitical): "India's latest mission aims to strengthen position in global space competition."

### B. Frontend Pages & Components
1. **Header / Masthead:**
   - Vintage broadsheet style masthead with "PERSPECTA", date display, issue/demo indicator, and clear tagline.
2. **Input Section:**
   - Tabs: "Compare Multiple Sources (Recommended)" and "Inspect Single Article".
   - Ability to paste URLs/raw text into side-by-side boxes OR click "Load Curated Demo Case".
   - "Analyze Framing with PRISM →" primary action button.
3. **Multi-Source Comparative Matrix (The Core Differentiator):**
   - Renders 2 or 3 articles side-by-side in responsive newspaper columns.
   - Highlights verbatim phrases directly in the article body with subtle, category-coded highlighter pens.
   - Top-level comparison table displaying: Primary Narrative Framing, Dominant Tone, Main Actors Highlighted, and Omitted Context compared to others.
4. **Interactive Inspection Drawer / Popover:**
   - Clicking any highlighted phrase reveals an inspector panel:
     - Tag badge (e.g., `Evaluative Language`)
     - Quoted span
     - Plain-language explanation of why it shapes perception
     - Confidence indicator
     - Explanatory caveat: *"Identifies framing signals. Does not determine truth or intent."*
5. **Observability & PRISM Compliance Footnote:**
   - Small footer/modal detailing the pipeline: Verbatim string matching validation, strict JSON schema adherence, zero model weight modifications, and human-in-the-loop prompt calibration.

---

## 4. CODE DELIVERABLES
Generate a complete, functioning project structure:
- `package.json` with all dependencies configured.
- `app/layout.tsx` and `app/page.tsx` with responsive, editorial UI.
- `app/api/analyze/route.ts` with typed Zod schemas, LLM structured call, and hallucination guardrail.
- `lib/prism-rubric.ts` containing the full PRISM system prompts and signal taxonomy.
- `lib/demo-data.ts` containing the 3-source demo coverage with realistic news text.
- `components/` for ArticleViewer, HighlightSpan, InspectionDrawer, and ComparisonMatrix.

Ensure zero TypeScript errors, clean modular components, and an immediate working build on `npm run dev`.