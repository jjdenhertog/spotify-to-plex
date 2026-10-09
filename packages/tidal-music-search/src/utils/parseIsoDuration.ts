/**
 * Converts an ISO 8601 duration (e.g. PT3M23S) to milliseconds, undefined when it can't be read.
 */
export function parseIsoDuration(duration?: string) {
    if (!duration)
        return;

    const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(duration);
    if (!match)
        return;

    const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match;
    const totalSeconds = Number(days) * 86_400 + Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
    if (totalSeconds <= 0)
        return;

    return Math.round(totalSeconds * 1000);
}
