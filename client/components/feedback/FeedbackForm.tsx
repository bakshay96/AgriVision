'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { feedbackApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

export default function FeedbackForm() {
  const { user } = useAppStore();
  const [feedback, setFeedback] = useState({ 
    subject: '', 
    message: '', 
    category: 'general' as 'bug' | 'feature' | 'general' | 'other', 
    rating: 5 
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => feedbackApi.create(data),
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      setIsSubmitted(true);
    },
    onError: () => toast.error('Failed to submit feedback. Please try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.message) return;
    mutation.mutate({
      ...feedback,
      name: user?.name || 'Anonymous',
      email: user?.email || 'anonymous@agrivision.com',
    });
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold dark:text-white">Feedback Received!</h3>
        <p className="text-slate-500 max-w-xs">We appreciate your input. Our team will review it and get back to you if needed.</p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div className="grid grid-cols-2 gap-3">
        {(['bug', 'feature', 'general', 'other'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFeedback({ ...feedback, category: cat })}
            className={`py-3 rounded-2xl border-2 text-sm font-bold capitalize transition-all ${
              feedback.category === cat 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-emerald-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">Subject</label>
        <input 
          type="text" 
          placeholder="Brief summary..." 
          value={feedback.subject} 
          onChange={(e) => setFeedback({ ...feedback, subject: e.target.value })} 
          className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">Your Message</label>
        <textarea 
          rows={5} 
          placeholder="What can we improve? We're listening..." 
          value={feedback.message} 
          onChange={(e) => setFeedback({ ...feedback, message: e.target.value })} 
          className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 p-4 text-sm dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" 
        />
      </div>

      <button 
        type="submit"
        disabled={mutation.isPending || !feedback.message}
        className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {mutation.isPending ? 'Sending...' : (
          <>
            <Send className="h-5 w-5" />
            Submit Feedback
          </>
        )}
      </button>
    </form>
  );
}
