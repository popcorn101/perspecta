'use client';

import React, { useMemo } from 'react';
import { ArticleAnalysis, ArticleInput, FramingSignal, PrismCategory } from '@/lib/types';
import { PRISM_CATEGORIES } from '@/lib/prism-rubric';
import { Shield, Sparkles, BookOpen, Layers } from 'lucide-react';
import { HighlightSpan } from './HighlightSpan';

interface StoryAnalysisDashboardProps {
  article: ArticleInput;
  analysis?: ArticleAnalysis;
  selectedSignal: FramingSignal | null;
  onSelectSignal: (signal: FramingSignal) => void;
  activeCategoryFilter: PrismCategory | 'all';
  onSelectCategoryFilter: (cat: PrismCategory | 'all') => void;
}

export const StoryAnalysisDashboard: React.FC<StoryAnalysisDashboardProps> = ({
  article,
  analysis,
  selectedSignal,
  onSelectSignal,
  activeCategoryFilter,
  onSelectCategoryFilter,
}) => {
  const allSignals = analysis?.signals || [];

  const filteredSignals = useMemo(() => {
    if (activeCategoryFilter === 'all') return allSignals;
    return allSignals.filter((s) => s.category === activeCategoryFilter);
  }, [allSignals, activeCategoryFilter]);

  // Metric distributions
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      claims: 0,
      evaluative: 0,
      attribution: 0,
      emotional: 0,
      certainty: 0,
      primacy: 0,
      omission: 0,
    };
    allSignals.forEach((s) => {
      if (counts[s.category] !== undefined) counts[s.category]++;
      else counts[s.category] = 1;
    });
    return counts;
  }, [allSignals]);

  const totalSignals = allSignals.length || 1;
  const factsPct = Math.round(((categoryCounts.claims || 0) / totalSignals) * 100);
  const opinionsPct = Math.round(((categoryCounts.evaluative || 0) / totalSignals) * 100);
  const framingPct = Math.round(
    (((categoryCounts.attribution || 0) + (categoryCounts.certainty || 0) + (categoryCounts.primacy || 0)) /
      totalSignals) *
      100
  );
  const emotionPct = Math.round(((categoryCounts.emotional || 0) / totalSignals) * 100);

  // Render article body with highlights
  const renderedBody = useMemo(() => {
    const rawText = article.text;
    if (!filteredSignals.length) {
      return <p className="leading-relaxed whitespace-pre-line">{rawText}</p>;
    }

    interface MatchOccur {
      signal: FramingSignal;
      start: number;
      end: number;
    }

    const occurrences: MatchOccur[] = [];
    const sorted = [...filteredSignals].sort((a, b) => b.quoted_text.length - a.quoted_text.length);

    for (const sig of sorted) {
      const q = sig.quoted_text;
      let pos = 0;
      while ((pos = rawText.indexOf(q, pos)) !== -1) {
        const start = pos;
        const end = pos + q.length;
        const overlap = occurrences.some((occ) => Math.max(start, occ.start) < Math.min(end, occ.end));
        if (!overlap) {
          occurrences.push({ signal: sig, start, end });
        }
        pos += q.length;
      }
    }

    occurrences.sort((a, b) => a.start - b.start);

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;

    occurrences.forEach((occ, idx) => {
      if (occ.start > lastIndex) {
        nodes.push(<span key={`text-${idx}-${lastIndex}`}>{rawText.substring(lastIndex, occ.start)}</span>);
      }
      const isActive = selectedSignal?.quoted_text === occ.signal.quoted_text;
      nodes.push(
        <HighlightSpan
          key={`sig-${idx}-${occ.start}`}
          signal={occ.signal}
          isActive={isActive}
          onSelect={onSelectSignal}
        />
      );
      lastIndex = occ.end;
    });

    if (lastIndex < rawText.length) {
      nodes.push(<span key={`text-tail-${lastIndex}`}>{rawText.substring(lastIndex)}</span>);
    }

    return (
      <div className="font-serif text-lg leading-[1.85] text-[#241E19] whitespace-pre-line">
        {nodes}
      </div>
    );
  }, [article.text, filteredSignals, selectedSignal, onSelectSignal]);

  return (
    <div className="space-y-6">
      {/* Top Utility Context Bar */}
      <section className="w-full bg-[#F2ECE3] border border-[#D8CFC4]/70 rounded-xl px-5 py-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#5D544C]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B6B56]" />
            <span className="font-semibold text-[#241E19]">Monitored Source:</span>
            <span>{article.publisher || 'Direct Publication Feed'}</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Model: Groq Llama-3.3 70B</span>
            <span className="text-[#D8CFC4]">•</span>
            <span>
              Signals Detected: <strong className="text-[#241E19] font-bold">{allSignals.length}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Editorial Overview Header */}
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-[#E2D9CE] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#F9EFEA] text-[#9E4A28] border border-[#FFDBCE] text-[11px] font-semibold uppercase tracking-wider">
              Linguistic Dissection
            </span>
            <span className="text-xs font-mono text-[#7C7167]">
              Perspective: {analysis?.primary_framing || 'General Framing'}
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#241E19] font-medium tracking-tight leading-tight">
            {article.title || 'Story Analysis'}
          </h2>
          <p className="text-xs text-[#5D544C] mt-1 flex flex-wrap items-center gap-2">
            <span>By <strong>{article.author || 'Editorial Staff'}</strong></span>
            <span className="text-[#D8CFC4]">•</span>
            <span>{article.text.split(/\s+/).length} words</span>
            <span className="text-[#D8CFC4]">•</span>
            <span className="text-[#3B6B56] font-semibold">100% Verbatim Quote Verification</span>
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-[#7C7167] font-semibold block mb-0.5">
            Dominant Tone
          </span>
          <span className="font-serif text-base italic text-[#241E19]">
            {analysis?.dominant_tone || 'Measured'}
          </span>
        </div>
      </header>

      {/* 4 Analytical Category Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Empirical Claims */}
        <article className="p-4 rounded-xl bg-[#FAF7F2] border border-[#D8CFC4] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#3B6B56]" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-[#EBF1EE] text-[#3B6B56] border border-[#B9D5C8] text-[10px] uppercase font-bold tracking-wider">
              Empirical Claims
            </span>
            <span className="text-xs font-mono text-[#7C7167]">{categoryCounts.claims || 0} nodes</span>
          </div>
          <div className="font-serif text-2xl font-bold text-[#241E19] mb-1">
            {categoryCounts.claims || 0} Verifiable Facts
          </div>
          <p className="text-xs text-[#5D544C] leading-normal">
            Statistical data, empirical citations, and official primary metrics.
          </p>
        </article>

        {/* Opinions */}
        <article className="p-4 rounded-xl bg-[#FAF7F2] border border-[#D8CFC4] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#A66B24]" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-[#FAF3EA] text-[#A66B24] border border-[#E8D4BE] text-[10px] uppercase font-bold tracking-wider">
              Evaluative
            </span>
            <span className="text-xs font-mono text-[#7C7167]">{categoryCounts.evaluative || 0} nodes</span>
          </div>
          <div className="font-serif text-2xl font-bold text-[#241E19] mb-1">
            {categoryCounts.evaluative || 0} Opinions &amp; Biases
          </div>
          <p className="text-xs text-[#5D544C] leading-normal">
            Value judgments, subjective adjectives, and loaded characterizations.
          </p>
        </article>

        {/* Framing Signals */}
        <article className="p-4 rounded-xl bg-[#FAF7F2] border border-[#D8CFC4] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#9E4A28]" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-[#F9EFEA] text-[#9E4A28] border border-[#E8B6A2] text-[10px] uppercase font-bold tracking-wider">
              Framing Signals
            </span>
            <span className="text-xs font-mono text-[#7C7167]">
              {(categoryCounts.attribution || 0) + (categoryCounts.certainty || 0) + (categoryCounts.primacy || 0)} nodes
            </span>
          </div>
          <div className="font-serif text-2xl font-bold text-[#241E19] mb-1">
            {(categoryCounts.attribution || 0) + (categoryCounts.certainty || 0) + (categoryCounts.primacy || 0)} Frames
          </div>
          <p className="text-xs text-[#5D544C] leading-normal">
            Attribution choices, pacing, anonymous sourcing, and certainty hedging.
          </p>
        </article>

        {/* Emotional Rhetoric */}
        <article className="p-4 rounded-xl bg-[#FAF7F2] border border-[#D8CFC4] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#7D374B]" />
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full bg-[#F6ECF0] text-[#7D374B] border border-[#DFBAC5] text-[10px] uppercase font-bold tracking-wider">
              Affective Language
            </span>
            <span className="text-xs font-mono text-[#7C7167]">{categoryCounts.emotional || 0} nodes</span>
          </div>
          <div className="font-serif text-2xl font-bold text-[#241E19] mb-1">
            {categoryCounts.emotional || 0} Emotional Terms
          </div>
          <p className="text-xs text-[#5D544C] leading-normal">
            Affective vocabulary evoking urgency, communal euphoria, or alarm.
          </p>
        </article>
      </section>

      {/* Rhetorical Weight Spectrum Bar */}
      <section className="bg-[#FAF7F2] rounded-xl p-4 border border-[#D8CFC4] shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#241E19]">
          <span>Dissection Ratio &amp; Rhetorical Weight</span>
          <span className="font-mono text-[#7C7167]">Sample Depth: {allSignals.length} Detected Signals</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-[#E5DCD1] flex gap-1 overflow-hidden p-0.5">
          <div className="h-full bg-[#3B6B56] rounded-full" style={{ width: `${Math.max(10, factsPct)}%` }} />
          <div className="h-full bg-[#A66B24] rounded-full" style={{ width: `${Math.max(10, opinionsPct)}%` }} />
          <div className="h-full bg-[#9E4A28] rounded-full" style={{ width: `${Math.max(10, framingPct)}%` }} />
          <div className="h-full bg-[#7D374B] rounded-full" style={{ width: `${Math.max(10, emotionPct)}%` }} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#5D544C] pt-1">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#3B6B56]" /> {categoryCounts.claims || 0} Claims</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#A66B24]" /> {categoryCounts.evaluative || 0} Evaluative</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#9E4A28]" /> {(categoryCounts.attribution || 0) + (categoryCounts.certainty || 0) + (categoryCounts.primacy || 0)} Framing</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#7D374B]" /> {categoryCounts.emotional || 0} Affective</span>
        </div>
      </section>

      {/* Interactive Filter Chips Row */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onSelectCategoryFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
            activeCategoryFilter === 'all'
              ? 'bg-[#241E19] text-[#FAF7F2] shadow-xs'
              : 'bg-[#EFE8DF] text-[#5D544C] hover:bg-[#E6DDD2]'
          }`}
        >
          Show All ({allSignals.length})
        </button>
        {(['attribution', 'evaluative', 'certainty', 'claims', 'primacy', 'omission', 'emotional'] as PrismCategory[]).map(
          (cat) => {
            const meta = PRISM_CATEGORIES[cat];
            const isSelected = activeCategoryFilter === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected ? 'ring-2 ring-offset-1 font-bold' : 'opacity-85 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: meta.bgWash,
                  borderColor: meta.borderColor,
                  color: meta.color,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                <span>{meta.name.split('&')[0]} ({count})</span>
              </button>
            );
          }
        )}
      </nav>

      {/* Article Monitored Broadside View */}
      <article className="bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#D8CFC4] shadow-paper-sm relative">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#E2D9CE] text-xs font-mono text-[#7C7167]">
          <span className="uppercase font-bold tracking-wider text-[#241E19]">
            Original Monitored Broadside
          </span>
          <span>Click colored phrases to open inspector</span>
        </div>

        {renderedBody}
      </article>
    </div>
  );
};
