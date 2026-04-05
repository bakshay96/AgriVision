import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Progress Bar (Shadcn/UI style) ──────────────────────────────────────────
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100 */
  value?: number;
  /** Colour override via Tailwind class on the fill bar */
  fillClassName?: string;
  /** Show numeric label inside the bar */
  showLabel?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, fillClassName, showLabel = false, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));

    // Derive colour automatically from value when no fillClassName given
    const autoFill =
      fillClassName ??
      (clamped >= 80
        ? 'bg-emerald-500'
        : clamped >= 60
        ? 'bg-amber-400'
        : clamped >= 40
        ? 'bg-orange-400'
        : 'bg-red-500');

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            autoFill
          )}
          style={{ width: `${clamped}%` }}
        >
          {showLabel && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-white">
              {clamped}%
            </span>
          )}
        </div>
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
