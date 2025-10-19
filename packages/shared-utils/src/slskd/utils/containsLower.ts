/**
 * Check if haystack contains needle (case-insensitive)
 * This matches the Go implementation's containsLower logic
 */
export function containsLower(haystack: string, needle: string): boolean {
    if (!haystack || !needle) return false;

    return haystack.toLowerCase().includes(needle.toLowerCase());
}
