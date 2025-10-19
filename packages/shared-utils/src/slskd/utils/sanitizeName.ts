/**
 * Sanitize a name by removing special characters and normalizing whitespace
 * This matches the Go implementation's sanitization logic
 */
export function sanitizeName(name: string): string {
    if (!name) return '';

    return name
        .toLowerCase()
        .trim()
        // Remove special characters commonly found in filenames
        .replace(/[()[\]{}]/g, '')
        .replace(/[!"',.:;?_-]/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();
}
