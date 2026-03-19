// Mock data for the admin panel dashboard

export const statsData = [
  {
    id: 1,
    title: 'Total Users',
    value: '24,521',
    change: '+12.5%',
    positive: true,
    color: 'indigo',
  },
  {
    id: 2,
    title: 'Revenue',
    value: '$84,320',
    change: '+8.2%',
    positive: true,
    color: 'green',
  },
  {
    id: 3,
    title: 'Orders',
    value: '3,847',
    change: '-2.4%',
    positive: false,
    color: 'amber',
  },
  {
    id: 4,
    title: 'Growth Rate',
    value: '18.7%',
    change: '+4.1%',
    positive: true,
    color: 'blue',
  },
];

export const recentActivityData = [
  {
    id: '#10041',
    user: 'Alice Johnson',
    email: 'alice@example.com',
    action: 'Created Account',
    status: 'Active',
    date: '2026-03-18',
  },
  {
    id: '#10042',
    user: 'Bob Smith',
    email: 'bob@example.com',
    action: 'Placed Order',
    status: 'Pending',
    date: '2026-03-18',
  },
  {
    id: '#10043',
    user: 'Carol White',
    email: 'carol@example.com',
    action: 'Updated Profile',
    status: 'Active',
    date: '2026-03-17',
  },
  {
    id: '#10044',
    user: 'David Lee',
    email: 'david@example.com',
    action: 'Cancelled Order',
    status: 'Inactive',
    date: '2026-03-17',
  },
  {
    id: '#10045',
    user: 'Emma Davis',
    email: 'emma@example.com',
    action: 'Placed Order',
    status: 'Active',
    date: '2026-03-16',
  },
  {
    id: '#10046',
    user: 'Frank Miller',
    email: 'frank@example.com',
    action: 'Submitted Review',
    status: 'Pending',
    date: '2026-03-16',
  },
];

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'users', label: 'Users', icon: 'Users' },
  { id: 'products', label: 'Products', icon: 'Box' },
  { id: 'orders', label: 'Orders', icon: 'ShoppingCart' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart2' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

export const chartData = [
  { month: 'Jan', revenue: 4000 },
  { month: 'Feb', revenue: 5200 },
  { month: 'Mar', revenue: 4800 },
  { month: 'Apr', revenue: 6100 },
  { month: 'May', revenue: 5500 },
  { month: 'Jun', revenue: 7200 },
  { month: 'Jul', revenue: 6800 },
  { month: 'Aug', revenue: 8100 },
  { month: 'Sep', revenue: 7500 },
  { month: 'Oct', revenue: 9200 },
  { month: 'Nov', revenue: 8700 },
  { month: 'Dec', revenue: 10400 },
];
