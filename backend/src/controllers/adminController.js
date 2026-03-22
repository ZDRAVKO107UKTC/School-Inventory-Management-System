const { User } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');

const listUsers = async (req, res) => {
    try {
        const pagination = resolvePagination(req.query);
        const queryOptions = {
            attributes: ['id', 'username', 'email', 'role', 'created_at'],
            order: [['created_at', 'DESC']]
        };

        if (!pagination) {
            const users = await User.findAll(queryOptions);
            return res.status(200).json({ users });
        }

        const { count, rows } = await User.findAndCountAll({
            ...queryOptions,
            limit: pagination.limit,
            offset: pagination.offset
        });
        const paginationMeta = buildPaginationMeta(count, pagination);
        applyPaginationHeaders(res, paginationMeta);

        return res.status(200).json({ users: rows, pagination: paginationMeta });
    } catch (error) {
        console.error('Error listing users:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

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

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long"
            });
        }

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { email: normalizedEmail },
                    { username: normalizedUsername }
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
            username: normalizedUsername,
            email: normalizedEmail,
            password_hash: hashedPassword,
            role
        });

        // Return user without password hash
        const { password_hash: _, ...userWithoutPassword } = newUser.toJSON();

        return res.status(201).json({
            message: "User created successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const validRoles = ['student', 'teacher', 'admin'];
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Allowed values: ${validRoles.join(', ')}` });
        }
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const oldRole = user.role;
        user.role = role;
        await user.save();
        // Audit log
        console.log(`[AUDIT] Admin ${req.user.userId} changed role of user ${user.id} from ${oldRole} to ${role} at ${new Date().toISOString()}`);
        return res.status(200).json({
            message: 'User role updated successfully',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (String(req.user.userId) === String(id)) {
            return res.status(400).json({
                message: 'Admins cannot delete their own account'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const deletedUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        await user.destroy();

        console.log(`[AUDIT] Admin ${req.user.userId} deleted user ${deletedUser.id} (${deletedUser.role}) at ${new Date().toISOString()}`);

        return res.status(200).json({
            message: 'User deleted successfully',
            user: deletedUser
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, role } = req.body;
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for conflicts if username or email is changing
        if (username || email) {
            const conflictWhere = {
                [Op.or]: [],
                id: { [Op.ne]: id }
            };
            if (username) conflictWhere[Op.or].push({ username: username.trim() });
            if (email) conflictWhere[Op.or].push({ email: email.trim().toLowerCase() });

            if (conflictWhere[Op.or].length > 0) {
                const existingUser = await User.findOne({ where: conflictWhere });
                if (existingUser) {
                    return res.status(409).json({ message: "Username or email already in use" });
                }
            }
        }

        if (username) user.username = username.trim();
        if (email) user.email = email.trim().toLowerCase();
        if (role) {
            const validRoles = ['student', 'teacher', 'admin'];
            if (validRoles.includes(role)) {
                user.role = role;
            }
        }

        await user.save();
        return res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { listUsers, createUser, updateUserRole, deleteUser, updateUser };
