const { Floor, Room, Equipment } = require('../../models');

/**
 * Get all floors with their rooms
 */
const getAllFloors = async (req, res) => {
    try {
        const floors = await Floor.findAll({
            include: [{
                model: Room,
                as: 'rooms'
            }],
            order: [['level', 'ASC'], ['name', 'ASC']]
        });
        return res.status(200).json({ floors });
    } catch (error) {
        console.error('Error fetching floors:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new floor (Admin only)
 */
const createFloor = async (req, res) => {
    try {
        const { name, level } = req.body;
        const floor = await Floor.create({ name, level });
        return res.status(201).json({ floor });
    } catch (error) {
        console.error('Error creating floor:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update a floor (Admin only)
 */
const updateFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, level } = req.body;
        const floor = await Floor.findByPk(id);
        if (!floor) return res.status(404).json({ message: 'Floor not found' });
        
        await floor.update({ name, level });
        return res.status(200).json({ floor });
    } catch (error) {
        console.error('Error updating floor:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Delete a floor (Admin only)
 */
const deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const floor = await Floor.findByPk(id);
        if (!floor) return res.status(404).json({ message: 'Floor not found' });
        
        await floor.destroy();
        return res.status(200).json({ message: 'Floor deleted successfully' });
    } catch (error) {
        console.error('Error deleting floor:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Create a new room (Admin only)
 */
const createRoom = async (req, res) => {
    try {
        const { floor_id, name, path_data, x, y, width, height } = req.body;
        const room = await Room.create({ floor_id, name, path_data, x, y, width, height });
        return res.status(201).json({ room });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Update a room (Admin only)
 */
const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, path_data, x, y, width, height } = req.body;
        const room = await Room.findByPk(id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        
        await room.update({ name, path_data, x, y, width, height });
        return res.status(200).json({ room });
    } catch (error) {
        console.error('Error updating room:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Delete a room (Admin only)
 */
const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findByPk(id);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        
        await room.destroy();
        return res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Assign equipment to a room (Admin only)
 */
const assignEquipmentToRoom = async (req, res) => {
    try {
        const { equipment_id, room_id } = req.body;
        const equipment = await Equipment.findByPk(equipment_id);
        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
        
        if (room_id) {
            const room = await Room.findByPk(room_id);
            if (!room) return res.status(404).json({ message: 'Room not found' });
        }
        
        await equipment.update({ room_id });
        return res.status(200).json({ equipment });
    } catch (error) {
        console.error('Error assigning equipment to room:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getAllFloors,
    createFloor,
    updateFloor,
    deleteFloor,
    createRoom,
    updateRoom,
    deleteRoom,
    assignEquipmentToRoom
};
