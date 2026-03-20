const { Equipment, Request, User, ReturnConditionLog } = require('../../models');
const { Op } = require('sequelize');

const getEquipmentById = async (id) => {
    return await Equipment.findByPk(id);
};

const getAllEquipment = async (filters) => {
    const { search, type, status, condition } = filters;
    let whereClause = {};

    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { type: { [Op.iLike]: `%${search}%` } },
            { serial_number: { [Op.iLike]: `%${search}%` } }
        ];
    }

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (condition) whereClause.condition = condition;
    if (filters.room_id) whereClause.room_id = filters.room_id;

    return await Equipment.findAll({ where: whereClause });
};

const createEquipment = async (data) => {
    const equipment = await Equipment.create(data);
    
    // Log initial condition
    if (equipment.condition) {
        await ReturnConditionLog.create({
            equipment_id: equipment.id,
            condition: equipment.condition,
            notes: 'Initial registration',
            recorded_at: new Date()
        });
    }
    
    return equipment;
};

const updateEquipment = async (id, data) => {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return null;
    return await equipment.update(data);
};

const updateEquipmentStatus = async (id, status) => {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return null;
    return await equipment.update({ status });
};

const deleteEquipment = async (id) => {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return null;

    if (equipment.status !== 'retired') {
        throw new Error('Cannot delete equipment that is not retired');
    }

    await equipment.destroy();
    return true;
};

// BE-015: Текущи заявки на потребителя (използва се в equipmentController)
const getUserRequests = async (userId) => {
    try {
        return await Request.findAll({
            where: { user_id: userId },
            include: [{
                model: Equipment,
                as: 'equipment',
                attributes: ['id', 'name', 'type', 'serial_number']
            }]
        });
    } catch (error) {
        console.error("Database error in getUserRequests:", error);
        throw error;
    }
};

// BE-016: Всички заявки за админ панела с филтри
const getAllRequestsAdmin = async (filters) => {
    const { status, user_id, equipment_id, startDate, endDate } = filters;
    let whereClause = {};

    if (status) whereClause.status = status;
    if (user_id) whereClause.user_id = user_id;
    if (equipment_id) whereClause.equipment_id = equipment_id;
    
    if (startDate || endDate) {
        whereClause.request_date = {};
        if (startDate) whereClause.request_date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.request_date[Op.lte] = new Date(endDate);
    }

    return await Request.findAll({
        where: whereClause,
        include: [
            {
                model: Equipment,
                as: 'equipment',
                attributes: ['id', 'name', 'serial_number'],
                include: [{
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'name']
                }]
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

// Помощен метод за създаване на заявка (ако се вика от equipmentController)
const createRequest = async (requestData) => {
    return await Request.create({
        user_id: requestData.user_id,
        equipment_id: requestData.equipment_id,
        request_date: new Date(),
        status: 'pending',
        notes: requestData.notes || ''
    });
};

const getEquipmentConditionHistory = async (equipmentId) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) {
        throw new Error('Equipment not found');
    }

    return await ReturnConditionLog.findAll({
        where: { equipment_id: equipmentId },
        include: [
            {
                model: Request,
                as: 'request',
                attributes: ['id', 'user_id', 'quantity', 'request_date', 'due_date', 'return_date', 'status'],
                include: [{ model: User, as: 'user', attributes: ['username'] }]
            },
            {
                model: Equipment,
                as: 'equipment',
                attributes: ['id', 'name', 'type', 'serial_number']
            }
        ],
        order: [['recorded_at', 'DESC'], ['created_at', 'DESC']]
    });
};

module.exports = { 
    getEquipmentById, 
    getAllEquipment, 
    createEquipment,
    updateEquipment,
    updateEquipmentStatus,
    deleteEquipment,
    getUserRequests,
    getAllRequestsAdmin,
    createRequest,
    getEquipmentConditionHistory
};