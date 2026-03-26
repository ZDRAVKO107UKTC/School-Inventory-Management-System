const requestService = require('../services/requestService');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');
const { validationResult } = require('express-validator');
const xss = require('xss');

const submitRequest = async (req, res) => {
    // 1. Check for Validation Errors (Blocks bad data types/SQLi characters)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { equipment_id, request_date, due_date, notes, quantity = 1 } = req.body;
        const user_id = req.user.userId;

        const start = new Date(request_date);
        const end = new Date(due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({ message: "Borrow date cannot be in the past" });
        }

        if (end <= start) {
            return res.status(400).json({ message: "Due date must be after the borrow date" });
        }

        // 2. XSS Sanitization: Clean the notes field
        const sanitizedNotes = notes ? xss(notes) : '';

        const newRequest = await requestService.createBorrowRequest({
            user_id,
            equipment_id,
            quantity,
            request_date,
            due_date,
            notes: sanitizedNotes
        });

        return res.status(201).json(newRequest);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error("Request Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const getUserRequests = async (req, res) => {
    try {
        const pagination = resolvePagination(req.query);
        const result = await requestService.getMyRequests(req.user.userId, pagination);

        if (!pagination) {
            return res.status(200).json(result);
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching user requests:', error);
        return res.status(500).json({ message: "Failed to fetch your requests" });
    }
};

const getAdminRequests = async (req, res) => {
    try {
        const pagination = resolvePagination(req.query);
        const result = await requestService.getAllRequestsAdmin(req.query || {}, pagination);

        if (!pagination) {
            return res.status(200).json({ requests: result });
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json({ requests: result.rows, pagination: paginationMeta });
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const approverId = req.user.userId;
        const actorRole = req.user.role;

        const request = await requestService.approveRequest(id, approverId, actorRole);

        return res.status(200).json({
            message: 'Request approved successfully',
            request
        });
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({ message: error.message });
        }
        if (
            error.message === 'Only pending requests can be approved' ||
            error.message === 'Equipment is no longer available' ||
            error.message === 'Requested quantity exceeds available inventory'
        ) {
            return res.status(400).json({ message: error.message });
        }

        console.error('Error approving request:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const rejectorId = req.user.userId;

        // SANITIZATION: Clean the rejection reason
        const sanitizedReason = reason ? xss(reason) : '';
        const actorRole = req.user.role;

        const request = await requestService.rejectRequest(id, rejectorId, sanitizedReason, actorRole);

        return res.status(200).json({
            message: 'Request rejected successfully',
            request
        });
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({ message: error.message });
        }

        if (error.message === 'Only pending requests can be rejected') {
            return res.status(400).json({ message: error.message });
        }

        console.error('Error rejecting request:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const returnRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { condition, notes } = req.body;
        const userId = req.user.userId;
        const actorRole = req.user.role;
        const validConditions = ['new', 'good', 'fair', 'damaged'];

        if (!condition || !validConditions.includes(condition)) {
            return res.status(400).json({
                message: `Valid return condition is required. Allowed values: ${validConditions.join(', ')}`
            });
        }

        // SANITIZATION: Clean the return notes
        const sanitizedNotes = notes ? xss(notes) : '';

        const request = await requestService.returnRequest(id, userId, condition, sanitizedNotes, actorRole);

        return res.status(200).json({
            message: 'Request returned successfully',
            request
        });
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Only approved requests can be returned' || error.message === 'You can only return your own requests') {
            return res.status(400).json({ message: error.message });
        }

        console.error('Error returning request:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getEquipmentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const pagination = resolvePagination(req.query);
        const result = await requestService.getEquipmentHistory(id, pagination);

        if (!pagination) {
            return res.status(200).json(result);
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching equipment history:', error);
        return res.status(500).json({ message: "Failed to fetch equipment history" });
    }
};

const getUserHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const pagination = resolvePagination(req.query);
        const result = await requestService.getUserHistory(id, pagination);

        if (!pagination) {
            return res.status(200).json(result);
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching user history:', error);
        return res.status(500).json({ message: "Failed to fetch user history" });
    }
};

const getRequestConditionHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const pagination = resolvePagination(req.query);
        const result = await requestService.getRequestConditionHistory(id, pagination);

        if (!pagination) {
            return res.status(200).json(result);
        }

        const paginationMeta = buildPaginationMeta(result.count, pagination);
        applyPaginationHeaders(res, paginationMeta);
        return res.status(200).json(result.rows);
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({ message: error.message });
        }
        console.error('Error fetching request condition history:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const actorId = req.user.userId;
        const actorRole = req.user.role;

        await requestService.deleteRequest(id, actorId, actorRole);

        return res.status(200).json({ message: 'Request deleted successfully' });
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({ message: error.message });
        }
        if (error.message === 'Forbidden') {
            return res.status(403).json({ message: 'Forbidden: cannot delete this request' });
        }
        console.error('Error deleting request:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    submitRequest,
    getUserRequests,
    getAdminRequests,
    approveRequest,
    rejectRequest,
    returnRequest,
    deleteRequest,
    getEquipmentHistory,
    getUserHistory,
    getRequestConditionHistory
};