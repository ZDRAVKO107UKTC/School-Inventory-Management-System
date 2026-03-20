'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const equipment = [];
    const now = new Date();

    const items = [
      { name: 'Dell XPS 15', type: 'Laptop', count: 5, specs: { condition: 'new', location: 'IT Lab 1' } },
      { name: 'MacBook Pro M2', type: 'Laptop', count: 3, specs: { condition: 'good', location: 'IT Lab 2' } },
      { name: 'Epson Pro EX9220', type: 'Projector', count: 2, specs: { condition: 'fair', location: 'Storage A' } },
      { name: 'Sony A7III Camera', type: 'Camera', count: 2, specs: { condition: 'good', location: 'Media Studio' } },
      { name: 'Wacom Intuos Pro', type: 'Tablet', count: 5, specs: { condition: 'new', location: 'Design Room' } },
      { name: 'Broken Projector (Test)', type: 'Projector', count: 1, specs: { condition: 'damaged', location: 'Repair Shop', status: 'under_repair' } }
    ];

    items.forEach(item => {
      for (let i = 1; i <= item.count; i++) {
        equipment.push({
          name: item.name,
          type: item.type,
          serial_number: `${item.name.substring(0, 3).toUpperCase()}-${item.type.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
          condition: item.specs.condition,
          status: item.specs.status || 'available',
          location: item.specs.location,
          photo_url: null, // We're using 3D models now
          quantity: 1, // Every item is single
          created_at: now,
          updated_at: now
        });
      }
    });

    return queryInterface.bulkInsert('equipment', equipment);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('equipment', null, {});
  }
};
