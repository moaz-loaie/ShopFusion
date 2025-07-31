import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/Dashboard/StatCard';
import { DashboardChart } from '../../components/Dashboard/DashboardChart';
import { api } from '../../services/api';
import {
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, revenueResponse] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/dashboard/revenue')
        ]);

        setStats(statsResponse.data.data);
        setRevenueData(revenueResponse.data.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sellers"
          value={stats.sellers.total}
          icon={<UsersIcon className="w-6 h-6" />}
          trend={stats.sellers.new > 0 ? 'up' : 'neutral'}
          trendValue={`+${stats.sellers.new}`}
          trendLabel="new this month"
          color="primary"
        />

        <StatCard
          title="Active Products"
          value={stats.products.approved || 0}
          icon={<ShoppingBagIcon className="w-6 h-6" />}
          trend={stats.products.pending > 0 ? 'up' : 'neutral'}
          trendValue={`${stats.products.pending}`}
          trendLabel="pending approval"
          color="success"
        />

        <StatCard
          title="Monthly Revenue"
          value={`$${stats.orders.totalAmount?.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          trend={stats.orders.byStatus?.completed > 0 ? 'up' : 'neutral'}
          trendValue={`${stats.orders.byStatus?.completed || 0}`}
          trendLabel="completed orders"
          color="info"
        />

        <StatCard
          title="Open Disputes"
          value={stats.disputes.total || 0}
          icon={<ExclamationCircleIcon className="w-6 h-6" />}
          trend={stats.disputes.byStatus?.open > 0 ? 'up' : 'neutral'}
          trendValue={`${stats.disputes.byStatus?.open || 0}`}
          trendLabel="need attention"
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart
          type="line"
          data={revenueData}
          xKey="date"
          yKey="revenue"
          secondaryYKey="orders"
          title="Revenue & Orders"
          subtitle="Last 30 days"
          height={300}
        />

        <DashboardChart
          type="bar"
          data={[
            { status: 'Active', count: stats.sellers.active },
            { status: 'Inactive', count: stats.sellers.total - stats.sellers.active },
            { status: 'New', count: stats.sellers.new }
          ]}
          xKey="status"
          yKey="count"
          title="Seller Distribution"
          subtitle="Active vs Inactive sellers"
          height={300}
          color="#8B5CF6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Product Status</h3>
          <div className="space-y-4">
            {Object.entries(stats.products).map(([status, count]) => (
              status !== 'total' && (
                <div key={status} className="flex items-center justify-between">
                  <span className="capitalize">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              )
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Dispute Overview</h3>
          <div className="space-y-4">
            {Object.entries(stats.disputes.byStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize">{status.replace('_', ' ')}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
