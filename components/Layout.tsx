
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, darkMode, onToggleTheme }) => (
  <div className="min-h-screen flex flex-col pt-16 transition-colors duration-300">
    {/* Header - Increased z-index to 100 to stay above dragged items */}
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="w-10 sm:hidden"></div>

        <div 
          className="flex items-center space-x-2 cursor-pointer group" 
          onClick={() => window.location.reload()}
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <LucideIcons.FileText className="text-white" size={18} />
          </div>
          <div className="flex items-center space-x-1 font-black text-lg sm:text-xl tracking-tighter text-slate-900 dark:text-white transition-colors uppercase">
            <span>I</span>
            <LucideIcons.Heart size={18} className="text-red-500 fill-red-500 animate-pulse" />
            <span>PDF</span>
          </div>
        </div>
        
        <button 
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <LucideIcons.Sun size={20} className="text-amber-400" />
          ) : (
            <LucideIcons.Moon size={20} />
          )}
        </button>
      </div>
    </header>

    <main className="flex-grow flex flex-col items-center px-4 py-4 sm:py-12">
      <div className="max-w-6xl w-full flex flex-col h-full">
        {children}
      </div>
    </main>

    {/* Footer */}
    <footer className="py-6 sm:py-12 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300 text-center text-slate-500 dark:text-slate-400 text-[10px] sm:text-sm">
      <div className="flex flex-col items-center space-y-2 sm:space-y-4">
        <p className="flex items-center space-x-1.5 flex-wrap justify-center">
          <span>Made with</span>
          <LucideIcons.Heart size={14} className="text-red-500 fill-red-500" />
          <span>by</span>
          <span className="font-black text-indigo-600 dark:text-indigo-400">Ajay Kumawat</span>
          <span>using Gemini</span>
        </p>
        <p className="opacity-40 tracking-tight flex items-center justify-center space-x-1 font-medium">
          <span>© {new Date().getFullYear()} I</span>
          <LucideIcons.Heart size={10} className="text-red-500 fill-red-500" />
          <span>PDF. Professional Toolkit.</span>
        </p>
      </div>
    </footer>
  </div>
);
