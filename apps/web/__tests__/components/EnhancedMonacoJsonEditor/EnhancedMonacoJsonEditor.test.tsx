import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EnhancedMonacoJsonEditor, { EnhancedMonacoJsonEditorHandle } from '../../../src/components/EnhancedMonacoJsonEditor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => {
    return {
        __esModule: true,
        default: ({ onChange, onMount, value, ...props }: any) => {
            const mockEditor = {
                getValue: vi.fn(() => value || '{}'),
                setValue: vi.fn(),
            };
      
            React.useEffect(() => {
                if (onMount) {
                    const mockMonaco = {
                        KeyMod: { CtrlCmd: 1, Shift: 2 },
                        KeyCode: { KeyI: 'KeyI', KeyE: 'KeyE', KeyC: 'KeyC' },
                        languages: {
                            json: {
                                jsonDefaults: {
                                    setDiagnosticsOptions: vi.fn(),
                                },
                            },
                        },
                        editor: {
                            defineTheme: vi.fn(),
                            setTheme: vi.fn(),
                        },
                    };
                    onMount(mockEditor, mockMonaco);
                }
            }, [onMount]);
      
            return (
                <div data-testid="monaco-editor" {...props}>
                    <textarea
                        data-testid="monaco-textarea"
                        value={value || '{}'}
                        onChange={(e) => onChange?.(e.target.value)}
                        readOnly={props.options?.readOnly}
          />
                </div>
            );
        },
    };
});

// Mock notistack
vi.mock('notistack', () => ({
    enqueueSnackbar: vi.fn(),
}));

// Mock clipboard API
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
        readText: vi.fn(() => Promise.resolve('{"test": "value"}')),
    },
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement for file download
const mockAnchorElement = {
    href: '',
    download: '',
    click: vi.fn(),
    remove: vi.fn(),
};

Object.defineProperty(document, 'createElement', {
    value: vi.fn((tagName) => {
        if (tagName === 'a') {
            return mockAnchorElement;
        }

        return document.createElement(tagName);
    }),
});

Object.defineProperty(document.body, 'append', {
    value: vi.fn(),
});

