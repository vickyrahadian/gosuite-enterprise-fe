import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Download,
} from 'lucide-react';
import DashboardCard from './DashboardCard';
import ChartPlaceholder from './ChartPlaceholder';
import RecentActivityTable from './RecentActivityTable';
import { statsData } from '../data/mockData';

const iconMap = {
  1: Users,
  2: DollarSign,
  3: ShoppingCart,
  4: TrendingUp,
};

const quickActions = [
  { label: 'Create', icon: Plus, variant: 'btn-primary' },
  { label: 'Edit', icon: Edit, variant: 'btn-secondary' },
  { label: 'Delete', icon: Trash2, variant: 'btn-danger' },
  { label: 'Export', icon: Download, variant: 'btn-secondary' },
];

const Dashboard = () => {
  const [loading, setLoading] = useState(true);

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="p-4 md:p-6 max-w-screen-2xl mx-auto space-y-6">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, Admin. Here's what's happening.</p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map(({ label, icon: Icon, variant }) => (
            <button key={label} className={variant} aria-label={label}>
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <section aria-label="Key metrics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsData.map((stat) => (
            <DashboardCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              positive={stat.positive}
              color={stat.color}
              icon={iconMap[stat.id]}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* Chart + Mini Stats row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart takes 2/3 */}
        <div className="lg:col-span-2">
          <ChartPlaceholder />
        </div>

        {/* Mini stats panel */}
        <div className="bg-white  shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-gray-900">Performance</h3>

          {[
            { label: 'Conversion Rate', value: '3.24%', progress: 32 },
            { label: 'Avg. Order Value', value: '$124.50', progress: 62 },
            { label: 'Customer Satisfaction', value: '94.2%', progress: 94 },
            { label: 'Retention Rate', value: '78.5%', progress: 78 },
          ].map(({ label, value, progress }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
              <div className="h-1.5 bg-gray-100  overflow-hidden">
                <div
                  className="h-full bg-indigo-500  transition-all duration-500"
                  style={{ width: `${progress}%` }}
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity Table */}
      <section aria-label="Recent activity">
        <RecentActivityTable />
      </section>
    </main>
  );
};

export default Dashboard;
