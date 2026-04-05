'use client';

import { AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import FloatingChatWidget from './FloatingChatWidget';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function FloatingChatContainer() {
  const { sessions, closeChat, minimizeChat, restoreChat, focusChat, updateChatPosition } = useChatStore();

  return (
    <>
      {/* Render all floating chat widgets */}
      <AnimatePresence>
        {sessions.map((session) => (
          <FloatingChatWidget
            key={session.id}
            session={session}
            onClose={() => closeChat(session.id)}
            onMinimize={() => minimizeChat(session.id)}
            onRestore={() => restoreChat(session.id)}
            onFocus={() => focusChat(session.id)}
            onPositionChange={(pos) => updateChatPosition(session.id, pos)}
          />
        ))}
      </AnimatePresence>

      {/* Minimized chats bar at bottom */}
      <AnimatePresence>
        {sessions.some(s => s.isMinimized) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[90] flex gap-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700"
          >
            {sessions.filter(s => s.isMinimized).map((session) => (
              <button
                key={session.id}
                onClick={() => restoreChat(session.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="max-w-[100px] truncate">{session.otherPartyName || 'Chat'}</span>
                <span className="text-xs opacity-60">#{session.orderNumber.slice(-4)}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
