import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Loader2,
  Bot,
  AlertTriangle,
  Plus,
  Paperclip,
  FileSpreadsheet,
  X,
  FileText,
  BarChart2,
  BrainCircuit,
} from 'lucide-react';
import KPICards from './KPICards';
import ChatMessage from './ChatMessage';

const LOADING_STEPS = [
  'Analyzing query intent & dataset schema...',
  'Generating Python Pandas & Plotly Express code...',
  'Executing sandbox & calculating statistics...',
  'Assembling publication-grade visualizations...',
];

export default function ChatView({
  dataset,
  onClearDataset,
  onFileUpload,
  isUploading,
  messages,
  onSendMessage,
  isLoading,
  pinnedCharts,
  onPinChart,
  onPinAllCharts,
  error,
}) {
  const [query, setQuery] = useState('');
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cycle through step-by-step loading messages
  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, loadingStepIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSendMessage(query.trim());
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const pinnedIds = new Set(pinnedCharts.map((p) => p.id));

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#F8FAFC] overflow-hidden relative">
      
      {/* Hidden File Input for in-input file attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />

      {/* Scrollable Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 custom-scrollbar">
        <div className="max-w-4xl mx-auto">

          {/* Sleeker, Collapsible Top KPI Bar (only visible when a dataset is loaded) */}
          {dataset?.kpis && dataset.kpis.length > 0 && (
            <KPICards kpis={dataset.kpis} />
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50/90 border border-red-200 rounded-xl flex items-start space-x-2.5 text-red-800 text-xs shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Error</p>
                <p className="text-red-700 mt-0.5 whitespace-pre-wrap">{error}</p>
              </div>
            </div>
          )}

          {/* Welcome Screen (Immediate access before or after file upload) */}
          {messages.length === 0 && (
            <div className="my-8 text-center py-10 px-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-3.5">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {dataset ? `Analyzing ${dataset.filename}` : 'Welcome to DataTalk AI'}
              </h2>
              <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
                {dataset
                  ? 'Your spreadsheet is loaded and cleaned. Ask specific questions, plot metrics, or say "Make a dashboard" to generate a 4-chart executive statistical report.'
                  : 'Your versatile AI assistant for general chat, coding, and conceptual problem-solving—which seamlessly adapts into an expert Data Analyst whenever a dataset is attached.'}
              </p>

              {/* Quick Starter Chips */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-2xl mx-auto text-left">
                {dataset ? (
                  <>
                    <button
                      onClick={() => onSendMessage('Make a full dashboard of key trends')}
                      className="p-3 bg-indigo-50/80 hover:bg-indigo-100/90 rounded-xl border border-indigo-200/80 text-left transition-all group"
                    >
                      <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-xs mb-1">
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>Executive Dashboard</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Generate a 4-chart 2x2 statistical report with publication styling.
                      </p>
                    </button>

                    <button
                      onClick={() => onSendMessage('Show summary statistics and numeric distributions')}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-left transition-all"
                    >
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs mb-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Summary Metrics</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Inspect mean, quartiles, and key distributions across features.
                      </p>
                    </button>

                    <button
                      onClick={() => onSendMessage('What are the top 5 records by highest values?')}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-left transition-all"
                    >
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Key Anomalies & Insights</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Extract top performers, unusual spikes, or correlation patterns.
                      </p>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onSendMessage('Explain the difference between correlation and causation')}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-left transition-all"
                    >
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs mb-1">
                        <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Data Science Theory</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Explain correlation vs. causation with real-world examples.
                      </p>
                    </button>

                    <button
                      onClick={() => onSendMessage('How do I choose between random forest and xgboost?')}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-left transition-all"
                    >
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>ML Algorithm Selection</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Compare tree-based ensembles, hyperparams, and tradeoffs.
                      </p>
                    </button>

                    <button
                      onClick={handleAttachClick}
                      className="p-3 bg-indigo-50/70 hover:bg-indigo-100/80 rounded-xl border border-indigo-200/80 text-left transition-all"
                    >
                      <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-xs mb-1">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Upload Any Spreadsheet</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Attach a .csv or .xlsx file to unlock conversational data exploration.
                      </p>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Message Stream */}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onPinChart={onPinChart}
              onPinAllCharts={onPinAllCharts}
              pinnedIds={pinnedIds}
            />
          ))}

          {/* Step-by-Step Analytical Loading Bubble */}
          {isLoading && (
            <div className="flex items-start max-w-2xl space-x-3 mb-6">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs space-y-2">
                <div className="flex items-center space-x-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                  <span className="font-semibold text-xs text-slate-800">
                    {LOADING_STEPS[loadingStepIndex]}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Step {loadingStepIndex + 1}/{LOADING_STEPS.length}
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Input Footer with Attachment Control */}
      <div className="no-print bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3.5 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto space-y-2">

          {/* Active Dataset Pill (if loaded) */}
          {dataset && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
              <div className="flex items-center space-x-2 truncate">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="font-semibold text-indigo-900 truncate">
                  Active Dataset: {dataset.filename}
                </span>
                <span className="text-[11px] text-indigo-700">
                  ({dataset.profile?.total_rows?.toLocaleString()} rows × {dataset.profile?.total_columns} cols)
                </span>
              </div>
              <button
                onClick={onClearDataset}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-indigo-100 transition-colors"
                title="Detach dataset and return to general chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center space-x-2">
            
            {/* Inline '+' File Attachment Button */}
            <button
              type="button"
              onClick={handleAttachClick}
              disabled={isUploading}
              className="p-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all shrink-0 shadow-2xs"
              title="Attach CSV or Excel dataset"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
                <Plus className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Input Bar */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={
                  dataset
                    ? 'Ask a data question, or say "Make a dashboard" to create a 4-chart report...'
                    : 'Ask anything (like ChatGPT) or click "+" to attach a dataset...'
                }
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 pr-12 border border-slate-200/90 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
              />
              <span className="hidden sm:inline-block absolute right-3 top-2.5 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 pointer-events-none">
                Enter
              </span>
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-xs transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Send query"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>

          </form>
        </div>
      </div>

    </div>
  );
}
