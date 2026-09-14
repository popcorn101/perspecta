'use client';

import React from 'react';
import { FramingSignal, PrismCategory } from '@/lib/types';
import { PRISM_CATEGORIES } from '@/lib/prism-rubric';
import {
  X,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface InspectionDrawerProps {
  signal: FramingSignal | null;
  onClose: () => void;
  publisherName?: string;
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  signal,
  onClose,
  publisherName,
}) => {
  if (!signal) {
    return (
      <div className="bg-[#FAF7F2] border border-[#D8CFC4] p-6 rounded text-center text-[#7C7167]">
        <Search className="w-8 h-8 mx-auto mb-2 text-[#A3998E] opacity-60" />
        <h4 className="font-serif text-base text-[#241E19] font-medium mb-1">
          Signal Inspector Ready
        </h4>
        <p className="text-xs text-[#5D544C] leading-relaxed">
          Click any highlighted phrase in the articles above to view verbatim evidence, PRISM taxonomy breakdown, and perceptual impact analysis.
        </p>
      </div>
    );
  }

  const categoryMeta =
    PRISM_CATEGORIES[signal.category as PrismCategory] ||
    PRISM_CATEGORIES.evaluative;

  const confidencePct = Math.round(signal.confidence * 100);

  return (
    <div className="bg-[#FAF7F2] border-2 border-[#D8CFC4] rounded shadow-paper-md overflow-hidden animate-fadeIn">
      {/* Drawer Header */}
      <div
        className="px-4 py-3 border-b border-[#D8CFC4] flex items-center justify-between"
        style={{ backgroundColor: categoryMeta.bgWash }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: categoryMeta.color }}
          />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: categoryMeta.color }}
          >
            {categoryMeta.name}
          </span>
          {publisherName && (
            <span className="text-xs text-[#7C7167] font-normal">
              • in <em>{publisherName}</em>
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-black/5 text-[#5D544C] transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-4 text-[#241E19]">
        {/* Exact Quoted Verbatim Span */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#7C7167] font-semibold mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#3B6B56]" />
            <span>Verbatim Source Quote</span>
          </div>
          <blockquote className="font-serif text-lg italic text-[#241E19] bg-[#F7F3EE] p-3 rounded border-l-4 border-[#9E4A28]">
            &ldquo;{signal.quoted_text}&rdquo;
          </blockquote>
        </div>

        {/* Plain Language Explanation */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[#7C7167] font-semibold mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#9E4A28]" />
            <span>Framing Analysis & Mechanism</span>
          </div>
          <p className="text-sm text-[#241E19] leading-relaxed bg-white/60 p-3 rounded border border-[#E2D9CE]">
            {signal.explanation}
          </p>
        </div>

        {/* Perceptual Impact & Alternative Phrasing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {signal.framing_effect && (
            <div className="bg-[#FAF3EA] p-3 rounded border border-[#E8D4BE]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C531B] block mb-1">
                Perceptual Framing Effect
              </span>
              <span className="text-[#241E19] font-medium">
                {signal.framing_effect}
              </span>
            </div>
          )}

          {signal.alternative_phrasing && (
            <div className="bg-[#EBF1EE] p-3 rounded border border-[#B9D5C8]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#3B6B56] block mb-1">
                Neutral / Descriptive Baseline
              </span>
              <span className="text-[#241E19] italic flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-[#3B6B56] shrink-0" />
                &ldquo;{signal.alternative_phrasing}&rdquo;
              </span>
            </div>
          )}
        </div>

        {/* Confidence & Taxonomy Context */}
        <div className="border-t border-[#E2D9CE] pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5D544C]">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#7C7167] block">
              Confidence Score
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 h-2 bg-[#E6DDD2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#9E4A28] rounded-full"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <span className="font-mono text-xs font-semibold text-[#241E19]">
                {confidencePct}%
              </span>
            </div>
          </div>

          <div className="max-w-xs text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#7C7167] block">
              Why It Matters
            </span>
            <span className="text-[11px] text-[#5D544C] line-clamp-2">
              {categoryMeta.whyItMatters}
            </span>
          </div>
        </div>

        {/* PRISM Strict Caveat Note */}
        <div className="bg-[#F7F3EE] p-2.5 rounded border border-[#D8CFC4] flex items-start gap-2 text-[11px] text-[#5D544C]">
          <ShieldCheck className="w-4 h-4 text-[#3B6B56] shrink-0 mt-0.5" />
          <p className="leading-normal">
            <strong className="text-[#241E19]">PRISM Evidence Caveat:</strong>{' '}
            Identifies linguistic and structural framing signals. Does not assess factual accuracy, partisan intent, or moral integrity.
          </p>
        </div>
      </div>
    </div>
  );
};
