
export default function getRequestHasH(type: "artist" | "album" | "track" | "playlist"): string {
    const hashes = {
        artist: "unknown?",
        album: "unknown?",
        track: "unknown?",
        playlist: "19ff1327c29e99c208c86d7a9d8f1929cfdf3d3202a0ff4253c821f1901aa94d"
    }

    return hashes[type]
}
