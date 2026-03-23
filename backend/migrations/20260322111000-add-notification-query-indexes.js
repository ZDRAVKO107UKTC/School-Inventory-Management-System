'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_requests_status_due_date_return_date"
      ON "requests" ("status", "due_date", "return_date")
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_equipment_status_quantity"
      ON "equipment" ("status", "quantity")
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_equipment_status_quantity"');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS "idx_requests_status_due_date_return_date"');
  }
};
