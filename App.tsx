
import React, { useState, useEffect, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  AppStep, 
  ToolCategory, 
  PDFTool, 
  CompressionLevel, 
  ProcessedFile 
} from './types';
import { TOOLS } from './constants';
import { pdfService } from './services/pdfService';

// --- Components ---

const Header = ({ darkMode, setDarkMode }: { darkMode: boolean, setDarkMode: (v: boolean) => void }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-2 cursor-pointer group" onClick={() => window.location.reload()}>
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
          <LucideIcons.FileText className="text-white" size={24} />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          OmniPDF
        </span>
      </div>
      
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
        aria-label="Toggle Theme"
      >
        {darkMode ? <LucideIcons.Sun size={20} /> : <LucideIcons.Moon size={20} />}
      </button>
    </div>
  </header>
);

const Footer = () => (
  <footer className="py-10 border-t border-slate-200 dark:border-slate-800 transition-colors text-center text-slate-500 dark:text-slate-400 text-sm">
    <p className="flex items-center justify-center space-x-1">
      <span>Made with</span>
      <LucideIcons.Heart size={16} className="text-red-500 fill-red-500" />
      <span>by</span>
      <span className="font-bold text-indigo-600 dark:text-indigo-400">Ajay Kumawat</span>
      <span>using Gemini</span>
    </p>
    <p className="mt-2 opacity-60">© {new Date().getFullYear()} OmniPDF. Professional Document Tools.</p>
  </footer>
);

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [step, setStep] = useState<AppStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  const [selectedTool, setSelectedTool] = useState<PDFTool | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [compression, setCompression] = useState<CompressionLevel>('medium');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [customName, setCustomName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Advanced States
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitMode, setSplitMode] = useState<'single' | 'multiple'>('single');
  const [splitGroups, setSplitGroups] = useState<{ id: string; pages: number[] }[]>([]);
  const [organizeOrder, setOrganizeOrder] = useState<number[]>([]);

  // Apply dark mode & Prevent global file drops
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, [darkMode]);

  const handleFiles = async (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFiles(newFiles);
      if (selectedTool?.category === 'PDF' && (selectedTool.id === 'split-pdf' || selectedTool.id === 'organize-pdf')) {
        const count = await pdfService.getPageCount(newFiles[0]);
        setPageCount(count);
        setOrganizeOrder(Array.from({ length: count }, (_, i) => i));
        setSelectedPages([]);
        setSplitGroups([{ id: 'group-1', pages: [] }]);
      }
      setStep('options');
    }
  };

  const startProcessing = async () => {
    if (!selectedTool || files.length === 0) return;
    setProcessing(true);
    setStep('processing');

    try {
      const processedResults: ProcessedFile[] = [];
      let baseFileName = customName || (files[0].name.split('.')[0] + '_processed');

      switch (selectedTool.id) {
        case 'jpg-to-pdf': {
          const data = await pdfService.jpgToPdf(files, compression);
          processedResults.push({ name: baseFileName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
        case 'png-to-pdf': {
          const data = await pdfService.pngToPdf(files, compression);
          processedResults.push({ name: baseFileName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
        case 'merge-pdf': {
          const data = await pdfService.mergePdfs(files);
          processedResults.push({ name: baseFileName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
        case 'split-pdf': {
          if (splitMode === 'single') {
            const data = await pdfService.splitPdfSingle(files[0], selectedPages.length > 0 ? selectedPages : [0]);
            processedResults.push({ name: baseFileName + '.pdf', data, type: 'application/pdf', size: data.length });
          } else {
            for (let i = 0; i < splitGroups.length; i++) {
              if (splitGroups[i].pages.length === 0) continue;
              const data = await pdfService.splitPdfSingle(files[0], splitGroups[i].pages);
              processedResults.push({ name: `${baseFileName}_part_${i+1}.pdf`, data, type: 'application/pdf', size: data.length });
            }
          }
          break;
        }
        case 'compress-pdf': {
          const data = await pdfService.compressPdf(files[0], compression);
          processedResults.push({ name: baseFileName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
        case 'organize-pdf': {
          const data = await pdfService.organizePdf(files[0], organizeOrder);
          processedResults.push({ name: baseFileName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
      }
      setResults(processedResults);
      setStep('done');
    } catch (err) {
      alert('Error processing file. Please try a different document.');
      setStep('options');
    } finally {
      setProcessing(false);
    }
  };

  const calculateEstimateSize = (originalSize: number, level: CompressionLevel) => {
    const factor = level === 'low' ? 0.75 : level === 'medium' ? 0.45 : 0.15;
    return ((originalSize * factor) / (1024 * 1024)).toFixed(2);
  };

  return (
    <div className="min-h-screen flex flex-col pt-20 bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-6xl w-full">
          <AnimatePresence mode="wait">
            
            {/* 1. Category View */}
            {step === 'category' && (
              <motion.div 
                key="cat" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="mb-14">
                  <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight text-slate-900 dark:text-white">
                    Powerfully Simple <span className="text-indigo-600 dark:text-indigo-400">PDFs</span>
                  </h1>
                  <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                    The modern standard for document processing. Fast, free, and completely secure.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {(['JPG', 'PNG', 'PDF'] as ToolCategory[]).map((cat) => (
                    <button
                      key={cat} onClick={() => { setSelectedCategory(cat); setStep('tool'); }}
                      className="group relative p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-2"
                    >
                      <div className="mb-8 w-20 h-20 mx-auto bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                        {cat === 'JPG' && <LucideIcons.Image size={40} />}
                        {cat === 'PNG' && <LucideIcons.FileImage size={40} />}
                        {cat === 'PDF' && <LucideIcons.FileType size={40} />}
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{cat} Tools</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Efficiently manage your {cat} files with ease.</p>
                      <div className="mt-6 inline-flex items-center text-indigo-600 dark:text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore Tools <LucideIcons.ChevronRight size={18} className="ml-1" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 2. Tool View */}
            {step === 'tool' && (
              <motion.div key="tool" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center mb-10">
                  <button onClick={() => setStep('category')} className="mr-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm text-slate-700 dark:text-slate-300">
                    <LucideIcons.ArrowLeft size={24} />
                  </button>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white">{selectedCategory} Tools</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {TOOLS.filter(t => t.category === selectedCategory).map((tool) => {
                    const IconComp = (LucideIcons as any)[tool.icon];
                    return (
                      <button
                        key={tool.id} onClick={() => { setSelectedTool(tool); setStep('upload'); }}
                        className="group flex flex-col items-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] hover:border-indigo-500 transition-all text-center shadow-md hover:shadow-xl"
                      >
                        <div className="mb-6 p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                          <IconComp size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{tool.name}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{tool.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 3. Upload View */}
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto">
                <div className="flex items-center mb-10">
                  <button onClick={() => setStep('tool')} className="mr-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300">
                    <LucideIcons.ArrowLeft size={24} />
                  </button>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">{selectedTool?.name}</h2>
                </div>

                <label 
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles(Array.from(e.dataTransfer.files)); }}
                  className={`flex flex-col items-center justify-center w-full h-[400px] border-4 border-dashed rounded-[3rem] cursor-pointer transition-all duration-300 bg-white dark:bg-slate-900 shadow-inner ${isDragOver ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 scale-[0.98]' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                >
                  <div className="flex flex-col items-center justify-center px-10 text-center">
                    <div className="p-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-full mb-6 text-indigo-600 dark:text-indigo-400">
                      <LucideIcons.UploadCloud size={64} strokeWidth={2.5} />
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mb-3">Drop files here</p>
                    <p className="text-slate-500 dark:text-slate-400 font-bold mb-1">or click to browse local storage</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm italic mt-4">Selected: {selectedTool?.name}</p>
                  </div>
                  <input type="file" className="hidden" multiple={['merge-pdf', 'jpg-to-pdf', 'png-to-pdf'].includes(selectedTool?.id || '')} onChange={(e) => handleFiles(Array.from(e.target.files || []))} />
                </label>
              </motion.div>
            )}

            {/* 4. Options View */}
            {step === 'options' && (
              <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center mb-10">
                  <button onClick={() => setStep('upload')} className="mr-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-700 dark:text-slate-300">
                    <LucideIcons.ArrowLeft size={24} />
                  </button>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">Customize & Optimize</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  <div className="lg:col-span-8 space-y-8">
                    {/* Organize PDF Tool UI */}
                    {selectedTool?.id === 'organize-pdf' && (
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                        <h3 className="text-xl font-black mb-8 flex items-center text-slate-900 dark:text-white uppercase tracking-tight">
                          <LucideIcons.Layout className="mr-3 text-indigo-600" /> Rearrange Sequence
                        </h3>
                        <Reorder.Group axis="y" values={organizeOrder} onReorder={setOrganizeOrder} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {organizeOrder.map((pageIdx) => (
                            <Reorder.Item key={pageIdx} value={pageIdx} className="cursor-grab active:cursor-grabbing p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-center shadow-sm hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-700 transition-all">
                              <div className="text-xs font-black text-indigo-600 mb-2 uppercase tracking-widest">Page</div>
                              <div className="text-4xl font-black text-slate-900 dark:text-white">{pageIdx + 1}</div>
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      </div>
                    )}

                    {/* Split PDF UI */}
                    {selectedTool?.id === 'split-pdf' && (
                      <div className="space-y-6">
                        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-2 rounded-3xl w-fit border border-slate-200 dark:border-slate-700">
                          <button onClick={() => setSplitMode('single')} className={`px-8 py-3 rounded-2xl transition-all font-black text-sm uppercase tracking-wider ${splitMode === 'single' ? 'bg-white dark:bg-slate-700 shadow-xl text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>One PDF</button>
                          <button onClick={() => setSplitMode('multiple')} className={`px-8 py-3 rounded-2xl transition-all font-black text-sm uppercase tracking-wider ${splitMode === 'multiple' ? 'bg-white dark:bg-slate-700 shadow-xl text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>Multiple PDFs</button>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                          {splitMode === 'single' ? (
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                              {Array.from({ length: pageCount }).map((_, i) => (
                                <button key={i} onClick={() => setSelectedPages(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])} className={`p-4 rounded-2xl border-4 transition-all font-black ${selectedPages.includes(i) ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>{i + 1}</button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {splitGroups.map((group, gIdx) => (
                                <div key={group.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 relative">
                                  <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-indigo-600 dark:text-indigo-400 uppercase text-xs tracking-widest">Collection {gIdx + 1}</h4>
                                    {splitGroups.length > 1 && (
                                      <button onClick={() => setSplitGroups(prev => prev.filter(g => g.id !== group.id))} className="text-red-500 p-2 hover:bg-red-50 rounded-xl transition-colors"><LucideIcons.X size={18} /></button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                                    {Array.from({ length: pageCount }).map((_, i) => (
                                      <button key={i} onClick={() => setSplitGroups(prev => prev.map(g => g.id === group.id ? { ...g, pages: g.pages.includes(i) ? g.pages.filter(x => x !== i) : [...g.pages, i] } : g))} className={`p-2 rounded-lg border-2 text-xs font-black transition-all ${group.pages.includes(i) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400'}`}>{i + 1}</button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              <button onClick={() => setSplitGroups(p => [...p, { id: Date.now().toString(), pages: [] }])} className="w-full py-4 border-4 border-dashed border-indigo-100 dark:border-indigo-900 rounded-3xl text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all">+ Add New Collection</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Default File List */}
                    {!['split-pdf', 'organize-pdf'].includes(selectedTool?.id || '') && (
                       <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                         <h3 className="text-xl font-black mb-6 uppercase text-slate-900 dark:text-white tracking-tight">Queue for processing</h3>
                         <div className="space-y-3">
                           {files.map((f, i) => (
                             <div key={i} className="flex items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-indigo-500 transition-colors">
                               <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-4">
                                 <LucideIcons.File size={20} />
                               </div>
                               <span className="flex-grow font-bold truncate text-slate-800 dark:text-slate-200">{f.name}</span>
                               <span className="text-sm font-black text-slate-400 uppercase">{(f.size/1024/1024).toFixed(2)} MB</span>
                             </div>
                           ))}
                         </div>
                       </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 sticky top-24">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl">
                      <h3 className="text-2xl font-black mb-8 text-slate-900 dark:text-white">Final Steps</h3>
                      
                      {selectedTool?.hasCompression && (
                        <div className="mb-10">
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Compression Power</label>
                          <div className="space-y-3">
                            {(['low', 'medium', 'high'] as CompressionLevel[]).map((level) => (
                              <button
                                key={level} onClick={() => setCompression(level)}
                                className={`w-full p-5 rounded-3xl border-2 text-left transition-all ${compression === level ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 shadow-lg' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className="font-black capitalize text-lg">{level} Intensity</div>
                                <div className="text-xs font-bold opacity-60 mt-1 italic">Est: {calculateEstimateSize(files.reduce((a,f)=>a+f.size,0), level)} MB</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mb-10">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">File Alias</label>
                        <input type="text" placeholder="Naming your masterpiece..." value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all font-bold text-slate-800 dark:text-white" />
                      </div>

                      <button onClick={startProcessing} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] text-xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center space-x-3 group">
                        <span>Process Now</span>
                        <LucideIcons.ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. Processing View */}
            {step === 'processing' && (
              <motion.div key="proc" className="flex flex-col items-center text-center py-20">
                <div className="relative w-40 h-40 mb-10">
                  <div className="absolute inset-0 border-[10px] border-slate-100 dark:border-slate-800 rounded-full"></div>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[10px] border-t-indigo-600 rounded-full shadow-lg"></motion.div>
                </div>
                <h2 className="text-4xl font-black mb-6 text-slate-900 dark:text-white tracking-tight">Crafting your document...</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm font-medium leading-relaxed">Optimization algorithms are running. This normally takes a few seconds.</p>
              </motion.div>
            )}

            {/* 6. Done View */}
            {step === 'done' && (
              <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl mx-auto text-center">
                <div className="mb-10 w-28 h-28 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <LucideIcons.Check size={64} strokeWidth={3} />
                </div>
                <h2 className="text-5xl font-black mb-4 text-slate-900 dark:text-white tracking-tight">It's Ready!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-12 font-bold uppercase tracking-widest text-sm">Download your processed files below</p>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-10 shadow-2xl space-y-6">
                  {results.map((res, i) => (
                    <div key={i} className="flex items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                      <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-5">
                        <LucideIcons.FileCheck size={32} />
                      </div>
                      <div className="text-left flex-grow">
                        <h4 className="text-xl font-black text-slate-900 dark:text-white truncate">{res.name}</h4>
                        <p className="text-slate-400 font-bold uppercase text-xs">{(res.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                    <button onClick={() => results.forEach(r => { const b=new Blob([r.data],{type:r.type}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=r.name; a.click(); })} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] text-xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center space-x-3">
                      <LucideIcons.Download size={28} />
                      <span>Download All</span>
                    </button>
                    <button onClick={() => window.location.reload()} className="w-full py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-[2rem] text-xl font-black hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Start Over</button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
