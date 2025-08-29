import { randomBytes } from 'node:crypto';

export const algorithm = 'aes-256-cbc';
export const iv = randomBytes(16);
export const key = Buffer.from(process.env.ENCRYPTION_KEY || "XClkSCrJoAxXZGVv8KZF1csyyscyLYEIy5TEIWXIZw", 'hex');