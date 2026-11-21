import React, { useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

export default function PlotComponent({ chartJson, height = '400px', className = '' }) {
  const parsed = useMemo(() => {
    if (!chartJson) return null;
    try {
      if (typeof chartJson === 'string') {
        return JSON.parse(chartJson);
      }
      return chartJson;
    } catch (err) {
      console.error('Failed to parse chart JSON:', err);
      return null;
    }
  }, [chartJson]);

  if (!parsed || !parsed.data) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-100 rounded-lg text-slate-400 text-sm italic">
        Unable to display visualization
      </div>
    );
  }

  // Ensure layout is clean, responsive, and styled nicely with modern fonts
  const safeLayout = {
    autosize: true,
    font: {
      family: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#334155',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { l: 50, r: 30, t: 50, b: 50, pad: 4 },
    ...parsed.layout,
  };

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <Plot
        data={parsed.data}
        layout={safeLayout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        }}
        style={{ width: '100%', height: height }}
        useResizeHandler
      />
    </div>
  );
}

