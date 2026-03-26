const requestService = require('../services/requestService');
const equipmentService = require('../services/equipmentService');
const notificationService = require('../services/notificationService');
const { getEmailProvider, isEmailEnabled, isEmailConfigured, getFromAddress } = require('../services/emailService');
const { getStorageStatus } = require('../services/storageService');
const {
    exportRowsToGoogleSheet,
    getGoogleSheetsStatus
} = require('../services/documentProviderService');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { resolvePagination, buildPaginationMeta, applyPaginationHeaders } = require('../utils/pagination');

const readAggregateValue = (item, key) => (
    typeof item?.getDataValue === 'function' ? item.getDataValue(key) : item?.[key]
);

const buildUsageReportRows = (report) => report.map(item => ({
    name: item.equipment?.name || `ID ${item.equipment_id}`,
    borrowCount: parseInt(readAggregateValue(item, 'total_requests') || 0, 10),
    totalQuantityBorrowed: parseInt(readAggregateValue(item, 'total_quantity_borrowed') || 0, 10)
}));

const buildHistoryReportRows = (report) => report.map(item => ({
    id: item.id,
    request_date: item.request_date,
    due_date: item.due_date,
    return_date: item.return_date,
    status: item.status,
    quantity: item.quantity,
    equipment: item.equipment?.name || 'N/A',
    user: item.user?.username || 'Unknown',
    requested_by: item.user?.username || 'Unknown',
    approver: item.approver?.username || 'N/A',
    return_condition: item.return_condition || 'N/A'
}));

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
        const flatData = buildUsageReportRows(report);

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
        const flatData = buildHistoryReportRows(report);

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
        const format = String(req.query.format || 'csv').toLowerCase();

        const rows = buildHistoryReportRows(report).map(item => ({
            id: item.id,
            request_date: item.request_date,
            due_date: item.due_date,
            return_date: item.return_date,
            status: item.status,
            quantity: item.quantity,
            equipment_name: item.equipment,
            requested_by: item.requested_by,
            approver: item.approver,
            return_condition: item.return_condition
        }));

        if (format === 'pdf') {
            const fileName = `inventory_report_${Date.now()}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

            const doc = new PDFDocument({ margin: 36, size: 'A4' });
            doc.pipe(res);

            doc.fontSize(16).text('Inventory History Report');
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor('#555').text(`Generated: ${new Date().toISOString()}`);
            doc.moveDown(1);
            doc.fillColor('#000');

            if (rows.length === 0) {
                doc.fontSize(12).text('No records found for the selected filters.');
                doc.end();
                return;
            }

            rows.forEach((row, index) => {
                doc.fontSize(11).text(`${index + 1}. Request #${row.id} - ${row.equipment_name}`);
                doc.fontSize(9)
                    .text(`Status: ${row.status} | Qty: ${row.quantity} | Requested by: ${row.requested_by} | Approver: ${row.approver}`)
                    .text(`Request: ${row.request_date || 'N/A'} | Due: ${row.due_date || 'N/A'} | Return: ${row.return_date || 'N/A'}`)
                    .text(`Return condition: ${row.return_condition}`);
                doc.moveDown(0.7);

                if (doc.y > 760) {
                    doc.addPage();
                }
            });

            doc.end();
            return;
        }

        const fields = ['id', 'request_date', 'due_date', 'return_date', 'status', 'quantity', 'equipment_name', 'requested_by', 'approver', 'return_condition'];
        if (report.length === 0) {
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse([]); // Header only
            res.header('Content-Type', 'text/csv');
            res.attachment(`inventory_report_empty_${new Date().getTime()}.csv`);
            return res.send(csv);
        }

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(rows);

        res.header('Content-Type', 'text/csv');
        res.attachment(`inventory_report_${new Date().getTime()}.csv`);
        return res.send(csv);

    } catch (error) {
        console.error('Export Error:', error);
        return res.status(500).json({ message: "Export failed" });
    }
};

/**
 * BE-025: Export Backup to Google Sheets
 */