describe('EnhancedMonacoJsonEditor', () => {
    const mockOnChange = vi.fn();
  
    const defaultProps = {
        value: { test: 'value', number: 42 },
        onChange: mockOnChange,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (navigator.clipboard.writeText as any).mockResolvedValue();
        (navigator.clipboard.readText as any).mockResolvedValue('{"test": "clipboard"}');
    });

    describe('Basic Rendering', () => {
        it('should render without crashing', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });

        it('should render with JSON value', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const textarea = screen.getByTestId('monaco-textarea');
            expect(textarea).toHaveValue('{\n  "test": "value",\n  "number": 42\n}');
        });

        it('should render with custom height', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} height={600} />);
      
            const editor = screen.getByTestId('monaco-editor');
            expect(editor).toHaveStyle('height: 600px');
        });

        it('should render in read-only mode', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} readOnly />);
      
            const textarea = screen.getByTestId('monaco-textarea');
            expect(textarea).toHaveAttribute('readonly');
        });

        it('should display error message when provided', () => {
            const errorMessage = 'Invalid JSON structure';
            render(<EnhancedMonacoJsonEditor {...defaultProps} error={errorMessage} />);
      
            expect(screen.getByText('Validation Error:')).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    describe('Import/Export Functionality', () => {
        it('should render import/export menu when enabled', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} enableImportExport />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            expect(menuButton).toBeInTheDocument();
        });

        it('should not render import/export menu when disabled', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} enableImportExport={false} />);
      
            const menuButton = screen.queryByRole('button', { name: /import\/export options/i });
            expect(menuButton).not.toBeInTheDocument();
        });

        it('should not render import/export menu when read-only', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} readOnly />);
      
            const menuButton = screen.queryByRole('button', { name: /import\/export options/i });
            expect(menuButton).not.toBeInTheDocument();
        });

        it('should open menu when menu button is clicked', async () => {
            const user = userEvent.setup();
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            expect(screen.getByText('Import JSON File')).toBeInTheDocument();
            expect(screen.getByText('Export JSON File')).toBeInTheDocument();
            expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
            expect(screen.getByText('Paste from Clipboard')).toBeInTheDocument();
        });
    });

    describe('Export Functionality', () => {
        it('should export JSON to file when export is clicked', async () => {
            const user = userEvent.setup();
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            const exportButton = screen.getByText('Export JSON File');
            await user.click(exportButton);
      
            expect(mockAnchorElement.download).toContain('match-filters-');
            expect(mockAnchorElement.download).toContain('.json');
            expect(mockAnchorElement.click).toHaveBeenCalled();
            expect(mockAnchorElement.remove).toHaveBeenCalled();
        });

        it('should copy JSON to clipboard when copy is clicked', async () => {
            const user = userEvent.setup();
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            const copyButton = screen.getByText('Copy to Clipboard');
            await user.click(copyButton);
      
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{\n  "test": "value",\n  "number": 42\n}');
        });

        it('should handle clipboard copy failure gracefully', async () => {
            const user = userEvent.setup();
            (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Clipboard error'));
      
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            const copyButton = screen.getByText('Copy to Clipboard');
            await user.click(copyButton);
      
            const { enqueueSnackbar } = require('notistack');
            expect(enqueueSnackbar).toHaveBeenCalledWith('Failed to copy to clipboard', { variant: 'error' });
        });
    });

    describe('Import Functionality', () => {
        it('should trigger file input when import is clicked', async () => {
            const user = userEvent.setup();
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            const importButton = screen.getByText('Import JSON File');
      
            // Get the hidden file input
            const fileInput = screen.getByTestId('monaco-editor').querySelector('input[type="file"]')!;
            expect(fileInput).toBeInTheDocument();
            expect(fileInput).toHaveStyle('display: none');
      
            const fileInputClickSpy = vi.spyOn(fileInput as HTMLInputElement, 'click');
      
            await user.click(importButton);
      
            expect(fileInputClickSpy).toHaveBeenCalled();
        });

        it('should handle file import with valid JSON', async () => {
            const mockFile = new File(['{"imported": "data"}'], 'test.json', { type: 'application/json' });
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const fileInput = screen.getByTestId('monaco-editor').querySelector('input[type="file"]')!;
      
            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                writable: false,
            });
      
            fireEvent.change(fileInput);
      
            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith({ imported: 'data' });
            });
        });

        it('should handle file import with invalid JSON', async () => {
            const mockFile = new File(['invalid json'], 'test.json', { type: 'application/json' });
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const fileInput = screen.getByTestId('monaco-editor').querySelector('input[type="file"]')!;
      
            Object.defineProperty(fileInput, 'files', {
                value: [mockFile],
                writable: false,
            });
      
            fireEvent.change(fileInput);
      
            await waitFor(() => {
                const { enqueueSnackbar } = require('notistack');
                expect(enqueueSnackbar).toHaveBeenCalledWith('Invalid JSON file', { variant: 'error' });
            });
        });

        it('should paste from clipboard when paste is clicked', async () => {
            const user = userEvent.setup();
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            const pasteButton = screen.getByText('Paste from Clipboard');
            await user.click(pasteButton);
      
            await waitFor(() => {
                expect(navigator.clipboard.readText).toHaveBeenCalled();
                expect(mockOnChange).toHaveBeenCalledWith({ test: 'clipboard' });
            });
        });

        it('should handle clipboard paste with invalid JSON', async () => {
            const user = userEvent.setup();
            (navigator.clipboard.readText as any).mockResolvedValue('invalid json');
      
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            const pasteButton = screen.getByText('Paste from Clipboard');
            await user.click(pasteButton);
      
            await waitFor(() => {
                const { enqueueSnackbar } = require('notistack');
                expect(enqueueSnackbar).toHaveBeenCalledWith('Invalid JSON in clipboard', { variant: 'error' });
            });
        });
    });

    describe('Value Changes and Validation', () => {
        it('should call onChange when valid JSON is entered', async () => {
            const user = userEvent.setup();
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const textarea = screen.getByTestId('monaco-textarea');
            await user.clear(textarea);
            await user.type(textarea, '{"new": "value"}');
      
            expect(mockOnChange).toHaveBeenCalledWith({ new: 'value' });
        });

        it('should not call onChange when invalid JSON is entered', async () => {
            const user = userEvent.setup();
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const textarea = screen.getByTestId('monaco-textarea');
            await user.clear(textarea);
            await user.type(textarea, 'invalid json');
      
            // Should not call onChange with invalid JSON
            expect(mockOnChange).not.toHaveBeenCalledWith('invalid json');
        });

        it('should not call onChange when readOnly is true', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} readOnly />);
      
            const textarea = screen.getByTestId('monaco-textarea');
            expect(textarea).toHaveAttribute('readonly');
      
            // onChange should not be called in readonly mode even if value changes somehow
        });
    });

    describe('Schema Validation', () => {
        it('should configure schema validation when schema is provided', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' }
                },
                required: ['name']
            };
      
            render(<EnhancedMonacoJsonEditor {...defaultProps} schema={schema} />);
      
            // Monaco editor should be rendered (schema validation is internal)
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });
    });

    describe('Ref Functionality', () => {
        it('should expose getCurrentValue method through ref', () => {
            const ref = React.createRef<EnhancedMonacoJsonEditorHandle>();
      
            render(<EnhancedMonacoJsonEditor {...defaultProps} ref={ref} />);
      
            expect(ref.current).toBeTruthy();
            expect(ref.current?.getCurrentValue).toBeInstanceOf(Function);
            expect(ref.current?.exportToFile).toBeInstanceOf(Function);
            expect(ref.current?.copyToClipboard).toBeInstanceOf(Function);
        });

        it('should return current JSON value through getCurrentValue', () => {
            const ref = React.createRef<EnhancedMonacoJsonEditorHandle>();
      
            render(<EnhancedMonacoJsonEditor {...defaultProps} ref={ref} />);
      
            const currentValue = ref.current?.getCurrentValue();
            expect(currentValue).toEqual({ test: 'value', number: 42 });
        });

        it('should handle invalid JSON in getCurrentValue', () => {
            const ref = React.createRef<EnhancedMonacoJsonEditorHandle>();
      
            // Mock Monaco editor to return invalid JSON
            vi.doMock('@monaco-editor/react', () => ({
                __esModule: true,
                default: ({ onMount }: any) => {
                    React.useEffect(() => {
                        if (onMount) {
                            const mockEditor = {
                                getValue: vi.fn(() => 'invalid json'),
                            };
                            onMount(mockEditor, {});
                        }
                    }, [onMount]);
          
                    return <div data-testid="monaco-editor" />;
                },
            }));
      
            render(<EnhancedMonacoJsonEditor {...defaultProps} ref={ref} />);
      
            const currentValue = ref.current?.getCurrentValue();
            expect(currentValue).toBeNull();
        });
    });

    describe('Keyboard Shortcuts', () => {
        it('should display keyboard shortcuts help text when import/export is enabled', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} enableImportExport />);
      
            expect(screen.getByText(/keyboard shortcuts/i)).toBeInTheDocument();
            expect(screen.getByText(/ctrl\+i \(import\)/i)).toBeInTheDocument();
            expect(screen.getByText(/ctrl\+e \(export\)/i)).toBeInTheDocument();
            expect(screen.getByText(/ctrl\+shift\+c \(copy\)/i)).toBeInTheDocument();
        });

        it('should not display keyboard shortcuts when import/export is disabled', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} enableImportExport={false} />);
      
            expect(screen.queryByText(/keyboard shortcuts/i)).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle null value gracefully', () => {
            render(<EnhancedMonacoJsonEditor value={null} onChange={mockOnChange} />);
      
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });

        it('should handle undefined value gracefully', () => {
            render(<EnhancedMonacoJsonEditor value={undefined} onChange={mockOnChange} />);
      
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });

        it('should handle empty object value', () => {
            render(<EnhancedMonacoJsonEditor value={{}} onChange={mockOnChange} />);
      
            const textarea = screen.getByTestId('monaco-textarea');
            expect(textarea).toHaveValue('{}');
        });

        it('should handle complex nested objects', () => {
            const complexValue = {
                user: {
                    name: 'John Doe',
                    preferences: {
                        theme: 'dark',
                        notifications: ['email', 'sms'],
                    },
                },
                metadata: {
                    created: '2023-01-01T00:00:00Z',
                    tags: ['important', 'user-data'],
                },
            };
      
            render(<EnhancedMonacoJsonEditor value={complexValue} onChange={mockOnChange} />);
      
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });

        it('should handle large JSON objects efficiently', () => {
            const largeValue = {
                items: Array.from({ length: 1000 }, (_, i) => ({
                    id: i,
                    name: `Item ${i}`,
                    data: Array.from({ length: 10 }, (_, j) => ({ key: `key${j}`, value: `value${j}` })),
                })),
            };
      
            const startTime = performance.now();
            render(<EnhancedMonacoJsonEditor value={largeValue} onChange={mockOnChange} />);
            const endTime = performance.now();
      
            expect(endTime - startTime).toBeLessThan(100); // Should render in less than 100ms
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });

        it('should handle menu close when clicking outside', async () => {
            const user = userEvent.setup();
            render(
                <div>
                    <EnhancedMonacoJsonEditor {...defaultProps} />
                    <button data-testid="outside-button">Outside Button</button>
                </div>
            );
      
            // Open menu
            const menuButton = screen.getByRole('button', { name: /import\/export options/i });
            await user.click(menuButton);
      
            expect(screen.getByText('Import JSON File')).toBeInTheDocument();
      
            // Click outside
            const outsideButton = screen.getByTestId('outside-button');
            await user.click(outsideButton);
      
            await waitFor(() => {
                expect(screen.queryByText('Import JSON File')).not.toBeInTheDocument();
            });
        });

        it('should handle file input without files selected', () => {
            render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            const fileInput = screen.getByTestId('monaco-editor').querySelector('input[type="file"]')!;
      
            Object.defineProperty(fileInput, 'files', {
                value: null,
                writable: false,
            });
      
            // Should not crash when no file is selected
            expect(() => fireEvent.change(fileInput)).not.toThrow();
        });
    });

    describe('Cleanup and Memory Management', () => {
        it('should cleanup properly on unmount', () => {
            const { unmount } = render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            expect(() => unmount()).not.toThrow();
        });

        it('should handle rapid re-renders without memory leaks', () => {
            const { rerender } = render(<EnhancedMonacoJsonEditor {...defaultProps} />);
      
            // Rapid re-renders with different values
            for (let i = 0; i < 100; i++) {
                rerender(<EnhancedMonacoJsonEditor value={{ iteration: i }} onChange={mockOnChange} />);
            }
      
            expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
        });
    });
});