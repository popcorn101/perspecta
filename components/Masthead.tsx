'use client';

import React from 'react';
import { Newspaper, ShieldCheck, BookOpen, Sparkles } from 'lucide-react';

interface MastheadProps {
  onOpenObservability: () => void;
  onOpenFramework: () => void;
  activeDemoId?: string;
  onSelectDemo?: (demoId: string) => void;
}

export const Masthead: React.FC<MastheadProps> = ({
  onOpenObservability,
  onOpenFramework,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="w-full bg-[#FAF7F2] border-b border-[#D8CFC4] pt-4 pb-3 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#7C7167] tracking-wider uppercase border-b border-[#E2D9CE] pb-2 mb-3">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[#241E19]">Vol. IV • No. 108</span>
            <span className="hidden sm:inline text-[#D8CFC4]">|</span>
            <span className="hidden sm:inline">{currentDate}</span>
            <span className="hidden md:inline text-[#D8CFC4]">|</span>
            <span className="hidden md:inline text-[#9E4A28] font-medium">PRISM Rubric Edition</span>
          </div>

          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            <button
              onClick={onOpenFramework}
              className="flex items-center gap-1.5 hover:text-[#9E4A28] transition-colors py-0.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>PRISM Methodology</span>
            </button>
            <span className="text-[#D8CFC4]">|</span>
            <button
              onClick={onOpenObservability}
              className="flex items-center gap-1.5 hover:text-[#9E4A28] transition-colors py-0.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3B6B56]" />
              <span>Guardrails & Verification</span>
            </button>
          </div>
        </div>

        {/* Central Masthead Typography */}
        <div className="text-center py-2 relative">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <span className="h-px w-12 sm:w-20 bg-[#D8CFC4]" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#7C7167] font-semibold">
              Media Literacy & Framing Analysis
            </span>
            <span className="h-px w-12 sm:w-20 bg-[#D8CFC4]" />
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl tracking-tight text-[#241E19] font-normal my-1">
            PERSPECTA
          </h1>

          <p className="font-serif italic text-sm sm:text-base text-[#5D544C] max-w-xl mx-auto mt-1">
            &ldquo;Don&rsquo;t tell people what to think. Show them how the story is being told.&rdquo;
          </p>
        </div>

        {/* Bottom Double Rule */}
        <div className="newspaper-double-rule pt-2 mt-2 flex flex-wrap items-center justify-between text-xs text-[#5D544C]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#3B6B56]" />
            <span>Strict Verbatim String Matching</span>
          </div>
          <div className="flex items-center gap-4 text-center">
            <span className="italic">7 Structural PRISM Signals</span>
            <span className="hidden sm:inline text-[#D8CFC4]">•</span>
            <span className="hidden sm:inline">Zero Subjective Bias Meters</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[#7C7167]">
            <Sparkles className="w-3.5 h-3.5 text-[#9E4A28]" />
            <span>Multi-Perspective Decomposition</span>
          </div>
        </div>
      </div>
    </header>
  );
};
