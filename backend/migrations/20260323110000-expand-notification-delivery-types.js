'use strict';

const NOTIFICATION_TYPES = [
  'request_submitted_confirmation',
  'request_submitted_admin_alert',
  'request_approved',
  'request_rejected',
  'request_returned_confirmation',
  'request_returned_admin_alert'
];

module.exports = {
  async up(queryInterface) {
    for (const type of NOTIFICATION_TYPES) {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_notification_deliveries_type" ADD VALUE IF NOT EXISTS '${type}';`
      );
    }
  },

  async down() {
    // PostgreSQL enum value removal is not safely reversible without recreating the type.
  }
};
