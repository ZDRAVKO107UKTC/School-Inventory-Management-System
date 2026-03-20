const { Request, Equipment, User, ReturnConditionLog, sequelize } = require('../../models');
const { Op, fn, col } = require('sequelize');

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

    if (!Number.isInteger(requestData.quantity) || requestData.quantity < 1) {
        const error = new Error('Quantity must be a positive integer');
        error.statusCode = 400;
        throw error;
    }

    if (requestData.quantity > equipment.quantity) {
        const error = new Error('Requested quantity exceeds available inventory');
        error.statusCode = 400;
        throw error;
    }

    return Request.create({
        user_id: requestData.user_id,
        equipment_id: requestData.equipment_id,
        quantity: requestData.quantity,
        request_date: requestData.request_date,
        due_date: requestData.due_date,
        notes: requestData.notes,
        status: 'pending'
    });
};

/**
 * Fetches requests for the logged-in user
 */
const getMyRequests = async (userId) => {
    return Request.findAll({
        where: { user_id: userId },
        include: [{ 
            model: Equipment, 
            as: 'equipment',
            attributes: ['id', 'name', 'type', 'serial_number', 'condition']
        }],
        order: [['created_at', 'DESC']]
    });
};

/**
 * Admin: Approves a request and updates inventory
 */
