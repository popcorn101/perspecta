'use client';

import React from 'react';
import {
  AnalysisResponse,
  PrismCategory,
} from '@/lib/types';
import { PRISM_CATEGORIES } from '@/lib/prism-rubric';
import {
  Layers,
  Eye,
  SlidersHorizontal,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ComparisonMatrixProps {
  analysis: AnalysisResponse;
  activeCategoryFilter: PrismCategory | 'all';
  onSelectCategoryFilter: (cat: PrismCategory | 'all') => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  analysis,
  activeCategoryFilter,
  onSelectCategoryFilter,
}) => {
  const articles = analysis.articles;
  const categoriesList: PrismCategory[] = [
    'attribution',
    'evaluative',
    'certainty',
    'claims',
    'primacy',
    'omission',
    'emotional',
  ];

  return (
    <div className="bg-[#FAF7F2] border border-[#D8CFC4] rounded p-6 shadow-paper-sm space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2D9CE] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-[#9E4A28]" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#9E4A28]">
              Cross-Source Framing Matrix
            </span>
          </div>
          <h3 className="font-serif text-2xl text-[#241E19] font-medium">
            Multi-Perspective Comparative Analysis
          </h3>
          <p className="text-xs text-[#5D544C] mt-0.5">
            Observing how divergent journalistic choices frame the identical underlying event.
          </p>
        </div>

        {/* PRISM Signal Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#7C7167] font-semibold uppercase mr-1">
            Filter Pen:
          </span>
          <button
            onClick={() => onSelectCategoryFilter('all')}
            className={`px-2.5 py-1 text-xs rounded transition-all font-medium ${
              activeCategoryFilter === 'all'
                ? 'bg-[#241E19] text-[#FAF7F2] shadow-sm'
                : 'bg-[#EFE8DF] text-[#5D544C] hover:bg-[#E6DDD2]'
            }`}
          >
            All Signals ({analysis.verified_signal_count})
          </button>

          {categoriesList.map((catKey) => {
            const meta = PRISM_CATEGORIES[catKey];
            const isSelected = activeCategoryFilter === catKey;
            return (
              <button
                key={catKey}
                onClick={() => onSelectCategoryFilter(catKey)}
                className={`px-2 py-1 text-xs rounded border transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'ring-2 ring-offset-1 font-semibold'
                    : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: meta.bgWash,
                  borderColor: meta.borderColor,
                  color: meta.color,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span>{meta.name.split('&')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparative Findings Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Finding 1: Framing Angle */}
        <div className="bg-[#F7F3EE] border border-[#E2D9CE] rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#9E4A28] font-bold uppercase tracking-wider mb-2">
              <Eye className="w-3.5 h-3.5" />
              <span>Narrative Angle & Frame</span>
            </div>
            <p className="text-xs text-[#5D544C] mb-4">
              How each outlet interprets the event&rsquo;s primary significance:
            </p>

            <div className="space-y-3">
              {articles.map((art) => (
                <div key={art.article_id} className="border-l-2 border-[#9E4A28] pl-3 py-0.5">
                  <span className="text-[11px] font-bold text-[#7C7167] uppercase block">
                    {art.publisher}
                  </span>
                  <p className="font-serif text-sm font-medium text-[#241E19]">
                    {art.primary_framing}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Finding 2: Dominant Tone & Highlighted Actors */}
        <div className="bg-[#F7F3EE] border border-[#E2D9CE] rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#8C531B] font-bold uppercase tracking-wider mb-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Tone & Attributed Voice</span>
            </div>
            <p className="text-xs text-[#5D544C] mb-4">
              Whose perspectives receive top authority versus quiet relegation:
            </p>

            <div className="space-y-3">
              {articles.map((art) => (
                <div key={art.article_id} className="border-l-2 border-[#8C531B] pl-3 py-0.5">
                  <span className="text-[11px] font-bold text-[#7C7167] uppercase block">
                    {art.publisher}
                  </span>
                  <p className="text-xs text-[#241E19] font-medium">
                    Tone: <em>{art.dominant_tone}</em>
                  </p>
                  <p className="text-[11px] text-[#5D544C] mt-0.5">
                    Quoted: {art.highlighted_actors.join(', ') || 'General sources'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Finding 3: Omissions & Blind Spots */}
        <div className="bg-[#F7F3EE] border border-[#E2D9CE] rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#3C567A] font-bold uppercase tracking-wider mb-2">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Omissions & Blind Spots</span>
            </div>
            <p className="text-xs text-[#5D544C] mb-4">
              Context highlighted by rivals but completely omitted in each text:
            </p>

            <div className="space-y-3">
              {articles.map((art) => (
                <div key={art.article_id} className="border-l-2 border-[#3C567A] pl-3 py-0.5">
                  <span className="text-[11px] font-bold text-[#7C7167] uppercase block">
                    {art.publisher}
                  </span>
                  <ul className="list-disc list-inside text-xs text-[#5D544C] space-y-0.5 mt-0.5">
                    {art.omitted_perspectives.length > 0 ? (
                      art.omitted_perspectives.map((om, idx) => (
                        <li key={idx} className="leading-tight">{om}</li>
                      ))
                    ) : (
                      <li>No major omissions detected</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
