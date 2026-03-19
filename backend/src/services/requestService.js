const {Request, Equipment, ReturnConditionLog, User} = require('../../models');

/**
 * Creates a new borrow request with full validation
 */
const createBorrowRequest = async (requestData) => {
    const equipment = await Equipment.findByPk(requestData.equipment_id);
    
    if (!equipment) {
        const error = new Error("Equipment not found");
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

    return await Request.create({
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
    return await Request.findAll({
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
    const request = await Request.findByPk(requestId, {
        include: [{ model: Equipment, as: 'equipment' }]
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
const returnRequest = async (requestId, userId, condition, notes) => {
    const request = await Request.findByPk(requestId, {
        include: [{ model: Equipment, as: 'equipment' }]
    });

    if (!request || request.user_id !== userId) {
        throw new Error('Request not found or unauthorized');
    }

    request.status = 'returned';
    request.return_date = new Date();
    if (condition) request.return_condition = condition;
    await request.save();

    // Update equipment
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
            [fn('SUM', col('quantity')), 'total_quantity_borrowed']
        ],
        include: [{
            model: Equipment,
            as: 'equipment',
            attributes: ['id', 'name', 'type', 'serial_number']
        }],
        group: ['equipment_id', 'equipment.id'],
        order: [[fn('COUNT', col('Request.id')), 'DESC']]
    });
};

const getRequestConditionHistory = async (requestId) => {
    const request = await Request.findByPk(requestId, {
        include: [
            {
                model: ReturnConditionLog,
                as: 'conditionLogs',
                attributes: ['id', 'condition', 'notes', 'recorded_at', 'created_at']
            },
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
        ]
    });

    if (!request) {
        throw new Error('Request not found');
    }

    return request.conditionLogs.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
};

const getUserHistory = async (userId) => {
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

module.exports = {
    createBorrowRequest,
    getMyRequests,
    approveRequest,
    rejectRequest,
    returnRequest,
    getEquipmentHistory,
    getRequestConditionHistory,
    getUserHistory,
};