const approveRequest = async (requestId, approverId) => {
    return sequelize.transaction(async (transaction) => {
        const request = await Request.findByPk(requestId, {
            include: [{ model: Equipment, as: 'equipment' }],
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

        if (!request.equipment || request.equipment.status !== 'available') {
            const error = new Error('Equipment is no longer available');
            error.statusCode = 400;
            throw error;
        }

        if (request.quantity > request.equipment.quantity) {
            const error = new Error('Requested quantity exceeds available inventory');
            error.statusCode = 400;
            throw error;
        }

        request.status = 'approved';
        request.approved_by = approverId;
        await request.save({ transaction });

        request.equipment.quantity -= request.quantity;
        request.equipment.status = request.equipment.quantity === 0 ? 'checked_out' : 'available';
        await request.equipment.save({ transaction });

        return request;
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

    // Update request
    request.status = 'approved';
    request.approved_by = approverId;
    await request.save();

    // Update equipment inventory
    request.equipment.quantity -= request.quantity;
    request.equipment.status = request.equipment.quantity === 0 ? 'checked_out' : 'available';
    await request.equipment.save();

    return request;
};

/**
 * Admin: Rejects a request
 */
const rejectRequest = async (requestId, rejectorId, reason) => {
    const request = await Request.findByPk(requestId);
    if (!request) throw new Error('Request not found');
    
    request.status = 'rejected';
    if (reason) request.notes = reason;
    await request.save();
    return request;
};

/**
 * User: Returns equipment
 */
const returnRequest = async (requestId, userId, condition, notes, actorRole) => {
    const request = await Request.findByPk(requestId, {
        include: [{ model: Equipment, as: 'equipment' }]
    });
};

/**
 * BE-021: Borrowing history by equipment
 */
const getEquipmentHistory = async (equipmentId) => {
    return Request.findAll({
        where: { equipment_id: equipmentId },
        attributes: HISTORY_REQUEST_ATTRIBUTES,
        include: HISTORY_INCLUDES,
        order: [['request_date', 'DESC'], ['created_at', 'DESC']]
    });
};

/**
 * BE-022: Usage Report
 */
const getUsageReport = async (filters = {}) => {
    const whereClause = buildHistoryWhereClause(filters);

    return Request.findAll({
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
        group: ['Request.equipment_id', 'equipment.id'],
        order: [[fn('COUNT', col('Request.id')), 'DESC']]
    });
};

/**
 * BE-023: Request history report
 */
const getHistoryReport = async (filters = {}) => {
    const whereClause = buildHistoryWhereClause(filters);

    return Request.findAll({
        where: whereClause,
        attributes: HISTORY_REQUEST_ATTRIBUTES,
        include: HISTORY_INCLUDES,
        order: [['request_date', 'DESC'], ['created_at', 'DESC']]
    });
};

const getRequestConditionHistory = async (requestId) => {
    const request = await Request.findByPk(requestId);

    if (!request) {
        const error = new Error('Request not found');
        error.statusCode = 404;
        throw error;
    }

    // Admins and teachers can return any request; students can only return their own
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
    await request.save();
    
    // BE-024: Create historical condition log
    if (condition) {
        await ReturnConditionLog.create({
            request_id: request.id,
            equipment_id: request.equipment_id,
            condition: condition,
            notes: notes || 'Returned',
            recorded_at: new Date()
        });
    }

    // Restore equipment quantity and update condition/status
    request.equipment.quantity += request.quantity;
    request.equipment.status = 'available';
    if (condition) request.equipment.condition = condition;
    await request.equipment.save();

    return request;
};

/**
 * BE-022: Usage Report
 */
const getUsageReport = async (filters) => {
    const { startDate, endDate } = filters;
    let whereClause = {};

    if (startDate || endDate) {
        whereClause.request_date = {};
        if (startDate) whereClause.request_date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.request_date[Op.lte] = new Date(endDate);
    }

    return await Request.findAll({
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
        order: [[literal('total_requests'), 'DESC']]
    });
};

/**
 * BE-023: History Report (ФИКСИРАН ЗА QUANTITY)
 */
const getHistoryReport = async (filters) => {
    const { startDate, endDate, status, equipment_id } = filters;
    let whereClause = {};

    if (startDate || endDate) {
        whereClause.request_date = {};
        if (startDate) whereClause.request_date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.request_date[Op.lte] = new Date(endDate);
    }

    if (status) whereClause.status = status;
    if (equipment_id) whereClause.equipment_id = equipment_id;

    return await Request.findAll({
        where: whereClause,
        // Изрично изброяваме колоните, за да избегнем грешката "column Request.quantity does not exist"
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
    });
};

/**
 * Admin: Fetches all requests with filters
 */
const getAllRequestsAdmin = async (filters = {}) => {
    const { status, equipment_id, user_id } = filters;
    let whereClause = {};

    if (status) whereClause.status = status;
    if (equipment_id) whereClause.equipment_id = equipment_id;
    if (user_id) whereClause.user_id = user_id;

    return await Request.findAll({
        where: whereClause,
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

    // Authorization: Admin/Teacher can delete any, user can delete their own only if pending/returned/rejected
    if (actorRole === 'student') {
        if (!isOwner || !isDeletable) {
            console.error(`[AUTH] Delete Forbidden: Role=${actorRole}, isOwner=${isOwner}, isDeletable=${isDeletable}, UserID=${actorId}, RequestOwner=${request.user_id}, Status=${request.status}`);
            throw new Error('Forbidden');
        }
    }

    return await request.destroy();
};
const getEquipmentHistory = async (equipmentId) => {
    return await Request.findAll({
        where: { equipment_id: equipmentId },
        include: [
            { model: User, as: 'user', attributes: ['username', 'email'] },
            { model: User, as: 'approver', attributes: ['username'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

const getUserHistory = async (userId) => {
    return await Request.findAll({
        where: { user_id: userId },
        include: [
            { model: Equipment, as: 'equipment', attributes: ['name', 'serial_number'] },
            { model: User, as: 'approver', attributes: ['username'] }
        ],
        order: [['created_at', 'DESC']]
    });
};

const clearHistoryData = async () => {
    // Using raw SQL TRUNCATE with CASCADE is the most reliable way to clear these related tables in Postgres
    await sequelize.query('TRUNCATE return_condition_logs, requests RESTART IDENTITY CASCADE');
};

module.exports = {
    createBorrowRequest,
    getMyRequests,
    getAllRequestsAdmin, // Added
    deleteRequest,      // Added
    approveRequest,
    rejectRequest,
    returnRequest,
    getUsageReport,
    getHistoryReport,
    getEquipmentHistory,
    getUserHistory,
    clearHistoryData
};
