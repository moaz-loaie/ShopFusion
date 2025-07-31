import React, { useState, useEffect } from 'react';
import { StatCard } from '../../components/Dashboard/StatCard';
import { DashboardChart } from '../../components/Dashboard/DashboardChart';
import { api } from '../../services/api';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export const SellerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, salesResponse] = await Promise.all([
          api.get('/seller/dashboard'),
          api.get('/seller/dashboard/sales')
        ]);

        setStats(statsResponse.data.data);
        setSalesData(salesResponse.data.data);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Store Dashboard</h1>
        <button
          onClick={() => window.location.href = '/seller/products/new'}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.products.total}
          icon={<ShoppingBagIcon className="w-6 h-6" />}
          trend={stats.products.pending > 0 ? 'up' : 'neutral'}
          trendValue={`${stats.products.pending}`}
          trendLabel="awaiting approval"
          color="primary"
        />

        <StatCard
          title="Monthly Revenue"
          value={`$${stats.revenue.monthly?.toLocaleString()}`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          trend={stats.revenue.trend > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(stats.revenue.trend)}%`}
          trendLabel="vs last month"
          color="success"
        />

        <StatCard
          title="Orders"
          value={stats.orders.total}
          icon={<ChartBarIcon className="w-6 h-6" />}
          trend={stats.orders.pending > 0 ? 'up' : 'neutral'}
          trendValue={`${stats.orders.pending}`}
          trendLabel="need attention"
          color="info"
        />

        <StatCard
          title="Product Issues"
          value={stats.issues.total || 0}
          icon={<ExclamationCircleIcon className="w-6 h-6" />}
          trend={stats.issues.new > 0 ? 'up' : 'neutral'}
          trendValue={`${stats.issues.new}`}
          trendLabel="new issues"
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart
          type="line"
          data={salesData}
          xKey="date"
          yKey="revenue"
          secondaryYKey="orders"
          title="Sales Performance"
          subtitle="Last 30 days"
          height={300}
        />

        <DashboardChart
          type="bar"
          data={[
            { status: 'Approved', count: stats.products.approved },
            { status: 'Pending', count: stats.products.pending },
            { status: 'Rejected', count: stats.products.rejected }
          ].filter(item => item.count > 0)}
          xKey="status"
          yKey="count"
          title="Product Status"
          subtitle="Distribution by approval status"
          height={300}
          color="#8B5CF6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {stats.recentOrders?.map(order => (
              <div key={order.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order #{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium">${order.total.toLocaleString()}</p>
                  <p className="text-sm text-gray-500 capitalize">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Low Stock Products</h3>
          <div className="space-y-4">
            {stats.lowStock?.map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                </div>
                <div>
                  <p className="font-medium">{product.stockQuantity} left</p>
                  <p className="text-sm text-red-500">Below threshold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
