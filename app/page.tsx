'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AnalysisResponse,
  ArticleInput,
  DemoCase,
  FramingSignal,
  PrismCategory,
} from '@/lib/types';
import { DEMO_CASES } from '@/lib/demo-data';
import { Masthead } from '@/components/Masthead';
import { InputSection } from '@/components/InputSection';
import { ComparisonMatrix } from '@/components/ComparisonMatrix';
import { ArticleViewer } from '@/components/ArticleViewer';
import { InspectionDrawer } from '@/components/InspectionDrawer';
import { FrameworkGuide } from '@/components/FrameworkGuide';
import { ObservabilityModal } from '@/components/ObservabilityModal';
import {
  Layers,
  BookOpen,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Search,
} from 'lucide-react';

export default function Home() {
  const [activeDemoId, setActiveDemoId] = useState<string>('space-mission-launch');
  const [articles, setArticles] = useState<ArticleInput[]>(
    DEMO_CASES[0].articles
  );
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSignal, setSelectedSignal] = useState<FramingSignal | null>(null);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    PrismCategory | 'all'
  >('all');
  const [isFrameworkOpen, setIsFrameworkOpen] = useState<boolean>(false);
  const [isObservabilityOpen, setIsObservabilityOpen] = useState<boolean>(false);

  // Trigger framing analysis
  const handleAnalyze = useCallback(async (articlesToAnalyze: ArticleInput[]) => {
    setIsLoading(true);
    setSelectedSignal(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articles: articlesToAnalyze }),
      });

      if (res.ok) {
        const data: AnalysisResponse = await res.json();
        setAnalysis(data);

        // Preselect the first signal if available for immediate inspection demo
        if (data.articles[0]?.signals[0]) {
          setSelectedSignal(data.articles[0].signals[0]);
          setSelectedPublisher(data.articles[0].publisher);
        }
      } else {
        console.error('Failed to analyze articles');
      }
    } catch (err) {
      console.error('Error during analysis request:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: analyze first demo case immediately
  useEffect(() => {
    handleAnalyze(DEMO_CASES[0].articles);
  }, [handleAnalyze]);

  // Handle selecting curated demo case
  const handleSelectDemo = (demo: DemoCase) => {
    setActiveDemoId(demo.id);
    setArticles(demo.articles);
    handleAnalyze(demo.articles);
  };

  const handleSelectSignalWithPublisher = (
    signal: FramingSignal,
    publisher: string
  ) => {
    setSelectedSignal(signal);
    setSelectedPublisher(publisher);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EE] text-[#241E19]">
      {/* Masthead Header */}
      <Masthead
        onOpenObservability={() => setIsObservabilityOpen(true)}
        onOpenFramework={() => setIsFrameworkOpen(true)}
        activeDemoId={activeDemoId}
        onSelectDemo={(id) => {
          const d = DEMO_CASES.find((item) => item.id === id);
          if (d) handleSelectDemo(d);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Input and Demo Loader Workspace */}
        <section>
          <InputSection
            articles={articles}
            setArticles={setArticles}
            onAnalyze={() => handleAnalyze(articles)}
            isLoading={isLoading}
            onSelectDemo={handleSelectDemo}
            activeDemoId={activeDemoId}
          />
        </section>

        {/* Framing Decomposition Results */}
        {analysis && (
          <section className="space-y-8 animate-fadeIn">
            {/* Multi-Source Comparative Matrix */}
            <ComparisonMatrix
              analysis={analysis}
              activeCategoryFilter={activeCategoryFilter}
              onSelectCategoryFilter={setActiveCategoryFilter}
            />

            {/* Side-by-Side Broadsheet Columns */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#D8CFC4] pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9E4A28]" />
                  <h3 className="font-serif text-lg font-medium text-[#241E19] uppercase tracking-wider">
                    Verbatim Signal Decomposition
                  </h3>
                </div>
                <span className="text-xs text-[#7C7167] italic">
                  Click any colored phrase to inspect framing taxonomy
                </span>
              </div>

              <div
                className={`grid gap-6 ${
                  articles.length === 1
                    ? 'grid-cols-1 max-w-3xl mx-auto'
                    : articles.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 lg:grid-cols-3'
                }`}
              >
                {articles.map((art, idx) => {
                  const artAnalysis = analysis.articles.find(
                    (a) => a.article_id === art.id
                  ) || analysis.articles[idx];

                  return (
                    <ArticleViewer
                      key={art.id}
                      article={art}
                      analysis={artAnalysis}
                      selectedSignal={selectedSignal}
                      onSelectSignal={(sig) =>
                        handleSelectSignalWithPublisher(
                          sig,
                          art.publisher || `Perspective ${idx + 1}`
                        )
                      }
                      activeCategoryFilter={activeCategoryFilter}
                      columnCount={articles.length}
                    />
                  );
                })}
              </div>
            </div>

            {/* Signal Inspector Drawer */}
            <section className="sticky bottom-4 z-30 max-w-4xl mx-auto">
              <InspectionDrawer
                signal={selectedSignal}
                onClose={() => setSelectedSignal(null)}
                publisherName={selectedPublisher}
              />
            </section>
          </section>
        )}
      </main>

      {/* Footer Colophon */}
      <footer className="bg-[#FAF7F2] border-t border-[#D8CFC4] mt-16 py-8 px-4 sm:px-8 text-xs text-[#5D544C]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-serif font-bold text-sm text-[#241E19]">
              PERSPECTA
            </span>
            <span className="mx-2 text-[#D8CFC4]">•</span>
            <span>Platform for Media Literacy & Framing Analysis</span>
            <p className="text-[11px] text-[#7C7167] mt-0.5">
              Built on the 7-dimension PRISM framing rubric with deterministic quote verification.
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsFrameworkOpen(true)}
              className="hover:text-[#9E4A28] underline underline-offset-2"
            >
              PRISM Taxonomy
            </button>
            <span className="text-[#D8CFC4]">•</span>
            <button
              onClick={() => setIsObservabilityOpen(true)}
              className="hover:text-[#9E4A28] underline underline-offset-2"
            >
              Strict Guardrails
            </button>
            <span className="text-[#D8CFC4]">•</span>
            <span className="text-[#7C7167]">Vercel Ready</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FrameworkGuide
        isOpen={isFrameworkOpen}
        onClose={() => setIsFrameworkOpen(false)}
      />

      <ObservabilityModal
        isOpen={isObservabilityOpen}
        onClose={() => setIsObservabilityOpen(false)}
        sourceType={analysis?.source}
        verifiedCount={analysis?.verified_signal_count}
        rejectedCount={analysis?.rejected_signal_count}
      />
    </div>
  );
}
