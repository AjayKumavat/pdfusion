
import React, { useState, useEffect, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200 dark:border-slate-800 transition-colors">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.location.reload()}>
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <LucideIcons.FileText className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          OmniPDF
        </span>
      </div>
      
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
      >
        {darkMode ? <LucideIcons.Sun size={20} /> : <LucideIcons.Moon size={20} />}
      </button>
    </div>
  </header>
);

const Footer = () => (
  <footer className="py-8 border-t border-slate-200 dark:border-slate-800 transition-colors text-center text-slate-500 text-sm">
    <p>Made with ❤️ by <span className="font-semibold text-indigo-600">Ajay Kumawat</span> using Gemini</p>
    <p className="mt-1">© {new Date().getFullYear()} OmniPDF. All rights reserved.</p>
  </footer>
);

// --- Main App Component ---

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [step, setStep] = useState<AppStep>('category');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  const [selectedTool, setSelectedTool] = useState<PDFTool | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [compression, setCompression] = useState<CompressionLevel>('medium');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ProcessedFile | null>(null);
  const [customName, setCustomName] = useState('');

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleCategorySelect = (cat: ToolCategory) => {
    setSelectedCategory(cat);
    setStep('tool');
  };

  const handleToolSelect = (tool: PDFTool) => {
    setSelectedTool(tool);
    setStep('upload');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setStep('options');
    }
  };

  const calculateEstimateSize = (originalSize: number, level: CompressionLevel) => {
    const factor = level === 'low' ? 0.9 : level === 'medium' ? 0.6 : 0.3;
    const sizeInMb = (originalSize * factor) / (1024 * 1024);
    return sizeInMb.toFixed(2);
  };

  const startProcessing = async () => {
    if (!selectedTool || files.length === 0) return;
    setProcessing(true);
    setStep('processing');

    try {
      let data: Uint8Array | Uint8Array[];
      let fileName = customName || (files[0].name.split('.')[0] + '_processed');
      let type = 'application/pdf';

      switch (selectedTool.id) {
        case 'jpg-to-pdf':
          data = await pdfService.jpgToPdf(files, compression);
          fileName += '.pdf';
          break;
        case 'png-to-pdf':
          data = await pdfService.pngToPdf(files, compression);
          fileName += '.pdf';
          break;
        case 'merge-pdf':
          data = await pdfService.mergePdfs(files, compression);
          fileName += '.pdf';
          break;
        case 'split-pdf':
          // Split returns multiple files, for simplicity we ZIP them or just take the first
          // Here we take the first for the demo or we can handle differently
          const splitPages = await pdfService.splitPdf(files[0]);
          data = splitPages[0]; 
          fileName += '_page_1.pdf';
          break;
        case 'compress-pdf':
          data = await pdfService.compressPdf(files[0], compression);
          fileName += '.pdf';
          break;
        case 'organize-pdf':
          // Simplified: just reverse the pages for demo
          const arrayBuffer = await files[0].arrayBuffer();
          const doc = await (await import('pdf-lib')).PDFDocument.load(arrayBuffer);
          const order = Array.from({length: doc.getPageCount()}, (_, i) => i).reverse();
          data = await pdfService.organizePdf(files[0], order);
          fileName += '_organized.pdf';
          break;
        default:
          throw new Error('Tool not implemented');
      }

      setResult({
        name: fileName,
        data: data as Uint8Array,
        type: type,
        size: (data as Uint8Array).length
      });
      setStep('done');
    } catch (err) {
      console.error(err);
      alert('Processing failed. Please try again.');
      setStep('options');
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([result.data], { type: result.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalOriginalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="min-h-screen flex flex-col pt-16 transition-colors duration-300">
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Category Selection */}
            {step === 'category' && (
              <motion.div 
                key="step-category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
                  What would you like to <span className="text-indigo-600">process</span>?
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-12">
                  Select a category to see all available tools.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {['JPG', 'PNG', 'PDF'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat as ToolCategory)}
                      className="group p-8 glass border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10"
                    >
                      <div className="mb-6 w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        {cat === 'JPG' && <LucideIcons.Image size={32} />}
                        {cat === 'PNG' && <LucideIcons.FileImage size={32} />}
                        {cat === 'PDF' && <LucideIcons.FileType size={32} />}
                      </div>
                      <h3 className="text-2xl font-bold">{cat} Tools</h3>
                      <p className="mt-2 text-slate-500 dark:text-slate-400">Everything related to {cat} files.</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Tool Selection */}
            {step === 'tool' && (
              <motion.div 
                key="step-tool"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full"
              >
                <div className="flex items-center mb-8">
                  <button onClick={() => setStep('category')} className="mr-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                    <LucideIcons.ArrowLeft size={20} />
                  </button>
                  <h2 className="text-3xl font-bold">Select a {selectedCategory} Tool</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TOOLS.filter(t => t.category === selectedCategory).map((tool) => {
                    const IconComp = (LucideIcons as any)[tool.icon];
                    return (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool)}
                        className="flex items-start p-6 glass border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all text-left"
                      >
                        <div className="mr-5 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                          <IconComp size={24} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold">{tool.name}</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{tool.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 3: File Upload */}
            {step === 'upload' && (
              <motion.div 
                key="step-upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="flex items-center mb-8">
                  <button onClick={() => setStep('tool')} className="mr-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                    <LucideIcons.ArrowLeft size={20} />
                  </button>
                  <h2 className="text-3xl font-bold">{selectedTool?.name}</h2>
                </div>

                <label className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl cursor-pointer hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full mb-4">
                      <LucideIcons.UploadCloud className="text-indigo-600" size={48} />
                    </div>
                    <p className="mb-2 text-xl font-semibold">Click to upload or drag and drop</p>
                    <p className="text-slate-500 dark:text-slate-400">PDF, JPG or PNG (up to 10MB each)</p>
                  </div>
                  <input type="file" className="hidden" multiple={selectedTool?.id !== 'compress-pdf' && selectedTool?.id !== 'split-pdf' && selectedTool?.id !== 'organize-pdf'} onChange={handleFileUpload} />
                </label>
              </motion.div>
            )}

            {/* Step 4: Options & Compression */}
            {step === 'options' && (
              <motion.div 
                key="step-options"
                className="w-full max-w-2xl mx-auto"
              >
                <div className="flex items-center mb-8">
                  <button onClick={() => setStep('upload')} className="mr-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                    <LucideIcons.ArrowLeft size={20} />
                  </button>
                  <h2 className="text-3xl font-bold">Configure Settings</h2>
                </div>

                <div className="glass border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-8">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                    <div className="flex items-center">
                      <LucideIcons.Files className="text-indigo-600 mr-3" size={24} />
                      <span className="font-semibold">{files.length} Files Selected</span>
                    </div>
                    <span className="text-sm text-slate-500">{(totalOriginalSize / (1024 * 1024)).toFixed(2)} MB total</span>
                  </div>

                  {selectedTool?.hasCompression && (
                    <div>
                      <label className="block text-lg font-bold mb-4">Compression Level</label>
                      <div className="grid grid-cols-3 gap-4">
                        {(['low', 'medium', 'high'] as CompressionLevel[]).map((level) => (
                          <button
                            key={level}
                            onClick={() => setCompression(level)}
                            className={`p-4 rounded-2xl border-2 transition-all ${
                              compression === level 
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' 
                                : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            <div className="font-bold capitalize">{level}</div>
                            <div className="text-xs text-slate-500 mt-1 italic">
                              Est. {calculateEstimateSize(totalOriginalSize, level)} MB
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-lg font-bold mb-4">Output File Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter custom name..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full p-4 glass border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                  </div>

                  <button 
                    onClick={startProcessing}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2"
                  >
                    <span>Process {selectedTool?.name}</span>
                    <LucideIcons.ChevronRight size={24} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Processing */}
            {step === 'processing' && (
              <motion.div 
                key="step-processing"
                className="flex flex-col items-center text-center"
              >
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-t-indigo-600 rounded-full"
                  ></motion.div>
                </div>
                <h2 className="text-3xl font-bold mb-4">Applying Magic...</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  We are processing your files with high-performance algorithms. Almost there!
                </p>
              </motion.div>
            )}

            {/* Step 6: Success / Download */}
            {step === 'done' && result && (
              <motion.div 
                key="step-done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl mx-auto text-center"
              >
                <div className="mb-8 w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  <LucideIcons.CheckCircle2 size={56} />
                </div>
                <h2 className="text-4xl font-extrabold mb-2">Process Complete!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10">
                  Your document is ready for download.
                </p>

                <div className="glass border border-slate-200 dark:border-slate-800 rounded-3xl p-8 mb-8">
                  <div className="flex items-center space-x-4 mb-6 text-left">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                      <LucideIcons.FileText size={32} />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-xl font-bold truncate max-w-[250px]">{result.name}</h4>
                      <p className="text-slate-500 dark:text-slate-400">{(result.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>

                  <button 
                    onClick={downloadResult}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl text-xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-3 mb-4"
                  >
                    <LucideIcons.Download size={24} />
                    <span>Download Now</span>
                  </button>

                  <button 
                    onClick={() => {
                      setStep('category');
                      setFiles([]);
                      setResult(null);
                      setCustomName('');
                    }}
                    className="w-full py-4 glass border border-slate-200 dark:border-slate-800 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                  >
                    Process Another File
                  </button>
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
