import React from 'react';
import { BarChart2, TrendingUp } from 'lucide-react';
import { chartData } from '../data/mockData';

const maxRevenue = Math.max(...chartData.map((d) => d.revenue));

const ChartPlaceholder = () => {
  return (
    <div className="bg-white  shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Revenue Overview</h3>
          <p className="text-sm text-gray-500 mt-0.5">Monthly revenue for 2026</p>
        </div>
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <TrendingUp size={16} />
          <span>+18.7%</span>
        </div>
      </div>

      {/* Bar chart (SVG-based, no library needed) */}
      <div className="relative">
        <div className="flex items-end gap-2 h-40" role="img" aria-label="Revenue bar chart">
          {chartData.map((item) => {
            const heightPct = (item.revenue / maxRevenue) * 100;
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-1 group">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-8 bg-gray-800 text-white text-xs px-2 py-1  pointer-events-none whitespace-nowrap">
                  ${item.revenue.toLocaleString()}
                </div>
                {/* Bar */}
                <div className="w-full relative flex items-end" style={{ height: '160px' }}>
                  <div
                    className="w-full bg-indigo-100 group-hover:bg-indigo-500 -t-sm transition-colors duration-200"
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                {/* Label */}
                <span className="text-[10px] text-gray-400">{item.month}</span>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-40 flex flex-col justify-between pointer-events-none -translate-x-10">
          <span className="text-[10px] text-gray-400">${(maxRevenue / 1000).toFixed(0)}k</span>
          <span className="text-[10px] text-gray-400">${(maxRevenue / 2000).toFixed(0)}k</span>
          <span className="text-[10px] text-gray-400">$0</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 -sm bg-indigo-500" />
          <span className="text-xs text-gray-500">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart2 size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Total: $84,320</span>
        </div>
      </div>
    </div>
  );
};

export default ChartPlaceholder;
