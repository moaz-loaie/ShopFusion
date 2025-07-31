'use strict';

const SETTING_CATEGORIES = {
  GENERAL: 'general',
  SECURITY: 'security',
  BUSINESS: 'business',
  USER_SETTINGS: 'user_settings'
};

module.exports = (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(Object.values(SETTING_CATEGORIES)),
      allowNull: false,
      defaultValue: SETTING_CATEGORIES.GENERAL,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'system_settings',
    timestamps: true,
    hooks: {
      beforeValidate: (setting) => {
        // Ensure JSON value is properly stored
        if (setting.value && typeof setting.value === 'object') {
          setting.value = JSON.stringify(setting.value);
        }
      },
      afterFind: (instances) => {
        // Parse JSON values after fetching
        if (Array.isArray(instances)) {
          instances.forEach(instance => {
            if (instance.value && typeof instance.value === 'string') {
              try {
                instance.value = JSON.parse(instance.value);
              } catch (e) {
                console.error('Error parsing system setting JSON value:', e);
              }
            }
          });
        } else if (instances && instances.value && typeof instances.value === 'string') {
          try {
            instances.value = JSON.parse(instances.value);
          } catch (e) {
            console.error('Error parsing system setting JSON value:', e);
          }
        }
      },
    },
  });
  SystemSetting.associate = function(models) {
    SystemSetting.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updatedBy',
    });
    SystemSetting.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return SystemSetting;
};
