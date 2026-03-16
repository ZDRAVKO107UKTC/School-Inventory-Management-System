const requestService = require('../services/requestService');

const submitRequest = async (req, res) => {
    try {
        const { equipment_id, request_date, due_date, notes } = req.body;
        const user_id = req.user.userId; // From authMiddleware (authenticated user)

        // Acceptance Criteria: Date Validation
        const start = new Date(request_date);
        const end = new Date(due_date);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (start < today) {
            return res.status(400).json({ message: "Borrow date cannot be in the past" });
        }

        if (end <= start) {
            return res.status(400).json({ message: "Due date must be after the borrow date" });
        }

        const newRequest = await requestService.createBorrowRequest({
            user_id,
            equipment_id,
            request_date,
            due_date,
            notes
        });

        res.status(201).json(newRequest);
    } catch (error) {
        console.error("Request Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getUserRequests = async (req, res) => {
    try {
        const requests = await requestService.getMyRequests(req.user.userId);
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch your requests" });
    }
};

module.exports = { submitRequest, getUserRequests };