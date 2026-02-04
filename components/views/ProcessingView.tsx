
import React from 'react';
import { motion } from 'framer-motion';

export const ProcessingView: React.FC = () => (
  <motion.div key="processing" className="flex flex-col items-center text-center py-32">
    <div className="relative w-48 h-48 mb-14">
      <div className="absolute inset-0 border-[12px] border-slate-100 dark:border-slate-900 rounded-full"></div>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.85, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[12px] border-t-indigo-600 rounded-full shadow-2xl shadow-indigo-500/20"></motion.div>
    </div>
    <h2 className="text-5xl font-black mb-6 text-slate-900 dark:text-white tracking-tighter leading-none">Perfecting your <br/> document...</h2>
    <p className="text-slate-500 dark:text-slate-400 max-w-sm font-bold uppercase text-xs tracking-widest mt-4 opacity-60">High-speed algorithms in action</p>
  </motion.div>
);
