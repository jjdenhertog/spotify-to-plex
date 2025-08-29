import { createCipheriv } from 'node:crypto';
import { algorithm, iv, key } from './constants';

export function encrypt(text: string): string {
    const cipher = createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
}