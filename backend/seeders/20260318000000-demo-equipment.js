'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const passwordHash = await bcrypt.hash('Password123', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        username: 'admin',
        email: 'admin@school.local',
        password_hash: passwordHash,
        role: 'admin',
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        username: 'teacher',
        email: 'teacher@school.local',
        password_hash: passwordHash,
        role: 'teacher',
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        username: 'student',
        email: 'student@school.local',
        password_hash: passwordHash,
        role: 'student',
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        username: 'student2',
        email: 'student2@school.local',
        password_hash: passwordHash,
        role: 'student',
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('floors', [
      { id: 1, name: 'Ground Floor', level: 0, created_at: now, updated_at: now },
      { id: 2, name: 'First Floor', level: 1, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('rooms', [
      { id: 1, floor_id: 1, name: 'IT Lab A', path_data: null, x: 80, y: 80, width: 160, height: 120, created_at: now, updated_at: now },
      { id: 2, floor_id: 1, name: 'Media Studio', path_data: null, x: 280, y: 80, width: 180, height: 120, created_at: now, updated_at: now },
      { id: 3, floor_id: 1, name: 'Storage A', path_data: null, x: 80, y: 240, width: 140, height: 100, created_at: now, updated_at: now },
      { id: 4, floor_id: 2, name: 'Physics Lab', path_data: null, x: 100, y: 70, width: 180, height: 120, created_at: now, updated_at: now },
      { id: 5, floor_id: 2, name: 'Design Room', path_data: null, x: 320, y: 70, width: 180, height: 120, created_at: now, updated_at: now }
    ]);

    await queryInterface.bulkInsert('equipment', [
      {
        id: 1,
        name: 'Dell XPS 15',
        type: 'Laptop',
        serial_number: 'LAP-DEL-XPS15-001',
        condition: 'good',
        status: 'available',
        location: 'IT Lab A',
        photo_url: null,
        quantity: 10,
        room_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        name: 'MacBook Pro M2',
        type: 'Laptop',
        serial_number: 'LAP-MAC-M2-001',
        condition: 'new',
        status: 'available',
        location: 'IT Lab A',
        photo_url: null,
        quantity: 6,
        room_id: 1,
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        name: 'Epson Pro EX9220',
        type: 'Projector',
        serial_number: 'PRO-EPS-EX9220-001',
        condition: 'fair',
        status: 'available',
        location: 'Storage A',
        photo_url: null,
        quantity: 4,
        room_id: 3,
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        name: 'Sony A7III Camera',
        type: 'Camera',
        serial_number: 'CAM-SON-A7III-001',
        condition: 'good',
        status: 'available',
        location: 'Media Studio',
        photo_url: null,
        quantity: 3,
        room_id: 2,
        created_at: now,
        updated_at: now
      },
      {
        id: 5,
        name: 'Wacom Intuos Pro',
        type: 'Tablet',
        serial_number: 'TAB-WAC-INTPRO-001',
        condition: 'new',
        status: 'available',
        location: 'Design Room',
        photo_url: null,
        quantity: 8,
        room_id: 5,
        created_at: now,
        updated_at: now
      },
      {
        id: 6,
        name: 'HP LaserJet Pro 400',
        type: 'Printer',
        serial_number: 'PRN-HPL-400-001',
        condition: 'good',
        status: 'available',
        location: 'Ground Floor Office',
        photo_url: null,
        quantity: 2,
        room_id: 3,
        created_at: now,
        updated_at: now
      },
      {
        id: 7,
        name: 'Broken Projector (Demo)',
        type: 'Projector',
        serial_number: 'PRO-BRO-DEMO-001',
        condition: 'damaged',
        status: 'under_repair',
        location: 'Storage A',
        photo_url: null,
        quantity: 1,
        room_id: 3,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('requests', [
      {
        id: 1,
        user_id: 3,
        equipment_id: 1,
        quantity: 2,
        request_date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        due_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        return_date: null,
        status: 'pending',
        notes: 'Need for robotics class',
        approved_by: null,
        return_condition: null,
        return_notes: null,
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        user_id: 4,
        equipment_id: 4,
        quantity: 1,
        request_date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        due_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        return_date: null,
        status: 'approved',
        notes: 'School event coverage',
        approved_by: 2,
        return_condition: null,
        return_notes: null,
        created_at: now,
        updated_at: now
      },
      {
        id: 3,
        user_id: 3,
        equipment_id: 3,
        quantity: 1,
        request_date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        due_date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        return_date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        status: 'returned',
        notes: 'Science presentation',
        approved_by: 1,
        return_condition: 'good',
        return_notes: 'Returned in good shape',
        created_at: now,
        updated_at: now
      },
      {
        id: 4,
        user_id: 4,
        equipment_id: 5,
        quantity: 2,
        request_date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        due_date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
        return_date: null,
        status: 'rejected',
        notes: 'Art workshop',
        approved_by: 1,
        return_condition: null,
        return_notes: null,
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.bulkInsert('return_condition_logs', [
      {
        id: 1,
        request_id: 3,
        equipment_id: 3,
        condition: 'good',
        notes: 'Returned in good shape',
        recorded_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        created_at: now,
        updated_at: now
      },
      {
        id: 2,
        request_id: 4,
        equipment_id: 7,
        condition: 'damaged',
        notes: 'Marked damaged during inventory audit',
        recorded_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        created_at: now,
        updated_at: now
      }
    ]);

    await queryInterface.sequelize.query(`
      SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM users;
      SELECT setval(pg_get_serial_sequence('floors', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM floors;
      SELECT setval(pg_get_serial_sequence('rooms', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM rooms;
      SELECT setval(pg_get_serial_sequence('equipment', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM equipment;
      SELECT setval(pg_get_serial_sequence('requests', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM requests;
      SELECT setval(pg_get_serial_sequence('return_condition_logs', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM return_condition_logs;
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('return_condition_logs', null, {});
    await queryInterface.bulkDelete('requests', null, {});
    await queryInterface.bulkDelete('equipment', null, {});
    await queryInterface.bulkDelete('rooms', null, {});
    await queryInterface.bulkDelete('floors', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};