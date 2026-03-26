const bcrypt = require('bcrypt');
const { User } = require('./models');
const sequelize = require('./models').sequelize;

async function resetAdminPassword() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const newPassword = 'Admin@123456';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const admin = await User.findOne({ where: { role: 'admin' } });
        
        if (!admin) {
            console.log('No admin user found, creating one...');
            await User.create({
                username: 'admin',
                email: 'admin@techacademy.com',
                password_hash: hashedPassword,
                role: 'admin'
            });
        } else {
            await admin.update({ password_hash: hashedPassword });
            console.log('✓ Admin password reset successfully');
        }

        console.log('\n📋 Admin Credentials:');
        console.log('Username: admin');
        console.log('Email: admin@techacademy.com');
        console.log('Password: Admin@123456');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

resetAdminPassword();
