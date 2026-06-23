export type RecordStatus = 'active' | 'pending' | 'completed' | 'cancelled'
export type RecordCategory = 'electronics' | 'clothing' | 'food' | 'services' | 'software'

export interface KPIMetric {
  id: string
  label: string
  value: string
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface AnalyticsRecord {
  id: string
  name: string
  status: RecordStatus
  category: RecordCategory
  date: string
  revenue: number
}

export const kpiMetrics: KPIMetric[] = [
  { id: 'revenue', label: 'Total Revenue', value: '$284,520', change: 12.5, trend: 'up' },
  { id: 'users', label: 'Active Users', value: '18,432', change: 8.2, trend: 'up' },
  { id: 'conversion', label: 'Conversion Rate', value: '3.24%', change: -0.4, trend: 'down' },
  { id: 'orders', label: 'Total Orders', value: '4,891', change: 5.1, trend: 'up' },
]

export const analyticsRecords: AnalyticsRecord[] = [
  { id: '1', name: 'Premium Headphones', status: 'completed', category: 'electronics', date: '2026-06-01', revenue: 14999 },
  { id: '2', name: 'Summer Collection Bundle', status: 'active', category: 'clothing', date: '2026-06-02', revenue: 8750 },
  { id: '3', name: 'Organic Meal Plan', status: 'pending', category: 'food', date: '2026-06-03', revenue: 3200 },
  { id: '4', name: 'Cloud Hosting Pro', status: 'active', category: 'services', date: '2026-06-04', revenue: 12400 },
  { id: '5', name: 'Design Suite License', status: 'completed', category: 'software', date: '2026-06-05', revenue: 9800 },
  { id: '6', name: 'Wireless Earbuds', status: 'cancelled', category: 'electronics', date: '2026-06-06', revenue: 0 },
  { id: '7', name: 'Winter Jacket', status: 'completed', category: 'clothing', date: '2026-06-07', revenue: 4500 },
  { id: '8', name: 'Gourmet Coffee Box', status: 'active', category: 'food', date: '2026-06-08', revenue: 2100 },
  { id: '9', name: 'Consulting Package', status: 'pending', category: 'services', date: '2026-06-09', revenue: 15000 },
  { id: '10', name: 'Analytics Plugin', status: 'completed', category: 'software', date: '2026-06-10', revenue: 6700 },
]

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export interface RevenueTrendPoint {
  month: string
  revenue: number
}

export interface UserGrowthPoint {
  week: string
  newUsers: number
  returningUsers: number
}

export interface TrafficSourcePoint {
  source: string
  percentage: number
  color: string
}

export const revenueTrendData: RevenueTrendPoint[] = [
  { month: 'Jul', revenue: 18200 },
  { month: 'Aug', revenue: 21500 },
  { month: 'Sep', revenue: 19800 },
  { month: 'Oct', revenue: 24100 },
  { month: 'Nov', revenue: 27300 },
  { month: 'Dec', revenue: 31200 },
  { month: 'Jan', revenue: 22800 },
  { month: 'Feb', revenue: 25600 },
  { month: 'Mar', revenue: 28900 },
  { month: 'Apr', revenue: 26400 },
  { month: 'May', revenue: 30100 },
  { month: 'Jun', revenue: 33400 },
]

export const userGrowthData: UserGrowthPoint[] = [
  { week: 'W1', newUsers: 420, returningUsers: 1180 },
  { week: 'W2', newUsers: 510, returningUsers: 1240 },
  { week: 'W3', newUsers: 380, returningUsers: 1310 },
  { week: 'W4', newUsers: 620, returningUsers: 1380 },
  { week: 'W5', newUsers: 540, returningUsers: 1420 },
  { week: 'W6', newUsers: 710, returningUsers: 1510 },
]

export const trafficSourcesData: TrafficSourcePoint[] = [
  { source: 'Organic Search', percentage: 38, color: 'bg-indigo-500' },
  { source: 'Direct', percentage: 24, color: 'bg-emerald-500' },
  { source: 'Social Media', percentage: 18, color: 'bg-amber-500' },
  { source: 'Referral', percentage: 12, color: 'bg-rose-500' },
  { source: 'Email', percentage: 8, color: 'bg-cyan-500' },
]

export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'food', label: 'Food' },
  { value: 'services', label: 'Services' },
  { value: 'software', label: 'Software' },
]
