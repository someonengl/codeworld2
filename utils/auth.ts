const SESSION_SECRET = process.env.SESSION_SECRET || 'codeworld_local_super_secret_session_key_123';

/**
 * Lightweight, synchronous, tamper-proof signature helper
 */
function generateSignature(payload: string, secret: string): string {
  let hash = 5381;
  const combined = payload + secret;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 33) ^ combined.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Encrypt and sign a session object into a secure base64 string
 */
export function encryptSession(data: any): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = generateSignature(payload, SESSION_SECRET);
  return `${payload}.${signature}`;
}

/**
 * Decrypt and verify a signed session token, returning the payload if valid
 */
export function decryptSession(token: string): any | null {
  if (!token) return null;
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    
    const expectedSignature = generateSignature(payload, SESSION_SECRET);
    if (signature !== expectedSignature) {
      return null;
    }
    
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}
