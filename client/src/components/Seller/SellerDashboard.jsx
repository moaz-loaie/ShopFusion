import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import DashboardCard from '../Common/DashboardCard';
import StatsGrid from '../Common/StatsGrid';
import RevenueChart from '../Charts/RevenueChart';
import RatingDistribution from '../Charts/RatingDistribution';
import styles from './SellerDashboard.module.css';

const SellerDashboard = ({ stats, loading, error, onRefresh }) => {
  if (loading) {
    return <div className={styles.loadingState}>Loading dashboard data...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <h3>Failed to load dashboard data</h3>
        <p>{error}</p>
        <button onClick={onRefresh} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  const { products, orders, reviews, recentOrders, performance, revenueChart } = stats;

  const renderHeader = () => (
    <header className={styles.dashboardHeader}>
      <div className={styles.headerContent}>
        <h1>Seller Dashboard</h1>
        <button onClick={onRefresh} className={styles.refreshButton} title="Refresh dashboard">
          🔄 Refresh
        </button>
      </div>
      {reviews.averageRating > 0 && (
        <div className={styles.ratingBanner}>
          <span className={styles.stars}>{'★'.repeat(Math.round(reviews.averageRating))}</span>
          <span className={styles.ratingText}>
            {reviews.averageRating} average rating from {reviews.count} reviews
          </span>
        </div>
      )}
    </header>
  );

  const renderProductStats = () => (
    <section className={styles.section}>
      <h2>Product Management</h2>
      <StatsGrid>
        <DashboardCard
          title="Total Products"
          value={products.total}
          status={[
            { label: 'Approved', value: products.approved, color: 'green' },
            { label: 'Pending', value: products.pending, color: 'orange' },
            { label: 'Rejected', value: products.rejected, color: 'red' }
          ]}
          action={{
            label: '+ Add Product',
            link: '/seller/products/new'
          }}
        />

        <DashboardCard
          title="Low Stock Alert"
          value={products.lowStock}
          status={[
            { label: 'Items', color: products.lowStock > 0 ? 'red' : 'green' }
          ]}
          action={products.lowStock > 0 ? {
            label: 'Review Stock',
            link: '/seller/products?filter=low-stock'
          } : null}
        />

        {products.pending > 0 && (
          <DashboardCard
            title="Awaiting Approval"
            value={products.pending}
            status={[
              { label: 'Products', color: 'orange' }
            ]}
            action={{
              label: 'View Products',
              link: '/seller/products?filter=pending'
            }}
          />
        )}

        {products.rejected > 0 && (
          <DashboardCard
            title="Needs Attention"
            value={products.rejected}
            status={[
              { label: 'Products', color: 'red' }
            ]}
            action={{
              label: 'View Feedback',
              link: '/seller/products?filter=rejected'
            }}
          />
        )}
      </StatsGrid>
    </section>
  );

  const renderOrderStats = () => (
    <section className={styles.section}>
      <h2>Sales Performance</h2>
      <StatsGrid>
        <DashboardCard
          title="Total Orders"
          value={orders.count}
          status={[
            { label: 'Completed', value: orders.completed, color: 'green' },
            { label: 'Cancelled', value: orders.cancelled, color: 'red' }
          ]}
          action={{
            label: 'View All',
            link: '/seller/orders'
          }}
        />

        <DashboardCard
          title="Revenue"
          value={`$${parseFloat(orders.revenue).toLocaleString()}`}
          trend={{
            direction: performance.orderValueTrend.direction,
            value: performance.orderValueTrend.percentage,
            label: 'vs last week'
          }}
        />

        <DashboardCard
          title="Conversion Rate"
          value={`${performance.conversionRate}%`}
          trend={{
            direction: performance.conversionTrend.direction,
            value: performance.conversionTrend.percentage,
            label: 'vs last week'
          }}
        />

        <DashboardCard
          title="Average Order Value"
          value={`$${performance.avgOrderValue}`}
          trend={{
            direction: performance.orderValueTrend.direction,
            value: performance.orderValueTrend.percentage,
            label: 'vs last week'
          }}
        />
      </StatsGrid>

      {revenueChart && revenueChart.length > 0 && (
        <div className={styles.chartSection}>
          <RevenueChart data={revenueChart} />
        </div>
      )}
    </section>
  );

  const renderCustomerFeedback = () => (
    <section className={styles.section}>
      <h2>Customer Feedback</h2>
      <StatsGrid>
        <DashboardCard
          title="Customer Reviews"
          value={reviews.count}
          status={[
            { 
              label: `${reviews.averageRating}★ Average`, 
              color: reviews.averageRating >= 4 ? 'green' : 'orange'
            }
          ]}
          action={{
            label: 'View All',
            link: '/seller/reviews'
          }}
        />

        <DashboardCard
          title="Satisfaction Rate"
          value={`${performance.satisfactionRate}%`}
          status={[
            { 
              label: 'Positive Reviews', 
              value: reviews.positiveRating,
              color: 'green'
            }
          ]}
        />
      </StatsGrid>

      {reviews.count > 0 && (
        <div className={styles.chartSection}>
          <RatingDistribution distribution={reviews.distribution} />
        </div>
      )}
    </section>
  );

  const renderRecentOrders = () => (
    <section className={styles.section}>
      <h2>Recent Orders</h2>
      <div className={styles.recentOrdersList}>
        {recentOrders.map(order => (
          <Link
            key={order.id}
            to={`/seller/orders/${order.id}`}
            className={styles.orderCard}
          >
            <div className={styles.orderHeader}>
              <span className={styles.orderId}>Order #{order.id}</span>
              <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                {order.status}
              </span>
            </div>
            <div className={styles.orderInfo}>
              <span className={styles.orderTotal}>${order.total}</span>
              <time className={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString()}
              </time>
            </div>
          </Link>
        ))}

        {recentOrders.length === 0 && (
          <p className={styles.noOrders}>No recent orders to display</p>
        )}

        <Link to="/seller/orders" className={styles.viewAllLink}>
          View All Orders →
        </Link>
      </div>
    </section>
  );

  return (
    <div className={styles.dashboardContainer}>
      {renderHeader()}
      {renderProductStats()}
      {renderOrderStats()}
      {renderCustomerFeedback()}
      {renderRecentOrders()}
    </div>
  );
};

SellerDashboard.propTypes = {
  stats: PropTypes.shape({
    products: PropTypes.shape({
      total: PropTypes.number.isRequired,
      approved: PropTypes.number.isRequired,
      pending: PropTypes.number.isRequired,
      rejected: PropTypes.number.isRequired,
      lowStock: PropTypes.number.isRequired
    }).isRequired,
    orders: PropTypes.shape({
      count: PropTypes.number.isRequired,
      revenue: PropTypes.string.isRequired,
      completed: PropTypes.number.isRequired,
      cancelled: PropTypes.number.isRequired
    }).isRequired,
    reviews: PropTypes.shape({
      count: PropTypes.number.isRequired,
      averageRating: PropTypes.string.isRequired,
      distribution: PropTypes.object.isRequired,
      positiveRating: PropTypes.number.isRequired
    }).isRequired,
    recentOrders: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      total: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired
    })).isRequired,
    performance: PropTypes.shape({
      conversionRate: PropTypes.string.isRequired,
      conversionTrend: PropTypes.shape({
        direction: PropTypes.string.isRequired,
        percentage: PropTypes.string.isRequired
      }).isRequired,
      avgOrderValue: PropTypes.string.isRequired,
      orderValueTrend: PropTypes.shape({
        direction: PropTypes.string.isRequired,
        percentage: PropTypes.string.isRequired
      }).isRequired,
      satisfactionRate: PropTypes.string.isRequired
    }).isRequired,
    revenueChart: PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string.isRequired,
      revenue: PropTypes.string.isRequired
    }))
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onRefresh: PropTypes.func.isRequired
};

export default SellerDashboard;
