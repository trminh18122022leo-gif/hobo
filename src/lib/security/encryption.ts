import crypto from 'crypto';

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production environment');
    }
    // Dev-only fallback — never used in production
    return 'dev-only-fallback-key-32bytes!!!!!';
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters');
  }
  return key;
}

const ALGORITHM = 'aes-256-gcm';

export function encrypt(plaintext: string): string {
  try {
    const iv = crypto.randomBytes(12);
    const key = Buffer.from(getEncryptionKey(), 'utf-8').slice(0, 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    const tag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${ciphertext}:${tag}`;
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

export function decrypt(encrypted: string): string {
  try {
    const [ivHex, ciphertext, tagHex] = encrypted.split(':');
    if (!ivHex || !ciphertext || !tagHex) throw new Error('Invalid format');
    
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = Buffer.from(getEncryptionKey(), 'utf-8').slice(0, 32);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');
    
    return plaintext;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}
