
import React from 'react';
import { motion, Reorder } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { PDFTool, CompressionLevel } from '../../types';

interface OptionsViewProps {
  tool: PDFTool | null;
  files: File[];
  pageCount: number;
  thumbnails: string[];
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

const PagePreview = ({ number, selected, onClick, small, image, isList }: { number: number, selected?: boolean, onClick?: () => void, small?: boolean, image?: string, isList?: boolean }) => (
  <div 
    onClick={onClick}
    className={`flex flex-col items-center group transition-all duration-300 ${onClick ? 'cursor-pointer' : 'cursor-default'} w-full`}
  >
    <div 
      className={`relative w-full aspect-[3/4] rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden theme-transition ${
        selected 
          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 shadow-lg ring-4 ring-indigo-500/10' 
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500'
      }`}
    >
      {image ? (
        <img 
          src={image} 
          alt={`Page ${number}`} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
        />
      ) : (
        <div className="w-full h-full p-2 space-y-1.5 flex flex-col opacity-10 dark:opacity-5 animate-pulse">
          <div className="h-1 bg-slate-400 dark:bg-slate-500 w-3/4 rounded"></div>
          <div className="h-1 bg-slate-400 dark:bg-slate-500 w-full rounded"></div>
          <div className="h-1 bg-slate-400 dark:bg-slate-500 w-full rounded"></div>
          <div className="flex-grow"></div>
          <div className="h-1 bg-slate-400 dark:bg-slate-500 w-full rounded"></div>
        </div>
      )}
      
      {selected && (
        <div className="absolute inset-0 bg-indigo-600/10 transition-colors"></div>
      )}

      <div className={`absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white font-black rounded text-[8px] uppercase tracking-tighter transition-all ${selected ? 'bg-indigo-600' : ''}`}>
        P.{number}
      </div>

      {selected && (
        <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm z-10">
          <LucideIcons.Check className="text-white" size={12} strokeWidth={3} />
        </div>
      )}
    </div>
    {!isList && (
      <span className={`mt-2 font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors ${small ? 'text-[8px]' : 'text-[10px]'}`}>
        Page {number}
      </span>
    )}
  </div>
);

export const OptionsView: React.FC<OptionsViewProps> = (props) => {
  const totalSize = props.files.reduce((acc, f) => acc + f.size, 0);
  
  const toggleSinglePage = (idx: number) => {
    props.setSelectedPages(prev => prev.includes(idx) ? prev.filter(p => p !== idx) : [...prev, idx].sort((a,b)=>a-b));
  };

  const calculateEstimate = (factor: number) => ((totalSize * factor) / (1024 * 1024)).toFixed(2);

  return (
    <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full pb-24 sm:pb-0">
      <div className="flex items-center mb-6 sm:mb-10 sticky top-16 z-40 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md py-4 sm:py-0 border-b border-slate-100 dark:border-slate-800 sm:border-none">
        <button onClick={props.onBack} className="mr-4 sm:mr-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors shadow-sm">
          <LucideIcons.ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Setup Task</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        <div className="lg:col-span-8 space-y-4 sm:space-y-8">
          
          {/* Organize Tool UI */}
          {props.tool?.id === 'organize-pdf' && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
              <h3 className="text-sm sm:text-xl font-black mb-4 sm:mb-8 flex items-center text-slate-900 dark:text-white uppercase tracking-wider">
                <LucideIcons.GripVertical className="mr-2 sm:mr-3 text-indigo-600" /> Rearrange Pages
              </h3>
              
              <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                <Reorder.Group 
                  axis="y" 
                  values={props.organizeOrder} 
                  onReorder={props.setOrganizeOrder} 
                  className="space-y-2 sm:space-y-4"
                >
                  {props.organizeOrder.map((idx, orderIdx) => (
                    <Reorder.Item 
                      key={idx} 
                      value={idx} 
                      className="cursor-grab active:cursor-grabbing flex items-center p-2.5 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group"
                    >
                      <div className="flex items-center justify-center w-6 sm:w-8 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors flex-shrink-0">
                        <LucideIcons.GripVertical size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <div className="w-10 sm:w-16 flex-shrink-0">
                        <PagePreview number={idx + 1} image={props.thumbnails[idx]} isList />
                      </div>
                      <div className="ml-3 sm:ml-8 flex flex-col min-w-0">
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-base">Seq. {orderIdx + 1}</span>
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Orig. P.{idx + 1}</span>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </div>
          )}

          {/* Split Tool UI */}
          {props.tool?.id === 'split-pdf' && (
            <div className="space-y-4">
              <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl sm:rounded-3xl w-fit border border-slate-200 dark:border-slate-700 mx-auto sm:mx-0">
                <button onClick={() => props.setSplitMode('single')} className={`px-4 sm:px-10 py-2 sm:py-3 rounded-lg sm:rounded-2xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest ${props.splitMode === 'single' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'text-slate-500'}`}>Selection</button>
                <button onClick={() => props.setSplitMode('multiple')} className={`px-4 sm:px-10 py-2 sm:py-3 rounded-lg sm:rounded-2xl transition-all font-black text-[9px] sm:text-[10px] uppercase tracking-widest ${props.splitMode === 'multiple' ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'text-slate-500'}`}>Collections</button>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                  {props.splitMode === 'single' ? (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 sm:mb-8 text-center sm:text-left">Select pages to extract</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-6">
                        {Array.from({ length: props.pageCount }).map((_, i) => (
                          <PagePreview 
                            key={i} 
                            number={i + 1} 
                            image={props.thumbnails[i]}
                            selected={props.selectedPages.includes(i)}
                            onClick={() => toggleSinglePage(i)}
                            small
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-8">
                      {props.splitGroups.map((g, gi) => (
                        <div key={g.id} className="p-3 sm:p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl sm:rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between items-center mb-4 sm:mb-8">
                            <h4 className="font-black text-indigo-600 uppercase text-[9px] tracking-widest bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">Coll. {gi + 1}</h4>
                            {props.splitGroups.length > 1 && (
                              <button onClick={() => props.setSplitGroups(ps => ps.filter(x => x.id !== g.id))} className="text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"><LucideIcons.Trash size={16} /></button>
                            )}
                          </div>
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-4">
                            {Array.from({ length: props.pageCount }).map((_, i) => (
                              <PagePreview 
                                key={i} 
                                number={i + 1} 
                                image={props.thumbnails[i]}
                                selected={g.pages.includes(i)}
                                onClick={() => props.setSplitGroups(ps => ps.map(x => x.id === g.id ? { ...x, pages: x.pages.includes(i) ? x.pages.filter(y => y !== i) : [...x.pages, i] } : x))}
                                small
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                      <button onClick={() => props.setSplitGroups(p => [...p, { id: Date.now().toString(), pages: [] }])} className="w-full py-3 sm:py-6 border-2 sm:border-4 border-dashed border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-indigo-600 dark:text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-x-2">
                        <LucideIcons.Plus size={16} /> Add Coll.
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!['split-pdf', 'organize-pdf'].includes(props.tool?.id || '') && (
             <div className="bg-white dark:bg-slate-900 p-4 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl">
               <h3 className="text-sm sm:text-xl font-black mb-4 sm:mb-8 uppercase text-slate-900 dark:text-white tracking-widest">Selected Files</h3>
               <div className="space-y-2 sm:space-y-4 max-h-[30vh] sm:max-h-[40vh] overflow-y-auto px-1 custom-scrollbar">
                 {props.files.map((f, i) => (
                   <div key={i} className="flex items-center p-3 sm:p-6 bg-slate-50 dark:bg-slate-800 rounded-xl sm:rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors shadow-sm">
                     <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg sm:rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3 sm:mr-5 flex-shrink-0">
                       <LucideIcons.File size={16} className="sm:w-5 sm:h-5" />
                     </div>
                     <span className="flex-grow font-black truncate text-slate-800 dark:text-slate-200 text-xs sm:text-base mr-2" title={f.name}>{f.name}</span>
                     <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">{(f.size/1024/1024).toFixed(2)} MB</span>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-10 rounded-3xl sm:rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl lg:sticky lg:top-24">
            <h3 className="hidden sm:block text-2xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Processing Panel</h3>
            
            {props.tool?.hasCompression && (
              <div className="mb-6 sm:mb-12">
                <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 sm:mb-5">Quality Target</label>
                <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 sm:gap-3">
                  {(['low', 'medium', 'high'] as CompressionLevel[]).map((level) => (
                    <button
                      key={level} onClick={() => props.setCompression(level)}
                      className={`w-full p-2.5 sm:p-6 rounded-xl sm:rounded-3xl border-2 text-center lg:text-left transition-all ${props.compression === level ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-md sm:shadow-xl' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500'}`}
                    >
                      <div className="font-black capitalize text-[10px] sm:text-xl tracking-tight">{level}</div>
                      <div className="hidden sm:block text-[10px] font-black uppercase opacity-50 mt-1 tracking-widest">Est: {calculateEstimate(level === 'low' ? 0.75 : level === 'medium' ? 0.45 : 0.15)} MB</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 sm:mb-12">
              <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 sm:mb-4">Result Filename</label>
              <input type="text" placeholder="Result_Name" value={props.customName} onChange={(e) => props.setCustomName(e.target.value)} className="w-full p-3 sm:p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl sm:rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-black text-slate-800 dark:text-white text-sm sm:text-lg" />
            </div>

            {/* Desktop-only static button */}
            <button onClick={props.onProcess} className="hidden lg:flex w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] text-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 items-center justify-center space-x-3 group active:scale-95">
              <span>Process Files</span>
              <LucideIcons.ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Fixed bottom button for mobile */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
        <button onClick={props.onProcess} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center space-x-2 active:scale-95">
          <span>Process Files</span>
          <LucideIcons.ArrowRight size={20} />
        </button>
      </div>
    </motion.div>
  );
};
