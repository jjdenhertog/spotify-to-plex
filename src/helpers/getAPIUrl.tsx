export default function getAPIUrl(_url: string, path: string) {
    const url = new URL(_url);
    if (!url || !url.port)
        throw new Error("The link to the Roon extension seems invalid. The port number might be missing")

    return `${url.protocol}//${url.host}${path}`
}