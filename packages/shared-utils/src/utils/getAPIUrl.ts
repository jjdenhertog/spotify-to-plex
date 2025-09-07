export function getAPIUrl(_url: string, path: string) {
    const url = new URL(_url);

    // Check if port was explicitly provided in the original URL
    // url.port is empty string for default ports, but we can detect if a colon was used
    const hasExplicitPort = url.port !== '' || _url.includes(`:${  url.protocol === 'https:' ? '443' : '80'}`);

    if (!hasExplicitPort)
        throw new Error("The link to the Roon extension seems invalid. The port number might be missing")

    // If default port was explicitly specified, include it in output
    const { protocol, hostname, port } = url;
    let {host} = url;
    if (port === '' && hasExplicitPort) {
        const defaultPort = protocol === 'https:' ? '443' : '80';
        host = `${hostname}:${defaultPort}`;
    }

    return `${protocol}//${host}${path}`
}