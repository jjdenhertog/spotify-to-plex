import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const algorithm = 'aes-256-cbc';
const iv = randomBytes(16); // Initialization vector
const key = Buffer.from(process.env.ENCRYPTION_KEY || "XClkSCrJoAxXZGVv8KZF1csyyscyLYEIy5TEIWXIZw", 'hex');

// Encrypt
export function encrypt(text: string): string {

    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
}

// Decrypt
export function decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}