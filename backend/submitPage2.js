const { updateMeasurementRow } = require('./googleSheets');

module.exports = async function submitPage2(req, res) {
  if (req.method && req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const { rowId, measurements, sizes } = body || {};

    if (!rowId || !measurements || !sizes) {
      return sendJSON(res, 400, { error: 'rowId, measurements, and sizes are required.' });
    }

    const result = await updateMeasurementRow(rowId, measurements, sizes);
    return sendJSON(res, 200, { success: true, rowNumber: result.rowNumber });
  } catch (error) {
    console.error('[submitPage2] error', error);
    return sendJSON(res, 500, { error: error.message || 'Failed to update measurements.' });
  }
};

async function readBody(req) {
  if (req.body) return req.body;

  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, payload) {
  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = statusCode;
  }
  res.end(JSON.stringify(payload));
}

