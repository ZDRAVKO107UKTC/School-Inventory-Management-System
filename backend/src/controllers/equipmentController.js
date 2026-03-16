const equipmentService = require('../services/equipmentService');

const getEquipmentDetails = async (req, res) => {
    try {
        const {id} = req.params;
        const equipment = await equipmentService.getEquipmentById(id);
        if (!equipment) return res.status(404).json({ message: `Equipment with ID ${id} not found` });
        return res.status(200).json(equipment);
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"});
    }
};

const getEquipment = async (req, res) => {
    try {
        const filters = req.query;
        const list = await equipmentService.getAllEquipment(filters);
        res.status(200).json(list);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch equipment"});
    }
};

const updateStatus = async (req, res) => {
    try {
        const {id} = req.params;
        const {status} = req.body;
        const updatedEquipment = await equipmentService.updateEquipmentStatus(id, status);
        if (!updatedEquipment) return res.status(404).json({message: "Not found"});
        return res.status(200).json(updatedEquipment);
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"});
    }
};

const deleteEquipment = async (req, res) => {
    try {
        const {id} = req.params;
        await equipmentService.deleteEquipment(id);
        return res.status(200).json({message: "Deleted successfully"});
    } catch (error) {
        return res.status(500).json({message: error.message});
    }
};

const getMyRequests = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId; 
        const requests = await equipmentService.getUserRequests(userId);
        return res.status(200).json(requests);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getAdminRequests = async (req, res) => {
    try {
        const filters = req.query;
        const requests = await equipmentService.getAllRequestsAdmin(filters);
        return res.status(200).json(requests);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const submitRequest = async (req, res) => {
    try {
        const { equipment_id, notes } = req.body;
        const user_id = req.user.id || req.user.userId;
        const newRequest = await equipmentService.createRequest({ user_id, equipment_id, notes });
        return res.status(201).json(newRequest);
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const createEquipment = async (req, res) => {
    try {
        const { name, type, condition, quantity } = req.body;

        // Validate required fields
        if (!name || !type || !condition || quantity === undefined) {
            return res.status(400).json({
                message: "Missing required fields: name, type, condition, quantity"
            });
        }

        // Validate condition
        const validConditions = ['new', 'good', 'fair', 'damaged'];
        if (!validConditions.includes(condition)) {
            return res.status(400).json({
                message: `Invalid condition. Allowed values: ${validConditions.join(', ')}`
            });
        }

        // Validate quantity
        if (quantity < 0) {
            return res.status(400).json({
                message: "Quantity must be a non-negative number"
            });
        }

        const equipment = await equipmentService.createEquipment(req.body);

        return res.status(201).json({
            message: "Equipment created successfully",
            equipment
        });
    } catch (error) {
        console.error("Error creating equipment:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

module.exports = {
    getEquipmentDetails,
    getEquipment,
    updateStatus,
    deleteEquipment,
    createEquipment,

}
