const crypto = require('crypto');

const AUTH_EMAIL = process.env.AUTH_EMAIL || 'adarsh.vinodhan.00@gmail.com';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'Dubai2026!';
const SESSION_SECRET = process.env.SESSION_SECRET || 'jobhunt-crm-secret-salt-2026';

// Create a signed session token
function createSessionToken(user) {
  const payload = {
    email: user.email,
    name: user.name || 'Adarsh Vinothan',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');
  return `${payloadStr}.${signature}`;
}

// Verify a signed session token
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadStr)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// Validate credentials
function validateCredentials(email, password) {
  if (!email || !password) return false;
  return (
    email.trim().toLowerCase() === AUTH_EMAIL.toLowerCase() &&
    password === AUTH_PASSWORD
  );
}

module.exports = {
  AUTH_EMAIL,
  createSessionToken,
  verifySessionToken,
  validateCredentials,
};
