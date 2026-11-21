import React from 'react';
import {
  Printer,
  Trash2,
  BarChart3,
  Sparkles,
  ArrowLeft,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import KPICards from './KPICards';
import PlotComponent from './PlotComponent';

export default function CustomDashboard({
  dataset,
  pinnedCharts,
  onRemoveChart,
  onGoToChat,
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-5 sm:p-6 lg:p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Dashboard Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Saved Insights Dashboard
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dataset?.filename ? (
                    <span>
                      Dataset: <strong className="text-slate-700">{dataset.filename}</strong> • {pinnedCharts.length} pinned visualization{pinnedCharts.length === 1 ? '' : 's'}
                    </span>
                  ) : (
                    'Dynamic KPI cards & executive visual reports'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="no-print flex items-center space-x-3">
            <button
              onClick={handlePrint}
              disabled={pinnedCharts.length === 0 && (!dataset?.kpis || dataset.kpis.length === 0)}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs hover:border-slate-300 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / Export Dashboard</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards (Collapsible) */}
        {dataset?.kpis && dataset.kpis.length > 0 && (
          <KPICards kpis={dataset.kpis} />
        )}

        {/* Empty State */}
        {pinnedCharts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-10 text-center shadow-xs">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-3.5">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Visualizations Pinned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Ask analytical questions or say <strong>"Make a dashboard"</strong> in the Chat & Analysis tab. Then click <strong>"Pin"</strong> or <strong>"Save All to Dashboard"</strong> to build your executive report!
            </p>
            <div className="mt-5">
              <button
                onClick={onGoToChat}
                className="no-print inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go to Chat & Analysis</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pinned Visualizations ({pinnedCharts.length})
              </h2>
            </div>

            {/* Responsive 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print:grid-cols-2">
              {pinnedCharts.map((chart) => (
                <div
                  key={chart.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                          {chart.query || 'Custom Visualization'}
                        </h3>
                        {chart.timestamp && (
                          <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{chart.timestamp}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onRemoveChart(chart.id)}
                        className="no-print p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        title="Remove from dashboard"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Plotly Chart Card Body */}
                    <div className="py-2">
                      <PlotComponent chartJson={chart.chart_json} height="320px" />
                    </div>
                  </div>

                  {/* Text summary snippet */}
                  {chart.answer && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-700">Summary: </span>
                      {chart.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
