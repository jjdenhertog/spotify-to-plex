import { vi } from 'vitest';

// Mock FileReader constructor
export class FileReaderMock {
    public result = '';
    public readAsText = vi.fn();
    public readAsDataURL = vi.fn();
    public addEventListener = vi.fn();
    public removeEventListener = vi.fn();
}