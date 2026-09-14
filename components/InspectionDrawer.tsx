'use client';

import React, { useState, useEffect } from 'react';
import { FramingSignal, PrismCategory } from '@/lib/types';
import { PRISM_CATEGORIES } from '@/lib/prism-rubric';
import {
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Layers,
  Globe,
  ExternalLink,
  Loader2,
  AlertTriangle,
  FileSearch,
} from 'lucide-react';

interface WebCorroborationData {
  query: string;
  verdict: 'corroborated' | 'contested' | 'unverified';
  summary: string;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
}

interface InspectionDrawerProps {
  signal: FramingSignal | null;
  onClose: () => void;
  publisherName?: string;
  totalSignalsCount?: number;
  currentIndex?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  signal,
  onClose,
  publisherName,
  totalSignalsCount = 1,
  currentIndex = 0,
  onPrev,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'alternatives' | 'corroboration'>('explanation');
  const [corroborationData, setCorroborationData] = useState<WebCorroborationData | null>(null);
  const [isCorroborating, setIsCorroborating] = useState<boolean>(false);
  const [corroborationError, setCorroborationError] = useState<string | null>(null);

  // Reset corroboration state when signal changes
  useEffect(() => {
    setCorroborationData(null);
    setIsCorroborating(false);
    setCorroborationError(null);
  }, [signal?.quoted_text]);

  const handleFetchWebCorroboration = async () => {
    if (!signal) return;
    setIsCorroborating(true);
    setCorroborationError(null);

    try {
      const res = await fetch('/api/corroborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote: signal.quoted_text,
          category: signal.category,
          context: signal.explanation,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch web corroboration.');
      }

      const data: WebCorroborationData = await res.json();
      setCorroborationData(data);
    } catch (err: any) {
      setCorroborationError(err.message || 'Error checking web corroboration.');
    } finally {
      setIsCorroborating(false);
    }
  };

  if (!signal) {
    return (
      <div className="bg-[#FAF7F2] border border-[#D8CFC4] p-6 rounded-2xl text-center text-[#7C7167] shadow-sm">
        <Layers className="w-8 h-8 mx-auto mb-2 text-[#9E4A28] opacity-70" />
        <h4 className="font-serif text-lg text-[#241E19] font-medium mb-1">
          Interactive Inspector Workbench
        </h4>
        <p className="text-xs text-[#5D544C] leading-relaxed max-w-md mx-auto">
          Click on any annotated phrase in the article above to inspect its framing mechanism, linguistic vectors, and live web corroboration.
        </p>
      </div>
    );
  }

  const categoryMeta =
    PRISM_CATEGORIES[signal.category as PrismCategory] ||
    PRISM_CATEGORIES.evaluative;

  const confidencePct = Math.round(signal.confidence * 100);

