const equipmentService = require('../services/equipmentService');
const { uploadMedia: uploadMediaToStorage } = require('../services/storageService');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');
const fs = require('fs');
const path = require('path');
const { uploadStream } = require('../utils/cloudinaryClient');
const logFile = path.join(__dirname, '../../../error_log.txt');

const generateRandomSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `SN-${segment()}-${segment()}`;
};

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
        const pagination = resolvePagination(req.query);
        const result = await equipmentService.getAllEquipment(filters, pagination);

        if (!pagination) {
            return res.status(200).json(result);
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json(result.rows);
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
        const data = { ...req.body };
        // If serial number is empty or null, generate a random one
        if (!data.serial_number || data.serial_number === '') {
            data.serial_number = generateRandomSerial();
        }

        const equipment = await equipmentService.createEquipment(data);

        return res.status(201).json({
            message: "Equipment created successfully",
            equipment
        });
    } catch (error) {
        const detail = `[${new Date().toISOString()}] CREATE ERROR: ${error.stack}\nBody: ${JSON.stringify(req.body)}\n`;
        fs.appendFileSync(logFile, detail);
        
        // Return 400 for uniqueness or validation errors so they show in alert
        const isValidationError = error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError';
        return res.status(isValidationError ? 400 : 500).json({ 
            message: error.message || "Failed to create equipment" 
        });
    }
};

const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = { ...req.body };
        if (data.serial_number === '') data.serial_number = null;
        
        const updatedEquipment = await equipmentService.updateEquipment(id, data);
        if (!updatedEquipment) return res.status(404).json({ message: "Equipment not found" });
        return res.status(200).json({ message: "Equipment updated successfully", equipment: updatedEquipment });
    } catch (error) {
        const detail = `[${new Date().toISOString()}] UPDATE ERROR (ID ${req.params.id}): ${error.stack}\nBody: ${JSON.stringify(req.body)}\n`;
        fs.appendFileSync(logFile, detail);
        
        const isValidationError = error.name === 'SequelizeUniqueConstraintError' || error.name === 'SequelizeValidationError';
        return res.status(isValidationError ? 400 : 500).json({ 
            message: error.message || "Failed to update equipment"
        });
    }
};

const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
        
        const filename = req.file.originalname;
        const safeFilename = `${Date.now()}_${filename.replace(/[^a-z0-9.]/gi, '_')}`;

        let uploadResult;
        try {
            uploadResult = await uploadStream(req.file.buffer, {
                folder: 'sims/equipment',
                resource_type: 'auto',
                public_id: safeFilename.replace(/\.[^/.]+$/, "")
            });
        } catch (err) {
            console.warn('[equipment-service] Cloudinary upload failed. Falling back to local storage.');
            const uploadDir = path.join(__dirname, '../../public/uploads/equipment');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, safeFilename);
            fs.writeFileSync(filePath, req.file.buffer);
            
            uploadResult = {
                secure_url: `/uploads/equipment/${safeFilename}`,
                format: safeFilename.split('.').pop() || 'jpg'
            };
        }

        return res.status(200).json({
            message: 'File uploaded successfully',
            url: uploadResult.secure_url,
            format: uploadResult.format
        });
    } catch (error) {
        console.error("Upload error:", error);
        return res.status(500).json({ message: "Upload failed" });
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
    uploadMedia,
    uploadFile
};
