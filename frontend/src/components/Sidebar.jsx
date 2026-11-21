import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Table2,
  Sparkles,
  Search,
  LayoutGrid,
  TrendingUp,
  FileText,
  BarChart2,
} from 'lucide-react';

export default function Sidebar({ dataset, onSelectQuestion, isAnalyzing }) {
  const [colSearch, setColSearch] = useState('');

  const suggestedQuestions = [
    'Make a full dashboard of key trends',
    'Show summary statistics',
    'Plot distribution of numeric columns',
    'Show top 5 records',
  ];

  if (!dataset) {
    return (
      <aside className="w-72 bg-[#0F172A] border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 text-slate-300">
        <div className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 text-center">
            <FileSpreadsheet className="w-9 h-9 text-indigo-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-xs font-semibold text-slate-200">No Dataset Uploaded</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Upload a .csv or .xlsx file to inspect columns, detect data types, and start AI data analysis.
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Supported Formats
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/60 font-mono text-center text-slate-300">
                .csv
              </div>
              <div className="p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/60 font-mono text-center text-slate-300">
                .xlsx / .xls
              </div>
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/70 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-[11px]">Gemini Flash AI</span>
          </div>
          <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online</span>
          </span>
        </div>
      </aside>
    );
  }

  const { filename, profile } = dataset;
  const { total_rows, total_columns, column_names = [], data_types = {}, missing_values = {} } = profile || {};

  const filteredColumns = column_names.filter((c) =>
    c.toLowerCase().includes(colSearch.toLowerCase())
  );

  const getDtypeBadge = (dtype) => {
    const d = (dtype || '').toLowerCase();
    if (d.includes('int') || d.includes('float') || d.includes('number')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
          num
        </span>
      );
    }
    if (d.includes('date') || d.includes('time')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950/80 text-amber-300 border border-amber-800/60">
          date
        </span>
      );
    }
    if (d.includes('bool')) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60">
          bool
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
        str
      </span>
    );
  };

  return (
    <aside className="w-72 bg-[#0F172A] border-r border-slate-800 p-4 flex flex-col h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden text-slate-200">
      
      {/* File Overview Card */}
      <div className="mb-4 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-400 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-xs font-bold text-slate-100 truncate" title={filename}>
              {filename}
            </h2>
            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
              <span>{total_rows?.toLocaleString()} rows</span>
              <span>•</span>
              <span>{total_columns} cols</span>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Questions Chips */}
      <div className="mb-4 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Suggested Prompts
          </span>
          <Sparkles className="w-3 h-3 text-indigo-400" />
        </div>
        <div className="flex flex-col gap-1.5">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuestion(q)}
              disabled={isAnalyzing}
              className="text-left px-2.5 py-1.5 text-[11px] font-medium bg-slate-800/60 hover:bg-indigo-950/70 hover:border-indigo-600/60 hover:text-indigo-200 text-slate-300 rounded-lg border border-slate-700/60 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed group flex items-center space-x-1.5"
            >
              <span className="text-indigo-400">⚡</span>
              <span className="truncate">{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Columns Header & Search */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Columns ({column_names.length})
        </span>
      </div>

      {column_names.length > 5 && (
        <div className="relative mb-2">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search columns..."
            value={colSearch}
            onChange={(e) => setColSearch(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-slate-900/90 text-slate-200 placeholder-slate-500 rounded-md border border-slate-700/80 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      )}

      {/* Scrollable Column List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {filteredColumns.map((colName) => {
          const dtype = data_types[colName];
          const missing = missing_values[colName] || 0;
          return (
            <div
              key={colName}
              className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-800/40 hover:bg-slate-800 border border-slate-800/90 text-[11px] transition-colors"
            >
              <div className="flex items-center space-x-1.5 truncate pr-2">
                <span className="font-mono text-slate-300 truncate" title={colName}>
                  {colName}
                </span>
                {missing > 0 && (
                  <span
                    className="text-[9px] text-amber-400 bg-amber-950/80 px-1 rounded border border-amber-800/60"
                    title={`${missing} missing values`}
                  >
                    !{missing}
                  </span>
                )}
              </div>
              <div className="shrink-0">{getDtypeBadge(dtype)}</div>
            </div>
          );
        })}
        {filteredColumns.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-3">No matching columns</p>
        )}
      </div>

      {/* Bottom Footer Badge */}
      <div className="pt-3 mt-auto border-t border-slate-800/80">
        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Engine</span>
          <span className="font-semibold text-indigo-300 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Gemini Flash AI</span>
          </span>
        </div>
      </div>

    </aside>
  );
}
