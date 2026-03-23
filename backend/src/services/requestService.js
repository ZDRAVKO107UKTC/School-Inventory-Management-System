const { Request, Equipment, User, ReturnConditionLog, sequelize } = require('../../models');
const { Op, fn, col } = require('sequelize');
const notificationService = require('./notificationService');

const REQUEST_NOTIFICATION_INCLUDE = [
    {
        model: Equipment,
        as: 'equipment',
        attributes: ['id', 'name', 'type', 'serial_number', 'condition', 'status', 'quantity']
    },
    {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email', 'role']
    },
    {
        model: User,
        as: 'approver',
        attributes: ['id', 'username', 'email', 'role'],
        required: false
    }
];

const loadRequestNotificationContext = async (requestId, transaction = null) => {
    return Request.findByPk(requestId, {
        attributes: [
            'id',
            'user_id',
            'equipment_id',
            'quantity',
            'request_date',
            'due_date',
            'return_date',
            'status',
            'notes',
            'approved_by',
            'return_condition',
            'return_notes',
            'created_at',
            'updated_at'
        ],
        include: REQUEST_NOTIFICATION_INCLUDE,
        ...(transaction ? { transaction } : {})
    });
};

const fireAndForgetNotification = (label, task) => {
    Promise.resolve(task()).catch((error) => {
        console.error(`[request-service] ${label} notification failed:`, error);
    });
};

/**
 * Creates a new borrow request with full validation
 */
const createBorrowRequest = async (requestData) => {
    const equipment = await Equipment.findByPk(requestData.equipment_id);

    if (!equipment) {
        const error = new Error('Equipment not found');
        error.statusCode = 404;
        throw error;
    }

    if (equipment.status !== 'available') {
        const error = new Error("Equipment is not available for borrowing");
        error.statusCode = 400;
        throw error;
    }

    if (!Number.isInteger(requestData.quantity) || requestData.quantity < 1) {
        const error = new Error("Quantity must be a positive integer");
        error.statusCode = 400;
        throw error;
    }

    if (requestData.quantity > equipment.quantity) {
        const error = new Error("Requested quantity exceeds available inventory");
        error.statusCode = 400;
        throw error;
    }

    const createdRequest = await Request.create({
        user_id: requestData.user_id,
        equipment_id: requestData.equipment_id,
        quantity: requestData.quantity,
        request_date: requestData.request_date,
        due_date: requestData.due_date,
        notes: requestData.notes,
        status: 'pending'
    });

    const requestWithRelations = await loadRequestNotificationContext(createdRequest.id);
    if (requestWithRelations) {
        fireAndForgetNotification('request submitted', () => notificationService.sendRequestSubmittedNotifications(requestWithRelations));
    }

    return createdRequest;
};

/**
 * Fetches requests for the logged-in user
 */
const getMyRequests = async (userId, pagination = null) => {
    const queryOptions = {
        where: { user_id: userId },
        attributes: [
            'id',
            'user_id',
            'equipment_id',
            'quantity',
            'request_date',
            'due_date',
            'return_date',
            'status',
            'notes',
            'approved_by',
            'return_condition',
            'return_notes',
            'created_at',
            'updated_at'
        ],
        include: [{
            model: Equipment,
            as: 'equipment',
            attributes: ['id', 'name', 'type', 'serial_number', 'condition']
        }],
        order: [['created_at', 'DESC']]
    };

    if (!pagination) {
        return Request.findAll(queryOptions);
    }

    return Request.findAndCountAll({
        ...queryOptions,
        distinct: true,
        limit: pagination.limit,
        offset: pagination.offset
    });
};

/**
 * Admin: Approves a request and updates inventory
 */
