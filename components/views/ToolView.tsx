
import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ToolCategory, PDFTool } from '../../types';
import { TOOLS } from '../../constants';

interface ToolViewProps {
  category: ToolCategory | null;
  onBack: () => void;
  onSelect: (tool: PDFTool) => void;
}

export const ToolView: React.FC<ToolViewProps> = ({ category, onBack, onSelect }) => (
  <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full">
    <div className="flex items-center mb-6 sm:mb-12 sticky top-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-4 sm:py-0 border-b border-slate-100 dark:border-slate-800 sm:border-none">
      <button onClick={onBack} className="mr-4 sm:mr-8 p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm text-slate-700 dark:text-slate-300">
        <LucideIcons.ArrowLeft size={20} className="sm:w-7 sm:h-7" />
      </button>
      <div className="flex-grow text-center sm:text-left pr-10 sm:pr-0">
        <h2 className="text-xl sm:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{category} Power-Ups</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[8px] sm:text-[10px] tracking-widest mt-0.5">Select an operation</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 pt-2 sm:pt-0">
      {TOOLS.filter(t => t.category === category).map((tool) => {
        const IconComp = (LucideIcons as any)[tool.icon];
        return (
          <button
            key={tool.id} onClick={() => onSelect(tool)}
            className="group flex items-center sm:flex-col p-4 sm:p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-[2.5rem] hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-left sm:text-center shadow-lg hover:shadow-2xl hover:-translate-y-1"
          >
            <div className="mr-4 sm:mr-0 sm:mb-8 p-3 sm:p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl sm:rounded-3xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
              <IconComp size={24} className="sm:w-10 sm:h-10" />
            </div>
            <div className="flex-grow">
              <h4 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mb-1 sm:mb-3 tracking-tight">{tool.name}</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed line-clamp-2">{tool.description}</p>
            </div>
            <div className="sm:hidden ml-2 text-indigo-600 dark:text-indigo-400 opacity-30 group-hover:opacity-100 transition-opacity">
              <LucideIcons.ChevronRight size={20} />
            </div>
          </button>
        );
      })}
    </div>
  </motion.div>
);
