'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Leaf, 
  Sprout, 
  Droplets, 
  Sun, 
  Loader2,
  type LucideIcon 
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export type LoaderVariant = 
  | 'default'      // Generic loading
  | 'auth'         // Authentication (login/register)
  | 'upload'       // File upload
  | 'analysis'     // AI analysis
  | 'saving'       // Saving data
  | 'fetching';    // Fetching data

export type LoaderSize = 'sm' | 'md' | 'lg' | 'full';

interface AgriLoaderProps {
  /** Show/hide the loader */
  isLoading: boolean;
  /** Main message to display */
  message?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Preset variant for common use cases */
  variant?: LoaderVariant;
  /** Size of the loader */
  size?: LoaderSize;
  /** Custom icon (overrides variant default) */
  icon?: LucideIcon;
  /** Show as overlay (full screen) or inline */
  overlay?: boolean;
  /** Custom z-index for overlay mode */
  zIndex?: number;
  /** Show progress dots animation */
  showDots?: boolean;
  /** Show animated icons row */
  showIcons?: boolean;
  /** Additional className */
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preset Configurations
// ─────────────────────────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<LoaderVariant, { 
  title: string; 
  subtitle: string; 
  icon: LucideIcon;
}> = {
  default: {
    title: 'Loading...',
    subtitle: 'Please wait a moment',
    icon: Leaf,
  },
  auth: {
    title: 'Authenticating',
    subtitle: 'Verifying your credentials...',
    icon: Leaf,
  },
  upload: {
    title: 'Uploading',
    subtitle: 'Processing your file...',
    icon: Sprout,
  },
  analysis: {
    title: 'Analyzing',
    subtitle: 'AI is examining your crop image...',
    icon: Sun,
  },
  saving: {
    title: 'Saving',
    subtitle: 'Storing your data securely...',
    icon: Leaf,
  },
  fetching: {
    title: 'Loading Data',
    subtitle: 'Fetching the latest information...',
    icon: Droplets,
  },
};

const SIZE_CONFIG: Record<LoaderSize, {
  container: string;
  ringOuter: string;
  ringInner: string;
  centerSize: string;
  iconSize: string;
  titleSize: string;
}> = {
  sm: {
    container: 'p-4 max-w-xs',
    ringOuter: 'w-12 h-12',
    ringInner: 'inset-1',
    centerSize: 'inset-2',
    iconSize: 'h-4 w-4',
    titleSize: 'text-sm font-semibold',
  },
  md: {
    container: 'p-6 max-w-sm',
    ringOuter: 'w-16 h-16',
    ringInner: 'inset-1.5',
    centerSize: 'inset-3',
    iconSize: 'h-5 w-5',
    titleSize: 'text-base font-bold',
  },
  lg: {
    container: 'p-8 max-w-sm',
    ringOuter: 'w-24 h-24',
    ringInner: 'inset-2',
    centerSize: 'inset-4',
    iconSize: 'h-8 w-8',
    titleSize: 'text-xl font-bold',
  },
  full: {
    container: 'p-8 max-w-md',
    ringOuter: 'w-32 h-32',
    ringInner: 'inset-3',
    centerSize: 'inset-6',
    iconSize: 'h-10 w-10',
    titleSize: 'text-2xl font-bold',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated Icons Component
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedIcons({ size }: { size: LoaderSize }) {
  const icons = [
    { icon: Sprout, color: 'text-emerald-400' },
    { icon: Sun, color: 'text-amber-400' },
    { icon: Droplets, color: 'text-blue-400' },
  ];

  const iconSizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' || size === 'full' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className="flex justify-center gap-4">
      {icons.map(({ icon: Icon, color }, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: idx * 0.1, 
            duration: 0.3, 
            repeat: Infinity, 
            repeatType: 'reverse' 
          }}
        >
          <Icon className={`${iconSizeClass} ${color} drop-shadow-lg`} />
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Dots Component
// ─────────────────────────────────────────────────────────────────────────────

function ProgressDots() {
  return (
    <div className="flex justify-center gap-2 mt-6">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
          className="w-2 h-2 rounded-full bg-white shadow-lg shadow-emerald-500/50"
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main AgriLoader Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AgriLoader({
  isLoading,
  message,
  subtitle,
  variant = 'default',
  size = 'lg',
  icon,
  overlay = true,
  zIndex = 9999,
  showDots = true,
  showIcons = true,
  className = '',
}: AgriLoaderProps) {
  const config = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];
  const IconComponent = icon || config.icon;

  const content = (
    <div className="relative z-10 text-center">
      {/* Animated Logo */}
      <div className={`relative ${sizeConfig.ringOuter} mx-auto mb-6`}>
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-emerald-500/50"
        />

        {/* Inner rotating ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className={`absolute ${sizeConfig.ringInner} rounded-full border-4 border-transparent border-b-emerald-400 border-l-emerald-400/50`}
        />

        {/* Center icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`absolute ${sizeConfig.centerSize} rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30`}
        >
          <IconComponent className={`${sizeConfig.iconSize} text-white`} />
        </motion.div>
      </div>

      {/* Title - white with shadow for visibility */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${sizeConfig.titleSize} text-white mb-2 drop-shadow-lg`}
      >
        {message || config.title}
      </motion.h3>

      {/* Subtitle - lighter text */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-white/80 mb-6 drop-shadow"
      >
        {subtitle || config.subtitle}
      </motion.p>

      {/* Animated icons row */}
      {showIcons && <AnimatedIcons size={size} />}

      {/* Progress dots */}
      {showDots && <ProgressDots />}
    </div>
  );

  // Inline mode (no overlay) - also transparent
  if (!overlay) {
    return (
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex items-center justify-center ${className}`}
          >
            <div className={`relative ${sizeConfig.container} ${className}`}>
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
              </div>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Overlay mode (full screen) - Transparent, no background container
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex }}
          className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative mx-4"
          >
            {/* Glow effects behind loader */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
            </div>
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Spinner Component (for buttons, small areas)
// ─────────────────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className={`${sizeClasses[size]} ${className}`} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Loading Component (for route transitions)
// ─────────────────────────────────────────────────────────────────────────────

export function PageLoader({ message = 'Loading Page...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-emerald-500 border-t-transparent"
        />
        <p className="text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}
