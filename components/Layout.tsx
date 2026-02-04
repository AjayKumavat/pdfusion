
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, darkMode, onToggleTheme }) => (
  <div className="min-h-screen flex flex-col pt-16 theme-transition">
    {/* Header */}
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 theme-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          className="flex items-center space-x-2.5 cursor-pointer group" 
          onClick={() => window.location.reload()}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <LucideIcons.FileText className="text-white" size={24} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors">
            OmniPDF
          </span>
        </div>
        
        <button 
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 flex items-center shadow-sm"
        >
          {darkMode ? (
            <><LucideIcons.Sun size={18} className="mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">Light</span></>
          ) : (
            <><LucideIcons.Moon size={18} className="mr-2" /> <span className="text-xs font-bold uppercase tracking-wider">Dark</span></>
          )}
        </button>
      </div>
    </header>

    <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-6xl w-full">
        {children}
      </div>
    </main>

    {/* Footer */}
    <footer className="py-12 border-t border-slate-200 dark:border-slate-800 theme-transition text-center text-slate-500 dark:text-slate-400 text-sm">
      <div className="flex flex-col items-center space-y-4">
        <p className="flex items-center space-x-2">
          <span>Made with</span>
          <LucideIcons.Heart size={18} className="text-red-500 fill-red-500" />
          <span>by</span>
          <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Ajay Kumawat</span>
          <span>using Gemini</span>
        </p>
        <div className="flex items-center space-x-6 opacity-60 font-medium">
          <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">API</a>
        </div>
        <p className="opacity-40">© {new Date().getFullYear()} OmniPDF. Professional Toolkit.</p>
      </div>
    </footer>
  </div>
);
