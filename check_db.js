const { UserRoom, Room, User } = require('./backend/models');

async function check() {
  try {
    const count = await UserRoom.count();
    console.log('UserRoom count:', count);
    const users = await User.findAll({
      include: [{ model: Room, as: 'assignedRooms' }]
    });
    console.log('Users with rooms:', JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit();
}

check();
