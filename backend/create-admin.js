const bcrypt = require('bcrypt');
const { User } = require('./models');
const sequelize = require('./models').sequelize;

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const hashedPassword = await bcrypt.hash('Admin@123456', 10);

        const admin = await User.create({
            username: 'admin',
            email: 'admin@techacademy.com',
            password_hash: hashedPassword,
            role: 'admin'
        });

        console.log('✓ Admin user created successfully');
        console.log('Username: admin');
        console.log('Email: admin@techacademy.com');
        console.log('Password: Admin@123456');
        process.exit(0);
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            console.log('Admin user already exists');
            process.exit(0);
        }
        console.error('Error:', err.message);
        process.exit(1);
    }
}

createAdmin();
