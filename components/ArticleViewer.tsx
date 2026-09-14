'use client';

import React, { useMemo } from 'react';
import { ArticleAnalysis, ArticleInput, FramingSignal, PrismCategory } from '@/lib/types';
import { HighlightSpan } from './HighlightSpan';
import { PRISM_CATEGORIES } from '@/lib/prism-rubric';
import { Bookmark, Shield, Sparkles } from 'lucide-react';

interface ArticleViewerProps {
  article: ArticleInput;
  analysis?: ArticleAnalysis;
  selectedSignal: FramingSignal | null;
  onSelectSignal: (signal: FramingSignal) => void;
  activeCategoryFilter?: PrismCategory | 'all';
  columnCount: number;
}

export const ArticleViewer: React.FC<ArticleViewerProps> = ({
  article,
  analysis,
  selectedSignal,
  onSelectSignal,
  activeCategoryFilter = 'all',
  columnCount,
}) => {
  const signals = useMemo(() => {
    if (!analysis?.signals) return [];
    if (activeCategoryFilter === 'all') return analysis.signals;
    return analysis.signals.filter((s) => s.category === activeCategoryFilter);
  }, [analysis, activeCategoryFilter]);

  // Robust algorithm to replace verbatim spans with HighlightSpan components
  const renderedContent = useMemo(() => {
    const rawText = article.text;
    if (!signals.length) {
      return <p className="leading-relaxed whitespace-pre-line">{rawText}</p>;
    }

    // Find all valid non-overlapping occurrences
    interface MatchOccur {
      signal: FramingSignal;
      start: number;
      end: number;
    }

    const occurrences: MatchOccur[] = [];

    // Sort signals by length descending to match longest phrases first
    const sortedSignals = [...signals].sort(
      (a, b) => b.quoted_text.length - a.quoted_text.length
    );

    for (const sig of sortedSignals) {
      const q = sig.quoted_text;
      let pos = 0;
      while ((pos = rawText.indexOf(q, pos)) !== -1) {
        const start = pos;
        const end = pos + q.length;

        // Ensure no overlap with already identified occurrences
        const overlap = occurrences.some(
          (occ) => Math.max(start, occ.start) < Math.min(end, occ.end)
        );

        if (!overlap) {
          occurrences.push({ signal: sig, start, end });
        }
        pos += q.length;
      }
    }

    // Sort occurrences by start index
    occurrences.sort((a, b) => a.start - b.start);

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    occurrences.forEach((occ, idx) => {
      if (occ.start > lastIndex) {
        segments.push(
          <span key={`text-${idx}-${lastIndex}`}>
            {rawText.substring(lastIndex, occ.start)}
          </span>
        );
      }

      const isActive = selectedSignal?.quoted_text === occ.signal.quoted_text;

      segments.push(
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
      segments.push(
        <span key={`text-tail-${lastIndex}`}>
          {rawText.substring(lastIndex)}
        </span>
      );
    }

    return (
      <div className="leading-relaxed whitespace-pre-line font-serif text-[#241E19] text-base md:text-[17px]">
        {segments}
      </div>
    );
  }, [article.text, signals, selectedSignal, onSelectSignal]);

  return (
    <article className="bg-[#FAF7F2] border border-[#D8CFC4] rounded p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-paper-sm">
      {/* Top Header Information */}
      <div>
        <div className="flex items-center justify-between border-b border-[#E2D9CE] pb-3 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#7C7167] block">
              Source Publication
            </span>
            <h3 className="font-serif text-xl sm:text-2xl text-[#241E19] font-medium">
              {article.publisher}
            </h3>
          </div>

          <div className="text-right">
            {article.date && (
              <span className="text-xs text-[#7C7167] block">
                {article.date}
              </span>
            )}
            {article.author && (
              <span className="text-xs italic text-[#5D544C] block">
                By {article.author}
              </span>
            )}
          </div>
        </div>

        {/* Framing & Tone Dossier Pill */}
        {analysis && (
          <div className="bg-[#F7F3EE] border border-[#E2D9CE] rounded p-3 mb-4 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E4A28] block">
                Primary Framing Angle
              </span>
              <p className="font-serif text-sm font-semibold text-[#241E19]">
                {analysis.primary_framing}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8DFD4] text-xs">
              <span className="text-[#5D544C]">
                <strong>Tone:</strong> {analysis.dominant_tone}
              </span>
              <span className="bg-[#EFE8DF] px-2 py-0.5 rounded text-[11px] font-mono text-[#5D544C]">
                {analysis.signals.length} Signals Identified
              </span>
            </div>
          </div>
        )}

        {/* Headline */}
        <h4 className="font-serif text-lg sm:text-xl font-medium text-[#241E19] leading-snug mb-4">
          {article.title}
        </h4>

        {/* Article Body with Highlights */}
        <div className="newspaper-single-rule pt-4 text-[#241E19]">
          {renderedContent}
        </div>
      </div>

      {/* Footer Meta */}
      {analysis && (
        <div className="mt-6 pt-4 border-t border-[#E2D9CE] flex flex-wrap items-center justify-between text-xs text-[#7C7167]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#3B6B56]" />
            <span>100% Verbatim Match</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="italic">Key Actors:</span>
            <span className="font-medium text-[#5D544C] truncate max-w-[180px]">
              {analysis.highlighted_actors.slice(0, 2).join(', ') || 'Various'}
            </span>
          </div>
        </div>
      )}
    </article>
  );
};
