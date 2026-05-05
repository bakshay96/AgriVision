'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Heart } from 'lucide-react';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeedbackPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 mb-2">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">We Value Your Voice</h1>
          <p className="text-slate-500 font-medium">Help us make AgriVision Pro the best tool for farmers across India.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900 rounded-[32px] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold px-1">Send Feedback</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <FeedbackForm />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none rounded-[32px]">
              <CardContent className="p-6 space-y-4">
                <Heart className="h-8 w-8 text-emerald-200" />
                <h3 className="text-xl font-bold">Community Driven</h3>
                <p className="text-emerald-50 text-sm leading-relaxed">
                  Every feature you see in AgriVision was built based on feedback from users like you.
                </p>
              </CardContent>
            </Card>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 italic">"Your suggestions are the seeds of our next big feature."</h4>
              <p className="text-xs text-slate-400">— The AgriVision Team</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
