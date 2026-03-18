const { Request, Equipment } = require('../../models');

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

const getMyRequests = async (userId) => {
    return await Request.findAll({
        where: { user_id: userId },
        include: [{ model: Equipment, as: 'equipment' }], // Matches the alias in your model
        order: [['created_at', 'DESC']]
    });
};

const approveRequest = async (requestId, approverId) => {
    const request = await Request.findByPk(requestId, {
        include: [{ model: Equipment, as: 'equipment' }]
    });

    if (!request) {
        throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
        throw new Error('Only pending requests can be approved');
    }

    // Recheck equipment availability
    if (request.equipment.status !== 'available') {
        throw new Error('Equipment is no longer available');
    }

    if (request.quantity > request.equipment.quantity) {
        throw new Error('Requested quantity exceeds available inventory');
    }

    // Update request status to approved
    request.status = 'approved';
    request.approved_by = approverId;
    await request.save();

    // Reduce available inventory and mark the item checked out only when stock reaches zero.
    request.equipment.quantity -= request.quantity;
    request.equipment.status = request.equipment.quantity === 0 ? 'checked_out' : 'available';
    await request.equipment.save();

    return request;
};

const rejectRequest = async (requestId, rejectorId, reason) => {
    const request = await Request.findByPk(requestId);

    if (!request) {
        throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
        throw new Error('Only pending requests can be rejected');
    }

    // Update request status to rejected
    request.status = 'rejected';
    if (reason) {
        request.notes = reason; // Store rejection reason in notes
    }
    await request.save();

    return request;
};

const returnRequest = async (requestId, userId, condition, notes) => {
    const request = await Request.findByPk(requestId, {
        include: [{ model: Equipment, as: 'equipment' }]
    });

    if (!request) {
        throw new Error('Request not found');
    }

    if (request.user_id !== userId) {
        throw new Error('You can only return your own requests');
    }

    if (request.status !== 'approved') {
        throw new Error('Only approved requests can be returned');
    }

    // Update request status to returned
    request.status = 'returned';
    request.return_date = new Date();
    if (condition) {
        request.return_condition = condition;
    }
    if (notes) {
        request.return_notes = notes;
    }
    await request.save();

    // Restore returned inventory and keep the latest reported condition.
    request.equipment.quantity += request.quantity;
    request.equipment.status = 'available';
    if (condition) {
        request.equipment.condition = condition;
    }
    await request.equipment.save();

    return request;
};

module.exports = {
    createBorrowRequest,
    getMyRequests,
    approveRequest,
    rejectRequest,
    returnRequest
};
