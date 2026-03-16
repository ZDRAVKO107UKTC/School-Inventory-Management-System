'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'return_condition', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('requests', 'return_notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('requests', 'return_condition');
    await queryInterface.removeColumn('requests', 'return_notes');
  }
};
