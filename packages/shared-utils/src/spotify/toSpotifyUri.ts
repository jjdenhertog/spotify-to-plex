const URI = /^spotify:([a-z]+):([\dA-Za-z]+)$/
const LINK_PATH = /(?:^|\/)([a-z]+)\/([\dA-Za-z]+)\/?$/

export function toSpotifyUri(input: string): string | null {
    const value = input.trim()

    const uri = URI.exec(value)
    if (uri)
        return value

    let url: URL
    try {
        url = new URL(value)
    } catch (_e) {
        return null
    }

    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com')
        return null

    const match = LINK_PATH.exec(url.pathname)
    if (!match)
        return null

    return `spotify:${match[1]}:${match[2]}`
}
