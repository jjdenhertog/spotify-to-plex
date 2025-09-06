import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import MatchFilterEditor from '../../../src/components/MatchFilterEditor';
import { MatchFilterRule } from '../../../src/types/MatchFilterTypes';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('notistack', () => ({
    enqueueSnackbar: jest.fn(),
}));

// Mock the Monaco Editor
jest.mock('../../../src/components/MonacoJsonEditor', () => {
    return React.forwardRef<any, any>(((props, ref) => {
        const {
            value,
            onChange,
            error
        } = props;

        React.useImperativeHandle(ref, () => ({
            getCurrentValue: () => value,
            setValue: (newValue: any) => onChange?.(newValue),
        }));

        return (
            <div data-testid="monaco-editor">
                <textarea
                    data-testid="monaco-textarea"
                    value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            onChange?.(parsed);
                        } catch {
                            onChange?.(e.target.value);
                        }
                    }}
        />
                {error ? <div data-testid="monaco-error">{error}</div> : null}
            </div>
        );
    }));
});

// Mock TableEditor
jest.mock('../../../src/components/TableEditor', () => {
    return function TableEditor({ filters, onChange }: { readonly filters: MatchFilterRule[], readonly onChange: (filters: MatchFilterRule[]) => void }) {
        return (
            <div data-testid="table-editor">
                <div data-testid="filters-count">{filters.length} filters</div>
                <button 
                    data-testid="add-filter"
                    onClick={() => onChange([...filters, 'artist:match'])}
        >
                    Add Filter
                </button>
                <button 
                    data-testid="remove-filter"
                    onClick={() => onChange(filters.slice(0, -1))}
        >
                    Remove Filter
                </button>
                {filters.map((filter, index) => (
                    <div key={index} data-testid={`filter-${index}`}>{filter}</div>
                ))}
            </div>
        );
    };
});

