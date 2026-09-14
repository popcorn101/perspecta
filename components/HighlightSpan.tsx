'use client';

import React from 'react';
import { FramingSignal, PrismCategory } from '@/lib/types';
import { PRISM_CATEGORIES } from '@/lib/prism-rubric';

interface HighlightSpanProps {
  signal: FramingSignal;
  isActive: boolean;
  onSelect: (signal: FramingSignal) => void;
}

export const HighlightSpan: React.FC<HighlightSpanProps> = ({
  signal,
  isActive,
  onSelect,
}) => {
  const categoryMeta = PRISM_CATEGORIES[signal.category as PrismCategory] || {
    name: signal.category,
    color: '#9E4A28',
    bgWash: '#F9EFEA',
    borderColor: '#E8B6A2',
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case 'attribution':
        return 'highlight-attribution';
      case 'evaluative':
        return 'highlight-evaluative';
      case 'certainty':
        return 'highlight-certainty';
      case 'claims':
        return 'highlight-claims';
      case 'primacy':
        return 'highlight-primacy';
      case 'omission':
        return 'highlight-omission';
      case 'emotional':
        return 'highlight-emotional';
      default:
        return 'highlight-evaluative';
    }
  };

  return (
    <mark
      onClick={(e) => {
        e.stopPropagation();
        onSelect(signal);
      }}
      className={`inline-block cursor-pointer transition-all duration-200 px-1.5 py-0.5 mx-0.5 rounded-md font-inherit ${getCategoryClass(
        signal.category
      )} ${
        isActive
          ? 'highlight-active'
          : 'hover:brightness-95 hover:shadow-sm hover:-translate-y-0.5'
      }`}
      title={`${categoryMeta.name} (${Math.round(signal.confidence * 100)}% confidence) — Click to inspect`}
    >
      <span className="font-serif leading-snug">{signal.quoted_text}</span>
      <span
        className="inline-flex items-center ml-1 text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full tracking-wider shadow-2xs select-none"
        style={{
          color: categoryMeta.color,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          border: `1px solid ${categoryMeta.borderColor}`,
        }}
      >
        {signal.category.slice(0, 3)}
      </span>
    </mark>
  );
};
