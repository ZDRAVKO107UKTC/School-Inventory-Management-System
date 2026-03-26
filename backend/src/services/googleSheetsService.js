const { google } = require('googleapis');

const createBackupSheet = async (ownerEmail, inventoryData, historyData) => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';

  if (!clientEmail || !privateKey) {
    console.warn("Google Sheets credentials are not configured. Returning mock success.");
    return {
      success: true,
      url: "https://docs.google.com/spreadsheets/d/mock-sheet-url/edit",
      mock: true
    };
  }

  try {
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
    );

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Create Spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: `SIMS Backup - ${new Date().toISOString().split('T')[0]}`
        },
        sheets: [
          { properties: { title: 'Inventory' } },
          { properties: { title: 'Borrow History' } }
        ]
      },
      fields: 'spreadsheetId,spreadsheetUrl'
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    const spreadsheetUrl = spreadsheet.data.spreadsheetUrl;

    // 2. Prepare Data
    const inventoryRows = [
      ['ID', 'Name', 'Type', 'Status', 'Total Quantity', 'Available Quantity'],
      ...inventoryData.map(item => [
        item.id, item.name, item.type, item.status, item.totalQuantity, item.availableQuantity
      ])
    ];

    const historyRows = [
      ['ID', 'Request Date', 'Status', 'Quantity', 'Equipment', 'Requested By'],
      ...historyData.map(req => [
        req.id, 
        req.request_date, 
        req.status, 
        req.quantity, 
        req.equipment?.name || 'N/A', 
        req.user?.username || 'System'
      ])
    ];

    // 3. Write Data
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: 'Inventory!A1', values: inventoryRows },
          { range: 'Borrow History!A1', values: historyRows }
        ]
      }
    });

    // 4. Share with Admin
    if (ownerEmail) {
      await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: ownerEmail
        },
        sendNotificationEmail: true
      });
    }

    return {
      success: true,
      url: spreadsheetUrl,
      mock: false
    };

  } catch (error) {
    console.error("Google Sheets Service Error:", error);
    throw error;
  }
};

module.exports = {
  createBackupSheet
};
