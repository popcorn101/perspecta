'use client';

import React from 'react';
import { PRISM_CATEGORIES } from '@/lib/prism-rubric';
import { PrismCategory } from '@/lib/types';
import { X, BookOpen, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FrameworkGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FrameworkGuide: React.FC<FrameworkGuideProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const categories: PrismCategory[] = [
    'attribution',
    'evaluative',
    'certainty',
    'claims',
    'primacy',
    'omission',
    'emotional',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#241E19]/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#D8CFC4] rounded max-w-4xl w-full max-h-[90vh] flex flex-col shadow-paper-lg animate-fadeIn my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#D8CFC4] flex items-center justify-between bg-[#F7F3EE]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#9E4A28]" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#241E19]">
                The PRISM Framing Methodology
              </h2>
              <p className="text-xs text-[#5D544C]">
                Seven inspectable rhetorical dimensions for deconstructing news discourse.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#EFE8DF] text-[#5D544C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Philosophy Banner */}
          <div className="bg-[#F9EFEA] border border-[#E8B6A2] p-4 rounded text-xs text-[#241E19] leading-relaxed">
            <h3 className="font-bold uppercase tracking-wider text-[#9E4A28] mb-1">
              Core Principle & Non-Partisan Stance
            </h3>
            <p>
              PERSPECTA does not score truthfulness or label stories as &ldquo;Left&rdquo; or &ldquo;Right&rdquo;. Every article — regardless of ideological affiliation — utilizes framing mechanisms to shape reader comprehension. The PRISM methodology highlights these choices so readers can discern rhetorical influence directly from verbatim evidence.
            </p>
          </div>

          {/* 7 PRISM Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((catKey) => {
              const meta = PRISM_CATEGORIES[catKey];
              return (
                <div
                  key={catKey}
                  className="bg-[#F7F3EE] border border-[#D8CFC4] rounded p-4 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      <h4
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: meta.color }}
                      >
                        {meta.name}
                      </h4>
                    </div>

                    <p className="text-xs text-[#241E19] leading-relaxed mb-2">
                      {meta.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-[#E2D9CE] text-[11px]">
                    <div>
                      <strong className="text-[#7C7167] uppercase block">
                        Example Signal:
                      </strong>
                      <span className="italic text-[#5D544C]">
                        {meta.example}
                      </span>
                    </div>

                    <div>
                      <strong className="text-[#7C7167] uppercase block">
                        Perceptual Impact:
                      </strong>
                      <span className="text-[#5D544C]">
                        {meta.whyItMatters}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#D8CFC4] bg-[#F7F3EE] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#9E4A28] hover:bg-[#B85934] text-[#FAF7F2] text-xs font-semibold px-5 py-2 rounded transition-colors"
          >
            Close Methodology Guide
          </button>
        </div>
      </div>
    </div>
  );
};
