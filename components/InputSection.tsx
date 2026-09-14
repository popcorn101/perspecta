'use client';

import React, { useState } from 'react';
import { ArticleInput, DemoCase } from '@/lib/types';
import { DEMO_CASES } from '@/lib/demo-data';
import {
  Sparkles,
  Plus,
  Trash2,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Layers,
  FileText,
} from 'lucide-react';

interface InputSectionProps {
  articles: ArticleInput[];
  setArticles: React.Dispatch<React.SetStateAction<ArticleInput[]>>;
  onAnalyze: () => void;
  isLoading: boolean;
  onSelectDemo: (demo: DemoCase) => void;
  activeDemoId?: string;
}

export const InputSection: React.FC<InputSectionProps> = ({
  articles,
  setArticles,
  onAnalyze,
  isLoading,
  onSelectDemo,
  activeDemoId,
}) => {
  const [activeTab, setActiveTab] = useState<'multi' | 'single'>('multi');

  const handleAddArticle = () => {
    if (articles.length >= 3) return;
    const nextNum = articles.length + 1;
    setArticles([
      ...articles,
      {
        id: `custom-art-${Date.now()}-${nextNum}`,
        title: '',
        publisher: `Source ${String.fromCharCode(64 + nextNum)}`,
        text: '',
      },
    ]);
  };

  const handleRemoveArticle = (id: string) => {
    if (articles.length <= 1) return;
    setArticles(articles.filter((a) => a.id !== id));
  };

  const handleUpdateArticle = (
    id: string,
    field: keyof ArticleInput,
    value: string
  ) => {
    setArticles(
      articles.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSwitchTab = (tab: 'multi' | 'single') => {
    setActiveTab(tab);
    if (tab === 'single' && articles.length > 1) {
      setArticles([articles[0]]);
    } else if (tab === 'multi' && articles.length === 1) {
      // If switching back to multi, default to 3 demo articles from active or first demo
      const currentDemo =
        DEMO_CASES.find((d) => d.id === activeDemoId) || DEMO_CASES[0];
      setArticles(currentDemo.articles);
    }
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#D8CFC4] rounded p-6 shadow-paper-sm space-y-6">
      {/* Top Controls: Tabs & Curated Demo Loader */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2D9CE] pb-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#EFE8DF] p-1 rounded">
          <button
            onClick={() => handleSwitchTab('multi')}
            className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-1.5 transition-all ${
              activeTab === 'multi'
                ? 'bg-[#FAF7F2] text-[#241E19] shadow-sm'
                : 'text-[#5D544C] hover:text-[#241E19]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#9E4A28]" />
            <span>Compare Multiple Sources (Recommended)</span>
          </button>
          <button
            onClick={() => handleSwitchTab('single')}
            className={`px-3 py-1.5 text-xs font-semibold rounded flex items-center gap-1.5 transition-all ${
              activeTab === 'single'
                ? 'bg-[#FAF7F2] text-[#241E19] shadow-sm'
                : 'text-[#5D544C] hover:text-[#241E19]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#5D544C]" />
            <span>Inspect Single Article</span>
          </button>
        </div>

        {/* Curated Demo Dossier Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#7C7167] uppercase tracking-wider">
            Curated Demos:
          </span>
          {DEMO_CASES.map((demo) => {
            const isSelected = activeDemoId === demo.id;
            return (
              <button
                key={demo.id}
                onClick={() => {
                  onSelectDemo(demo);
                  if (activeTab === 'single') setActiveTab('multi');
                }}
                className={`px-2.5 py-1 text-xs rounded border transition-all ${
                  isSelected
                    ? 'bg-[#9E4A28] text-white border-[#9E4A28] font-medium shadow-sm'
                    : 'bg-[#F7F3EE] text-[#5D544C] border-[#D8CFC4] hover:bg-[#EFE8DF]'
                }`}
              >
                {demo.title.split(' ')[0]} Launch
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Article Text Input Cards */}
      <div
        className={`grid gap-4 ${
          articles.length === 1
            ? 'grid-cols-1'
            : articles.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 lg:grid-cols-3'
        }`}
      >
        {articles.map((art, idx) => (
          <div
            key={art.id}
            className="bg-[#F7F3EE] border border-[#D8CFC4] rounded p-4 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#E2D9CE] pb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9E4A28]">
                Perspective {idx + 1}
              </span>
              {articles.length > 1 && (
                <button
                  onClick={() => handleRemoveArticle(art.id)}
                  className="text-[#7C7167] hover:text-[#9E4A28] p-1 transition-colors"
                  title="Remove this perspective"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Publisher Name Input */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7C7167] block mb-1">
                Publisher / Source Name
              </label>
              <input
                type="text"
                value={art.publisher}
                onChange={(e) =>
                  handleUpdateArticle(art.id, 'publisher', e.target.value)
                }
                placeholder="e.g., The Daily Chronicle"
                className="w-full bg-[#FAF7F2] border border-[#D8CFC4] rounded px-2.5 py-1.5 text-xs text-[#241E19] focus:outline-none focus:border-[#9E4A28]"
              />
            </div>

            {/* Article Headline Input */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7C7167] block mb-1">
                Headline / Title
              </label>
              <input
                type="text"
                value={art.title}
                onChange={(e) =>
                  handleUpdateArticle(art.id, 'title', e.target.value)
                }
                placeholder="e.g., Space Agency Achieves Historic Feat"
                className="w-full bg-[#FAF7F2] border border-[#D8CFC4] rounded px-2.5 py-1.5 text-xs font-serif text-[#241E19] focus:outline-none focus:border-[#9E4A28]"
              />
            </div>

            {/* Article Body Text Input */}
            <div className="flex-1 flex flex-col">
              <label className="text-[10px] uppercase font-semibold text-[#7C7167] block mb-1">
                Article Body Text (Raw Text for PRISM Decomposition)
              </label>
              <textarea
                rows={6}
                value={art.text}
                onChange={(e) =>
                  handleUpdateArticle(art.id, 'text', e.target.value)
                }
                placeholder="Paste the verbatim article text here..."
                className="w-full flex-1 bg-[#FAF7F2] border border-[#D8CFC4] rounded p-2.5 text-xs font-serif leading-relaxed text-[#241E19] focus:outline-none focus:border-[#9E4A28] resize-y"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E2D9CE] pt-4">
        <div>
          {activeTab === 'multi' && articles.length < 3 && (
            <button
              onClick={handleAddArticle}
              className="text-xs text-[#5D544C] hover:text-[#241E19] border border-dashed border-[#D8CFC4] px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Publication Perspective ({articles.length}/3)</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const currentDemo =
                DEMO_CASES.find((d) => d.id === activeDemoId) || DEMO_CASES[0];
              setArticles(currentDemo.articles);
            }}
            className="text-xs text-[#7C7167] hover:text-[#241E19] px-3 py-1.5 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Text</span>
          </button>

          <button
            onClick={onAnalyze}
            disabled={isLoading || articles.some((a) => !a.text.trim())}
            className="bg-[#9E4A28] hover:bg-[#B85934] disabled:opacity-50 text-[#FAF7F2] font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Decomposing Framing Signals...</span>
              </>
            ) : (
              <>
                <span>Analyze Framing with PRISM</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