// Mock EditorHeader
jest.mock('../../../src/components/EditorHeader', () => {
    return function EditorHeader({ 
        title, 
    viewMode, 
    onViewModeChange, 
    onSave, 
    onReset, 
    disabled 
    }: {
    readonly title: string;
    readonly viewMode: 'ui' | 'json';
    readonly onViewModeChange: (event: any, mode: 'ui' | 'json' | null) => void;
    readonly onSave: () => void;
    readonly onReset: () => void;
    readonly disabled?: boolean;
  }) {
        return (
            <div data-testid="editor-header">
                <h1>{title}</h1>
                <div data-testid="view-mode-buttons">
                    <button
                        data-testid="ui-mode-button"
                        onClick={(e) => onViewModeChange(e, 'ui')}
                        disabled={disabled}
                        style={{ fontWeight: viewMode === 'ui' ? 'bold' : 'normal' }}
          >
                        UI Mode
                    </button>
                    <button
                        data-testid="json-mode-button"
                        onClick={(e) => onViewModeChange(e, 'json')}
                        disabled={disabled}
                        style={{ fontWeight: viewMode === 'json' ? 'bold' : 'normal' }}
          >
                        JSON Mode
                    </button>
                </div>
                <button data-testid="save-button" onClick={onSave} disabled={disabled}>
                    Save
                </button>
                <button data-testid="reset-button" onClick={onReset} disabled={disabled}>
                    Reset
                </button>
            </div>
        );
    };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Sample test data
const mockFilters: MatchFilterRule[] = [
    'artist:match',
    'title:contains AND album:match',
    'artist:similarity>=0.8'
];

describe('MatchFilterEditor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock responses
        mockedAxios.get.mockResolvedValue({ data: mockFilters });
        mockedAxios.post.mockResolvedValue({ data: 'success' });
    });

    describe('Component Initialization', () => {
        it('should render loading state initially', async () => {
            // Mock a delayed response
            mockedAxios.get.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({ data: mockFilters }), 100))
            );

            render(<MatchFilterEditor />);

            expect(screen.getByText('Loading match filters...')).toBeInTheDocument();

            // Wait for loading to complete
            await waitFor(() => {
                expect(screen.queryByText('Loading match filters...')).not.toBeInTheDocument();
            }, { timeout: 2000 });
        });

        it('should load data on mount', async () => {
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(mockedAxios.get).toHaveBeenCalledWith('/api/plex/music-search-config/match-filters');
            });

            await waitFor(() => {
                expect(screen.getByTestId('editor-header')).toBeInTheDocument();
            });
        });

        it('should start in UI mode by default', async () => {
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('ui-mode-button')).toHaveStyle('font-weight: bold');
            });
        });
    });

    describe('Mode Switching', () => {
        it('should switch between UI and JSON modes', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            // Wait for component to load
            await waitFor(() => {
                expect(screen.getByTestId('editor-header')).toBeInTheDocument();
            });

            // Should start in UI mode
            expect(screen.getByTestId('table-editor')).toBeInTheDocument();
            expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();

            // Switch to JSON mode
            await user.click(screen.getByTestId('json-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
                expect(screen.queryByTestId('table-editor')).not.toBeInTheDocument();
            });

            // Switch back to UI mode
            await user.click(screen.getByTestId('ui-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('table-editor')).toBeInTheDocument();
                expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();
            });
        });

        it('should convert data when switching modes', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('editor-header')).toBeInTheDocument();
            });

            // Add a filter in UI mode
            await user.click(screen.getByTestId('add-filter'));

            // Switch to JSON mode
            await user.click(screen.getByTestId('json-mode-button'));

            // Check if the data is properly converted to JSON
            await waitFor(() => {
                const textarea = screen.getByTestId('monaco-textarea');
                expect((textarea as HTMLTextAreaElement).value).toContain('artist:match');
            });
        });
    });

    describe('Filter Validation', () => {
        it('should validate filter expressions correctly', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('json-mode-button')).toBeInTheDocument();
            });

            // Switch to JSON mode
            await user.click(screen.getByTestId('json-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-textarea')).toBeInTheDocument();
            });

            // Enter invalid JSON
            const textarea = screen.getByTestId('monaco-textarea');
            await user.clear(textarea);
            await user.type(textarea, '["invalid:operation"]');

            // Try to save
            await user.click(screen.getByTestId('save-button'));

            // Should show validation error
            await waitFor(() => {
                expect(screen.getByTestId('monaco-error')).toBeInTheDocument();
            });
        });

        it('should accept valid filter expressions', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('json-mode-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('json-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-textarea')).toBeInTheDocument();
            });

            // Enter valid JSON
            const textarea = screen.getByTestId('monaco-textarea');
            await user.clear(textarea);
            await user.type(textarea, '["artist:match", "title:contains"]');

            // Try to save
            await user.click(screen.getByTestId('save-button'));

            // Should not show validation error and should call save endpoint
            await waitFor(() => {
                expect(mockedAxios.post).toHaveBeenCalledWith(
                    '/api/plex/music-search-config/match-filters',
                    ['artist:match', 'title:contains']
                );
            });
        });

        it('should validate array structure', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('json-mode-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('json-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-textarea')).toBeInTheDocument();
            });

            // Enter invalid structure (not array)
            const textarea = screen.getByTestId('monaco-textarea');
            await user.clear(textarea);
            await user.type(textarea, '{"not": "array"}');

            await user.click(screen.getByTestId('save-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-error')).toHaveTextContent('Configuration must be an array');
            });
        });
    });

    describe('Save and Load Operations', () => {
        it('should save filters successfully', async () => {
            const user = userEvent.setup();
            const onSave = jest.fn();
            render(<MatchFilterEditor onSave={onSave} />);

            await waitFor(() => {
                expect(screen.getByTestId('save-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('save-button'));

            await waitFor(() => {
                expect(mockedAxios.post).toHaveBeenCalledWith(
                    '/api/plex/music-search-config/match-filters',
                    mockFilters
                );
                expect(onSave).toHaveBeenCalled();
            });
        });

        it('should reset filters to original data', async () => {
            const user = userEvent.setup();
      
            // Mock window.confirm
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('add-filter')).toBeInTheDocument();
            });

            // Add a filter
            await user.click(screen.getByTestId('add-filter'));
      
            // Reset
            await user.click(screen.getByTestId('reset-button'));

            expect(confirmSpy).toHaveBeenCalledWith('Reset to defaults? This will overwrite your current configuration.');
      
            // Should reload data
            await waitFor(() => {
                expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Once on mount, once on reset
            });

            confirmSpy.mockRestore();
        });

        it('should not reset if user cancels confirmation', async () => {
            const user = userEvent.setup();
      
            // Mock window.confirm to return false
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('reset-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('reset-button'));

            expect(confirmSpy).toHaveBeenCalled();
      
            // Should not reload data (still only the initial load)
            await waitFor(() => {
                expect(mockedAxios.get).toHaveBeenCalledTimes(1);
            });

            confirmSpy.mockRestore();
        });
    });

    describe('Error Display for Invalid JSON', () => {
        it('should display error for invalid JSON syntax', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('json-mode-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('json-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-textarea')).toBeInTheDocument();
            });

            // Enter invalid JSON syntax
            const textarea = screen.getByTestId('monaco-textarea');
            await user.clear(textarea);
            await user.type(textarea, '[invalid json}');

            // The onChange should handle the parsing error
            // Check if validation occurs when saving
            await user.click(screen.getByTestId('save-button'));

            // Should show some kind of error indication
            await waitFor(() => {
                expect(mockedAxios.post).not.toHaveBeenCalled();
            });
        });

        it('should clear validation errors when switching modes', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('json-mode-button')).toBeInTheDocument();
            });

            // Switch to JSON mode
            await user.click(screen.getByTestId('json-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-textarea')).toBeInTheDocument();
            });

            // Create validation error
            const textarea = screen.getByTestId('monaco-textarea');
            await user.clear(textarea);
            await user.type(textarea, '["invalid:operation"]');
            await user.click(screen.getByTestId('save-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-error')).toBeInTheDocument();
            });

            // Switch to UI mode - should clear error
            await user.click(screen.getByTestId('ui-mode-button'));

            await waitFor(() => {
                expect(screen.queryByTestId('monaco-error')).not.toBeInTheDocument();
            });
        });
    });

    describe('UI Mode Interactions', () => {
        it('should display filters in UI mode', async () => {
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('filters-count')).toHaveTextContent('3 filters');
                expect(screen.getByTestId('filter-0')).toHaveTextContent('artist:match');
                expect(screen.getByTestId('filter-1')).toHaveTextContent('title:contains AND album:match');
            });
        });

        it('should update filters in UI mode', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('add-filter')).toBeInTheDocument();
            });

            // Add a filter
            await user.click(screen.getByTestId('add-filter'));

            expect(screen.getByTestId('filters-count')).toHaveTextContent('4 filters');

            // Remove a filter
            await user.click(screen.getByTestId('remove-filter'));

            expect(screen.getByTestId('filters-count')).toHaveTextContent('3 filters');
        });
    });

    describe('Loading States', () => {
        it('should disable controls during loading', async () => {
            // Mock a longer loading time
            mockedAxios.get.mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({ data: mockFilters }), 100))
            );

            render(<MatchFilterEditor />);

            // During loading state, there should be no interactive elements
            expect(screen.queryByTestId('save-button')).not.toBeInTheDocument();
            expect(screen.queryByTestId('reset-button')).not.toBeInTheDocument();

            // Wait for loading to complete
            await waitFor(() => {
                expect(screen.getByTestId('save-button')).toBeInTheDocument();
                expect(screen.getByTestId('reset-button')).toBeInTheDocument();
            }, { timeout: 2000 });
        });
    });

    describe('Keyboard Navigation', () => {
        it('should handle keyboard shortcuts in JSON mode', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('json-mode-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('json-mode-button'));

            await waitFor(() => {
                expect(screen.getByTestId('monaco-textarea')).toBeInTheDocument();
            });

            const textarea = screen.getByTestId('monaco-textarea');
      
            // Focus the textarea
            await user.click(textarea);

            // Test basic keyboard navigation
            await user.keyboard('{Control>}a{/Control}');
            await user.keyboard('["test:match"]');

            expect(textarea).toHaveValue('["test:match"]');
        });

        it('should handle tab navigation between controls', async () => {
            const user = userEvent.setup();
            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('ui-mode-button')).toBeInTheDocument();
            });

            // Tab should navigate through the interface
            await user.tab();
            expect(document.activeElement).toBe(screen.getByTestId('ui-mode-button'));

            await user.tab();
            expect(document.activeElement).toBe(screen.getByTestId('json-mode-button'));

            await user.tab();
            expect(document.activeElement).toBe(screen.getByTestId('save-button'));
        });
    });

    describe('Error Handling', () => {
        it('should handle API load errors gracefully', async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

            render(<MatchFilterEditor />);

            // Should still render without crashing
            await waitFor(() => {
                // Component should handle the error and show the interface
                expect(screen.queryByText('Loading match filters...')).not.toBeInTheDocument();
            }, { timeout: 2000 });
        });

        it('should handle API save errors gracefully', async () => {
            const user = userEvent.setup();
            mockedAxios.post.mockRejectedValueOnce(new Error('Save Error'));

            render(<MatchFilterEditor />);

            await waitFor(() => {
                expect(screen.getByTestId('save-button')).toBeInTheDocument();
            });

            await user.click(screen.getByTestId('save-button'));

            // Should not crash the application
            await waitFor(() => {
                expect(screen.getByTestId('save-button')).toBeInTheDocument();
            });
        });
    });
});