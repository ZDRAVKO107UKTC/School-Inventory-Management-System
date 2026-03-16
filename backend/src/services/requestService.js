const { Request, Equipment } = require('../../models');

const createBorrowRequest = async (requestData) => {
    const equipment = await Equipment.findByPk(requestData.equipment_id);
    if (!equipment) {
        const error = new Error("Equipment not found");
        error.statusCode = 404;
        throw error;
    }

    // Since 'is_sensitive' doesn't exist in your model yet,
    // we default to 'pending' to be safe, or you can add the column later.
    const initialStatus = 'pending';

    return await Request.create({
        user_id: requestData.user_id,
        equipment_id: requestData.equipment_id,
        request_date: requestData.request_date,
        due_date: requestData.due_date,
        notes: requestData.notes,
        status: initialStatus
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

    // Update request status to approved
    request.status = 'approved';
    request.approved_by = approverId;
    await request.save();

    // Update equipment status to checked_out
    request.equipment.status = 'checked_out';
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

    // Update equipment status to available
    request.equipment.status = 'available';
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