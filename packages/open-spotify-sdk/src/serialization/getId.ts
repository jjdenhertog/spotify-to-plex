
export default function getId(uri: string): string {
    const parts = uri.split(':')
    return parts.pop() || uri
}