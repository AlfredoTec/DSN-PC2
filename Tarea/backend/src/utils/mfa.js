/**
 * Utilidades para MFA basado en TOTP (Time-based One-Time Password).
 */
const speakeasy = require('speakeasy');

/**
 * Genera un secreto TOTP para un usuario y devuelve metadatos útiles (otpauth_url, base32).
 * @param {string} labelEmail
 */
function generateMfaSecret(labelEmail) {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `TechStore (${labelEmail})`,
  });
  return secret; // incluye base32, otpauth_url
}

/**
 * Verifica un código TOTP de 6 dígitos contra el secreto en base32.
 * @param {string} token
 * @param {string} secretBase32
 */
function verifyTotp(token, secretBase32) {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token,
    window: 1,
  });
}

module.exports = { generateMfaSecret, verifyTotp };
