const { google } = require('googleapis');
const crypto = require('crypto');

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_TAB = process.env.GOOGLE_SHEETS_TAB || 'Leads';

async function appendLeadRow({ name, phone, email }) {
  ensureConfig();
  const { sheets } = await getSheetsClient();
  const rowId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const values = [[rowId, timestamp, name, phone, email, '', '', '', '', '', '', '', '']];

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A:L`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });

  const updatedRange = response.data?.updates?.updatedRange || `${SHEET_TAB}!A:Z`;
  const rowNumber = parseInt(updatedRange.match(/\d+/g)?.pop() || '0', 10);

  return { rowId, rowNumber };
}

async function updateMeasurementRow(rowId, measurements, sizes) {
  ensureConfig();
  const { sheets } = await getSheetsClient();
  const rowNumber = await findRowNumberById(sheets, rowId);

  const existingRange = `${SHEET_TAB}!A${rowNumber}:L${rowNumber}`;
  const existingResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: existingRange
  });

  const existingRow = existingResponse.data.values?.[0] || [];

  const [
    ,
    createdAt = new Date().toISOString(),
    name = '',
    phone = '',
    email = ''
  ] = existingRow;

  const nextRow = [
    rowId,
    createdAt,
    name,
    phone,
    email,
    measurements.bust || '',
    measurements.naturalWaist || '',
    measurements.pantWaist || '',
    measurements.hip || '',
    measurements.thigh || '',
    sizes.jacket || '',
    sizes.pant || '',
    measurements.notes || ''
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A${rowNumber}:M${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [nextRow] }
  });

  return { rowNumber };
}

async function findRowNumberById(sheets, rowId) {
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A:A`
  });

  const rows = data.values || [];
  const index = rows.findIndex((row) => row[0] === rowId);

  if (index === -1) {
    throw new Error(`Row with ID ${rowId} not found.`);
  }

  // Sheets rows are 1-indexed
  return index + 1;
}

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  return { sheets };
}

function getServiceAccountCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // google-auth-library will read the file path automatically
    return undefined;
  }

  throw new Error('Missing Google service account credentials.');
}

function ensureConfig() {
  if (!SHEET_ID) {
    throw new Error('GOOGLE_SHEETS_ID is not configured.');
  }
}

module.exports = {
  appendLeadRow,
  updateMeasurementRow
};

