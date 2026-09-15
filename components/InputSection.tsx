'use client';

import React, { useState, useRef } from 'react';
import { ArticleInput, DemoCase } from '@/lib/types';
import { DEMO_CASES } from '@/lib/demo-data';
import {
  Plus,
  Trash2,
  ArrowRight,
  RotateCcw,
  Layers,
  FileText,
  Globe,
  Upload,
  Link,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface InputSectionProps {
  articles: ArticleInput[];
  setArticles: React.Dispatch<React.SetStateAction<ArticleInput[]>>;
  onAnalyze: () => void;
  isLoading: boolean;
  onSelectDemo: (demo: DemoCase) => void;
  activeDemoId?: string;
}

type InputMode = 'paste' | 'url' | 'file';

interface IngestionState {
  [articleId: string]: {
    mode: InputMode;
    urlInput: string;
    loading: boolean;
    error: string | null;
    successMessage: string | null;
    fileName: string | null;
    wordCount: number;
  };
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
  const [ingestionStates, setIngestionStates] = useState<IngestionState>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const getArticleState = (id: string, text: string) => {
    const existing = ingestionStates[id];
    const calculatedWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (existing) {
      return { ...existing, wordCount: calculatedWordCount };
    }
    return {
      mode: 'paste' as InputMode,
      urlInput: '',
      loading: false,
      error: null,
      successMessage: null,
      fileName: null,
      wordCount: calculatedWordCount,
    };
  };

  const updateArticleState = (id: string, partial: Partial<IngestionState[string]>) => {
    setIngestionStates((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          mode: 'paste',
          urlInput: '',
          loading: false,
          error: null,
          successMessage: null,
          fileName: null,
          wordCount: 0,
        }),
        ...partial,
      },
    }));
  };

  const handleAddArticle = () => {
    if (articles.length >= 3) return;
    const nextNum = articles.length + 1;
    const newId = `custom-art-${Date.now()}-${nextNum}`;
    setArticles([
      ...articles,
      {
        id: newId,
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
      const currentDemo =
        DEMO_CASES.find((d) => d.id === activeDemoId) || DEMO_CASES[0];
      setArticles(currentDemo.articles);
    }
  };

  // URL Ingestion Handler
  const handleFetchUrl = async (artId: string) => {
    const state = getArticleState(artId, '');
    const url = state.urlInput.trim();

    if (!url) {
      updateArticleState(artId, { error: 'Please enter a valid web URL.' });
      return;
    }

    updateArticleState(artId, { loading: true, error: null, successMessage: null });

    try {
      const response = await fetch('/api/parse-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch URL (${response.statusText})`);
      }

      setArticles((prev) =>
        prev.map((a) =>
          a.id === artId
            ? {
                ...a,
                title: data.title || a.title || 'Extracted Web Article',
                publisher: data.publisher || a.publisher || 'Web Source',
                text: data.text,
                url: data.source || url,
              }
            : a
        )
      );

      const words = data.text ? data.text.trim().split(/\s+/).length : 0;
      updateArticleState(artId, {
        loading: false,
        error: null,
        successMessage: `Successfully extracted ${words} words from webpage.`,
        wordCount: words,
      });
    } catch (err: any) {
      updateArticleState(artId, {
        loading: false,
        error: err.message || 'Failed to ingest URL',
        successMessage: null,
      });
    }
  };

  // File Upload Ingestion Handler
  const handleFileUpload = async (artId: string, file: File) => {
    if (!file) return;

    const allowedExts = ['pdf', 'docx', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExts.includes(ext)) {
      updateArticleState(artId, {
        error: `Unsupported file extension .${ext}. Please provide .pdf, .docx, .txt, or .md.`,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      updateArticleState(artId, {
        error: `File exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      });
      return;
    }

    updateArticleState(artId, {
      loading: true,
      error: null,
      successMessage: null,
      fileName: file.name,
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-source', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to parse document (${response.statusText})`);
      }

      setArticles((prev) =>
        prev.map((a) =>
          a.id === artId
            ? {
                ...a,
                title: data.title || file.name,
                publisher: data.publisher || 'Document Upload',
                text: data.text,
              }
            : a
        )
      );

      const words = data.text ? data.text.trim().split(/\s+/).length : 0;
      updateArticleState(artId, {
        loading: false,
        error: null,
        successMessage: `Successfully parsed ${words} words from ${file.name}.`,
        wordCount: words,
      });
    } catch (err: any) {
      updateArticleState(artId, {
        loading: false,
        error: err.message || 'Failed to parse file document',
        successMessage: null,
      });
    }
  };

  const handleTriggerAnalysis = async () => {
    let updatedArticles = [...articles];
    let hasFetchError = false;

    for (const art of articles) {
      const state = getArticleState(art.id, art.text);
      if (state.mode === 'url' && state.urlInput.trim() && !state.successMessage) {
        updateArticleState(art.id, { loading: true, error: null });
        try {
          const response = await fetch('/api/parse-source', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: state.urlInput.trim() }),
          });
          const data = await response.json();
          if (response.ok && data.text) {
            updatedArticles = updatedArticles.map((a) =>
              a.id === art.id
                ? {
                    ...a,
                    title: data.title || a.title || 'Extracted Web Article',
                    publisher: data.publisher || a.publisher || 'Web Source',
                    text: data.text,
                    url: data.source || state.urlInput.trim(),
                  }
                : a
            );
            const words = data.text.trim().split(/\s+/).length;
            updateArticleState(art.id, {
              loading: false,
              error: null,
              successMessage: `Successfully extracted ${words} words from webpage.`,
              wordCount: words,
            });
          } else {
            hasFetchError = true;
            updateArticleState(art.id, {
              loading: false,
              error: data.error || 'Could not fetch text from URL. Please paste text directly.',
            });
          }
        } catch (e: any) {
          hasFetchError = true;
          updateArticleState(art.id, {
            loading: false,
            error: e.message || 'Error fetching URL.',
          });
        }
      }
    }

    if (hasFetchError) return;
    setArticles(updatedArticles);
    onAnalyze();
  };

  return (
    <div className="bg-[#FAF7F2] border border-[#D8CFC4] rounded-2xl p-6 shadow-sm space-y-6">
      {/* Top Header: Ingestion Strategy & Mode Switching */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2D9CE] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5 text-[#9E4A28]" />
            <h2 className="font-serif text-xl font-bold tracking-tight text-[#241E19]">
              Editorial Ingestion Desk
            </h2>
          </div>
          <p className="text-xs text-[#5D544C]">
            Supply one or more news sources to decompose framing signals, examine omitted perspectives, and benchmark live web corroboration.
          </p>
        </div>

        {/* Multi-source vs Single Source Toggle */}
        <div className="flex items-center bg-[#EAE2D7] p-1 rounded-lg text-xs">
          <button
            onClick={() => handleSwitchTab('multi')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'multi'
                ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                : 'text-[#7C7167] hover:text-[#241E19]'
            }`}
          >
            Multi-Source Comparison ({articles.length})
          </button>
          <button
            onClick={() => handleSwitchTab('single')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'single'
                ? 'bg-[#FAF7F2] text-[#241E19] shadow-xs'
                : 'text-[#7C7167] hover:text-[#241E19]'
            }`}
          >
            Single Story Deep Dive
          </button>
        </div>
      </div>

      {/* Preset Demo Articles Selector */}
      <div className="flex items-center justify-between bg-[#F2ECE4] border border-[#DDD4C7] rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9E4A28]" />
          <span className="text-xs font-serif font-medium text-[#241E19]">
            Load Curated Cross-Publication Demo Case:
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {DEMO_CASES.map((demo) => {
            const isSelected = activeDemoId === demo.id;
            return (
              <button
                key={demo.id}
                onClick={() => onSelectDemo(demo)}
                className={`text-xs px-2.5 py-1 rounded transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#9E4A28] text-white font-medium shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5D544C] hover:text-[#241E19] border border-[#D8CFC4]'
                }`}
              >
                {demo.title}
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
            : 'grid-cols-1 md:grid-cols-3'
        }`}
      >
        {articles.map((art, idx) => {
          const state = getArticleState(art.id, art.text);
          const wordCount = art.text.trim() ? art.text.trim().split(/\s+/).length : 0;

          return (
            <div
              key={art.id}
              className="bg-white border border-[#D8CFC4] rounded-xl p-4 flex flex-col space-y-3 relative shadow-xs"
            >
              {/* Header with Perspective Index & Input Mode Selectors */}
              <div className="flex items-center justify-between border-b border-[#EAE2D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EAE2D7] text-[#9E4A28] flex items-center justify-center font-mono font-bold text-[11px]">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-serif font-semibold text-[#241E19]">
                    Perspective {idx + 1}
                  </span>
                </div>

                {articles.length > 1 && (
                  <button
                    onClick={() => handleRemoveArticle(art.id)}
                    className="text-[#7C7167] hover:text-red-600 transition-colors p-1"
                    title="Remove Perspective Slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Ingestion Mode Toggle Tabs */}
              <div className="flex items-center bg-[#EAE2D7] p-0.5 rounded text-[11px] font-medium text-[#7C7167]">
                <button
                  type="button"
                  onClick={() => updateArticleState(art.id, { mode: 'paste' })}
                  className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                    state.mode === 'paste'
                      ? 'bg-[#FAF7F2] text-[#241E19] font-semibold shadow-xs'
                      : 'hover:text-[#241E19]'
                  }`}
                >
                  <FileText className="w-3 h-3 text-[#9E4A28]" />
                  <span>Paste Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateArticleState(art.id, { mode: 'url' })}
                  className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                    state.mode === 'url'
                      ? 'bg-[#FAF7F2] text-[#241E19] font-semibold shadow-xs'
                      : 'hover:text-[#241E19]'
                  }`}
                >
                  <Link className="w-3 h-3 text-[#9E4A28]" />
                  <span>Web URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateArticleState(art.id, { mode: 'file' })}
                  className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 transition-all ${
                    state.mode === 'file'
                      ? 'bg-[#FAF7F2] text-[#241E19] font-semibold shadow-xs'
                      : 'hover:text-[#241E19]'
                  }`}
                >
                  <Upload className="w-3 h-3 text-[#9E4A28]" />
                  <span>Upload File</span>
                </button>
              </div>

              {/* Mode-Specific Ingestion Input */}
              {state.mode === 'url' && (
                <div className="bg-[#FAF7F2] border border-[#D8CFC4] rounded p-2.5 space-y-2">
                  <label className="text-[10px] uppercase font-semibold text-[#7C7167] block">
                    Scrape News Webpage
                  </label>
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Link className="w-3.5 h-3.5 text-[#7C7167] absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        value={state.urlInput}
                        onChange={(e) =>
                          updateArticleState(art.id, { urlInput: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleFetchUrl(art.id);
                          }
                        }}
                        placeholder="https://example.com/news-story"
                        className="w-full bg-white border border-[#D8CFC4] rounded pl-8 pr-2 py-1.5 text-xs text-[#241E19] focus:outline-none focus:border-[#9E4A28]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={state.loading}
                      onClick={() => handleFetchUrl(art.id)}
                      className="bg-[#241E19] hover:bg-[#3D352E] disabled:opacity-50 text-[#FAF7F2] px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                    >
                      {state.loading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Fetching...</span>
                        </>
                      ) : (
                        <span>Fetch</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {state.mode === 'file' && (
                <div className="bg-[#FAF7F2] border border-[#D8CFC4] rounded p-3 space-y-2">
                  <label className="text-[10px] uppercase font-semibold text-[#7C7167] block">
                    Upload Document (.pdf, .docx, .txt, .md)
                  </label>
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[art.id] = el;
                    }}
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(art.id, file);
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRefs.current[art.id]?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFileUpload(art.id, file);
                    }}
                    className="border-2 border-dashed border-[#D8CFC4] hover:border-[#9E4A28] rounded p-4 text-center cursor-pointer bg-white transition-colors flex flex-col items-center justify-center gap-1.5"
                  >
                    {state.loading ? (
                      <>
                        <Loader2 className="w-5 h-5 text-[#9E4A28] animate-spin" />
                        <span className="text-xs font-medium text-[#241E19]">
                          Extracting document text...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-[#7C7167]" />
                        <span className="text-xs font-medium text-[#241E19]">
                          Click to select or drag & drop file
                        </span>
                        <span className="text-[10px] text-[#7C7167]">
                          PDF, DOCX, TXT, or MD up to 5 MB
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Status Feedback Banners */}
              {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] p-2 rounded flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-600" />
                  <span>{state.error}</span>
                </div>
              )}
              {state.successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2 rounded flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{state.successMessage}</span>
                </div>
              )}

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

              {/* Article Body Text & Ingestion Preview */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-semibold text-[#7C7167]">
                    Article Body (Decomposition Source)
                  </label>
                  <span className="text-[10px] font-mono text-[#7C7167] bg-[#EAE2D7] px-1.5 py-0.5 rounded">
                    {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={art.text}
                  onChange={(e) =>
                    handleUpdateArticle(art.id, 'text', e.target.value)
                  }
                  placeholder="Paste verbatim text, or import above via live URL or document upload..."
                  className="w-full flex-1 bg-[#FAF7F2] border border-[#D8CFC4] rounded p-2.5 text-xs font-serif leading-relaxed text-[#241E19] focus:outline-none focus:border-[#9E4A28] resize-y"
                />
              </div>
            </div>
          );
        })}
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
            id="tour-analyze-btn"
            onClick={handleTriggerAnalysis}
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
