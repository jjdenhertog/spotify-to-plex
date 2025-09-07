// Mock File constructor
export class FileMock {
    public name: string;
    public size: number;
    public type: string;
    public lastModified: number;

    public constructor(bits: any[], filename: string, options?: any) {
        this.name = filename;
        this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
        this.type = options?.type || '';
        this.lastModified = Date.now();
    }
}