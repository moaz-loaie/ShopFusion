// List of navigation items for each user role
export const settingsNavItems = {
  common: [
    { to: 'profile', label: 'Profile', icon: 'UserIcon' },
    { to: 'security', label: 'Security', icon: 'ShieldIcon' },
    { to: 'notifications', label: 'Notifications', icon: 'BellIcon' },
    { to: 'preferences', label: 'Preferences', icon: 'GearIcon' }
  ],
  seller: [
    { to: 'store', label: 'Store Settings', icon: 'StoreIcon' },
    { to: 'payouts', label: 'Payout Settings', icon: 'CurrencyIcon' },
    { to: 'tax', label: 'Tax Information', icon: 'TaxIcon' }
  ],
  admin: [
    { to: 'system', label: 'System Settings', icon: 'GearIcon' },
    { to: 'roles', label: 'Role Management', icon: 'UsersIcon' },
    { to: 'integrations', label: 'Integrations', icon: 'PlugIcon' }
  ]
};
