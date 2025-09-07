// Mock URL constructor
export class URLMock {
    public href: string;
    public origin: string;
    public pathname: string;
    public search: string;
    public hash: string;

    public constructor(url: string) {
        this.href = url;
        this.origin = 'http://localhost:3000';
        this.pathname = '/';
        this.search = '';
        this.hash = '';
    }
}