const { User } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');

const VALID_ROLES = ['student', 'teacher', 'admin'];
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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
        const normalizedUsername = typeof username === 'string' ? username.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';

        if (!normalizedUsername || !normalizedEmail || !password || !normalizedRole) {
            return res.status(400).json({
                message: "Missing required fields: username, email, password, role"
            });
        }

        if (!VALID_ROLES.includes(normalizedRole)) {
            return res.status(400).json({
                message: `Invalid role. Allowed values: ${VALID_ROLES.join(', ')}`
            });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({
                message: 'A valid email address is required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long"
            });
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
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
            role: normalizedRole
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
        const normalizedRole = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : '';
        if (!normalizedRole || !VALID_ROLES.includes(normalizedRole)) {
            return res.status(400).json({ message: `Invalid role. Allowed values: ${VALID_ROLES.join(', ')}` });
        }
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const oldRole = user.role;
        user.role = normalizedRole;
        await user.save();
        console.log(`[AUDIT] Admin ${req.user.userId} changed role of user ${user.id} from ${oldRole} to ${normalizedRole} at ${new Date().toISOString()}`);
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
        const normalizedUsername = typeof username === 'string' ? username.trim() : undefined;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : undefined;
        const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : undefined;

        if (normalizedUsername === undefined && normalizedEmail === undefined && normalizedRole === undefined) {
            return res.status(400).json({ message: 'At least one of username, email, or role is required' });
        }

        if (normalizedUsername !== undefined && !normalizedUsername) {
            return res.status(400).json({ message: 'Username cannot be empty' });
        }

        if (normalizedEmail !== undefined && (!normalizedEmail || !isValidEmail(normalizedEmail))) {
            return res.status(400).json({ message: 'A valid email address is required' });
        }

        if (normalizedRole !== undefined && !VALID_ROLES.includes(normalizedRole)) {
            return res.status(400).json({ message: `Invalid role. Allowed values: ${VALID_ROLES.join(', ')}` });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (normalizedUsername !== undefined || normalizedEmail !== undefined) {
            const conflictWhere = {
                [Op.or]: [],
                id: { [Op.ne]: id }
            };
            if (normalizedUsername !== undefined) conflictWhere[Op.or].push({ username: normalizedUsername });
            if (normalizedEmail !== undefined) conflictWhere[Op.or].push({ email: normalizedEmail });

            if (conflictWhere[Op.or].length > 0) {
                const existingUser = await User.findOne({ where: conflictWhere });
                if (existingUser) {
                    return res.status(409).json({ message: "Username or email already in use" });
                }
            }
        }

        if (normalizedUsername !== undefined) user.username = normalizedUsername;
        if (normalizedEmail !== undefined) user.email = normalizedEmail;
        if (normalizedRole !== undefined) user.role = normalizedRole;

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
