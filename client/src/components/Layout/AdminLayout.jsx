import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  UsersIcon,
  ShoppingBagIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorBoundary from '../common/ErrorBoundary';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: ChartBarIcon
  },
  {
    name: 'Sellers',
    href: '/admin/sellers',
    icon: UsersIcon
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: ShoppingBagIcon
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ClipboardDocumentListIcon
  },
  {
    name: 'Disputes',
    href: '/admin/disputes',
    icon: ShieldExclamationIcon
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon
  }
];

export const AdminLayout = ({ children, loading = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        {/* Mobile sidebar */}
        <div
          className={`fixed inset-0 z-40 lg:hidden ${
            sidebarOpen ? 'block' : 'hidden'
          }`}
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative flex flex-col w-full max-w-xs bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 flex flex-col pt-5 pb-4">
              <div className="flex-shrink-0 flex items-center px-4">
                <Link to="/" className="text-xl font-bold text-primary">
                  ShopFusion Admin
                </Link>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-gray-100 text-primary'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`mr-3 h-6 w-6 ${
                          isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4">
            <div className="flex items-center px-6">
              <Link to="/" className="text-xl font-bold text-primary">
                ShopFusion Admin
              </Link>
            </div>
            <nav className="mt-5 flex-1 px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-100 text-primary'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 ${
                        isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col">
          {/* Mobile header */}
          <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
            <button
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>

          {/* Main content area */}
          <main className="flex-1">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool
};
