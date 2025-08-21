export default function getAPIUrl(uri: string, path: string) {
    const url = new URL(uri);
    if (!url?.port)
        throw new Error("The link to the Plex seems invalid. The port number might be missing")

    return `${url.protocol}//${url.host}${path}`
}