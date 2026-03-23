const requestService = require('../services/requestService');
const notificationService = require('../services/notificationService');
const { Parser } = require('json2csv');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');

/**
 * BE-022: Usage Report
 */
const getUsageReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const pagination = resolvePagination(req.query);
        const reportResult = await requestService.getUsageReport({ startDate, endDate }, pagination);
        const report = pagination ? reportResult.rows : reportResult;
        
        // Flatten for frontend
        const flatData = report.map(item => ({
            name: item.equipment?.name || `ID ${item.equipment_id}`,
            borrowCount: parseInt(item.getDataValue('total_requests') || 0)
        }));

        if (pagination) {
            const paginationMeta = buildPaginationMeta(reportResult.count, pagination);
            applyPaginationHeaders(res, paginationMeta);
            return res.status(200).json({ generated_at: new Date(), data: flatData, pagination: paginationMeta });
        }

        return res.status(200).json({ generated_at: new Date(), data: flatData });
    } catch (error) {
        console.error('Usage Report Error:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * BE-023: History Report
 */
const getHistoryReport = async (req, res) => {
    try {
        const pagination = resolvePagination(req.query);
        const reportResult = await requestService.getHistoryReport(req.query, pagination);
        const report = pagination ? reportResult.rows : reportResult;
        const flatData = report.map(item => ({
            id: item.id,
            request_date: item.request_date,
            status: item.status,
            quantity: item.quantity,
            equipment: item.equipment?.name || 'N/A',
            user: item.user?.username || 'Unknown'
        }));

        if (pagination) {
            const paginationMeta = buildPaginationMeta(reportResult.count, pagination);
            applyPaginationHeaders(res, paginationMeta);
            return res.status(200).json({ generated_at: new Date(), data: flatData, pagination: paginationMeta });
        }

        return res.status(200).json({ generated_at: new Date(), data: flatData });
    } catch (error) {
        console.error('History Report Error:', error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * BE-024: Export Report to CSV
 */
const exportReport = async (req, res) => {
    try {
        const report = await requestService.getHistoryReport(req.query);

        const fields = ['id', 'request_date', 'status', 'quantity', 'equipment_name', 'requested_by'];
        if (report.length === 0) {
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse([]); // Header only
            res.header('Content-Type', 'text/csv');
            res.attachment(`inventory_report_empty_${new Date().getTime()}.csv`);
            return res.send(csv);
        }

        const data = report.map(item => ({
            id: item.id,
            request_date: item.request_date,
            status: item.status,
            quantity: item.quantity,
            equipment_name: item.equipment?.name || 'N/A',
            requested_by: item.user?.username || 'Unknown'
        }));

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(data);

        res.header('Content-Type', 'text/csv');
        res.attachment(`inventory_report_${new Date().getTime()}.csv`);
        return res.send(csv);

    } catch (error) {
        console.error('Export Error:', error);
        return res.status(500).json({ message: "Export failed" });
    }
};

/**
 * Reset History
 */
const clearHistory = async (req, res) => {
    try {
        await requestService.clearHistoryData();
        return res.status(200).json({ message: "History cleared successfully" });
    } catch (error) {
        console.error('Clear History Error:', error);
        return res.status(500).json({ message: "Failed to clear history" });
    }
};

const getNotificationSummary = async (_req, res) => {
    try {
        const summary = await notificationService.getNotificationSummary();
        return res.status(200).json(summary);
    } catch (error) {
        console.error('Notification Summary Error:', error);
        return res.status(500).json({ message: 'Failed to load notification summary' });
    }
};

const runNotificationCycle = async (_req, res) => {
    try {
        const result = await notificationService.processNotificationCycle();
        return res.status(200).json({
            message: 'Notification cycle completed',
            result
        });
    } catch (error) {
        console.error('Notification Run Error:', error);
        return res.status(500).json({ message: 'Failed to run notification cycle' });
    }
};

module.exports = {
    getUsageReport,
    getHistoryReport,
    exportReport,
    clearHistory,
    getNotificationSummary,
    runNotificationCycle
};
