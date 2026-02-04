
import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ToolCategory } from '../../types';

interface CategoryViewProps {
  onSelect: (cat: ToolCategory) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({ onSelect }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
    className="text-center w-full"
  >
    <div className="mb-8 sm:mb-16">
      <h1 className="text-4xl sm:text-7xl font-black mb-4 sm:mb-8 tracking-tighter text-slate-900 dark:text-white leading-tight">
        Next-Gen <span className="text-indigo-600 dark:text-indigo-400">PDF</span> Processing
      </h1>
      <p className="text-sm sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed px-2">
        <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap align-middle">
          <span className="font-bold text-slate-900 dark:text-white">I</span>
          <LucideIcons.Heart size={18} className="text-red-500 fill-red-500 animate-pulse" />
          <span className="font-bold text-slate-900 dark:text-white">PDF</span>
        </span>
        <span className="ml-1">
          makes document management effortless. Convert, merge, and split in seconds.
        </span>
      </p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-10">
      {(['JPG', 'PNG', 'PDF'] as ToolCategory[]).map((cat) => (
        <button
          key={cat} onClick={() => onSelect(cat)}
          className="group relative flex items-center sm:flex-col p-5 sm:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl sm:rounded-[3rem] hover:border-indigo-500 dark:hover:border-indigo-500 transition-all duration-300 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-1 sm:hover:-translate-y-3 text-left sm:text-center overflow-hidden"
        >
          <div className="w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-2xl sm:rounded-[2rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner mr-4 sm:mr-0 sm:mb-10 text-indigo-600 sm:text-inherit">
            {cat === 'JPG' && <LucideIcons.Image size={32} className="sm:w-12 sm:h-12" />}
            {cat === 'PNG' && <LucideIcons.FileImage size={32} className="sm:w-12 sm:h-12" />}
            {cat === 'PDF' && <LucideIcons.FileType size={32} className="sm:w-12 sm:h-12" />}
          </div>
          <div className="flex-grow">
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mb-1 sm:mb-4">{cat} Tools</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed">Fast {cat} conversion & edits.</p>
          </div>
          <div className="sm:mt-8 flex items-center text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] tracking-widest opacity-0 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="hidden sm:inline">Select </span><LucideIcons.ArrowRight size={14} className="ml-1 sm:ml-2" />
          </div>
        </button>
      ))}
    </div>
  </motion.div>
);
