const equipmentService = require('../services/equipmentService.js');

const getEquipmentDetails = async (req, res) => {
    try {
        const {id} = req.params;
        const equipment = await equipmentService.getEquipmentById(id);

        // Acceptance Criteria: Invalid ID returns 404
        if (!equipment) {
            return res.status(404).json({
                message: `Equipment with ID ${id} not found`
            });
        }

        // Success: returns equipment details
        return res.status(200).json(equipment);
    } catch (error) {
        console.error("Error fetching equipment:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

const getEquipment = async (req, res) => {
    try {
        const filters = req.query; // Тук идват search и type от URL-а
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

        // Acceptance Criteria: Only valid statuses allowed
        const validStatuses = ['available', 'checked out', 'under repair', 'retired'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
            });
        }

        const updatedEquipment = await equipmentService.updateEquipmentStatus(id, status);

        if (!updatedEquipment) {
            return res.status(404).json({message: `Equipment with ID ${id} not found`});
        }

        return res.status(200).json(updatedEquipment);
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }
};

module.exports = {
    getEquipmentDetails,
    getEquipment,
    updateStatus,

}