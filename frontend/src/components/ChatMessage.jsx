import React, { useState } from 'react';
import {
  User,
  Bot,
  Code2,
  ChevronDown,
  ChevronRight,
  Pin,
  Check,
  Copy,
  BarChart3,
  LayoutGrid,
  BookmarkCheck,
  Download,
  FileBarChart2,
  Printer,
} from 'lucide-react';
import PlotComponent from './PlotComponent';

export default function ChatMessage({
  message,
  onPinChart,
  onPinAllCharts,
  pinnedIds = new Set(),
}) {
  const { role, content, charts, chart_json, report_title, generated_code, timestamp } = message;
  const isUser = role === 'user';
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Normalize charts array
  const chartList = React.useMemo(() => {
    if (Array.isArray(charts) && charts.length > 0) {
      return charts;
    }
    if (chart_json) {
      return [chart_json];
    }
    return [];
  }, [charts, chart_json]);

  const handleCopyCode = () => {
    if (!generated_code) return;
    navigator.clipboard.writeText(generated_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReport = () => {
    window.print();
  };

  const getChartId = (index) => `${message.id}-chart-${index}`;

  if (isUser) {
    return (
      <div className="flex justify-end mb-5">
        <div className="flex items-start max-w-2xl space-x-2.5 flex-row-reverse space-x-reverse">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="bg-indigo-600 text-white px-3.5 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-sm font-medium leading-relaxed">
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  const is2x2Report = chartList.length >= 4 || (report_title && chartList.length > 1);
  const allPinned = chartList.length > 0 && chartList.every((_, idx) => pinnedIds.has(getChartId(idx)));

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start max-w-4xl space-x-3 w-full">
        {/* Assistant Avatar */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <Bot className="w-4 h-4" />
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-xs w-full overflow-hidden space-y-4">
          
          {/* Text Answer (General response or executive summary) */}
          <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {content}
          </div>

          {/* DYNAMIC 2x2 STATISTICAL REPORT GRID MODE */}
          {is2x2Report ? (
            <div className="border border-slate-200/90 rounded-2xl p-4 sm:p-5 bg-white shadow-xs space-y-4">
              
              {/* Report Header: Centered Bold Dynamic Title & Action Controls */}
              <div className="border-b border-slate-200/80 pb-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-indigo-600 mb-0.5">
                    <FileBarChart2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      Statistical Analysis Report
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {report_title || 'Executive 2x2 Statistical Performance Report'}
                  </h3>
                </div>

                {/* Report Action Buttons */}
                <div className="no-print flex items-center space-x-2 shrink-0">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors"
                    title="Export / Print Full Statistical Report as PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download Full Report</span>
                  </button>

                  <button
                    onClick={() => onPinAllCharts(message, chartList)}
                    disabled={allPinned}
                    className={`flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      allPinned
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                    title="Pin all 4 charts to custom dashboard"
                  >
                    {allPinned ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>All Saved</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5" />
                        <span>Save All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 2x2 Grid of Diverse Publication-Grade Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chartList.slice(0, 4).map((chartItem, idx) => {
                  const chartId = getChartId(idx);
                  const isPinned = pinnedIds.has(chartId);
                  return (
                    <div
                      key={chartId}
                      className="border border-slate-200/90 rounded-xl p-3 bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                        <span className="text-[11px] font-bold text-slate-600">
                          {idx === 0
                            ? '1. Primary Trend / Distribution'
                            : idx === 1
                            ? '2. Secondary Trend / Correlation'
                            : idx === 2
                            ? '3. Categorical Comparison'
                            : '4. Proportional Composition'}
                        </span>

                        <button
                          onClick={() =>
                            onPinChart({
                              id: chartId,
                              query: `${report_title || 'Statistical Report'} - View ${idx + 1}`,
                              answer: content,
                              chart_json: chartItem,
                              timestamp: timestamp,
                            })
                          }
                          className={`flex items-center space-x-1 px-2 py-0.5 text-[10px] font-medium rounded-md transition-colors ${
                            isPinned
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200'
                          }`}
                        >
                          <Pin className={`w-3 h-3 ${isPinned ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                          <span>{isPinned ? 'Pinned' : 'Pin'}</span>
                        </button>
                      </div>

                      <PlotComponent chartJson={chartItem} height="290px" />
                    </div>
                  );
                })}
              </div>

            </div>
          ) : chartList.length === 1 ? (
            /* SINGLE-CHART CARD MODE */
            <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-2xs">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>Interactive Visualization</span>
                </div>
                <button
                  onClick={() => {
                    const chartId = getChartId(0);
                    onPinChart({
                      id: chartId,
                      query: message.query || 'Data Analysis',
                      answer: content,
                      chart_json: chartList[0],
                      timestamp: timestamp,
                    });
                  }}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                    pinnedIds.has(getChartId(0))
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-2xs'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${pinnedIds.has(getChartId(0)) ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                  <span>{pinnedIds.has(getChartId(0)) ? 'Pinned to Dashboard' : 'Pin to Dashboard'}</span>
                </button>
              </div>

              <PlotComponent chartJson={chartList[0]} height="380px" />
            </div>
          ) : null}

          {/* Expandable Python Code View (only shown if code was generated) */}
          {generated_code && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <button
                onClick={() => setShowCode(!showCode)}
                className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/70 text-slate-700 font-mono transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-[11px]">Generated Python Code</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-400">
                  <span className="text-[10px] font-sans">{showCode ? 'Hide' : 'View Code'}</span>
                  {showCode ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showCode && (
                <div className="relative bg-slate-900 text-slate-100 p-3.5 font-mono overflow-x-auto">
                  <button
                    onClick={handleCopyCode}
                    className="absolute top-2.5 right-2.5 flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <pre className="text-[11px] leading-relaxed pt-1.5">{generated_code}</pre>
                </div>
              )}
            </div>
          )}

          {/* Timestamp footer */}
          {timestamp && (
            <div className="text-[10px] text-slate-400 text-right">
              {timestamp}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
