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

module.exports = {
    createBorrowRequest,
    getMyRequests
};