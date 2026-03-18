'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('return_condition_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'requests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      equipment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'equipment',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      condition: {
        type: Sequelize.ENUM('new', 'good', 'fair', 'damaged'),
        allowNull: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
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

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "return_condition_logs_request_id"
      ON "return_condition_logs" ("request_id")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "return_condition_logs_equipment_id"
      ON "return_condition_logs" ("equipment_id")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "return_condition_logs_recorded_at"
      ON "return_condition_logs" ("recorded_at")
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO return_condition_logs (request_id, equipment_id, condition, notes, recorded_at, created_at, updated_at)
      SELECT
        id,
        equipment_id,
        LOWER(TRIM(return_condition))::"public"."enum_return_condition_logs_condition",
        return_notes,
        COALESCE(return_date, updated_at, created_at, NOW()),
        NOW(),
        NOW()
      FROM requests
      WHERE return_condition IS NOT NULL
        AND LOWER(TRIM(return_condition)) IN ('new', 'good', 'fair', 'damaged')
        AND NOT EXISTS (
          SELECT 1
          FROM return_condition_logs logs
          WHERE logs.request_id = requests.id
        )
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('return_condition_logs');
  }
};
