'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create floors table
    await queryInterface.createTable('floors', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    // 2. Create rooms table
    await queryInterface.createTable('rooms', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      floor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'floors',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      path_data: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      x: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      y: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      width: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      height: {
        type: Sequelize.INTEGER,
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

    // 3. Add room_id to equipment table
    await queryInterface.addColumn('equipment', 'room_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'rooms',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('equipment', 'room_id');
    await queryInterface.dropTable('rooms');
    await queryInterface.dropTable('floors');
  }
};
