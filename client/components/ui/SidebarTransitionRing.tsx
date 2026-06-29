'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SidebarTransitionRingProps {
  /** Whether the sidebar is currently collapsed */
  isCollapsed: boolean;
  /** Stroke colour — e.g. "#f59e0b" for amber, "#10b981" for emerald */
  color?: string;
  /** Glow / shadow colour in rgba */
  glowColor?: string;
}

/**
 * Renders a full-screen SVG lemniscate (∞ / figure-8) overlay that sweeps
 * across the viewport whenever the sidebar transitions between min and max.
 *
 * The left loop sits over the sidebar panel; the right loop sits over the
 * main content panel. The path is drawn with stroke-dashoffset animation so
 * the ring visually "draws itself" in and then fades away.
 */
export default function SidebarTransitionRing({
  isCollapsed,
  color = '#f59e0b',
  glowColor = 'rgba(245,158,11,0.35)',
}: SidebarTransitionRingProps) {
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Each toggle: bump key (remount) + show for 900ms
    setKey((k) => k + 1);
    setShow(true);
    const t = setTimeout(() => setShow(false), 900);
    return () => clearTimeout(t);
  }, [isCollapsed]);

  // SVG viewBox: 1000 × 500
  // Lemniscate parametric: x = a·cos(t)/(1+sin²(t)), y = a·sin(t)·cos(t)/(1+sin²(t))
  // Pre-calculated and scaled so the ∞ shape fills the viewport centre.
  // We centre the figure-8 slightly left of screen centre so the crossing
  // point sits roughly at the sidebar / main-panel divider line.
  const pathData =
    // Large lemniscate (∞) centred at (500,250), 460×220 bounding box
    'M 500 250 C 500 130 680 80 730 250 C 780 420 960 370 960 250 C 960 130 780 80 730 250 C 680 420 500 370 500 250 C 500 130 320 80 270 250 C 220 420 40 370 40 250 C 40 130 220 80 270 250 C 320 420 500 370 500 250 Z';

  // Total length for stroke-dasharray; approximate, tuned visually
  const totalLen = 2600;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none fixed inset-0 z-[200] overflow-hidden"
          aria-hidden="true"
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1000 500"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Glow filter */}
            <defs>
              <filter id="strglow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background glow path (thick, blurred) */}
            <motion.path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={28}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.18}
              filter="url(#strglow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.18 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.75, ease: 'easeInOut' }}
            />

            {/* Main crisp ring path */}
            <motion.path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#strglow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            />

            {/* Bright leading dot that races along the path */}
            <motion.circle
              r={10}
              fill={color}
              filter="url(#strglow)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, times: [0, 0.1, 0.85, 1] }}
            >
              <animateMotion
                dur="0.75s"
                begin="0s"
                fill="freeze"
                path={pathData}
                calcMode="spline"
                keyTimes="0;1"
                keySplines="0.4 0 0.6 1"
              />
            </motion.circle>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