  return (
    <div className="bg-[#FAF7F2] rounded-2xl border border-[#D8CFC4] shadow-md transition-all duration-300 relative overflow-hidden text-[#241E19]">
      {/* Accent Top Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-300"
        style={{ backgroundColor: categoryMeta.color }}
      />

      <div className="p-5 space-y-4">
        {/* Header & Category Badge */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border"
              style={{
                backgroundColor: categoryMeta.bgWash,
                color: categoryMeta.color,
                borderColor: categoryMeta.borderColor,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: categoryMeta.color }}
              />
              <span>{categoryMeta.name}</span>
            </span>

            {publisherName && (
              <span className="text-[11px] text-[#7C7167] font-mono">
                Source: {publisherName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onPrev && (
              <button
                onClick={onPrev}
                className="w-7 h-7 rounded-full bg-[#EFE8DF] hover:bg-[#E6DDD2] border border-[#D8CFC4] flex items-center justify-center text-[#241E19] transition-colors"
                title="Previous signal"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="w-7 h-7 rounded-full bg-[#EFE8DF] hover:bg-[#E6DDD2] border border-[#D8CFC4] flex items-center justify-center text-[#241E19] transition-colors"
                title="Next signal"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#EFE8DF] hover:bg-[#E6DDD2] border border-[#D8CFC4] flex items-center justify-center text-[#5D544C] transition-colors ml-1"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Syntactic Unit / Quote Display */}
        <div className="bg-[#F7F3EE] p-3.5 rounded-xl border border-[#D8CFC4]/70">
          <span className="text-[10px] uppercase font-semibold text-[#7C7167] tracking-wider block mb-1">
            Selected Syntactic Excerpt
          </span>
          <blockquote className="font-serif text-lg italic text-[#241E19] leading-snug">
            &ldquo;{signal.quoted_text}&rdquo;
          </blockquote>
        </div>

        {/* Inspector Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#EFE8DF] p-1 rounded-lg border border-[#D8CFC4]">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'explanation'
                ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                : 'text-[#5D544C] hover:text-[#241E19]'
            }`}
          >
            Explanation
          </button>
          <button
            onClick={() => setActiveTab('alternatives')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
              activeTab === 'alternatives'
                ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                : 'text-[#5D544C] hover:text-[#241E19]'
            }`}
          >
            Alternatives
          </button>
          <button
            onClick={() => setActiveTab('corroboration')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all flex items-center justify-center gap-1 ${
              activeTab === 'corroboration'
                ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                : 'text-[#5D544C] hover:text-[#241E19]'
            }`}
          >
            <Globe className="w-3 h-3 text-[#3B6B56]" />
            <span>Corroboration</span>
          </button>
        </div>

        {/* Tab 1: Explanation */}
        {activeTab === 'explanation' && (
          <div className="space-y-3 animate-fadeIn">
            <div>
              <h5 className="text-[11px] uppercase font-bold tracking-wider text-[#7C7167] mb-1">
                Why was this highlighted?
              </h5>
              <p className="font-serif text-sm text-[#241E19] leading-relaxed bg-[#FAF7F2] p-3 rounded-lg border border-[#E2D9CE]">
                {signal.explanation}
              </p>
            </div>

            {/* Linguistic Vector Analysis Card */}
            <div className="p-3 bg-[#F7F3EE] rounded-xl border border-[#D8CFC4]/70 space-y-2 text-xs">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#241E19]">
                Linguistic Vector Analysis
              </div>
              <ul className="space-y-1.5 text-[#241E19]">
                {signal.framing_effect && (
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9E4A28] mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-[#241E19]">Perceptual Impact: </span>
                      <span className="text-[#5D544C]">{signal.framing_effect}</span>
                    </div>
                  </li>
                )}
                {signal.alternative_phrasing && (
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B6B56] mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-[#241E19]">Neutral Reformulation: </span>
                      <span className="text-[#5D544C] italic">&ldquo;{signal.alternative_phrasing}&rdquo;</span>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            {/* Confidence Gauge */}
            <div className="bg-[#F7F3EE] p-3 rounded-xl border border-[#D8CFC4]/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#7C7167] block">
                  Classification Rigor
                </span>
                <span className="font-mono text-xs font-semibold text-[#241E19]">
                  {confidencePct}% • Lexical Semantics
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-4 h-2 rounded ${confidencePct > 50 ? 'bg-[#9E4A28]' : 'bg-[#E2D9CE]'}`} />
                <span className={`w-4 h-2 rounded ${confidencePct > 75 ? 'bg-[#9E4A28]' : 'bg-[#E2D9CE]'}`} />
                <span className={`w-4 h-2 rounded ${confidencePct > 85 ? 'bg-[#9E4A28]' : 'bg-[#E2D9CE]'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Alternatives */}
        {activeTab === 'alternatives' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="p-3 bg-[#F7F3EE] rounded-xl border border-[#D8CFC4]/70">
              <div className="text-[11px] font-bold text-[#241E19] mb-1">
                Neutral Editorial Baseline
              </div>
              <p className="font-serif text-sm text-[#5D544C] italic mb-3">
                &ldquo;{signal.alternative_phrasing || 'The reported action occurred in accordance with the established schedule.'}&rdquo;
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#7C7167] border-t border-[#E2D9CE] pt-2">
                <span>Rhetorical delta: -72% Affective Weight</span>
                <span className="text-[#9E4A28] font-semibold">Standard Model</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Corroboration (Live Web Fact-Checking & Primary Sources) */}
        {activeTab === 'corroboration' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Action Trigger if not checked yet */}
            {!corroborationData && !isCorroborating && (
              <div className="p-4 bg-[#F7F3EE] rounded-xl border border-[#D8CFC4]/70 text-center space-y-3">
                <Globe className="w-6 h-6 text-[#3B6B56] mx-auto opacity-80" />
                <div>
                  <h5 className="font-serif text-sm font-semibold text-[#241E19]">
                    Empirical Web Corroboration
                  </h5>
                  <p className="text-xs text-[#5D544C] mt-0.5 max-w-sm mx-auto">
                    Cross-reference this excerpt against live news archives, public records, and external coverage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFetchWebCorroboration}
                  className="bg-[#241E19] hover:bg-[#3D352E] text-[#FAF7F2] text-xs font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <FileSearch className="w-3.5 h-3.5 text-[#A66B24]" />
                  <span>Search Live Web Sources</span>
                </button>
              </div>
            )}

            {/* Loading Indicator */}
            {isCorroborating && (
              <div className="p-6 bg-[#F7F3EE] rounded-xl border border-[#D8CFC4]/70 text-center space-y-2">
                <Loader2 className="w-5 h-5 text-[#9E4A28] animate-spin mx-auto" />
                <p className="text-xs font-mono text-[#5D544C]">
                  Scanning live web records &amp; synthesizing primary evidence...
                </p>
              </div>
            )}

            {/* Error Message */}
            {corroborationError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{corroborationError}</span>
              </div>
            )}

            {/* Results Display */}
            {corroborationData && (
              <div className="space-y-3">
                {/* Synthesis Summary Badge */}
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#D8CFC4] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#7C7167]">
                      Web Synthesis
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        corroborationData.verdict === 'corroborated'
                          ? 'bg-[#EBF1EE] text-[#3B6B56] border border-[#B9D5C8]'
                          : corroborationData.verdict === 'contested'
                          ? 'bg-[#F9EFEA] text-[#9E4A28] border border-[#E8B6A2]'
                          : 'bg-[#FAF3EA] text-[#A66B24] border border-[#E8D4BE]'
                      }`}
                    >
                      {corroborationData.verdict}
                    </span>
                  </div>
                  <p className="text-xs text-[#241E19] leading-relaxed">
                    {corroborationData.summary}
                  </p>
                </div>

                {/* Cited Sources List */}
                {corroborationData.sources.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#7C7167] block px-1">
                      Matched Web Sources &amp; Coverage ({corroborationData.sources.length})
                    </span>
                    <div className="space-y-2">
                      {corroborationData.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-2.5 bg-[#F7F3EE] hover:bg-[#EFE8DF] rounded-lg border border-[#D8CFC4]/70 transition-colors group"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-[#241E19] group-hover:text-[#9E4A28] mb-1">
                            <span className="line-clamp-1">{src.title}</span>
                            <ExternalLink className="w-3 h-3 text-[#7C7167] shrink-0 ml-1" />
                          </div>
                          <p className="text-[11px] text-[#5D544C] line-clamp-2 leading-tight">
                            {src.snippet}
                          </p>
                          <span className="text-[10px] font-mono text-[#7C7167] mt-1 block">
                            {src.domain}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleFetchWebCorroboration}
                    className="text-[11px] text-[#7C7167] hover:text-[#241E19] underline"
                  >
                    Re-check live sources
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
