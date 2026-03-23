'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_deliveries', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM('overdue_reminder', 'low_stock_alert'),
        allowNull: false
      },
      channel: {
        type: Sequelize.ENUM('email'),
        allowNull: false,
        defaultValue: 'email'
      },
      status: {
        type: Sequelize.ENUM('sent', 'failed', 'skipped'),
        allowNull: false,
        defaultValue: 'sent'
      },
      dedupe_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      recipient_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'equipment',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex('notification_deliveries', ['type', 'sent_at']);
    await queryInterface.addIndex('notification_deliveries', ['user_id', 'sent_at']);
    await queryInterface.addIndex('notification_deliveries', ['request_id', 'sent_at']);
    await queryInterface.addIndex('notification_deliveries', ['equipment_id', 'sent_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notification_deliveries');
  }
};
