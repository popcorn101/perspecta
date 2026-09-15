'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { StoryAnalysisDashboard } from '@/components/StoryAnalysisDashboard';
import { FrameworkGuide } from '@/components/FrameworkGuide';
import { ObservabilityModal } from '@/components/ObservabilityModal';
import { OnboardingTour } from '@/components/OnboardingTour';

export default function Home() {
  const [currentView, setCurrentView] = useState<'analysis' | 'compare'>('analysis');
  const [activeDemoId, setActiveDemoId] = useState<string>('space-mission-launch');
  const [articles, setArticles] = useState<ArticleInput[]>(
    DEMO_CASES[0].articles
  );
  const [selectedArticleIndex, setSelectedArticleIndex] = useState<number>(0);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSignal, setSelectedSignal] = useState<FramingSignal | null>(null);
  const [selectedPublisher, setSelectedPublisher] = useState<string>('');
  const [selectedArticleTitle, setSelectedArticleTitle] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    PrismCategory | 'all'
  >('all');
  const [isFrameworkOpen, setIsFrameworkOpen] = useState<boolean>(false);
  const [isObservabilityOpen, setIsObservabilityOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('perspecta_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = saved === 'dark' || (!saved && prefersDark);
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('perspecta_theme', next ? 'dark' : 'light');
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  // Auto-launch tour on first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tourSeen = localStorage.getItem('perspecta_tour_completed');
      if (!tourSeen) {
        // Launch after brief delay for initial render
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Trigger framing analysis
  const handleAnalyze = useCallback(async (articlesToAnalyze: ArticleInput[]) => {
    setIsLoading(true);
    setAnalysisError(null);
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
        const activeArticleAnalysis = data.articles[selectedArticleIndex] || data.articles[0];
        if (activeArticleAnalysis?.signals[0]) {
          setSelectedSignal(activeArticleAnalysis.signals[0]);
          setSelectedPublisher(activeArticleAnalysis.publisher);
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error || 'Failed to analyze articles. Check server logs.';
        setAnalysisError(errMsg);
        console.error('Failed to analyze articles:', errJson);
      }
    } catch (err: any) {
      setAnalysisError(err?.message || 'Network error during analysis.');
      console.error('Error during analysis request:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedArticleIndex]);

  // Handle selecting curated demo case (loads text into desk without auto-submitting analysis)
  const handleSelectDemo = (demo: DemoCase) => {
    setActiveDemoId(demo.id);
    setArticles(demo.articles);
    setSelectedArticleIndex(0);
    setAnalysis(null);
    setSelectedSignal(null);
  };

  const handleSelectSignalWithPublisher = (
    signal: FramingSignal,
    publisher: string,
    title?: string
  ) => {
    setSelectedSignal(signal);
    setSelectedPublisher(publisher);
    if (title) setSelectedArticleTitle(title);
  };

  const currentArticle = articles[selectedArticleIndex] || articles[0];
  const currentAnalysis =
    analysis?.articles.find((a) => a.article_id === currentArticle?.id) ||
    analysis?.articles[selectedArticleIndex] ||
    analysis?.articles[0];

  // For cycling through signals in inspector
  const currentArticleSignals = currentAnalysis?.signals || [];
  const currentSignalIndex = useMemo(() => {
    if (!selectedSignal) return -1;
    return currentArticleSignals.findIndex((s) => s.quoted_text === selectedSignal.quoted_text);
  }, [selectedSignal, currentArticleSignals]);

  const handleNextSignal = () => {
    if (currentArticleSignals.length === 0) return;
    const nextIdx = (currentSignalIndex + 1) % currentArticleSignals.length;
    setSelectedSignal(currentArticleSignals[nextIdx]);
    setSelectedPublisher(currentArticle.publisher);
  };

  const handlePrevSignal = () => {
    if (currentArticleSignals.length === 0) return;
    const prevIdx = (currentSignalIndex - 1 + currentArticleSignals.length) % currentArticleSignals.length;
    setSelectedSignal(currentArticleSignals[prevIdx]);
    setSelectedPublisher(currentArticle.publisher);
  };

  const handleStartTour = () => {
    // If analysis hasn't run yet, analyze current articles so article reader & inspector drawer
    // exist in the DOM, allowing the full 6-step spotlight tour to focus on all elements smoothly!
    if (!analysis) {
      handleAnalyze(articles);
    }
    setTimeout(() => {
      setIsTourOpen(true);
    }, 450);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EE] dark:bg-[#121518] text-[#241E19] dark:text-[#ECE7DF] transition-colors duration-200">
      {/* Masthead Header with Top-Level View Tabs */}
      <Masthead
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenObservability={() => setIsObservabilityOpen(true)}
        onOpenFramework={() => setIsFrameworkOpen(true)}
        onStartTour={handleStartTour}
        activeDemoId={activeDemoId}
        onSelectDemo={(id) => {
          const d = DEMO_CASES.find((item) => item.id === id);
          if (d) handleSelectDemo(d);
        }}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-8">
        {/* Ingestion Workspace */}
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

        {/* Error Banner */}
        {analysisError && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider">Analysis Warning:</span>
              <span>{analysisError}</span>
            </div>
            <button
              onClick={() => handleAnalyze(articles)}
              className="px-3 py-1 bg-red-800 text-white rounded font-medium hover:bg-red-900 transition-colors cursor-pointer"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {/* Initial Prompt State (Before User Clicks Analyze) */}
        {!analysis && !isLoading && (
          <div className="bg-[#FAF7F2] border border-[#D8CFC4] rounded-2xl p-10 text-center space-y-3 shadow-paper-sm">
            <div className="w-12 h-12 rounded-full bg-[#EFE8DF] border border-[#D8CFC4] flex items-center justify-center mx-auto text-[#9E4A28]">
              <span className="font-serif text-2xl font-bold">P</span>
            </div>
            <h4 className="font-serif text-xl font-medium text-[#241E19]">
              Newsroom Workspace Ready
            </h4>
            <p className="text-xs text-[#5D544C] max-w-md mx-auto leading-relaxed">
              Verify or customize your publication inputs above, then click <strong className="text-[#9E4A28]">&ldquo;Analyze Framing with PRISM&rdquo;</strong> to deconstruct rhetorical signals and stream traces to observability.
            </p>
          </div>
        )}

        {/* View 1: Primary Story Analysis Dashboard (Linen & Sandstone reference layout) */}
        {analysis && currentView === 'analysis' && currentArticle && (
          <section className="space-y-8 animate-fadeIn">
            {/* Perspective Switcher if multiple articles are loaded */}
            {articles.length > 1 && (
              <div className="flex items-center gap-2 bg-[#EFE8DF] p-1.5 rounded-xl border border-[#D8CFC4]/70 max-w-fit">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C7167] px-2">
                  Select Article View:
                </span>
                {articles.map((art, idx) => (
                  <button
                    key={art.id}
                    onClick={() => {
                      setSelectedArticleIndex(idx);
                      const artAna = analysis.articles[idx];
                      if (artAna?.signals[0]) {
                        setSelectedSignal(artAna.signals[0]);
                        setSelectedPublisher(art.publisher);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedArticleIndex === idx
                        ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                        : 'text-[#5D544C] hover:text-[#241E19]'
                    }`}
                  >
                    Perspective {idx + 1}: {art.publisher || 'Source'}
                  </button>
                ))}
              </div>
            )}

            {/* Split Screen Workbench (60% Left Story Analysis / 40% Right Inspector) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Columns: Story Analysis Dashboard */}
              <div className="lg:col-span-7 xl:col-span-8">
                <StoryAnalysisDashboard
                  article={currentArticle}
                  analysis={currentAnalysis}
                  selectedSignal={selectedSignal}
                  onSelectSignal={(sig) =>
                    handleSelectSignalWithPublisher(sig, currentArticle.publisher, currentArticle.title)
                  }
                  activeCategoryFilter={activeCategoryFilter}
                  onSelectCategoryFilter={setActiveCategoryFilter}
                />
              </div>

              {/* Right 5 Columns: Sticky Inspector Panel */}
              <aside id="tour-inspector-drawer" className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
                <InspectionDrawer
                  signal={selectedSignal}
                  onClose={() => setSelectedSignal(null)}
                  publisherName={selectedPublisher}
                  articleTitle={selectedArticleTitle || currentArticle?.title}
                  totalSignalsCount={currentArticleSignals.length}
                  currentIndex={currentSignalIndex}
                  onPrev={handlePrevSignal}
                  onNext={handleNextSignal}
                />
              </aside>
            </div>
          </section>
        )}

        {/* View 2: Dedicated Compare Perspectives Broadsheet Matrix */}
        {analysis && currentView === 'compare' && (
          <section className="space-y-8 animate-fadeIn">
            {/* Multi-Source Comparative Matrix */}
            <ComparisonMatrix
              analysis={analysis}
              activeCategoryFilter={activeCategoryFilter}
              onSelectCategoryFilter={setActiveCategoryFilter}
            />

            {/* Multi-Column Side-by-Side Broadsheets */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-[#D8CFC4] pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#9E4A28]" />
                  <h3 className="font-serif text-lg font-medium text-[#241E19] uppercase tracking-wider">
                    Synchronized Comparative Broadside
                  </h3>
                </div>
                <span className="text-xs text-[#7C7167] italic font-mono">
                  Multi-perspective alignment across {articles.length} publications
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
                  const artAnalysis =
                    analysis.articles.find((a) => a.article_id === art.id) ||
                    analysis.articles[idx];

                  return (
                    <ArticleViewer
                      key={art.id}
                      article={art}
                      analysis={artAnalysis}
                      selectedSignal={selectedSignal}
                      onSelectSignal={(sig) =>
                        handleSelectSignalWithPublisher(
                          sig,
                          art.publisher || `Perspective ${idx + 1}`,
                          art.title
                        )
                      }
                      activeCategoryFilter={activeCategoryFilter}
                      columnCount={articles.length}
                    />
                  );
                })}
              </div>
            </div>

            {/* Drawer at bottom for Compare View */}
            <section className="sticky bottom-4 z-30 max-w-4xl mx-auto">
              <InspectionDrawer
                signal={selectedSignal}
                onClose={() => setSelectedSignal(null)}
                publisherName={selectedPublisher}
                articleTitle={selectedArticleTitle || currentArticle?.title}
                totalSignalsCount={currentArticleSignals.length}
                currentIndex={currentSignalIndex}
                onPrev={handlePrevSignal}
                onNext={handleNextSignal}
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
            <span>Platform for Media Literacy &amp; Framing Analysis</span>
            <p className="text-[11px] text-[#7C7167] mt-0.5">
              Built on the 7-dimension PRISM framing rubric with deterministic quote verification and Supabase trace monitoring.
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
            <span className="text-[#7C7167]">Vercel &amp; Supabase Ready</span>
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

      <OnboardingTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}
