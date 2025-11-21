import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between text-xs font-bold text-primary-600 dark:text-primary-300 mb-2 uppercase tracking-widest">
        <span>Question {current + 1}</span>
        <span>{total} Total</span>
      </div>
      <div className="h-3 w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/20 dark:border-white/5 shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-600 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};