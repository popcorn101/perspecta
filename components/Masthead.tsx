'use client';

import React from 'react';
import { Newspaper, ShieldCheck, BookOpen, Layers, BarChart3, Sparkles } from 'lucide-react';

interface MastheadProps {
  currentView: 'analysis' | 'compare';
  onChangeView: (view: 'analysis' | 'compare') => void;
  onOpenObservability: () => void;
  onOpenFramework: () => void;
  onStartTour?: () => void;
  activeDemoId?: string;
  onSelectDemo?: (demoId: string) => void;
}

export const Masthead: React.FC<MastheadProps> = ({
  currentView,
  onChangeView,
  onOpenObservability,
  onOpenFramework,
  onStartTour,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="w-full bg-[#FAF7F2] border-b border-[#D8CFC4] pt-4 pb-3 px-4 sm:px-8 shadow-[0_1px_6px_rgba(36,30,25,0.03)]">
      <div className="max-w-7xl mx-auto">
        {/* Top Context Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-[#7C7167] tracking-wider uppercase border-b border-[#E2D9CE] pb-2 mb-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[#241E19]">PERSPECTA</span>
            <span className="hidden sm:inline text-[#D8CFC4]">•</span>
            <span className="px-2 py-0.5 rounded-full bg-[#EFE8DF] text-[#5D544C] text-[10px] font-semibold tracking-wider border border-[#D8CFC4]/50">
              Perspective Intelligence
            </span>
            <span className="hidden md:inline text-[#D8CFC4]">•</span>
            <span className="hidden md:inline text-[#9E4A28] font-medium">{currentDate}</span>
          </div>

          <div className="flex items-center gap-4 mt-1 sm:mt-0">
            {onStartTour && (
              <>
                <button
                  onClick={onStartTour}
                  className="flex items-center gap-1.5 text-[#9E4A28] hover:text-[#742A2A] font-medium transition-colors py-0.5"
                  title="Guided Spotlight Tour"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#9E4A28]" />
                  <span>How PERSPECTA Works</span>
                </button>
                <span className="text-[#D8CFC4]">|</span>
              </>
            )}
            <button
              onClick={onOpenFramework}
              className="flex items-center gap-1.5 hover:text-[#9E4A28] transition-colors py-0.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#A66B24]" />
              <span>Prism Framework</span>
            </button>
            <span className="text-[#D8CFC4]">|</span>
            <button
              onClick={onOpenObservability}
              className="flex items-center gap-1.5 hover:text-[#9E4A28] transition-colors py-0.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3B6B56]" />
              <span>Guardrails & Telemetry</span>
            </button>
          </div>
        </div>

        {/* Central Masthead Header with Top-Level Route Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif text-3xl sm:text-4xl text-[#241E19] font-medium tracking-tight">
                PERSPECTA
              </span>
              <span className="h-4 w-px bg-[#D8CFC4] mx-1" />
              <span className="text-xs text-[#7C7167] italic font-serif">
                &ldquo;Don&rsquo;t tell people what to think. Show them how the story is being told.&rdquo;
              </span>
            </div>
          </div>

          {/* Top-Level Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[#EFE8DF] p-1 rounded-full border border-[#D8CFC4]/80 shadow-xs">
            <button
              onClick={() => onChangeView('analysis')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'analysis'
                  ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                  : 'text-[#5D544C] hover:text-[#241E19]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#9E4A28]" />
              <span>Story Analysis</span>
            </button>

            <button
              id="tour-compare-tab"
              onClick={() => onChangeView('compare')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentView === 'compare'
                  ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                  : 'text-[#5D544C] hover:text-[#241E19]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#3B6B56]" />
              <span>Compare Perspectives</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
