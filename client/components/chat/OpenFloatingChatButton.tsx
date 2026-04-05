'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Popcorn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpenFloatingChatButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'icon' | 'button';
  hasUnread?: boolean;
  className?: string;
}

export default function OpenFloatingChatButton({
  onClick,
  label = 'Open Chat',
  variant = 'button',
  hasUnread = false,
  className,
}: OpenFloatingChatButtonProps) {
  if (variant === 'icon') {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors",
          className
        )}
        title={label}
      >
        <Popcorn className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm font-medium",
        "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
        "rounded-lg shadow-sm hover:shadow-md transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      <Popcorn className="h-4 w-4" />
      {label}
    </motion.button>
  );
}
