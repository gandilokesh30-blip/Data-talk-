import React, { useState } from 'react';
import {
  Database,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function KPICards({ kpis }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!kpis || kpis.length === 0) return null;

  const getKPIIcon = (label) => {
    const l = label.toLowerCase();
    if (l.includes('record') || l.includes('row')) {
      return <Database className="w-4 h-4 text-indigo-500" />;
    }
    if (l.includes('total') || l.includes('sum') || l.includes('revenue') || l.includes('sales')) {
      return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    }
    if (l.includes('avg') || l.includes('mean')) {
      return <BarChart2 className="w-4 h-4 text-blue-500" />;
    }
    if (l.includes('complete') || l.includes('quality')) {
      return <CheckCircle2 className="w-4 h-4 text-violet-500" />;
    }
    return <Layers className="w-4 h-4 text-indigo-500" />;
  };

  // Sleek Collapsed Strip: saves vertical space for charts
  if (isCollapsed) {
    return (
      <div className="mb-4 flex items-center justify-between px-3.5 py-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs text-xs transition-all">
        <div className="flex items-center space-x-3 overflow-x-auto py-0.5">
          <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider shrink-0">
            KPIs
          </span>
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 shrink-0"
            >
              <span className="text-slate-500 text-[11px]">{kpi.label}:</span>
              <strong className="font-bold text-slate-800 text-[11px]">{kpi.value}</strong>
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsCollapsed(false)}
          className="flex items-center space-x-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors shrink-0 ml-2"
          title="Expand KPI Cards"
        >
          <span>Expand</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Expanded Sleek Linear/Hex-style KPI Cards
  return (
    <div className="mb-5 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Executive Summary Metrics
        </span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="flex items-center space-x-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
          title="Collapse KPI Cards to maximize chart view"
        >
          <span>Collapse</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 truncate pr-2">
                {kpi.label}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                {getKPIIcon(kpi.label)}
              </div>
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-800 tracking-tight">
                {kpi.value}
              </div>
              {kpi.description && (
                <p className="text-[11px] text-slate-400 mt-0.5 truncate" title={kpi.description}>
                  {kpi.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
