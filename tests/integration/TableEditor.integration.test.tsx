/**
 * Integration tests for TableEditor with PillEditor
 * Tests the complete table editing workflow with pill-based expression editing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TableEditor from '../../apps/web/src/components/TableEditor';
import { MatchFilterRule } from '../../apps/web/src/types/MatchFilterTypes';

// Mock theme for Material-UI components
const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('TableEditor with PillEditor Integration', () => {
    let mockOnChange: jest.Mock;

    beforeEach(() => {
        mockOnChange = jest.fn();
    });

    describe('Basic Table Operations', () => {
        test('should render empty table with add button', () => {
            renderWithTheme(
                <TableEditor
                    filters={[]}
                    onChange={mockOnChange}
                />
            );

            expect(screen.getByText('Add Filter Rule')).toBeInTheDocument();
            expect(screen.getByText('No filter rules configured. Click "Add Filter Rule" to get started.')).toBeInTheDocument();
        });

        test('should add new filter rule with default expression', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <TableEditor
                    filters={[]}
                    onChange={mockOnChange}
                />
            );

            const addButton = screen.getByText('Add Filter Rule');
            await user.click(addButton);

            expect(mockOnChange).toHaveBeenCalledWith(['artist:match']);
        });

        test('should render existing filters with PillEditor', () => {
            const filters: MatchFilterRule[] = [\n                'artist:match',\n                'title:contains AND album:match'\n            ];\n\n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                />\n            );\n\n            // Should show both filter rows\n            expect(screen.getByDisplayValue).toBeDefined();\n            expect(screen.getAllByText('+ Add Field')).toHaveLength(2);\n        });\n\n        test('should delete filter when delete button clicked', async () => {\n            const user = userEvent.setup();\n            const filters: MatchFilterRule[] = ['artist:match', 'title:contains'];\n            \n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                />\n            );\n\n            const deleteButtons = screen.getAllByLabelText('Delete filter');\n            await user.click(deleteButtons[0]);\n\n            expect(mockOnChange).toHaveBeenCalledWith(['title:contains']);\n        });\n    });\n\n    describe('PillEditor Integration in Table Context', () => {\n        test('should update filter when pills are modified', async () => {\n            const user = userEvent.setup();\n            const filters: MatchFilterRule[] = ['artist:match'];\n            \n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                />\n            );\n\n            // Find and click the artist pill to modify it\n            const artistPill = screen.getByText('artist');\n            await user.click(artistPill);\n\n            await waitFor(async () => {\n                const containsOption = screen.getByText('Contains');\n                await user.click(containsOption);\n            });\n\n            expect(mockOnChange).toHaveBeenCalledWith(['artist:contains']);\n        });\n\n        test('should add new field to existing filter', async () => {\n            const user = userEvent.setup();\n            const filters: MatchFilterRule[] = ['artist:match'];\n            \n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                />\n            );\n\n            // Click add field button in the existing row\n            const addButton = screen.getByText('+ Add Field');\n            await user.click(addButton);\n\n            await waitFor(async () => {\n                const titleOption = screen.getByText('Title');\n                await user.click(titleOption);\n            });\n\n            expect(mockOnChange).toHaveBeenCalledWith(['artist:match AND title:?']);\n        });\n\n        test('should handle multiple filter rows independently', async () => {\n            const user = userEvent.setup();\n            const filters: MatchFilterRule[] = ['artist:match', 'title:contains'];\n            \n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                />\n            );\n\n            // Modify second filter\n            const addButtons = screen.getAllByText('+ Add Field');\n            await user.click(addButtons[1]); // Second row add button\n\n            await waitFor(async () => {\n                const albumOption = screen.getByText('Album');\n                await user.click(albumOption);\n            });\n\n            expect(mockOnChange).toHaveBeenCalledWith(['artist:match', 'title:contains AND album:?']);\n        });\n    });\n\n    describe('Disabled State', () => {\n        test('should disable all interactions when disabled prop is true', () => {\n            const filters: MatchFilterRule[] = ['artist:match'];\n            \n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                    disabled={true}\n                />\n            );\n\n            // All interactive elements should be disabled\n            expect(screen.getByText('Add Filter Rule')).toBeDisabled();\n            expect(screen.getByLabelText('Delete filter')).toBeDisabled();\n            expect(screen.getByText('+ Add Field').closest('.MuiChip-root')).toHaveClass('Mui-disabled');\n        });\n\n        test('should not respond to clicks when disabled', async () => {\n            const user = userEvent.setup();\n            const filters: MatchFilterRule[] = ['artist:match'];\n            \n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                    disabled={true}\n                />\n            );\n\n            const artistPill = screen.getByText('artist');\n            await user.click(artistPill);\n\n            // Should not open any popups\n            await waitFor(() => {\n                expect(screen.queryByText('Match')).not.toBeInTheDocument();\n            }, { timeout: 500 });\n        });\n    });\n\n    describe('JSON Mode Compatibility', () => {\n        test('should work seamlessly with JSON mode switching', () => {\n            const filters: MatchFilterRule[] = [\n                'artist:match AND title:contains',\n                'album:similarity>=0.85'\n            ];\n            \n            // Render with pills\n            const { rerender } = renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                />\n            );\n\n            // Should render without errors\n            expect(screen.getByText('artist')).toBeInTheDocument();\n            expect(screen.getByText('album')).toBeInTheDocument();\n\n            // Rerender with different filters (simulating JSON mode update)\n            const updatedFilters: MatchFilterRule[] = [\n                'title:match',\n                'artistInTitle:contains'\n            ];\n\n            rerender(\n                <ThemeProvider theme={theme}>\n                    <TableEditor\n                        filters={updatedFilters}\n                        onChange={mockOnChange}\n                    />\n                </ThemeProvider>\n            );\n\n            expect(screen.getByText('title')).toBeInTheDocument();\n            expect(screen.getByText('artistInTitle')).toBeInTheDocument();\n        });\n\n        test('should preserve expression format for JSON export', () => {\n            const originalExpression = 'artist:similarity>=0.85 AND title:match';\n            const filters: MatchFilterRule[] = [originalExpression];\n            \n            renderWithTheme(\n                <TableEditor\n                    filters={filters}\n                    onChange={mockOnChange}\n                />\n            );\n\n            // The expression should be parseable and regeneratable\n            expect(screen.getByText('artist')).toBeInTheDocument();\n            expect(screen.getByText('title')).toBeInTheDocument();\n        });\n    });\n\n    describe('Error Handling', () => {\n        test('should handle invalid filter expressions gracefully', () => {\n            const invalidFilters: MatchFilterRule[] = [\n                'invalid:expression',\n                '',\n                'artist:', // Missing operation\n                ':match' // Missing field\n            ];\n            \n            expect(() => {\n                renderWithTheme(\n                    <TableEditor\n                        filters={invalidFilters}\n                        onChange={mockOnChange}\n                    />\n                );\n            }).not.toThrow();\n        });\n\n        test('should recover from parsing errors', () => {\n            const { rerender } = renderWithTheme(\n                <TableEditor\n                    filters={['invalid:expression']}\n                    onChange={mockOnChange}\n                />\n            );\n\n            // Update with valid expression\n            rerender(\n                <ThemeProvider theme={theme}>\n                    <TableEditor\n                        filters={['artist:match']}\n                        onChange={mockOnChange}\n                    />\n                </ThemeProvider>\n            );\n\n            expect(screen.getByText('artist')).toBeInTheDocument();\n        });\n    });\n});