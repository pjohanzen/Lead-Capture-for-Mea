const { appendLeadRow } = require('./googleSheets');

module.exports = async function submitPage1(req, res) {
  if (req.method && req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const { name, phone, email } = body || {};

    if (!name || !phone || !email) {
      return sendJSON(res, 400, { error: 'Name, phone, and email are required.' });
    }

    const result = await appendLeadRow({ name, phone, email });
    return sendJSON(res, 200, { success: true, rowId: result.rowId, rowNumber: result.rowNumber });
  } catch (error) {
    console.error('[submitPage1] error', error);
    return sendJSON(res, 500, { error: error.message || 'Failed to save lead.' });
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

