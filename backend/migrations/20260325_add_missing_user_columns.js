'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.password_reset_token_hash) {
      await queryInterface.addColumn('users', 'password_reset_token_hash', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableInfo.password_reset_expires_at) {
      await queryInterface.addColumn('users', 'password_reset_expires_at', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'password_reset_token_hash');
    await queryInterface.removeColumn('users', 'password_reset_expires_at');
  }
};
