
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { PDFTool, CompressionLevel, PageSize } from '../../types';
import { pdfService } from '../../services/pdfService';

interface OptionsViewProps {
  tool: PDFTool | null;
  files: File[];
  pageCount: number;
  thumbnails: string[];
  compression: CompressionLevel;
  setCompression: (c: CompressionLevel) => void;
  pageSize: PageSize;
  setPageSize: (s: PageSize) => void;
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

const ComparisonSlider = ({ original, compressed }: { original: string, compressed: string }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(pos, 0), 100));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[60vh] sm:h-[70vh] rounded-2xl overflow-hidden cursor-ew-resize select-none border-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shadow-2xl"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      <img src={compressed} className="absolute inset-0 w-full h-full object-contain" alt="Compressed View" />
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img src={original} className="absolute inset-0 w-full h-full object-contain" alt="Original View" />
      </div>
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-xl flex items-center justify-center z-10"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl border border-slate-200">
          <LucideIcons.GripVertical size={20} className="text-slate-400" />
        </div>
      </div>
      <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-xl text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg border border-white/10">Original</div>
      <div className="absolute top-6 right-6 px-4 py-2 bg-indigo-600/80 backdrop-blur-xl text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg border border-white/10">Result</div>
    </div>
  );
};

const reorder = (list: number[], startIndex: number, endIndex: number) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const OptionsView: React.FC<OptionsViewProps> = (props) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [comparingIndex, setComparingIndex] = useState<number | null>(null);
  const [previewOriginals, setPreviewOriginals] = useState<string[]>([]);
  const [previewResults, setPreviewResults] = useState<string[]>([]);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [draggedOriginalIndex, setDraggedOriginalIndex] = useState<number | null>(null);
  
  const itemLayouts = useRef<{ id: number; rect: { left: number, top: number, width: number, height: number } }[]>([]);
  const scrollInterval = useRef<number | null>(null);
  const currentScrollSpeed = useRef<number>(0);

  const totalSize = props.files.reduce((acc, f) => acc + f.size, 0);
  const isImageToPdf = props.tool?.id === 'jpg-to-pdf' || props.tool?.id === 'png-to-pdf';
  const isPdfTool = props.tool?.category === 'PDF';
  const isOrganizeMode = props.tool?.id === 'organize-pdf';

  useEffect(() => {
    const initOriginals = async () => {
      setIsLoadingPreviews(true);
      if (isImageToPdf) {
        const urls = props.files.map(f => URL.createObjectURL(f));
        setPreviewOriginals(urls);
      } else if (isPdfTool && props.thumbnails.length > 0) {
        setPreviewOriginals(props.thumbnails);
      }
      setIsLoadingPreviews(false);
    };
    initOriginals();
  }, [props.files, props.thumbnails, isImageToPdf, isPdfTool]);

  useEffect(() => {
    if (props.tool?.hasCompression && props.files.length > 0) {
      updateCompressedPreviews();
    }
  }, [props.compression, props.files, props.tool]);

  const updateCompressedPreviews = async () => {
    const quality = props.compression === 'none' ? 1.0 : props.compression === 'low' ? 0.8 : props.compression === 'medium' ? 0.4 : 0.1;
    try {
      if (isImageToPdf) {
        const results = await Promise.all(props.files.slice(0, 12).map(async (f) => {
          const buffer = await f.arrayBuffer();
          const compressed = await pdfService.compressImage(buffer, 'image/jpeg', quality);
          return URL.createObjectURL(new Blob([compressed], { type: 'image/jpeg' }));
        }));
        setPreviewResults(results);
      } else if (isPdfTool && props.files[0]) {
        const results = await pdfService.pdfToImages(props.files[0], 'jpeg', props.compression);
        const urls = results.map(r => URL.createObjectURL(new Blob([r.data], { type: 'image/jpeg' })));
        setPreviewResults(urls);
      }
    } catch (e) {
      console.error("Preview generation failed", e);
    }
  };

  const calculateEstimate = (level: CompressionLevel) => {
    const factor = level === 'none' ? 1.0 : level === 'low' ? 0.75 : level === 'medium' ? 0.45 : 0.15;
    return ((totalSize * factor) / (1024 * 1024)).toFixed(2);
  };

  /**
   * Dampened Scroll Engine with Boundary Awareness
   */
  const handleAutoScroll = (pointerY: number) => {
    const threshold = 100; // Trigger area size
    const maxSpeed = 5;    // Reduced for smoothness
    let speed = 0;
    
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Upward logic with check for document top
    if (pointerY < threshold && scrollY > 0) {
        const factor = (threshold - pointerY) / threshold;
        speed = -Math.max(1, factor * maxSpeed);
    } 
    // Downward logic with check for document bottom
    else if (pointerY > window.innerHeight - threshold && scrollY < maxScroll) {
        const factor = (pointerY - (window.innerHeight - threshold)) / threshold;
        speed = Math.max(1, factor * maxSpeed);
    }

    currentScrollSpeed.current = speed;

    if (speed !== 0) {
        if (!scrollInterval.current) {
            const step = () => {
                if (currentScrollSpeed.current !== 0) {
                    // Precision check before scroll
                    const nowY = window.scrollY;
                    if (currentScrollSpeed.current < 0 && nowY <= 0) {
                        currentScrollSpeed.current = 0;
                        return;
                    }
                    if (currentScrollSpeed.current > 0 && nowY >= maxScroll) {
                        currentScrollSpeed.current = 0;
                        return;
                    }

                    window.scrollBy(0, currentScrollSpeed.current);
                    scrollInterval.current = requestAnimationFrame(step);
                } else {
                    scrollInterval.current = null;
                }
            };
            scrollInterval.current = requestAnimationFrame(step);
        }
    } else {
        if (scrollInterval.current) {
            cancelAnimationFrame(scrollInterval.current);
            scrollInterval.current = null;
        }
    }
  };

  const handleDragStart = (originalIndex: number) => {
    setDraggedOriginalIndex(originalIndex);
    if (!gridContainerRef.current) return;
    
    const items = Array.from(gridContainerRef.current.querySelectorAll('.organize-item-container')) as HTMLElement[];
    itemLayouts.current = items.map((item, idx) => {
      const rect = item.getBoundingClientRect();
      return {
        id: props.organizeOrder[idx],
        rect: {
            left: rect.left,
            top: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
        }
      };
    });
  };

  const handleGridDrag = (originalIndex: number, info: any) => {
    if (!gridContainerRef.current || itemLayouts.current.length === 0) return;

    handleAutoScroll(info.point.y);

    const currentSeqIndex = props.organizeOrder.indexOf(originalIndex);
    const docPointerX = info.point.x;
    const docPointerY = info.point.y + window.scrollY;

    let targetSeqIndex = currentSeqIndex;
    let minDistance = Infinity;

    itemLayouts.current.forEach((layout, i) => {
      const centerX = layout.rect.left + layout.rect.width / 2;
      const centerY = layout.rect.top + layout.rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(docPointerX - centerX, 2) + Math.pow(docPointerY - centerY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        targetSeqIndex = i;
      }
    });

    const targetRect = itemLayouts.current[targetSeqIndex].rect;
    const threshold = Math.max(targetRect.width, targetRect.height) * 0.75;

    if (targetSeqIndex !== currentSeqIndex && minDistance < threshold) {
      const nextOrder = reorder(props.organizeOrder, currentSeqIndex, targetSeqIndex);
      props.setOrganizeOrder(nextOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedOriginalIndex(null);
    currentScrollSpeed.current = 0;
    if (scrollInterval.current) {
        cancelAnimationFrame(scrollInterval.current);
        scrollInterval.current = null;
    }
  };

  return (
    <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full pb-48 sm:pb-0">
      <div className="flex items-center mb-6 sm:mb-10 sticky top-16 z-[80] bg-white/50 dark:bg-slate-950/50 backdrop-blur-md py-4 sm:py-0 border-b border-slate-100 dark:border-slate-800 sm:border-none">
        <button onClick={props.onBack} className="mr-4 sm:mr-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl text-slate-700 dark:text-slate-300 hover:border-indigo-500 transition-colors shadow-sm">
          <LucideIcons.ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Setup Task</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        <div className="lg:col-span-8 space-y-4 sm:space-y-8">
          
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h3 className="text-sm sm:text-xl font-black flex items-center text-slate-900 dark:text-white uppercase tracking-wider">
                  {isOrganizeMode ? <LucideIcons.GripVertical className="mr-2 sm:mr-3 text-indigo-600" /> : <LucideIcons.Layout className="mr-2 sm:mr-3 text-indigo-600" />}
                  {isOrganizeMode ? 'Rearrange Pages' : 'Document Preview'}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                  Total <span className="text-indigo-500">{isImageToPdf ? props.files.length : props.pageCount}</span> page{props.pageCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                  <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest flex items-center gap-1.5">
                    <LucideIcons.Layers size={12} /> {isOrganizeMode ? 'Velocity-Dampened Reordering' : 'Click to inspect quality'}
                  </span>
                </div>
              </div>
            </div>

            {isOrganizeMode ? (
              <div className="bg-slate-50 dark:bg-slate-950/40 p-4 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <div 
                  ref={gridContainerRef}
                  className="organize-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-10 relative min-h-[450px]"
                >
                  {props.organizeOrder.map((originalIndex, currentSeq) => (
                    <div key={originalIndex} className="organize-item-container flex flex-col items-center">
                      <motion.div
                        layout
                        drag
                        dragSnapToOrigin
                        dragElastic={0}
                        onDragStart={() => handleDragStart(originalIndex)}
                        onDrag={(e, info) => handleGridDrag(originalIndex, info)}
                        onDragEnd={handleDragEnd}
                        whileDrag={{ 
                          scale: 1.05, 
                          zIndex: 50, // Strictly below headers (80/100)
                          rotate: 1,
                          cursor: 'grabbing',
                          boxShadow: "0 50px 100px -20px rgba(79, 70, 229, 0.4)"
                        }}
                        transition={{ 
                          layout: { type: "spring", stiffness: 700, damping: 50 },
                          default: { duration: 0.05 }
                        }}
                        className={`organize-item relative cursor-grab group w-full ${draggedOriginalIndex === originalIndex ? 'z-50' : 'z-10'}`}
                      >
                        <div className={`relative w-full aspect-[1/1.4] bg-white dark:bg-slate-900 border-2 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center p-1 sm:p-2 transition-all duration-300 ${draggedOriginalIndex === originalIndex ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-800 group-hover:border-indigo-400'}`}>
                          {previewOriginals[originalIndex] ? (
                            <img 
                              src={previewOriginals[originalIndex]} 
                              className="max-w-full max-h-full object-contain pointer-events-none select-none" 
                              alt={`Page ${originalIndex + 1}`} 
                            />
                          ) : (
                            <LucideIcons.File size={32} className="opacity-10" />
                          )}
                          
                          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-[8px] sm:text-[10px] font-black shadow-xl border border-white/20">
                            {currentSeq + 1}
                          </div>
                          
                          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-slate-900/80 backdrop-blur-md text-white font-black text-[7px] sm:text-[9px] uppercase rounded-md border border-white/10">
                            P{originalIndex + 1}
                          </div>
                        </div>
                      </motion.div>
                      
                      <div className="mt-2 sm:mt-4 h-6 flex items-center justify-center w-full">
                        <motion.span layout className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Slot {currentSeq + 1}</motion.span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10 bg-slate-50 dark:bg-slate-950/40 p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                {(isImageToPdf ? props.files : Array.from({ length: props.pageCount })).map((_, i) => (
                  <motion.button key={i} whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} onClick={() => setComparingIndex(i)} className="flex flex-col items-center group">
                    <div className="relative w-full aspect-[1/1.4] rounded-2xl shadow-lg dark:shadow-none bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 transition-all duration-500 flex items-center justify-center p-2 sm:p-4 group-hover:border-indigo-500">
                      {previewOriginals[i] ? (
                        <img src={previewOriginals[i]} className="max-w-full max-h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" alt={`Page ${i+1}`} />
                      ) : (
                        <div className="flex flex-col items-center opacity-10 animate-pulse"><LucideIcons.File size={40} /></div>
                      )}
                      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-6 h-6 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><LucideIcons.ZoomIn size={18} /></div>
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-slate-800/80 backdrop-blur-md text-white font-black text-[8px] sm:text-[10px] uppercase rounded-md">Page {i + 1}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-10 rounded-3xl sm:rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl lg:sticky lg:top-24">
            <h3 className="hidden sm:block text-2xl font-black mb-10 text-slate-900 dark:text-white tracking-tight">Processing Panel</h3>
            <div className="mb-6 sm:mb-12">
              <label className="block text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 sm:mb-4">Result Filename</label>
              <input type="text" placeholder="Result_Name" value={props.customName} onChange={(e) => props.setCustomName(e.target.value)} className="w-full p-3 sm:p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl sm:rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-black text-slate-800 dark:text-white text-sm sm:text-lg" />
            </div>
            <button onClick={props.onProcess} className="hidden lg:flex w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] text-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 items-center justify-center space-x-3 group active:scale-95">
              <span>Process Files</span>
              <LucideIcons.ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-[95]">
        <button onClick={props.onProcess} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-lg font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/40 flex items-center justify-center space-x-2 active:scale-95"><span>Process Files</span><LucideIcons.ArrowRight size={20} /></button>
      </div>

      <AnimatePresence>
        {comparingIndex !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-10 backdrop-blur-3xl bg-slate-950/80">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="w-full max-w-6xl flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tighter uppercase">Quality Inspector</h3>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Analyzing: {isImageToPdf ? props.files[comparingIndex]?.name : `Page ${comparingIndex + 1}`}</p>
                </div>
                <button onClick={() => setComparingIndex(null)} className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><LucideIcons.X size={28} /></button>
              </div>
              {previewResults[comparingIndex] ? (<ComparisonSlider original={previewOriginals[comparingIndex]} compressed={previewResults[comparingIndex]} />) : (
                <div className="h-[60vh] bg-white/5 rounded-[3rem] flex flex-col items-center justify-center space-y-4 border-2 border-white/5">
                  <LucideIcons.Loader2 className="animate-spin text-indigo-500" size={56} />
                  <span className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Rendering Fidelity...</span>
                </div>
              )}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <button onClick={() => setComparingIndex(null)} className="w-full sm:w-auto px-12 py-5 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-50 active:scale-95 transition-all shadow-2xl">Confirm Selection</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
