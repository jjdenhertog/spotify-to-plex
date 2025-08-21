export function filterUnique<T>(val: T, index: number, array: T[]): boolean {
    return array.indexOf(val) == index
}