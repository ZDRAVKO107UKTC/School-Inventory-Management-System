'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'password_reset_token_hash', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'password_reset_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addIndex('users', ['password_reset_token_hash'], {
      name: 'users_password_reset_token_hash_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('users', 'users_password_reset_token_hash_idx');
    await queryInterface.removeColumn('users', 'password_reset_expires_at');
    await queryInterface.removeColumn('users', 'password_reset_token_hash');
  }
};
