module.exports = async function emailPage2(req, res) {
  if (req.method && req.method !== 'POST') {
    return sendJSON(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const { email, jacketSize, pantSize, sizeChartUrl, socials = {} } = body || {};

    if (!email || !jacketSize || !pantSize || !sizeChartUrl) {
      return sendJSON(res, 400, { error: 'email, jacketSize, pantSize, and sizeChartUrl are required.' });
    }

    await sendEmail({
      to: email,
      subject: 'Your Essato Customs size profile',
      html: buildHtml({ jacketSize, pantSize, sizeChartUrl, socials }),
      text: buildText({ jacketSize, pantSize, sizeChartUrl, socials })
    });

    return sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('[emailPage2] error', error);
    return sendJSON(res, 500, { error: error.message || 'Failed to send size email.' });
  }
};

function buildHtml({ jacketSize, pantSize, sizeChartUrl, socials }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#000;">
      <p>Your Essato Customs profile is locked in.</p>
      <p><strong>Jacket:</strong> ${jacketSize}<br/>
      <strong>Pants:</strong> ${pantSize}</p>
      <p><a href="${sizeChartUrl}" style="background:#FEB6A3;color:#000;padding:12px 24px;border-radius:999px;text-decoration:none;display:inline-block;">Open Size Chart</a></p>
      <p>Save this email and keep your tape handy—launch is right around the corner.</p>
      <p style="margin-top:2rem;">Follow Essato Customs:</p>
      <p>
        <a href="${socials.instagram || '#'}">Instagram</a> ·
        <a href="${socials.linkedin || '#'}">LinkedIn</a> ·
        <a href="${socials.tiktok || '#'}">TikTok</a>
      </p>
    </div>
  `;
}

function buildText({ jacketSize, pantSize, sizeChartUrl, socials }) {
  return `Your Essato Customs profile is confirmed.

Jacket: ${jacketSize}
Pants: ${pantSize}

Size chart: ${sizeChartUrl}

Follow us:
Instagram: ${socials.instagram || ''}
LinkedIn: ${socials.linkedin || ''}
TikTok: ${socials.tiktok || ''}
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

