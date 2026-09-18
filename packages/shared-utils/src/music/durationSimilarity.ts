
export function durationSimilarity(a?: number, b?: number) {
    if (!a || !b)
        return 0;

    return 1 - Math.abs(a - b) / Math.max(a, b);
}
