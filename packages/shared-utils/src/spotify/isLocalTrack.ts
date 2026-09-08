
export function isLocalTrack(trackId?: string) {
    return !!trackId && trackId.startsWith('spotify:local:');
}
