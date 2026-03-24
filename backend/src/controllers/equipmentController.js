const equipmentService = require('../services/equipmentService');
const { uploadMedia: uploadMediaToStorage } = require('../services/storageService');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');
const {
    serializeEquipmentWithPreview,
    serializeEquipmentCollectionWithPreview
} = require('../utils/equipmentMedia');

const normalizeEquipmentPayload = (payload) => {
    const normalized = { ...payload };

    for (const field of ['name', 'type', 'condition', 'status']) {
        if (typeof normalized[field] === 'string') {
            normalized[field] = normalized[field].trim();
        }
    }

    for (const field of ['serial_number', 'location', 'photo_url']) {
        if (typeof normalized[field] === 'string') {
            normalized[field] = normalized[field].trim();
            if (normalized[field] === '') {
                normalized[field] = null;
            }
        }
    }

    if (normalized.room_id === '' || normalized.room_id === undefined) {
        delete normalized.room_id;
    }

    return normalized;
};

const handleEquipmentPersistenceError = (res, error) => {
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            message: error.errors?.[0]?.message || 'Invalid equipment payload'
        });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
            message: 'Equipment with this serial number already exists'
        });
    }

    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(400).json({
            message: 'Selected room does not exist'
        });
    }

    return null;
};

const normalizeOptionalString = (value) => {
    if (value === undefined || value === null) {
        return undefined;
    }

    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
};

const normalizeEquipmentPayload = (body, { isPartial = false } = {}) => {
    const payload = { ...body };

    if (!isPartial || payload.quantity !== undefined) {
        payload.quantity = payload.quantity === undefined ? 1 : Number(payload.quantity);
    }

    if (!isPartial || payload.serial_number !== undefined) {
        payload.serial_number = normalizeOptionalString(payload.serial_number);
    }

    if (!isPartial || payload.location !== undefined) {
        payload.location = normalizeOptionalString(payload.location);
    }

    if (!isPartial || payload.photo_url !== undefined) {
        payload.photo_url = normalizeOptionalString(payload.photo_url);
    }

    return payload;
};

const isPersistenceError = (error) => ['SequelizeValidationError', 'SequelizeUniqueConstraintError'].includes(error.name);

const getEquipmentDetails = async (req, res) => {
    try {
        const {id} = req.params;
        const equipment = await equipmentService.getEquipmentById(id);
        if (!equipment) return res.status(404).json({ message: `Equipment with ID ${id} not found` });
        return res.status(200).json(serializeEquipmentWithPreview(equipment));
    } catch (error) {
        return res.status(500).json({message: "Internal Server Error"});
    }
};

const getEquipment = async (req, res) => {
    try {
        const filters = req.query;
        const pagination = resolvePagination(req.query);
        const result = await equipmentService.getAllEquipment(filters, pagination);

        if (!pagination) {
            return res.status(200).json(serializeEquipmentCollectionWithPreview(result));
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json(serializeEquipmentCollectionWithPreview(result.rows));
    } catch (error) {
        res.status(500).json({error: "Failed to fetch equipment"});
    }
};

const getConditionHistory = async (req, res) => {
    try {
        const {id} = req.params;
        const pagination = resolvePagination(req.query);
        const result = await equipmentService.getEquipmentConditionHistory(id, pagination);

        if (!pagination) {
            return res.status(200).json(result);
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json(result.rows);
    } catch (error) {
        if (error.message === 'Equipment not found') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({message: "Internal Server Error"});
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
        const deleted = await equipmentService.deleteEquipment(id);
        if (!deleted) {
            return res.status(404).json({message: "Equipment not found"});
        }
        return res.status(200).json({message: "Deleted successfully"});
    } catch (error) {
        if (error.message === 'Cannot delete equipment that is not retired') {
            return res.status(400).json({message: error.message});
        }
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
        const payload = normalizeEquipmentPayload(req.body);
        const { name, type, condition, quantity } = payload;

        if (!name || !type || !condition || quantity === undefined) {
            return res.status(400).json({
                message: "Missing required fields: name, type, condition, quantity"
            });
        }

        const validConditions = ['new', 'good', 'fair', 'damaged'];
        if (!validConditions.includes(condition)) {
            return res.status(400).json({
                message: `Invalid condition. Allowed values: ${validConditions.join(', ')}`
            });
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({
                message: "Quantity must be a non-negative integer"
            });
        }

        const equipment = await equipmentService.createEquipment(payload);

        return res.status(201).json({
            message: "Equipment created successfully",
            equipment: serializeEquipmentWithPreview(equipment)
        });
    } catch (error) {
        if (isPersistenceError(error)) {
            return res.status(400).json({ message: error.errors?.[0]?.message || error.message });
        }
        console.error("Error creating equipment:", error);
        return handleEquipmentPersistenceError(res, error)
            || res.status(500).json({message: "Internal Server Error"});
    }
};

const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = normalizeEquipmentPayload(req.body);
        // Basic validation
        if (data.quantity !== undefined && data.quantity < 0) {
            return res.status(400).json({ message: "Quantity must be a non-negative number" });
        const data = normalizeEquipmentPayload(req.body, { isPartial: true });

        if (data.quantity !== undefined && (!Number.isInteger(data.quantity) || data.quantity < 0)) {
            return res.status(400).json({ message: "Quantity must be a non-negative integer" });
        }

        const updatedEquipment = await equipmentService.updateEquipment(id, data);
        if (!updatedEquipment) return res.status(404).json({ message: "Equipment not found" });
        return res.status(200).json({
            message: "Equipment updated successfully",
            equipment: serializeEquipmentWithPreview(updatedEquipment)
        });
    } catch (error) {
        if (isPersistenceError(error)) {
            return res.status(400).json({ message: error.errors?.[0]?.message || error.message });
        }
        console.error("Error updating equipment:", error);
        return handleEquipmentPersistenceError(res, error)
            || res.status(500).json({ message: "Internal Server Error" });
    }
};

const uploadMedia = async (req, res) => {
    try {
        const upload = await uploadMediaToStorage({
            fileName: req.body.file_name,
            contentType: req.body.content_type,
            dataBase64: req.body.data_base64,
            remoteUrl: req.body.remote_url,
            folder: req.body.folder
        });

        return res.status(201).json({
            message: 'Media uploaded successfully',
            upload
        });
    } catch (error) {
        console.error('Error uploading equipment media:', error);
        const statusCode = /not configured|no supported storage provider/i.test(error.message) ? 503 : 400;
        return res.status(statusCode).json({ message: error.message || 'Media upload failed' });
    }
};

module.exports = {
    getEquipmentDetails,
    getEquipment,
    getConditionHistory,
    updateStatus,
    deleteEquipment,
    createEquipment,
    updateEquipment,
    uploadMedia
};
