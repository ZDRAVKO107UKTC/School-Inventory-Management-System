const requestService = require('../services/requestService');
const { Parser } = require('json2csv');

/**
 * BE-022: Usage Report
 */
const getUsageReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const report = await requestService.getUsageReport({ startDate, endDate });
        return res.status(200).json({ generated_at: new Date(), data: report });
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
        const report = await requestService.getHistoryReport(req.query);
        const flatData = report.map(item => ({
            id: item.id,
            request_date: item.request_date,
            status: item.status,
            quantity: item.quantity,
            equipment: item.equipment?.name || 'N/A',
            user: item.user?.username || 'Unknown'
        }));
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
        // Вземаме данните от същия сървис, който ползваме за History
        const report = await requestService.getHistoryReport(req.query);

        if (report.length === 0) {
            return res.status(404).json({ message: "No data found for export" });
        }

        // Мапваме ги за CSV формат
        const fields = ['id', 'request_date', 'status', 'quantity', 'equipment_name', 'requested_by'];
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

        // Настройваме хедърите, за да знае браузърът, че това е файл за теглене
        res.header('Content-Type', 'text/csv');
        res.attachment(`inventory_report_${new Date().getTime()}.csv`);
        return res.send(csv);

    } catch (error) {
        console.error('Export Error:', error);
        return res.status(500).json({ message: "Export failed" });
    }
};

module.exports = {
    getUsageReport,
    getHistoryReport,
    exportReport
};