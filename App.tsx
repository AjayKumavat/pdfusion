
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  AppStep, 
  ToolCategory, 
  PDFTool, 
  CompressionLevel, 
  ProcessedFile 
} from './types';
import { TOOLS } from './constants';
import { pdfService } from './services/pdfService';

// Import Modular Components
import { Layout } from './components/Layout';
import { CategoryView } from './components/views/CategoryView';
import { ToolView } from './components/views/ToolView';
import { UploadView } from './components/views/UploadView';
import { OptionsView } from './components/views/OptionsView';
import { ProcessingView } from './components/views/ProcessingView';
import { ResultView } from './components/views/ResultView';

export default function App() {
  // Theme state: robustly initialize from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme) return storedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Navigation & Tool state
  const [step, setStep] = useState<AppStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  const [selectedTool, setSelectedTool] = useState<PDFTool | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [compression, setCompression] = useState<CompressionLevel>('medium');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [customName, setCustomName] = useState('');

  // PDF Tool Specific States
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitMode, setSplitMode] = useState<'single' | 'multiple'>('single');
  const [splitGroups, setSplitGroups] = useState<{ id: string; pages: number[] }[]>([]);
  const [organizeOrder, setOrganizeOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // Effect to apply theme and handle global drag prevention
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const preventDefault = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const handleFiles = async (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setFiles(newFiles);
    
    // Analyze pages if tool requires it
    const isPDFAction = selectedTool?.id === 'split-pdf' || selectedTool?.id === 'organize-pdf' || selectedTool?.id === 'pdf-to-jpg' || selectedTool?.id === 'pdf-to-png';
    
    if (selectedTool?.category === 'PDF' && isPDFAction) {
      try {
        const count = await pdfService.getPageCount(newFiles[0]);
        setPageCount(count);
        setOrganizeOrder(Array.from({ length: count }, (_, i) => i));
        setSelectedPages([]);
        setSplitGroups([{ id: 'g1', pages: [] }]);
        
        // Generate actual page thumbnails
        const renderedThumbnails = await pdfService.getPageThumbnails(newFiles[0]);
        setThumbnails(renderedThumbnails);
      } catch (e) {
        console.error("Error reading PDF metadata:", e);
      }
    }
    setStep('options');
  };

  const startProcessing = async () => {
    if (!selectedTool || files.length === 0) return;
    setProcessing(true);
    setStep('processing');

    try {
      const processedResults: ProcessedFile[] = [];
      let baseName = customName || (files[0].name.split('.')[0] + '_processed');

      switch (selectedTool.id) {
        case 'jpg-to-pdf':
        case 'png-to-pdf': {
          const fn = selectedTool.id === 'jpg-to-pdf' ? pdfService.jpgToPdf : pdfService.pngToPdf;
          const data = await fn.call(pdfService, files, compression);
          processedResults.push({ name: baseName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
        case 'pdf-to-jpg':
        case 'pdf-to-png': {
          const format = selectedTool.id === 'pdf-to-jpg' ? 'jpeg' : 'png';
          const mime = selectedTool.id === 'pdf-to-jpg' ? 'image/jpeg' : 'image/png';
          const outputs = await pdfService.pdfToImages(files[0], format, compression);
          outputs.forEach(out => {
            processedResults.push({ name: `${baseName}_${out.name}`, data: out.data, type: mime, size: out.data.length });
          });
          break;
        }
        case 'merge-pdf': {
          const data = await pdfService.mergePdfs(files);
          processedResults.push({ name: baseName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
        case 'split-pdf': {
          if (splitMode === 'single') {
            const data = await pdfService.splitPdfSingle(files[0], selectedPages.length > 0 ? selectedPages : [0]);
            processedResults.push({ name: baseName + '.pdf', data, type: 'application/pdf', size: data.length });
          } else {
            for (let i = 0; i < splitGroups.length; i++) {
              if (splitGroups[i].pages.length === 0) continue;
              const data = await pdfService.splitPdfSingle(files[0], splitGroups[i].pages);
              processedResults.push({ name: `${baseName}_part_${i + 1}.pdf`, data, type: 'application/pdf', size: data.length });
            }
          }
          break;
        }
        case 'compress-pdf': {
          const data = await pdfService.compressPdf(files[0], compression);
          processedResults.push({ name: baseName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
        case 'organize-pdf': {
          const data = await pdfService.organizePdf(files[0], organizeOrder);
          processedResults.push({ name: baseName + '.pdf', data, type: 'application/pdf', size: data.length });
          break;
        }
      }
      setResults(processedResults);
      setStep('done');
    } catch (err) {
      console.error(err);
      alert('Processing failed. Please try a valid file.');
      setStep('options');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Layout darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)}>
      <AnimatePresence mode="wait">
        {step === 'category' && (
          <CategoryView 
            onSelect={(cat) => { setSelectedCategory(cat); setStep('tool'); }} 
          />
        )}
        {step === 'tool' && (
          <ToolView 
            category={selectedCategory} 
            onBack={() => setStep('category')}
            onSelect={(tool) => { setSelectedTool(tool); setStep('upload'); }}
          />
        )}
        {step === 'upload' && (
          <UploadView 
            tool={selectedTool} 
            onBack={() => setStep('tool')}
            onFiles={handleFiles}
          />
        )}
        {step === 'options' && (
          <OptionsView 
            tool={selectedTool} 
            files={files}
            pageCount={pageCount}
            thumbnails={thumbnails}
            compression={compression}
            setCompression={setCompression}
            customName={customName}
            setCustomName={setCustomName}
            splitMode={splitMode}
            setSplitMode={setSplitMode}
            selectedPages={selectedPages}
            setSelectedPages={setSelectedPages}
            splitGroups={splitGroups}
            setSplitGroups={setSplitGroups}
            organizeOrder={organizeOrder}
            setOrganizeOrder={setOrganizeOrder}
            onBack={() => setStep('upload')}
            onProcess={startProcessing}
          />
        )}
        {step === 'processing' && <ProcessingView />}
        {step === 'done' && (
          <ResultView 
            results={results} 
            onReset={() => { setStep('category'); setFiles([]); setResults([]); setCustomName(''); setThumbnails([]); }} 
          />
        )}
      </AnimatePresence>
    </Layout>
  );
}
