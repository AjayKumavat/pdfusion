
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { PDFTool } from '../../types';

interface UploadViewProps {
  tool: PDFTool | null;
  onBack: () => void;
  onFiles: (files: File[]) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ tool, onBack, onFiles }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <motion.div key="upload" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
      <div className="flex items-center mb-10">
        <button onClick={onBack} className="mr-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300">
          <LucideIcons.ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{tool?.name}</h2>
      </div>

      <label 
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onFiles(Array.from(e.dataTransfer.files)); }}
        className={`flex flex-col items-center justify-center w-full h-[450px] border-4 border-dashed rounded-[4rem] cursor-pointer transition-all duration-500 bg-white dark:bg-slate-900/50 shadow-inner ${isDragOver ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 scale-[0.99]' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:bg-slate-50'}`}
      >
        <div className="flex flex-col items-center justify-center px-12 text-center">
          <div className="p-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-8 text-indigo-600 dark:text-indigo-400 shadow-lg">
            <LucideIcons.CloudUpload size={80} strokeWidth={2.5} />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white mb-4">Pull your files here</p>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-lg mb-2">or tap to select from disk</p>
          <div className="mt-8 flex space-x-2">
             <span className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-black uppercase tracking-widest opacity-60">Ready for {tool?.category}</span>
          </div>
        </div>
        <input 
          type="file" 
          className="hidden" 
          multiple={['merge-pdf', 'jpg-to-pdf', 'png-to-pdf'].includes(tool?.id || '')} 
          onChange={(e) => onFiles(Array.from(e.target.files || []))} 
        />
      </label>
    </motion.div>
  );
};
