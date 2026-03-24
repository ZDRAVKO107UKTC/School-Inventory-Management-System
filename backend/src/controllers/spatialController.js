const { Floor, Room, Equipment, sequelize } = require('../../models');

const normalizeOptionalString = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
};

const parseOptionalInteger = (value) => {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : null;
};

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
        const name = normalizeOptionalString(req.body.name);
        const level = parseOptionalInteger(req.body.level);

        if (!name) {
            return res.status(400).json({ message: 'Floor name is required' });
        }

        if (level === null || level === undefined || level < 0) {
            return res.status(400).json({ message: 'Floor level must be a non-negative integer' });
        }

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
        const name = normalizeOptionalString(req.body.name);
        const level = parseOptionalInteger(req.body.level);

        if (name === null) {
            return res.status(400).json({ message: 'Floor name cannot be empty' });
        }

        if (level === null) {
            return res.status(400).json({ message: 'Floor level must be a non-negative integer' });
        }

        if (name === undefined && level === undefined) {
            return res.status(400).json({ message: 'At least one floor field must be provided' });
        }

        const floor = await Floor.findByPk(id);
        if (!floor) return res.status(404).json({ message: 'Floor not found' });

        await floor.update({
            ...(name !== undefined ? { name } : {}),
            ...(level !== undefined ? { level } : {})
        });
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
        const floor = await Floor.findByPk(id, {
            include: [{ model: Room, as: 'rooms', attributes: ['id'] }]
        });
        if (!floor) return res.status(404).json({ message: 'Floor not found' });

        await sequelize.transaction(async (transaction) => {
            const roomIds = floor.rooms.map((room) => room.id);

            if (roomIds.length > 0) {
                await Equipment.update({ room_id: null }, {
                    where: { room_id: roomIds },
                    transaction
                });

                await Room.destroy({
                    where: { floor_id: floor.id },
                    transaction
                });
            }

            await floor.destroy({ transaction });
        });

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
        const floor_id = parseOptionalInteger(req.body.floor_id);
        const name = normalizeOptionalString(req.body.name);
        const path_data = normalizeOptionalString(req.body.path_data);
        const x = parseOptionalInteger(req.body.x);
        const y = parseOptionalInteger(req.body.y);
        const width = parseOptionalInteger(req.body.width);
        const height = parseOptionalInteger(req.body.height);

        if (floor_id === null || floor_id === undefined) {
            return res.status(400).json({ message: 'A valid floor_id is required' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Room name is required' });
        }

        if ([x, y, width, height].some((value) => value === null)) {
            return res.status(400).json({ message: 'Room coordinates and dimensions must be integers' });
        }

        const floor = await Floor.findByPk(floor_id);
        if (!floor) {
            return res.status(404).json({ message: 'Floor not found' });
        }

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
        const name = normalizeOptionalString(req.body.name);
        const path_data = normalizeOptionalString(req.body.path_data);
        const x = parseOptionalInteger(req.body.x);
        const y = parseOptionalInteger(req.body.y);
        const width = parseOptionalInteger(req.body.width);
        const height = parseOptionalInteger(req.body.height);

        if (name === null) {
            return res.status(400).json({ message: 'Room name cannot be empty' });
        }

        if ([x, y, width, height].some((value) => value === null)) {
            return res.status(400).json({ message: 'Room coordinates and dimensions must be integers' });
        }

        if (name === undefined && path_data === undefined && x === undefined && y === undefined && width === undefined && height === undefined) {
            return res.status(400).json({ message: 'At least one room field must be provided' });
        }

        const room = await Room.findByPk(id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        await room.update({
            ...(name !== undefined ? { name } : {}),
            ...(path_data !== undefined ? { path_data } : {}),
            ...(x !== undefined ? { x } : {}),
            ...(y !== undefined ? { y } : {}),
            ...(width !== undefined ? { width } : {}),
            ...(height !== undefined ? { height } : {})
        });
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

        await sequelize.transaction(async (transaction) => {
            await Equipment.update({ room_id: null }, {
                where: { room_id: room.id },
                transaction
            });

            await room.destroy({ transaction });
        });

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
        const equipment_id = parseOptionalInteger(req.body.equipment_id);
        const room_id = req.body.room_id === null ? null : parseOptionalInteger(req.body.room_id);

        if (equipment_id === null || equipment_id === undefined) {
            return res.status(400).json({ message: 'A valid equipment_id is required' });
        }

        if (room_id === null && req.body.room_id !== null && req.body.room_id !== undefined) {
            return res.status(400).json({ message: 'room_id must be an integer or null' });
        }

        const equipment = await Equipment.findByPk(equipment_id);
        if (!equipment) return res.status(404).json({ message: 'Equipment not found' });

        if (room_id !== null && room_id !== undefined) {
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
