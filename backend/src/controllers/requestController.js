const requestService = require('../services/requestService');

const submitRequest = async (req, res) => {
    try {
        const {equipment_id, request_date, due_date, notes, quantity = 1} = req.body;
        const user_id = req.user.userId; // From authMiddleware (authenticated user)

        const start = new Date(request_date);
        const end = new Date(due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            return res.status(400).json({message: "Borrow date cannot be in the past"});
        }

        if (end <= start) {
            return res.status(400).json({message: "Due date must be after the borrow date"});
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({message: "Quantity must be a positive integer"});
        }

        const newRequest = await requestService.createBorrowRequest({
            user_id,
            equipment_id,
            quantity,
            request_date,
            due_date,
            notes
        });

        return res.status(201).json(newRequest);
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({message: error.message});
        }
        console.error("Request Error:", error);
        res.status(500).json({message: "Internal Server Error"});
    }
};

const getUserRequests = async (req, res) => {
    try {
        const requests = await requestService.getMyRequests(req.user.userId);
        return res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching user requests:', error);
        res.status(500).json({message: "Failed to fetch your requests"});
    }
};

const getAdminRequests = async (req, res) => {
    try {
        const requests = await requestService.getAllRequestsAdmin(req.query || {});
        return res.status(200).json({ requests });
    } catch (error) {
        console.error('Error fetching admin requests:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const approveRequest = async (req, res) => {
    try {
        const {id} = req.params;
        const approverId = req.user.userId; // Assuming req.user has userId

        const request = await requestService.approveRequest(id, approverId);

        return res.status(200).json({
            message: 'Request approved successfully',
            request
        });
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({message: error.message});
        }
        if (
            error.message === 'Only pending requests can be approved' ||
            error.message === 'Equipment is no longer available' ||
            error.message === 'Requested quantity exceeds available inventory'
        ) {
            return res.status(400).json({message: error.message});
        }

        console.error('Error approving request:', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};

const rejectRequest = async (req, res) => {
    try {
        const {id} = req.params;
        const {reason} = req.body; // Optional rejection reason
        const rejectorId = req.user.userId;
        const request = await requestService.rejectRequest(id, rejectorId, reason);

        return res.status(200).json({
            message: 'Request rejected successfully',
            request
        });
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({message: error.message});
        }

        if (error.message === 'Only pending requests can be rejected') {
            return res.status(400).json({message: error.message});
        }

        console.error('Error rejecting request:', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};

const returnRequest = async (req, res) => {
    try {
        const {id} = req.params;
        const {condition, notes} = req.body; // Return condition and notes
        const userId = req.user.userId;
        const actorRole = req.user.role;
        const validConditions = ['new', 'good', 'fair', 'damaged'];

        if (!condition || !validConditions.includes(condition)) {
            return res.status(400).json({
                message: `Valid return condition is required. Allowed values: ${validConditions.join(', ')}`
            });
        }

        const request = await requestService.returnRequest(id, userId, condition, notes, actorRole);

        return res.status(200).json({
            message: 'Request returned successfully',
            request
        });
    } catch (error) {
        if (error.message === 'Request not found') {
            return res.status(404).json({message: error.message});
        }
        if (error.message === 'Only approved requests can be returned' || error.message === 'You can only return your own requests') {
            return res.status(400).json({message: error.message});
        }

        console.error('Error returning request:', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};

const getEquipmentHistory = async (req, res) => {
    try {
        const {id} = req.params;
        const history = await requestService.getEquipmentHistory(id);
        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching equipment history:', error);
        res.status(500).json({message: "Failed to fetch equipment history"});
    }
};

const getUserHistory = async (req, res) => {
    try {
        const {id} = req.params;
        const history = await requestService.getUserHistory(id);
        res.status(200).json(history);
    } catch (error) {
        console.error('Error fetching user history:', error);
        res.status(500).json({message: "Failed to fetch user history"});
    }
};

const getRequestConditionHistory = async (req, res) => {
    try {
        const {id} = req.params;
        // Тъй като в сервиза нямаш специфичен метод за това, връщаме стандартен успех
        // за да не гърми маршрутизатора при старт.
        res.status(200).json({ message: "Condition history for request " + id });
    } catch (error) {
        console.error('Error fetching request condition history:', error);
        res.status(500).json({message: "Internal Server Error"});
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
    getAdminRequests, // Added
    approveRequest,
    rejectRequest,
    returnRequest,
    deleteRequest,   // Added
    getEquipmentHistory,
    getUserHistory,
    getRequestConditionHistory
};
