const equipmentService = require('../services/equipmentService');

const getEquipmentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const equipment = await equipmentService.getEquipmentById(id);

        if (!equipment) {
            return res.status(404).json({
                message: `Equipment with ID ${id} not found`
            });
        }

        return res.status(200).json(equipment);
    } catch (error) {
        console.error("Error fetching equipment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getEquipment = async (req, res) => {
    try {
        const filters = req.query;
        const list = await equipmentService.getAllEquipment(filters);
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch equipment" });
    }
};

const createEquipment = async (req, res) => {
    try {
        const { name, type, condition, status, serial_number, location, quantity } = req.body;

        if (!name || !type || !condition) {
            return res.status(400).json({ 
                message: "Name, type, and condition are required fields." 
            });
        }

        const newItem = await equipmentService.createEquipment({
            name,
            type,
            condition,
            status: status || 'available',
            serial_number,
            location,
            quantity: quantity || 1
        });

        return res.status(201).json({
            message: "Equipment created successfully",
            equipment: newItem
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Serial number already exists" });
        }
        console.error("Error creating equipment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Валидация: Ако тялото на заявката е празно
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No update data provided" });
        }

        const updatedItem = await equipmentService.updateEquipment(id, updateData);

        if (!updatedItem) {
            return res.status(404).json({ message: `Equipment with ID ${id} not found` });
        }

        return res.status(200).json({
            message: "Equipment updated successfully",
            equipment: updatedItem
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: "Serial number already exists" });
        }
        console.error("Error updating equipment:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = { 
    getEquipmentDetails, 
    getEquipment, 
    createEquipment,
    updateEquipment
};