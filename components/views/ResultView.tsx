
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
    <motion.div 
      initial={{ scale: 0.95, opacity: 0 }} 
      animate={{ scale: 1, opacity: 1 }} 
      className="max-w-3xl mx-auto text-center w-full px-2"
    >
      <div className="mb-6 sm:mb-12 w-24 h-24 sm:w-32 sm:h-32 bg-green-500 text-white rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
        <LucideIcons.Check className="w-12 h-12 sm:w-[72px] sm:h-[72px]" strokeWidth={3} />
      </div>
      <h2 className="text-4xl sm:text-6xl font-black mb-2 sm:mb-4 text-slate-900 dark:text-white tracking-tighter">Done!</h2>
      <p className="text-slate-400 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs mb-8 sm:mb-16">All operations successfully finished</p>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] sm:rounded-[4rem] p-6 sm:p-12 shadow-2xl space-y-6 sm:space-y-8">
        <div className="space-y-3 sm:space-y-4 max-h-[40vh] overflow-y-auto px-1 custom-scrollbar">
          {results.map((res, i) => (
            <div key={i} className="flex items-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 group transition-all hover:border-indigo-500 dark:hover:border-indigo-500">
              <div className="w-10 h-10 sm:w-16 sm:h-16 flex-shrink-0 bg-white dark:bg-slate-700 rounded-xl sm:rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm mr-3 sm:mr-6">
                <LucideIcons.FileCheck className="w-6 h-6 sm:w-9 sm:h-9" />
              </div>
              <div className="text-left flex-grow min-w-0 mr-2">
                <h4 
                  className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate"
                  title={res.name}
                >
                  {res.name}
                </h4>
                <p className="text-slate-400 font-black uppercase text-[8px] sm:text-[10px] tracking-widest mt-0.5 sm:mt-1">{(res.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={() => download(res)} 
                className="p-3 sm:p-4 bg-indigo-600 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-700 shadow-lg transition-transform active:scale-90 flex-shrink-0"
                aria-label="Download file"
              >
                <LucideIcons.Download className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 sm:pt-10">
          <button 
            onClick={() => results.forEach(download)} 
            className="w-full py-4 sm:py-7 bg-indigo-600 text-white rounded-[1.5rem] sm:rounded-[2.5rem] text-lg sm:text-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 sm:space-x-3"
          >
            <LucideIcons.CloudDownload className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>Download All</span>
          </button>
          <button 
            onClick={onReset} 
            className="w-full py-4 sm:py-7 bg-white dark:bg-slate-800 border-2 sm:border-4 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-[1.5rem] sm:rounded-[2.5rem] text-lg sm:text-2xl font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Start Again
          </button>
        </div>
      </div>
    </motion.div>
  );
};
