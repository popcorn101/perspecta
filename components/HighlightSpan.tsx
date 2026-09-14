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
      className={`inline cursor-pointer transition-all duration-150 px-1 py-0.5 rounded-sm font-inherit ${getCategoryClass(
        signal.category
      )} ${
        isActive
          ? 'ring-2 ring-[#9E4A28] ring-offset-1 font-medium scale-[1.01]'
          : 'hover:opacity-85'
      }`}
      title={`${categoryMeta.name} (${Math.round(signal.confidence * 100)}% conf) — Click to inspect`}
    >
      {signal.quoted_text}
      <span
        className="inline-block ml-0.5 text-[9px] uppercase px-1 py-0.2 rounded font-sans tracking-wider align-super"
        style={{
          color: categoryMeta.color,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        {signal.category.slice(0, 3)}
      </span>
    </mark>
  );
};
