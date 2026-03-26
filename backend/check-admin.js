const bcrypt = require('bcrypt');
const { User } = require('./models');
const sequelize = require('./models').sequelize;

async function checkAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const admin = await User.findOne({ where: { role: 'admin' } });
        
        if (!admin) {
            console.log('No admin user found');
            process.exit(1);
        }

        console.log('\n📋 Current Admin User:');
        console.log('ID:', admin.id);
        console.log('Username:', admin.username);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Password Hash:', admin.password_hash);

        // Test if password matches
        const testPassword = 'Admin@123456';
        const matches = await bcrypt.compare(testPassword, admin.password_hash);
        console.log('\nPassword "Admin@123456" matches:', matches);

        // Let's reset it fresh
        console.log('\n🔄 Resetting password...');
        const newHashedPassword = await bcrypt.hash(testPassword, 10);
        await admin.update({ password_hash: newHashedPassword });

        console.log('✓ Password reset successfully');
        console.log('\n📝 Use these credentials:');
        console.log('Email: admin@techacademy.com');
        console.log('Password: Admin@123456');
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

checkAdmin();
