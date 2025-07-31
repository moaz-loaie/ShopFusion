import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './SettingsLayout.module.css';

const SettingsLayout = () => {
  const { user } = useAuth();
  const getNavItems = () => {
    const items = [...settingsNavItems.common];

    if (user?.role === 'seller') {
      items.push(...settingsNavItems.seller);
    } else if (user?.role === 'admin') {
      items.push(...settingsNavItems.admin);
    } else {
      // Customer-specific settings
      items.push(
        { to: 'addresses', label: 'Shipping Addresses', icon: 'TruckIcon' },
        { to: 'payment', label: 'Payment Methods', icon: 'CreditCardIcon' },
        { to: 'subscriptions', label: 'Subscriptions', icon: 'RepeatIcon' }
      );
    }
    
    return items;
  };

  return (
    <div className={styles.settingsContainer}>
      <aside className={styles.sidebar}>
        <nav className={styles.nav}>
          {getNavItems().map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsLayout;
