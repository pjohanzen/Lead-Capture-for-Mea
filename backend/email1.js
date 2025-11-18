module.exports = async function emailPage1(req, res) {
  if (req.method && req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const { email, name, page2Url } = body || {};

    if (!email || !name || !page2Url) {
      return sendJSON(res, 400, { error: 'email, name, and page2Url are required.' });
    }

    await sendEmail({
      to: email,
      subject: 'You’re in! Next up: your Essato measurements',
      html: buildHtml({ name, page2Url }),
      text: `Hi ${name},

Thank you for joining the Essato Customs 8-Pocket Suit Giveaway.

Next step: reserve your size now so you’re ready for launch.
${page2Url}

With love,
Team Essato`
    });

    return sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('[emailPage1] error', error);
    return sendJSON(res, 500, { error: error.message || 'Failed to send email.' });
  }
};

function buildHtml({ name, page2Url }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#000;">
      <p>Hi ${name},</p>
      <p>Welcome to the Essato Customs 8-Pocket Suit Giveaway list—consider your early spot secured.</p>
      <p>To maximize your entries and secure your pre-sale slot, take 60 seconds to add your measurements:</p>
      <p><a href="${page2Url}" style="background:#FEB6A3;color:#000;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block;">Enter Measurements</a></p>
      <p>If the button doesn’t work, copy this link:<br>${page2Url}</p>
      <p>With love,<br>Essato Customs</p>
    </div>
  `;
}

async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Email send skipped.');
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Essato Customs <hello@essatocustoms.com>',
      to,
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.message || 'Email provider error');
  }

  return response.json();
}

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

