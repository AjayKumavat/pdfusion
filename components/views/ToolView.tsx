
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
  <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
    <div className="flex items-center mb-12">
      <button onClick={onBack} className="mr-8 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-slate-700 dark:text-slate-300">
        <LucideIcons.ArrowLeft size={28} />
      </button>
      <div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white">{category} Power-Ups</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">Pick your preferred operation</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {TOOLS.filter(t => t.category === category).map((tool) => {
        const IconComp = (LucideIcons as any)[tool.icon];
        return (
          <button
            key={tool.id} onClick={() => onSelect(tool)}
            className="group flex flex-col items-center p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] hover:border-indigo-500 transition-all text-center shadow-lg hover:shadow-2xl"
          >
            <div className="mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl text-indigo-600 dark:text-indigo-400 group-hover:rotate-6 transition-transform">
              <IconComp size={40} />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{tool.name}</h4>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold leading-relaxed">{tool.description}</p>
          </button>
        );
      })}
    </div>
  </motion.div>
);
