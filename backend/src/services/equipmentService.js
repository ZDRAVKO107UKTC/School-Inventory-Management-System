const { Equipment } = require('../../models'); // Points to your models/index.js

const getEquipmentById = async (id) => {
    // findByPk is the Sequelize method for "Find By Primary Key"
    return await Equipment.findByPk(id);
};

module.exports = {
    getEquipmentById,
};
//Tuk mahnah povtorniq declaration na { Equipment }
const { Op } = require('sequelize');

const getAllEquipment = async (filters) => {
    const { search, type, status } = filters;
    let whereClause = {};

    // Търсене по име ИЛИ сериен номер (case-insensitive)
    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { serial_number: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // Филтър по точно съвпадение на тип или статус
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    return await Equipment.findAll({ where: whereClause });
};

module.exports = { getAllEquipment };

const updateEquipmentStatus = async (id, status) => {
    const equipment = await getEquipmentById(id);
    if (!equipment) {
        return null;
    }
    equipment.status = status;
    await equipment.save();
    return equipment;
}

module.exports = {
    getEquipmentById,
    updateEquipmentStatus,
}