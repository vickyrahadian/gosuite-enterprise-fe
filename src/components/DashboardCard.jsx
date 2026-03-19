import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    border: 'border-indigo-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-100',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'border-amber-100',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-100',
  },
};

/**
 * DashboardCard — displays a single KPI stat.
 * Props:
 *   title     {string}   Card title
 *   value     {string}   Main metric value
 *   change    {string}   Percentage change string, e.g. "+12.5%"
 *   positive  {boolean}  True = green trend, false = red trend
 *   color     {string}   One of: indigo | green | amber | blue
 *   icon      {React.ElementType}  Lucide icon component
 *   loading   {boolean}  Show skeleton loader
 */
const DashboardCard = ({ title, value, change, positive, color = 'indigo', icon: Icon, loading = false }) => {
  const colors = colorMap[color] || colorMap.indigo;

  if (loading) {
    return (
      <div className="stat-card animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200" />
          <div className="w-16 h-5 bg-gray-200" />
        </div>
        <div className="w-24 h-7 bg-gray-200 mb-1" />
        <div className="w-32 h-4 bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="stat-card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div className={`w-10 h-10 ${colors.bg} flex items-center justify-center`}>
          {Icon && <Icon size={20} className={colors.icon} />}
        </div>

        {/* Change badge */}
        <span
          className={`
            inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold
            ${positive
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-600'}
          `}
        >
          {positive
            ? <TrendingUp size={12} />
            : <TrendingDown size={12} />}
          {change}
        </span>
      </div>

      {/* Value */}
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>

      {/* Title */}
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
};

export default DashboardCard;
