'use client';

import React from 'react';
import { X, ShieldCheck, Check, Cpu, Lock, Sparkles } from 'lucide-react';

interface ObservabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceType?: 'llm' | 'heuristic_mock';
  verifiedCount?: number;
  rejectedCount?: number;
}

export const ObservabilityModal: React.FC<ObservabilityModalProps> = ({
  isOpen,
  onClose,
  sourceType = 'heuristic_mock',
  verifiedCount = 0,
  rejectedCount = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#241E19]/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#FAF7F2] border-2 border-[#D8CFC4] rounded max-w-3xl w-full max-h-[90vh] flex flex-col shadow-paper-lg animate-fadeIn my-auto">
        {/* Header */}
        <div className="p-5 border-b border-[#D8CFC4] flex items-center justify-between bg-[#F7F3EE]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#3B6B56]" />
            <div>
              <h2 className="font-serif text-xl font-medium text-[#241E19]">
                Observability & PRISM Guardrails
              </h2>
              <p className="text-xs text-[#5D544C]">
                Strict server-side verification and ethical constraints protecting analytical integrity.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#241E19]">
          {/* Active Engine Telemetry */}
          <div className="bg-[#FAF7F2] border border-[#D8CFC4] rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2D9CE] pb-2">
              <span className="font-bold uppercase tracking-wider text-[#7C7167]">
                Active Analysis Pipeline Status
              </span>
              <span className="bg-[#EBF1EE] text-[#3B6B56] font-bold px-2 py-0.5 rounded text-[11px]">
                {sourceType === 'llm' ? 'Live LLM Structured Engine' : 'Built-in PRISM Heuristic Engine'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-[#7C7167] uppercase block">
                  Verified Signals
                </span>
                <span className="font-mono text-base font-bold text-[#3B6B56]">
                  {verifiedCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#7C7167] uppercase block">
                  Hallucinations Prevented
                </span>
                <span className="font-mono text-base font-bold text-[#9E4A28]">
                  {rejectedCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#7C7167] uppercase block">
                  Sub-string Match Accuracy
                </span>
                <span className="font-mono text-base font-bold text-[#241E19]">
                  100% Verbatim
                </span>
              </div>
            </div>
          </div>

          {/* 4 Guardrail Pillars */}
          <div className="space-y-3">
            <h3 className="font-bold uppercase tracking-wider text-[#7C7167]">
              Strict Engineering Guardrails
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#F7F3EE] border border-[#D8CFC4] p-3 rounded">
                <div className="flex items-center gap-1.5 font-bold text-[#241E19] mb-1">
                  <Check className="w-3.5 h-3.5 text-[#3B6B56]" />
                  <span>1. Verbatim Substring Filter</span>
                </div>
                <p className="text-[#5D544C] leading-relaxed">
                  Every signal must be an exact verbatim substring. Any generated quote not found in the original text is discarded prior to client delivery.
                </p>
              </div>

              <div className="bg-[#F7F3EE] border border-[#D8CFC4] p-3 rounded">
                <div className="flex items-center gap-1.5 font-bold text-[#241E19] mb-1">
                  <Lock className="w-3.5 h-3.5 text-[#9E4A28]" />
                  <span>2. Zero Bias Scoring</span>
                </div>
                <p className="text-[#5D544C] leading-relaxed">
                  PERSPECTA deliberately rejects political bias meters (&ldquo;73% Left/Right&rdquo;) and fake news labels, focusing exclusively on inspectable framing rhetoric.
                </p>
              </div>

              <div className="bg-[#F7F3EE] border border-[#D8CFC4] p-3 rounded">
                <div className="flex items-center gap-1.5 font-bold text-[#241E19] mb-1">
                  <Cpu className="w-3.5 h-3.5 text-[#434D80]" />
                  <span>3. Typed Zod Runtime Contracts</span>
                </div>
                <p className="text-[#5D544C] leading-relaxed">
                  All inputs and generated decompositions are validated through strict Zod schemas to guarantee deterministic, reproducible API contracts.
                </p>
              </div>

              <div className="bg-[#F7F3EE] border border-[#D8CFC4] p-3 rounded">
                <div className="flex items-center gap-1.5 font-bold text-[#241E19] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C531B]" />
                  <span>4. Calibrated Prompt Taxonomy</span>
                </div>
                <p className="text-[#5D544C] leading-relaxed">
                  Decompositions require neutral, non-evaluative perceptual explanations and descriptive alternative baselines for every flagged signal.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#D8CFC4] bg-[#F7F3EE] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#241E19] hover:bg-[#5D544C] text-[#FAF7F2] text-xs font-semibold px-5 py-2 rounded transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
