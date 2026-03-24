const { User } = require('../../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');

const VALID_ROLES = ['student', 'teacher', 'admin'];
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeOptionalString = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isPersistenceError = (error) => ['SequelizeValidationError', 'SequelizeUniqueConstraintError'].includes(error.name);

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
        const username = normalizeOptionalString(req.body.username);
        const email = normalizeOptionalString(req.body.email)?.toLowerCase();
        const password = req.body.password;
        const role = normalizeOptionalString(req.body.role)?.toLowerCase();

        if (!username || !email || !password || !role) {
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
        if (!isValidEmail(email)) {
            return res.status(400).json({
                message: "A valid email address is required"
            });
        }

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({
                message: `Invalid role. Allowed values: ${VALID_ROLES.join(', ')}`
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password_hash: hashedPassword,
            role: normalizedRole
        });

        const { password_hash: _, ...userWithoutPassword } = newUser.toJSON();

        return res.status(201).json({
            message: "User created successfully",
            user: userWithoutPassword
        });
    } catch (error) {
        if (isPersistenceError(error)) {
            return res.status(400).json({ message: error.errors?.[0]?.message || error.message });
        }
        console.error('Error creating user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const normalizedRole = typeof req.body.role === 'string' ? req.body.role.trim().toLowerCase() : '';
        if (!normalizedRole || !VALID_ROLES.includes(normalizedRole)) {
        const role = normalizeOptionalString(req.body.role)?.toLowerCase();

        if (!role || !VALID_ROLES.includes(role)) {
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
        const username = normalizeOptionalString(req.body.username);
        const email = normalizeOptionalString(req.body.email)?.toLowerCase();
        const role = normalizeOptionalString(req.body.role)?.toLowerCase();

        if (username === null) {
            return res.status(400).json({ message: 'Username cannot be empty' });
        }

        if (email === null) {
            return res.status(400).json({ message: 'Email cannot be empty' });
        }

        if (!username && !email && !role) {
            return res.status(400).json({ message: 'At least one field must be provided' });
        }

        if (email && !isValidEmail(email)) {
            return res.status(400).json({ message: 'A valid email address is required' });
        }

        if (role && !VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Allowed values: ${VALID_ROLES.join(', ')}` });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (normalizedUsername !== undefined || normalizedEmail !== undefined) {
        if (username || email) {
            const conflictWhere = {
                [Op.or]: [],
                id: { [Op.ne]: id }
            };
            if (normalizedUsername !== undefined) conflictWhere[Op.or].push({ username: normalizedUsername });
            if (normalizedEmail !== undefined) conflictWhere[Op.or].push({ email: normalizedEmail });
            if (username) conflictWhere[Op.or].push({ username });
            if (email) conflictWhere[Op.or].push({ email });

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
        if (username) user.username = username;
        if (email) user.email = email;
        if (role) user.role = role;

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
        if (isPersistenceError(error)) {
            return res.status(400).json({ message: error.errors?.[0]?.message || error.message });
        }
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { listUsers, createUser, updateUserRole, deleteUser, updateUser };
