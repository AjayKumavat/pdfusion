
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
    className="text-center"
  >
    <div className="mb-16">
      <h1 className="text-5xl sm:text-7xl font-black mb-8 tracking-tighter text-slate-900 dark:text-white leading-tight">
        Next-Gen <span className="text-indigo-600 dark:text-indigo-400">PDF</span> Processing
      </h1>
      <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
        Everything you need to merge, convert, split, and compress PDFs in seconds. 
        Privacy-first and lightning-fast.
      </p>
    </div>
    
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
      {(['JPG', 'PNG', 'PDF'] as ToolCategory[]).map((cat) => (
        <button
          key={cat} onClick={() => onSelect(cat)}
          className="group relative p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-3"
        >
          <div className="mb-10 w-24 h-24 mx-auto bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
            {cat === 'JPG' && <LucideIcons.Image size={48} />}
            {cat === 'PNG' && <LucideIcons.FileImage size={48} />}
            {cat === 'PDF' && <LucideIcons.FileType size={48} />}
          </div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{cat} Tools</h3>
          <p className="text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">Manage and convert your {cat} files instantly.</p>
          <div className="mt-8 inline-flex items-center text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            Select Category <LucideIcons.ArrowRight size={16} className="ml-2" />
          </div>
        </button>
      ))}
    </div>
  </motion.div>
);