const approveRequest = async (requestId, approverId) => {
    const approvedRequest = await sequelize.transaction(async (transaction) => {
        const request = await Request.findByPk(requestId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }

        if (request.status !== 'pending') {
            const error = new Error('Only pending requests can be approved');
            error.statusCode = 400;
            throw error;
        }

        const equipment = await Equipment.findByPk(request.equipment_id, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!equipment || equipment.status !== 'available') {
            const error = new Error('Equipment is no longer available');
            error.statusCode = 400;
            throw error;
        }

        if (request.quantity > equipment.quantity) {
            const error = new Error('Requested quantity exceeds available inventory');
            error.statusCode = 400;
            throw error;
        }

        request.status = 'approved';
        request.approved_by = approverId;
        await request.save({ transaction });

        equipment.quantity -= request.quantity;
        equipment.status = equipment.quantity === 0 ? 'checked_out' : 'available';
        await equipment.save({ transaction });

        return loadRequestNotificationContext(request.id, transaction);
    });

    if (approvedRequest) {
        fireAndForgetNotification('request approved', () => notificationService.sendRequestApprovedNotification(approvedRequest));
    }

    return approvedRequest;
};

/**
 * Admin: Rejects a request
 */
const rejectRequest = async (requestId, rejectorId, reason) => {
    const request = await Request.findByPk(requestId);
    if (!request) throw new Error('Request not found');

    if (request.status !== 'pending') {
        throw new Error('Only pending requests can be rejected');
    }

    request.status = 'rejected';
    request.approved_by = rejectorId;
    if (reason) request.notes = reason;
    await request.save();

    const requestWithRelations = await loadRequestNotificationContext(request.id);
    if (requestWithRelations) {
        fireAndForgetNotification('request rejected', () => notificationService.sendRequestRejectedNotification(requestWithRelations, reason));
    }

    return requestWithRelations || request;
};

/**
 * User: Returns equipment
 */
