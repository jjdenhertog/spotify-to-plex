export function filterUnique<T>(val: T, index: number, array: T[]) {
    return array.indexOf(val) == index
}