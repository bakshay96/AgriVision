import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── Badge (Shadcn/UI style) ──────────────────────────────────────────────────
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:   'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:   'text-foreground',
        // ── AI Status variants ──
        HEALTHY:  'border-transparent bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
        STRESSED: 'border-transparent bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
        DISEASED: 'border-transparent bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400',
        UNKNOWN:  'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
