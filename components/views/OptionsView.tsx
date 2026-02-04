
import React from 'react';
import { motion, Reorder } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { PDFTool, CompressionLevel } from '../../types';

interface OptionsViewProps {
  tool: PDFTool | null;
  files: File[];
  pageCount: number;
  compression: CompressionLevel;
  setCompression: (c: CompressionLevel) => void;
  customName: string;
  setCustomName: (s: string) => void;
  splitMode: 'single' | 'multiple';
  setSplitMode: (m: 'single' | 'multiple') => void;
  selectedPages: number[];
  setSelectedPages: React.Dispatch<React.SetStateAction<number[]>>;
  splitGroups: { id: string; pages: number[] }[];
  setSplitGroups: React.Dispatch<React.SetStateAction<{ id: string; pages: number[] }[]>>;
  organizeOrder: number[];
  setOrganizeOrder: (o: number[]) => void;
  onBack: () => void;
  onProcess: () => void;
}

export const OptionsView: React.FC<OptionsViewProps> = (props) => {
  const totalSize = props.files.reduce((acc, f) => acc + f.size, 0);
  
  const toggleSinglePage = (idx: number) => {
    props.setSelectedPages(prev => prev.includes(idx) ? prev.filter(p => p !== idx) : [...prev, idx].sort((a,b)=>a-b));
  };

  const calculateEstimate = (factor: number) => ((totalSize * factor) / (1024 * 1024)).toFixed(2);

  return (
    <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center mb-10">
        <button onClick={props.onBack} className="mr-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300">
          <LucideIcons.ArrowLeft size={24} />
        </button>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configuration</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          
          {/* Organize Tool UI */}
          {props.tool?.id === 'organize-pdf' && (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-xl font-black mb-8 flex items-center text-slate-900 dark:text-white uppercase tracking-wider">
                <LucideIcons.LayoutTemplate className="mr-3 text-indigo-600" /> Sort Pages
              </h3>
              <Reorder.Group axis="y" values={props.organizeOrder} onReorder={props.setOrganizeOrder} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {props.organizeOrder.map((idx) => (
                  <Reorder.Item key={idx} value={idx} className="cursor-grab p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-colors">
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{idx + 1}</div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            </div>
          )}

          {/* Split Tool UI */}
          {props.tool?.id === 'split-pdf' && (
            <div className="space-y-6">
              <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-3xl w-fit border border-slate-200 dark:border-slate-700">
                <button onClick={() => props.setSplitMode('single')} className={`px-10 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${props.splitMode === 'single' ? 'bg-white dark:bg-slate-700 shadow-xl text-indigo-600' : 'text-slate-500'}`}>Target Selection</button>
                <button onClick={() => props.setSplitMode('multiple')} className={`px-10 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${props.splitMode === 'multiple' ? 'bg-white dark:bg-slate-700 shadow-xl text-indigo-600' : 'text-slate-500'}`}>Multiple Collections</button>
              </div>
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                {props.splitMode === 'single' ? (
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                    {Array.from({ length: props.pageCount }).map((_, i) => (
                      <button key={i} onClick={() => toggleSinglePage(i)} className={`p-5 rounded-2xl border-4 font-black transition-all ${props.selectedPages.includes(i) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-300'}`}>{i + 1}</button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {props.splitGroups.map((g, gi) => (
                      <div key={g.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-black text-indigo-600 uppercase text-xs tracking-widest">Collection {gi + 1}</h4>
                          <button onClick={() => props.setSplitGroups(ps => ps.filter(x => x.id !== g.id))} className="text-red-500 p-2"><LucideIcons.Trash size={18} /></button>
                        </div>
                        <div className="grid grid-cols-8 sm:grid-cols-12 gap-2">
                          {Array.from({ length: props.pageCount }).map((_, i) => (
                            <button key={i} onClick={() => props.setSplitGroups(ps => ps.map(x => x.id === g.id ? { ...x, pages: x.pages.includes(i) ? x.pages.filter(y => y !== i) : [...x.pages, i] } : x))} className={`p-2 rounded-lg border-2 text-[10px] font-black transition-all ${g.pages.includes(i) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600'}`}>{i + 1}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button onClick={() => props.setSplitGroups(p => [...p, { id: Date.now().toString(), pages: [] }])} className="w-full py-5 border-4 border-dashed border-indigo-100 dark:border-indigo-900/40 rounded-[2rem] text-indigo-600 font-black uppercase text-xs tracking-widest hover:bg-indigo-50">+ Create Collection</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simple Queue UI */}
          {!['split-pdf', 'organize-pdf'].includes(props.tool?.id || '') && (
             <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
               <h3 className="text-xl font-black mb-8 uppercase text-slate-900 dark:text-white tracking-widest">Processing Queue</h3>
               <div className="space-y-4">
                 {props.files.map((f, i) => (
                   <div key={i} className="flex items-center p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-indigo-400 transition-colors">
                     <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-5 shadow-sm">
                       <LucideIcons.File size={24} />
                     </div>
                     <span className="flex-grow font-black truncate text-slate-800 dark:text-slate-200">{f.name}</span>
                     <span className="text-sm font-black text-slate-400 uppercase tracking-widest">{(f.size/1024/1024).toFixed(2)} MB</span>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl sticky top-24">
            <h3 className="text-2xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Processing Panel</h3>
            
            {props.tool?.hasCompression && (
              <div className="mb-12">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">Compression Power</label>
                <div className="space-y-3">
                  {(['low', 'medium', 'high'] as CompressionLevel[]).map((level) => (
                    <button
                      key={level} onClick={() => props.setCompression(level)}
                      className={`w-full p-6 rounded-3xl border-2 text-left transition-all ${props.compression === level ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-xl' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'}`}
                    >
                      <div className="font-black capitalize text-xl tracking-tight">{level} intensity</div>
                      <div className="text-[10px] font-black uppercase opacity-50 mt-1.5 tracking-widest">Target: {calculateEstimate(level === 'low' ? 0.75 : level === 'medium' ? 0.45 : 0.15)} MB</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-12">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Output Filename</label>
              <input type="text" placeholder="Omni_Processed" value={props.customName} onChange={(e) => props.setCustomName(e.target.value)} className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-black text-slate-800 dark:text-white text-lg" />
            </div>

            <button onClick={props.onProcess} className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] text-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center space-x-3 group active:scale-95">
              <span>Run Task</span>
              <LucideIcons.ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
