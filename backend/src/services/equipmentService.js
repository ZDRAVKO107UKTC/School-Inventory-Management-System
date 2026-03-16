const { Equipment } = require('../../models');
const { Op } = require('sequelize');

const getEquipmentById = async (id) => {
    return await Equipment.findByPk(id);
};

const getAllEquipment = async (filters) => {
    const { search, type, status } = filters;
    let whereClause = {};

    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { serial_number: { [Op.iLike]: `%${search}%` } }
        ];
    }

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    return await Equipment.findAll({ where: whereClause });
};

const createEquipment = async (data) => {
    return await Equipment.create(data);
};

const updateEquipment = async (id, data) => {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) return null;
    
    return await equipment.update(data);
};

module.exports = { 
    getEquipmentById, 
    getAllEquipment, 
    createEquipment,
    updateEquipment
};