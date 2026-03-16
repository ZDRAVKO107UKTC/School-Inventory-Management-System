const { User } = require('../../models');
const bcrypt = require('bcrypt');

const createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate required fields
        if (!username || !email || !password || !role) {
            return res.status(400).json({
                message: "Missing required fields: username, email, password, role"
            });
        }

        // Validate role
        const validRoles = ['student', 'teacher', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: `Invalid role. Allowed values: ${validRoles.join(', ')}`
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User with this email or username already exists"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser.toJSON();

        return res.status(201).json({
            message: "User created successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { createUser };
