import React, { useRef } from 'react';
import { Sparkles, UploadCloud, MessageSquare, LayoutDashboard, Loader2, Database } from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  onFileUpload,
  isUploading,
  pinnedCount = 0,
  datasetName,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  return (
    <header className="no-print bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              DataTalk AI
            </span>
            <span className="hidden sm:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>FastAPI</span>
            </span>
          </div>
        </div>

        {/* Center View Toggle Switch */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs">
          <button
            onClick={() => setCurrentView('chat')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
              currentView === 'chat'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Analysis</span>
          </button>
          
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
              currentView === 'dashboard'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Saved Dashboard</span>
            {pinnedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
                {pinnedCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Action: Upload Button */}
        <div className="flex items-center space-x-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, .xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Parsing Data...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5 text-slate-300" />
                <span>Upload CSV / Excel</span>
              </>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
