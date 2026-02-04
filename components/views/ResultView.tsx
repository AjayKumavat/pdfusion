
import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ProcessedFile } from '../../types';

interface ResultViewProps {
  results: ProcessedFile[];
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ results, onReset }) => {
  const download = (r: ProcessedFile) => {
    const b = new Blob([r.data], { type: r.type });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u;
    a.download = r.name;
    a.click();
  };

  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-3xl mx-auto text-center">
      <div className="mb-12 w-32 h-32 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
        <LucideIcons.Check size={72} strokeWidth={3} />
      </div>
      <h2 className="text-6xl font-black mb-4 text-slate-900 dark:text-white tracking-tighter">Done!</h2>
      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs mb-16">All operations successfully finished</p>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[4rem] p-12 shadow-2xl space-y-8">
        <div className="space-y-4">
          {results.map((res, i) => (
            <div key={i} className="flex items-center p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700">
              <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm mr-6">
                <LucideIcons.FileCheck size={36} />
              </div>
              <div className="text-left flex-grow">
                <h4 className="text-2xl font-black text-slate-900 dark:text-white truncate max-w-xs">{res.name}</h4>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-1">{(res.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button onClick={() => download(res)} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-90">
                <LucideIcons.Download size={24} />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10">
          <button onClick={() => results.forEach(download)} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] text-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center space-x-3">
            <LucideIcons.CloudDownload size={32} />
            <span>Download All</span>
          </button>
          <button onClick={onReset} className="w-full py-7 bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-[2.5rem] text-2xl font-black hover:bg-slate-50 transition-all">Start Again</button>
        </div>
      </div>
    </motion.div>
  );
};
