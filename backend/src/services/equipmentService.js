const {Equipment, Request, User, ReturnConditionLog, Room} = require('../../models');
const {Op} = require('sequelize');

const isInitialConditionLogSchemaMismatch = (error) => (
    error?.name === 'SequelizeDatabaseError'
    && error?.original?.column === 'request_id'
    && /null value/i.test(error?.original?.message || '')
);

const getEquipmentById = async (id) => {
    return await Equipment.findByPk(id, {
        include: [{
            model: Room,
            as: 'room',
            attributes: ['id', 'name']
        }]
    });
};

const getAllEquipment = async (filters, pagination = null) => {
    const {search, type, status, condition} = filters;
    let whereClause = {};

    if (search) {
        whereClause[Op.or] = [
            {name: {[Op.iLike]: `%${search}%`}},
            {type: {[Op.iLike]: `%${search}%`}},
            {serial_number: {[Op.iLike]: `%${search}%`}}
        ];
    }

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;
    if (condition) whereClause.condition = condition;
    if (filters.room_id) whereClause.room_id = filters.room_id;

    const queryOptions = {
        where: whereClause,
        attributes: [
            'id',
            'name',
            'type',
            'serial_number',
            'condition',
            'status',
            'location',
            'photo_url',
            'quantity',
            'room_id',
            'created_at',
            'updated_at'
        ],
        order: [['updated_at', 'DESC'], ['id', 'DESC']]
    };

    if (!pagination) {
        return await Equipment.findAll(queryOptions);
    }

    return await Equipment.findAndCountAll({
        ...queryOptions,
        limit: pagination.limit,
        offset: pagination.offset
    });
};

const createEquipment = async (data) => {
    const equipment = await Equipment.create(data);

    if (equipment.condition) {
        try {
            await ReturnConditionLog.create({
                request_id: null,
                equipment_id: equipment.id,
                condition: equipment.condition,
                notes: 'Initial registration',
                recorded_at: new Date()
            });
        } catch (error) {
            if (isInitialConditionLogSchemaMismatch(error)) {
                console.warn('[equipment-service] skipped initial condition log because request_id is still NOT NULL in the database schema');
                return equipment;
            }

            await equipment.destroy();
            throw error;
            const requestIdConstraintIssue = typeof error.message === 'string' && error.message.includes('request_id');
            if (!requestIdConstraintIssue) {
                throw error;
            }
        }
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
    return await equipment.update({status});
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
const getUserRequests = async (userId, pagination = null) => {
    try {
        const queryOptions = {
            where: {user_id: userId},
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
                attributes: ['id', 'name', 'type', 'serial_number']
            }],
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
    } catch (error) {
        console.error("Database error in getUserRequests:", error);
        throw error;
    }
};

// BE-016: Всички заявки за админ панела с филтри
const getAllRequestsAdmin = async (filters, pagination = null) => {
    const {status, user_id, equipment_id, startDate, endDate} = filters;
    let whereClause = {};

    if (status) whereClause.status = status;
    if (user_id) whereClause.user_id = user_id;
    if (equipment_id) whereClause.equipment_id = equipment_id;

    if (startDate || endDate) {
        whereClause.request_date = {};
        if (startDate) whereClause.request_date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.request_date[Op.lte] = new Date(endDate);
    }

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

const getEquipmentConditionHistory = async (equipmentId, pagination = null) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) {
        throw new Error('Equipment not found');
    }

    const queryOptions = {
        where: {equipment_id: equipmentId},
        attributes: ['id', 'request_id', 'equipment_id', 'condition', 'notes', 'recorded_at', 'created_at'],
        include: [
            {
                model: Request,
                as: 'request',
                attributes: ['id', 'user_id', 'quantity', 'request_date', 'due_date', 'return_date', 'status'],
                include: [{model: User, as: 'user', attributes: ['username']}]
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
