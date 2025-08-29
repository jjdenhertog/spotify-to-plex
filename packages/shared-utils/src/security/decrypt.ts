import { createDecipheriv } from 'node:crypto';
import { algorithm, key } from './constants';

export function decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
        throw new Error('Invalid encrypted text format');
    }

    const ivBuffer = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}