'use strict';

module.exports = (sequelize, DataTypes) => {
  const NotificationDelivery = sequelize.define('NotificationDelivery', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    type: {
      type: DataTypes.ENUM(
        'overdue_reminder',
        'low_stock_alert',
        'request_submitted_confirmation',
        'request_submitted_admin_alert',
        'request_approved',
        'request_rejected',
        'request_returned_confirmation',
        'request_returned_admin_alert'
      ),
      allowNull: false
    },
    channel: {
      type: DataTypes.ENUM('email'),
      allowNull: false,
      defaultValue: 'email'
    },
    status: {
      type: DataTypes.ENUM('sent', 'failed', 'skipped'),
      allowNull: false,
      defaultValue: 'sent'
    },
    dedupe_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    recipient_email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    request_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'notification_deliveries',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  NotificationDelivery.associate = function(models) {
    NotificationDelivery.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    NotificationDelivery.belongsTo(models.Equipment, {
      foreignKey: 'equipment_id',
      as: 'equipment'
    });

    NotificationDelivery.belongsTo(models.Request, {
      foreignKey: 'request_id',
      as: 'request'
    });
  };

  return NotificationDelivery;
};
