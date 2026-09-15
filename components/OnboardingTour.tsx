'use client';

import { useEffect, useCallback } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const startDriverTour = useCallback(() => {
    const steps: DriveStep[] = [
      {
        element: '#tour-source-input',
        popover: {
          title: '1. Input & Universal Ingestion',
          description:
            'Paste raw text, fetch from live URLs, or drop documents (.pdf, .docx). You can ingest up to 3 publication perspectives on the same event.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-demo-selector',
        popover: {
          title: '2. Curated Case Studies',
          description:
            'Select preloaded comparative dossiers (Space Exploration, Fiscal Budgets, Tech Regulations) to test the platform instantly.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-analyze-btn',
        popover: {
          title: '3. The PRISM Engine',
          description:
            'Clicking Analyze runs multi-signal framing decomposition and cross-checks claims without assigning partisan labels.',
          side: 'top',
          align: 'end',
        },
      },
      {
        element: '#tour-article-reader',
        popover: {
          title: '4. Verbatim Signal Highlights',
          description:
            'Every highlight is an exact quote categorized by the 7 PRISM dimensions: Sourcing, Loaded Terms, Certainty, Claims, and Affective framing.',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#tour-inspector-drawer',
        popover: {
          title: '5. Framing Inspector Workbench',
          description:
            'Click any highlighted phrase in the article to inspect why it shapes perception, view neutral rewrites, and run live empirical web corroboration.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '#tour-compare-tab',
        popover: {
          title: '6. Multi-Perspective Matrix',
          description:
            'Switch to the Compare tab to inspect competing editorial outlets side-by-side and expose structural omissions and contrasting narrative emphasis.',
          side: 'bottom',
          align: 'end',
        },
      },
    ];

    const validSteps = steps.filter((step) => {
      if (!step.element) return true;
      if (typeof step.element === 'string') {
        const el = document.querySelector(step.element);
        return !!el;
      }
      return true;
    });

    if (validSteps.length === 0) {
      onClose();
      return;
    }

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: isDark ? '#000000' : '#1F2421',
      overlayOpacity: isDark ? 0.82 : 0.75,
      popoverClass: isDark ? 'perspecta-tour-dark' : 'perspecta-tour-light',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Finish Tour',
      steps: validSteps,
      onDestroyStarted: () => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('perspecta_tour_completed', 'true');
        }
        driverObj.destroy();
        onClose();
      },
    });

    driverObj.drive();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow DOM to render
      const timer = setTimeout(() => {
        startDriverTour();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, startDriverTour]);

  return null;
};
