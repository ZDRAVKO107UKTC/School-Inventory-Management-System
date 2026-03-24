'use strict';

const {
  getGoogleAccessToken,
  getGoogleServiceAccountConfig,
  isGoogleServiceAccountConfigured
} = require('./googleServiceAccount');

const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const sanitizeSheetName = (value, fallback = 'Inventory Export') => {
  const sanitized = String(value || fallback)
    .replace(/[\[\]\*\?\/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return sanitized.slice(0, 100) || fallback;
};

const toRange = (sheetName, cell = 'A1') => `${sheetName}!${cell}`;

const getGoogleSheetsStatus = () => ({
  configured: isGoogleServiceAccountConfigured(),
  defaultSpreadsheetId: process.env.GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID || null,
  serviceAccountEmail: getGoogleServiceAccountConfig()?.clientEmail || null
});

const googleSheetsRequest = async ({ method = 'GET', path, body = null }) => {
  const accessToken = await getGoogleAccessToken([GOOGLE_SHEETS_SCOPE]);
  const response = await fetch(`https://sheets.googleapis.com/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = payload.error?.message || 'Google Sheets API request failed';
    const error = new Error(errorMessage);
    error.statusCode = response.status;
    error.provider = 'google-sheets';
    throw error;
  }

  return payload;
};

const ensureSheet = async (spreadsheetId, sheetName) => {
  const metadata = await googleSheetsRequest({
    path: `/spreadsheets/${encodeURIComponent(spreadsheetId)}`
  });

  const existingSheet = metadata.sheets?.find((sheet) => sheet.properties?.title === sheetName);
  if (existingSheet) {
    return {
      spreadsheetId,
      spreadsheetUrl: metadata.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      sheetId: existingSheet.properties?.sheetId || null,
      sheetName,
      sheetCreated: false
    };
  }

  const batchUpdateResult = await googleSheetsRequest({
    method: 'POST',
    path: `/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`,
    body: {
      requests: [{
        addSheet: {
          properties: {
            title: sheetName
          }
        }
      }]
    }
  });

  return {
    spreadsheetId,
    spreadsheetUrl: metadata.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetId: batchUpdateResult.replies?.[0]?.addSheet?.properties?.sheetId || null,
    sheetName,
    sheetCreated: true
  };
};

const createSpreadsheet = async (spreadsheetTitle, sheetName) => {
  const payload = await googleSheetsRequest({
    method: 'POST',
    path: '/spreadsheets',
    body: {
      properties: {
        title: spreadsheetTitle
      },
      sheets: [{
        properties: {
          title: sheetName
        }
      }]
    }
  });

  return {
    spreadsheetId: payload.spreadsheetId,
    spreadsheetUrl: payload.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${payload.spreadsheetId}/edit`,
    sheetId: payload.sheets?.[0]?.properties?.sheetId || null,
    sheetName,
    sheetCreated: true
  };
};

const clearSheet = async (spreadsheetId, sheetName) => {
  await googleSheetsRequest({
    method: 'POST',
    path: `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(sheetName)}:clear`,
    body: {}
  });
};

const exportRowsToGoogleSheet = async ({
  spreadsheetId,
  spreadsheetTitle,
  sheetName,
  headers,
  rows,
  writeMode = 'replace'
}) => {
  if (!isGoogleServiceAccountConfigured()) {
    throw new Error('Google Sheets is not configured');
  }

  if (!Array.isArray(headers) || headers.length === 0) {
    throw new Error('Headers are required for Google Sheets export');
  }

  const safeSheetName = sanitizeSheetName(sheetName, process.env.GOOGLE_SHEETS_DEFAULT_SHEET_NAME || 'Inventory Export');
  const targetSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEETS_DEFAULT_SPREADSHEET_ID || null;

  const targetSpreadsheet = targetSpreadsheetId
    ? await ensureSheet(targetSpreadsheetId, safeSheetName)
    : await createSpreadsheet(spreadsheetTitle || `Inventory Export ${new Date().toISOString().slice(0, 10)}`, safeSheetName);

  if (writeMode === 'replace') {
    await clearSheet(targetSpreadsheet.spreadsheetId, safeSheetName);
  }

  const values = [headers, ...(Array.isArray(rows) ? rows : [])];
  if (writeMode === 'append') {
    const appendValues = targetSpreadsheet.sheetCreated ? values : (Array.isArray(rows) ? rows : []);

    if (appendValues.length === 0) {
      return {
        provider: 'google-sheets',
        spreadsheetId: targetSpreadsheet.spreadsheetId,
        spreadsheetUrl: targetSpreadsheet.spreadsheetUrl,
        sheetId: targetSpreadsheet.sheetId,
        sheetName: safeSheetName,
        updatedRange: null,
        updatedRows: 0
      };
    }

    const appendResult = await googleSheetsRequest({
      method: 'POST',
      path: `/spreadsheets/${encodeURIComponent(targetSpreadsheet.spreadsheetId)}/values/${encodeURIComponent(toRange(safeSheetName))}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      body: { values: appendValues }
    });

    return {
      provider: 'google-sheets',
      spreadsheetId: targetSpreadsheet.spreadsheetId,
      spreadsheetUrl: targetSpreadsheet.spreadsheetUrl,
      sheetId: targetSpreadsheet.sheetId,
      sheetName: safeSheetName,
      updatedRange: appendResult.updates?.updatedRange || null,
      updatedRows: appendResult.updates?.updatedRows || appendValues.length
    };
  }

  const updateResult = await googleSheetsRequest({
    method: 'PUT',
    path: `/spreadsheets/${encodeURIComponent(targetSpreadsheet.spreadsheetId)}/values/${encodeURIComponent(toRange(safeSheetName))}?valueInputOption=RAW`,
    body: { values }
  });

  return {
    provider: 'google-sheets',
    spreadsheetId: targetSpreadsheet.spreadsheetId,
    spreadsheetUrl: targetSpreadsheet.spreadsheetUrl,
    sheetId: targetSpreadsheet.sheetId,
    sheetName: safeSheetName,
    updatedRange: updateResult.updatedRange || null,
    updatedRows: updateResult.updatedRows || values.length
  };
};

module.exports = {
  exportRowsToGoogleSheet,
  getGoogleSheetsStatus
};