const exportToGoogleSheets = async (req, res) => {
    try {
        const inventoryData = await equipmentService.getAllEquipment({}, false);
        const historyData = await requestService.getHistoryReport({}, false);

        const inventoryRows = (Array.isArray(inventoryData) ? inventoryData : (inventoryData.rows || [])).map((item) => [
            item.id,
            item.name,
            item.type,
            item.status,
            item.totalQuantity ?? item.total_quantity ?? item.quantity ?? 0,
            item.availableQuantity ?? item.available_quantity ?? item.quantity ?? 0
        ]);

        const historyRows = (Array.isArray(historyData) ? historyData : (historyData.rows || [])).map((req) => [
            req.id,
            req.request_date,
            req.status,
            req.quantity,
            req.equipment?.name || 'N/A',
            req.user?.username || 'System'
        ]);

        const targetSpreadsheetId = process.env.GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID || undefined;

        const inventoryResult = await exportRowsToGoogleSheet({
            spreadsheetId: targetSpreadsheetId,
            sheetName: 'Inventory',
            headers: ['ID', 'Name', 'Type', 'Status', 'Total Quantity', 'Available Quantity'],
            rows: inventoryRows,
            writeMode: 'replace'
        });

        await exportRowsToGoogleSheet({
            spreadsheetId: targetSpreadsheetId || inventoryResult.spreadsheetId,
            sheetName: 'Borrow History',
            headers: ['ID', 'Request Date', 'Status', 'Quantity', 'Equipment', 'Requested By'],
            rows: historyRows,
            writeMode: 'replace'
        });

        return res.status(200).json({ 
            message: "Google Sheets backup created successfully",
            url: inventoryResult.spreadsheetUrl
        });
    } catch (error) {
        console.error('Google Sheets Export Error:', error);
        const googleSheetsStatus = getGoogleSheetsStatus();
        const statusCode = error.statusCode || Number(error?.code || error?.status || error?.response?.status || error?.cause?.code) || (/not configured/i.test(error.message) ? 503 : 500);
        const apiMessage = error?.response?.data?.error?.message || error?.cause?.message || error?.message || 'Unknown error';

        if (statusCode === 401) {
            return res.status(401).json({ message: `Google authentication failed: ${apiMessage}` });
        }

        if (statusCode === 403) {
            return res.status(403).json({
                message: `Google API permission denied: ${apiMessage}. Share the spreadsheet with the service account as Editor.`,
                service_account_email: googleSheetsStatus.serviceAccountEmail || null
            });
        }

        return res.status(statusCode).json({ message: `Backup to Google Sheets failed: ${apiMessage}` });
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

const getIntegrationStatus = async (_req, res) => {
    try {
        return res.status(200).json({
            email: {
                enabled: isEmailEnabled(),
                configured: isEmailConfigured(),
                provider: getEmailProvider(),
                from: getFromAddress()
            },
            storage: getStorageStatus(),
            documents: {
                googleSheets: getGoogleSheetsStatus()
            }
        });
    } catch (error) {
        console.error('Integration Status Error:', error);
        return res.status(500).json({ message: 'Failed to load integration status' });
    }
};

const exportReportToGoogleSheets = async (req, res) => {
    try {
        const {
            report_type: reportType,
            spreadsheet_id: spreadsheetId,
            spreadsheet_title: spreadsheetTitle,
            sheet_name: sheetName,
            write_mode: writeMode,
            startDate,
            endDate,
            status,
            equipment_id: equipmentId
        } = req.body;

        let headers;
        let rows;

        if (reportType === 'usage') {
            const report = await requestService.getUsageReport({ startDate, endDate });
            const flatData = buildUsageReportRows(report);
            headers = ['Equipment', 'Borrow Count', 'Total Quantity Borrowed'];
            rows = flatData.map((item) => [item.name, item.borrowCount, item.totalQuantityBorrowed]);
        } else {
            const report = await requestService.getHistoryReport({ startDate, endDate, status, equipment_id: equipmentId });
            const flatData = buildHistoryReportRows(report);
            headers = ['Request ID', 'Request Date', 'Due Date', 'Return Date', 'Status', 'Quantity', 'Equipment', 'Requested By', 'Approver', 'Return Condition'];
            rows = flatData.map((item) => [
                item.id,
                item.request_date,
                item.due_date,
                item.return_date,
                item.status,
                item.quantity,
                item.equipment,
                item.requested_by,
                item.approver,
                item.return_condition
            ]);
        }

        const result = await exportRowsToGoogleSheet({
            spreadsheetId,
            spreadsheetTitle,
            sheetName: sheetName || `${reportType}-report`,
            headers,
            rows,
            writeMode: writeMode || 'replace'
        });

        return res.status(201).json({
            message: 'Report exported to Google Sheets',
            report_type: reportType,
            result
        });
    } catch (error) {
        console.error('Google Sheets Export Error:', error);
        const googleSheetsStatus = getGoogleSheetsStatus();
        const statusCode = error.statusCode
            || (/not configured/i.test(error.message) ? 503 : 500);

        if (statusCode === 403) {
            return res.status(403).json({
                message: `${error.message}. Share the target spreadsheet with the configured Google service account as Editor.`,
                service_account_email: googleSheetsStatus.serviceAccountEmail || null
            });
        }

        if (statusCode === 404) {
            return res.status(404).json({
                message: `${error.message}. Check that spreadsheet_id is correct and the spreadsheet exists.`
            });
        }

        return res.status(statusCode).json({ message: error.message || 'Failed to export report to Google Sheets' });
    }
};

module.exports = {
    getUsageReport,
    getHistoryReport,
    exportReport,
    exportToGoogleSheets,
    clearHistory,
    getNotificationSummary,
    runNotificationCycle,
    getIntegrationStatus,
    exportReportToGoogleSheets
};
