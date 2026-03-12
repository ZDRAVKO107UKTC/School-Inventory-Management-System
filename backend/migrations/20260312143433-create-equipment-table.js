'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      name: {
        type: Sequelize.STRING,
        allowNull: false
      },

      type: {
        type: Sequelize.STRING,
        allowNull: false
      },

      serial_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },

      condition: {
        type: Sequelize.ENUM('new', 'good', 'fair', 'damaged'),
        allowNull: false
      },

      status: {
        type: Sequelize.ENUM(
            'available',
            'checked_out',
            'under_repair',
            'retired'
        ),
        allowNull: false,
        defaultValue: 'available'
      },

      location: {
        type: Sequelize.STRING,
        allowNull: true
      },

      photo_url: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('equipment');
  }
};