const { Floor, Room, Equipment } = require('../../models');

const hasField = (body, field) => Object.prototype.hasOwnProperty.call(body || {}, field);
const normalizeName = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizePathData = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return typeof value === 'string' ? value.trim() : value;
};
const parseInteger = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : Number.NaN;
};
const isInvalidInteger = (value) => Number.isNaN(value);

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

const createFloor = async (req, res) => {
    try {
        const name = normalizeName(req.body.name);
        const level = parseInteger(req.body.level);

        if (!name) {
            return res.status(400).json({ message: 'Floor name is required' });
        }

        if (level === null || isInvalidInteger(level)) {
            return res.status(400).json({ message: 'Floor level must be an integer' });
        }

        const floor = await Floor.create({ name, level });
        return res.status(201).json({ floor });
    } catch (error) {
        console.error('Error creating floor:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const floor = await Floor.findByPk(id);
        if (!floor) {
            return res.status(404).json({ message: 'Floor not found' });
        }

        if (!hasField(req.body, 'name') && !hasField(req.body, 'level')) {
            return res.status(400).json({ message: 'At least one of name or level is required' });
        }

        const updates = {};

        if (hasField(req.body, 'name')) {
            const name = normalizeName(req.body.name);
            if (!name) {
                return res.status(400).json({ message: 'Floor name cannot be empty' });
            }
            updates.name = name;
        }

        if (hasField(req.body, 'level')) {
            const level = parseInteger(req.body.level);
            if (level === null || isInvalidInteger(level)) {
                return res.status(400).json({ message: 'Floor level must be an integer' });
            }
            updates.level = level;
        }

        await floor.update(updates);
        return res.status(200).json({ floor });
    } catch (error) {
        console.error('Error updating floor:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;
        const floor = await Floor.findByPk(id);
        if (!floor) {
            return res.status(404).json({ message: 'Floor not found' });
        }

        await floor.destroy();
        return res.status(200).json({ message: 'Floor deleted successfully' });
    } catch (error) {
        console.error('Error deleting floor:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const createRoom = async (req, res) => {
    try {
        const floorId = parseInteger(req.body.floor_id);
        const name = normalizeName(req.body.name);
        const pathData = normalizePathData(req.body.path_data);
        const x = parseInteger(req.body.x);
        const y = parseInteger(req.body.y);
        const width = parseInteger(req.body.width);
        const height = parseInteger(req.body.height);

        if (floorId === null || isInvalidInteger(floorId) || floorId < 1) {
            return res.status(400).json({ message: 'floor_id must be a positive integer' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Room name is required' });
        }

        if (pathData !== null && typeof pathData !== 'string') {
            return res.status(400).json({ message: 'path_data must be a string' });
        }

        if (isInvalidInteger(x) || isInvalidInteger(y)) {
            return res.status(400).json({ message: 'x and y must be integers when provided' });
        }

        if ((width !== null && isInvalidInteger(width)) || (height !== null && isInvalidInteger(height))) {
            return res.status(400).json({ message: 'width and height must be integers when provided' });
        }

        if ((width !== null && width < 1) || (height !== null && height < 1)) {
            return res.status(400).json({ message: 'width and height must be at least 1 when provided' });
        }

        const floor = await Floor.findByPk(floorId);
        if (!floor) {
            return res.status(404).json({ message: 'Floor not found' });
        }

        const room = await Room.create({
            floor_id: floorId,
            name,
            path_data: pathData,
            x,
            y,
            width,
            height
        });
        return res.status(201).json({ room });
    } catch (error) {
        console.error('Error creating room:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findByPk(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        const roomFields = ['floor_id', 'name', 'path_data', 'x', 'y', 'width', 'height'];
        if (!roomFields.some((field) => hasField(req.body, field))) {
            return res.status(400).json({ message: 'At least one room field is required' });
        }

        const updates = {};

        if (hasField(req.body, 'floor_id')) {
            const floorId = parseInteger(req.body.floor_id);
            if (floorId === null || isInvalidInteger(floorId) || floorId < 1) {
                return res.status(400).json({ message: 'floor_id must be a positive integer' });
            }

            const floor = await Floor.findByPk(floorId);
            if (!floor) {
                return res.status(404).json({ message: 'Floor not found' });
            }

            updates.floor_id = floorId;
        }

        if (hasField(req.body, 'name')) {
            const name = normalizeName(req.body.name);
            if (!name) {
                return res.status(400).json({ message: 'Room name cannot be empty' });
            }
            updates.name = name;
        }

        if (hasField(req.body, 'path_data')) {
            const pathData = normalizePathData(req.body.path_data);
            if (pathData !== null && typeof pathData !== 'string') {
                return res.status(400).json({ message: 'path_data must be a string' });
            }
            updates.path_data = pathData;
        }

        for (const field of ['x', 'y']) {
            if (hasField(req.body, field)) {
                const parsed = parseInteger(req.body[field]);
                if (parsed !== null && isInvalidInteger(parsed)) {
                    return res.status(400).json({ message: `${field} must be an integer when provided` });
                }
                updates[field] = parsed;
            }
        }

        for (const field of ['width', 'height']) {
            if (hasField(req.body, field)) {
                const parsed = parseInteger(req.body[field]);
                if (parsed !== null && (isInvalidInteger(parsed) || parsed < 1)) {
                    return res.status(400).json({ message: `${field} must be an integer greater than or equal to 1 when provided` });
                }
                updates[field] = parsed;
            }
        }

        await room.update(updates);
        return res.status(200).json({ room });
    } catch (error) {
        console.error('Error updating room:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await Room.findByPk(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        await room.destroy();
        return res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const assignEquipmentToRoom = async (req, res) => {
    try {
        const equipmentId = parseInteger(req.body.equipment_id);
        const rawRoomId = req.body.room_id;
        const roomId = parseInteger(rawRoomId);

        if (equipmentId === null || isInvalidInteger(equipmentId) || equipmentId < 1) {
            return res.status(400).json({ message: 'equipment_id must be a positive integer' });
        }

        if (rawRoomId !== null && rawRoomId !== undefined && rawRoomId !== '' && (isInvalidInteger(roomId) || roomId < 1)) {
            return res.status(400).json({ message: 'room_id must be a positive integer or null' });
        }

        const equipment = await Equipment.findByPk(equipmentId);
        if (!equipment) {
            return res.status(404).json({ message: 'Equipment not found' });
        }

        if (roomId !== null) {
            const room = await Room.findByPk(roomId);
            if (!room) {
                return res.status(404).json({ message: 'Room not found' });
            }
        }

        await equipment.update({ room_id: roomId });
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
