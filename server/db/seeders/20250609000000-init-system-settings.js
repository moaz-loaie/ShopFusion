'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const now = new Date();
      
      // Clean up existing settings
      await queryInterface.bulkDelete('system_settings', null, { truncate: true, cascade: true });
      
      // Get roles first
      const rolesResult = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM Users WHERE Field = 'role'"
      );
      const roleEnum = rolesResult[0][0].Type;
      const roles = roleEnum.replace(/^enum\('|'\)$/g, '').split("','");
      
      // System defaults (admin settings)
      const systemSettings = [
        {
          id: 'system_general',
          value: JSON.stringify({
            maintenanceMode: false,
            allowNewRegistrations: true,
            maxLoginAttempts: 5,
            sessionTimeout: 60
          }),
          description: 'General system settings',
          category: 'general',
          metadata: JSON.stringify({
            lastUpdated: now.toISOString(),
            version: 1,
            access: ['admin']
          }),
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'system_security',
          value: JSON.stringify({
            emailVerificationRequired: true,
            automaticModeration: false,
            passwordMinLength: 8,
            passwordRequireSpecialChar: true,
            twoFactorAuthEnabled: false
          }),
          description: 'Security settings',
          category: 'security',
          metadata: JSON.stringify({
            lastUpdated: now.toISOString(),
            version: 1,
            access: ['admin']
          }),
          createdAt: now,
          updatedAt: now
        },
        {
          id: 'system_business',
          value: JSON.stringify({
            disputeAutoClose: 30,
            minimumOrderAmount: 10.00,
            platformFeePercentage: 5.00,
            lowStockThreshold: 5,
            maxItemsPerOrder: 100
          }),
          description: 'Business rules',
          category: 'business',
          metadata: JSON.stringify({
            lastUpdated: now.toISOString(),
            version: 1,
            access: ['admin']
          }),
          createdAt: now,
          updatedAt: now
        }
      ];      // Get users from demo data with proper error handling
      const users = await queryInterface.sequelize.query(
        "SELECT id, role FROM Users WHERE role IN (:roles)",
        {
          replacements: { roles: roles },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (!users || users.length === 0) {

        await queryInterface.bulkInsert('system_settings', systemSettings);
        return;
      }

      // Role-specific default settings
      const defaultSettings = {
        user: {
          notifications: {
            orderUpdates: true,
            promotions: true,
            newsletter: true
          },
          privacy: {
            profileVisibility: 'public',
            showReviews: true
          },
          preferences: {
            language: 'en',
            currency: 'USD',
            theme: 'light'
          }
        },
        seller: {
          notifications: {
            orderUpdates: true,
            promotions: true,
            newsletter: true,
            inventoryAlerts: true,
            orderNotifications: true
          },
          privacy: {
            profileVisibility: 'public',
            showReviews: true,
            storeVisibility: 'public'
          },
          preferences: {
            language: 'en',
            currency: 'USD',
            theme: 'light',
            defaultShippingMethod: 'standard',
            autoConfirmOrders: false
          },
          business: {
            minOrderValue: 0,
            maxOrderItems: 50,
            shippingMethods: ['standard', 'express'],
            returnPeriod: 14
          }
        },
        admin: {
          notifications: {
            systemAlerts: true,
            userReports: true,
            securityAlerts: true
          },
          preferences: {
            language: 'en',
            theme: 'dark',
            dashboardView: 'detailed'
          }
        }
      };

      // Generate settings for each user with validation
      const userSettings = users.map(user => {
        const roleSettings = defaultSettings[user.role] || defaultSettings.user;
        
        return {
          id: `user_${user.id}_settings`,
          value: JSON.stringify(roleSettings),
          description: `User settings for ${user.role} ${user.id}`,
          category: 'user_settings',
          user_id: user.id,
          metadata: JSON.stringify({
            lastUpdated: now.toISOString(),
            version: 1,
            role: user.role
          }),
          createdAt: now,
          updatedAt: now
        };
      });

      // Insert all settings with transaction
      await queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.bulkInsert('system_settings', [...systemSettings, ...userSettings], { transaction });
      });



    } catch (error) {
      console.error('Error seeding settings:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('system_settings', null, { truncate: true, cascade: true });
  }
};