const returnRequest = async (requestId, userId, condition, notes, actorRole) => {
    const result = await sequelize.transaction(async (transaction) => {
        const request = await Request.findByPk(requestId, {
            attributes: [
                'id',
                'user_id',
                'equipment_id',
                'quantity',
                'request_date',
                'due_date',
                'return_date',
                'status',
                'notes',
                'approved_by',
                'return_condition',
                'return_notes',
                'created_at',
                'updated_at'
            ],
            include: [{
                model: Equipment,
                as: 'equipment',
                attributes: ['id', 'name', 'type', 'serial_number', 'condition', 'status', 'quantity'],
                required: true
            }],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!request) {
            const error = new Error('Request not found');
            error.statusCode = 404;
            throw error;
        }

        const isPrivileged = actorRole === 'admin' || actorRole === 'teacher';
        if (!isPrivileged && request.user_id !== userId) {
            throw new Error('You can only return your own requests');
        }

        if (request.status !== 'approved') {
            throw new Error('Only approved requests can be returned');
        }

        request.status = 'returned';
        request.return_date = new Date();
        if (condition) request.return_condition = condition;
        if (notes) request.return_notes = notes;
        await request.save({ transaction });

        if (condition) {
            await ReturnConditionLog.create({
                request_id: request.id,
                equipment_id: request.equipment_id,
                condition,
                notes: notes || 'Returned',
                recorded_at: new Date()
            }, { transaction });
        }

        request.equipment.quantity += request.quantity;
        request.equipment.status = 'available';
        if (condition) request.equipment.condition = condition;
        await request.equipment.save({ transaction });

        const requestWithRelations = await loadRequestNotificationContext(request.id, transaction);
        return {
            request: requestWithRelations || request,
            actor: isPrivileged ? await User.findByPk(userId, {
                attributes: ['id', 'username', 'email', 'role'],
                transaction
            }) : requestWithRelations?.user || null
        };
    });

    if (result?.request) {
        fireAndForgetNotification('request returned', () => notificationService.sendRequestReturnedNotifications(result.request, result.actor));
    }

    return result.request;
};

/**
 * BE-022: Usage Report
 */
const getUsageReport = async (filters = {}, pagination = null) => {
    const { startDate, endDate } = filters;
    let whereClause = {};

    if (startDate || endDate) {
        whereClause.request_date = {};
        if (startDate) whereClause.request_date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.request_date[Op.lte] = new Date(endDate);
    }

    const queryOptions = {
        where: whereClause,
        attributes: [
            'equipment_id',
            [fn('COUNT', col('Request.id')), 'total_requests'],
            [fn('SUM', col('Request.quantity')), 'total_quantity_borrowed']
        ],
        include: [{
            model: Equipment,
            as: 'equipment',
            attributes: ['id', 'name', 'type', 'serial_number']
        }],
        group: ['Request.equipment_id', 'equipment.id', 'equipment.name', 'equipment.type', 'equipment.serial_number'],
        order: [[fn('COUNT', col('Request.id')), 'DESC']]
    };

    const rows = await Request.findAll({
        ...queryOptions,
        ...(pagination ? { limit: pagination.limit, offset: pagination.offset } : {})
    });

    if (!pagination) {
        return rows;
    }

    const count = await Request.count({
        where: whereClause,
        distinct: true,
        col: 'equipment_id'
    });

    return { rows, count };
};

/**
 * BE-023: History Report
 */
const getHistoryReport = async (filters = {}, pagination = null) => {
    const { startDate, endDate, status, equipment_id } = filters;
    let whereClause = {};

    if (startDate || endDate) {
        whereClause.request_date = {};
        if (startDate) whereClause.request_date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.request_date[Op.lte] = new Date(endDate);
    }

    if (status) whereClause.status = status;
    if (equipment_id) whereClause.equipment_id = equipment_id;

    const queryOptions = {
        where: whereClause,
        attributes: [
            'id',
            'user_id',
            'equipment_id',
            'quantity',
            'request_date',
            'due_date',
            'return_date',
            'status',
            'notes',
            'approved_by',
            'return_condition'
        ],
        include: [
            {
                model: Equipment,
                as: 'equipment',
                attributes: ['name', 'serial_number']
            },
            {
                model: User,
                as: 'user',
                attributes: ['username', 'email']
            },
            {
                model: User,
                as: 'approver',
                attributes: ['username']
            }
        ],
        order: [['request_date', 'DESC']]
    };

    if (!pagination) {
        return await Request.findAll(queryOptions);
    }

    return await Request.findAndCountAll({
        ...queryOptions,
        distinct: true,
        limit: pagination.limit,
        offset: pagination.offset
    });
};

/**
 * Admin: Fetches all requests with filters
 */
const getAllRequestsAdmin = async (filters = {}, pagination = null) => {
    const { status, equipment_id, user_id } = filters;
    let whereClause = {};

    if (status) whereClause.status = status;
    if (equipment_id) whereClause.equipment_id = equipment_id;
    if (user_id) whereClause.user_id = user_id;

    const queryOptions = {
        where: whereClause,
        attributes: [
            'id',
            'user_id',
            'equipment_id',
            'quantity',
            'request_date',
            'due_date',
            'return_date',
            'status',
            'notes',
            'approved_by',
            'return_condition',
            'return_notes',
            'created_at',
            'updated_at'
        ],
        include: [
            {
                model: Equipment,
                as: 'equipment',
                attributes: ['id', 'name', 'type', 'serial_number']
            },
            {
                model: User,
                as: 'user',
                attributes: ['id', 'username', 'email']
            }
        ],
        order: [['created_at', 'DESC']]
    };

    if (!pagination) {
        return await Request.findAll(queryOptions);
    }

    return await Request.findAndCountAll({
        ...queryOptions,
        distinct: true,
        limit: pagination.limit,
        offset: pagination.offset
    });
};

/**
 * Admin/Owner: Deletes a request
 */
const deleteRequest = async (requestId, actorId, actorRole) => {
    const request = await Request.findByPk(requestId);
    if (!request) throw new Error('Request not found');

    const deletableStatuses = ['pending', 'returned', 'rejected'];
    const isOwner = Number(request.user_id) === Number(actorId);
    const isDeletable = deletableStatuses.includes(request.status);

    if (actorRole === 'student') {
        if (!isOwner || !isDeletable) {
            console.error(`[AUTH] Delete Forbidden: Role=${actorRole}, isOwner=${isOwner}, isDeletable=${isDeletable}, UserID=${actorId}, RequestOwner=${request.user_id}, Status=${request.status}`);
            throw new Error('Forbidden');
        }
    }

    return await request.destroy();
};

const getEquipmentHistory = async (equipmentId, pagination = null) => {
    const queryOptions = {
        where: { equipment_id: equipmentId },
        attributes: [
            'id',
            'user_id',
            'equipment_id',
            'quantity',
            'request_date',
            'due_date',
            'return_date',
            'status',
            'notes',
            'approved_by',
            'return_condition',
            'return_notes',
            'created_at',
            'updated_at'
        ],
        include: [
            { model: User, as: 'user', attributes: ['username', 'email'] },
            { model: User, as: 'approver', attributes: ['username'] }
        ],
        order: [['created_at', 'DESC']]
    };

    if (!pagination) {
        return await Request.findAll(queryOptions);
    }

    return await Request.findAndCountAll({
        ...queryOptions,
        distinct: true,
        limit: pagination.limit,
        offset: pagination.offset
    });
};

const getUserHistory = async (userId, pagination = null) => {
    const queryOptions = {
        where: { user_id: userId },
        attributes: [
            'id',
            'user_id',
            'equipment_id',
            'quantity',
            'request_date',
            'due_date',
            'return_date',
            'status',
            'notes',
            'approved_by',
            'return_condition',
            'return_notes',
            'created_at',
            'updated_at'
        ],
        include: [
            { model: Equipment, as: 'equipment', attributes: ['name', 'serial_number'] },
            { model: User, as: 'approver', attributes: ['username'] }
        ],
        order: [['created_at', 'DESC']]
    };

    if (!pagination) {
        return await Request.findAll(queryOptions);
    }

    return await Request.findAndCountAll({
        ...queryOptions,
        distinct: true,
        limit: pagination.limit,
        offset: pagination.offset
    });
};

const getRequestConditionHistory = async (requestId, pagination = null) => {
    const request = await Request.findByPk(requestId);
    if (!request) {
        throw new Error('Request not found');
    }

    const queryOptions = {
        where: { request_id: requestId },
        attributes: ['id', 'request_id', 'equipment_id', 'condition', 'notes', 'recorded_at', 'created_at'],
        include: [
            {
                model: Request,
                as: 'request',
                attributes: ['id', 'user_id', 'equipment_id', 'quantity', 'request_date', 'due_date', 'return_date', 'status'],
                include: [
                    { model: User, as: 'user', attributes: ['username', 'email'] },
                    { model: Equipment, as: 'equipment', attributes: ['id', 'name', 'serial_number'] }
                ]
            }
        ],
        order: [['recorded_at', 'DESC'], ['created_at', 'DESC']]
    };

    if (!pagination) {
        return await ReturnConditionLog.findAll(queryOptions);
    }

    return await ReturnConditionLog.findAndCountAll({
        ...queryOptions,
        distinct: true,
        limit: pagination.limit,
        offset: pagination.offset
    });
};

const clearHistoryData = async () => {
    await sequelize.query('TRUNCATE return_condition_logs, requests RESTART IDENTITY CASCADE');
};

module.exports = {
    createBorrowRequest,
    getMyRequests,
    getAllRequestsAdmin,
    deleteRequest,
    approveRequest,
    rejectRequest,
    returnRequest,
    getUsageReport,
    getHistoryReport,
    getEquipmentHistory,
    getUserHistory,
    getRequestConditionHistory,
    clearHistoryData
};
