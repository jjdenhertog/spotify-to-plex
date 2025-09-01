/**
 * Integration tests for PillEditor component
 * Tests the complete pill-based editing workflow including popups and expression generation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PillEditor from '../../apps/web/src/components/PillEditor';
import { expressionToPills } from '../../apps/web/src/utils/expressionToPills';
import { pillsToExpression } from '../../apps/web/src/utils/pillsToExpression';

// Mock theme for Material-UI components
const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('PillEditor Integration Tests', () => {
    let mockOnChange: jest.Mock;

    beforeEach(() => {
        mockOnChange = jest.fn();
    });

    describe('Expression Parsing Integration', () => {
        test('should parse simple expression to pills correctly', () => {
            const expression = 'artist:match';
            const pills = expressionToPills(expression);
            
            expect(pills).toHaveLength(1);
            expect(pills[0]).toMatchObject({
                type: 'condition',
                field: 'artist',
                operation: 'match',
                text: 'artist:match'
            });
        });

        test('should parse complex expression with multiple conditions', () => {
            const expression = 'artist:match AND title:contains AND album:similarity>=0.85';
            const pills = expressionToPills(expression);
            
            expect(pills).toHaveLength(5); // 3 conditions + 2 combinators
            expect(pills.filter(p => p.type === 'condition')).toHaveLength(3);
            expect(pills.filter(p => p.type === 'combinator')).toHaveLength(2);
        });

        test('should generate expression from pills correctly', () => {
            const pills = [
                {
                    id: 'pill-1',
                    type: 'condition' as const,
                    field: 'artist' as const,
                    operation: 'match' as const,
                    text: 'artist:match'
                },
                {
                    id: 'pill-2',
                    type: 'combinator' as const,
                    combinator: 'AND' as const,
                    text: 'AND'
                },
                {
                    id: 'pill-3',
                    type: 'condition' as const,
                    field: 'title' as const,
                    operation: 'contains' as const,
                    text: 'title:contains'
                }
            ];

            const expression = pillsToExpression(pills);
            expect(expression).toBe('artist:match AND title:contains');
        });

        test('should handle similarity operations with thresholds', () => {
            const expression = 'artist:similarity>=0.85';
            const pills = expressionToPills(expression);
            const regeneratedExpression = pillsToExpression(pills);
            
            expect(regeneratedExpression).toBe('artist:similarity>=0.85');
            expect(pills[0].threshold).toBe(0.85);
        });
    });

    describe('Pill Rendering and Interactions', () => {
        test('should render empty state when no expression provided', () => {
            renderWithTheme(
                <PillEditor
                    value=""
                    onChange={mockOnChange}
                />
            );

            expect(screen.getByText('Click + Add Field to start')).toBeInTheDocument();
            expect(screen.getByText('+ Add Field')).toBeInTheDocument();
        });

        test('should render pills for existing expression', () => {
            renderWithTheme(
                <PillEditor
                    value="artist:match AND title:contains"
                    onChange={mockOnChange}
                />
            );

            expect(screen.getByText('artist')).toBeInTheDocument();
            expect(screen.getByText('title')).toBeInTheDocument();
            expect(screen.getByText('AND')).toBeInTheDocument();
            expect(screen.getByText('+ Add Field')).toBeInTheDocument();
        });

        test('should show field selector popup when add field is clicked', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value=""
                    onChange={mockOnChange}
                />
            );

            const addButton = screen.getByText('+ Add Field');
            await user.click(addButton);

            await waitFor(() => {
                expect(screen.getByText('Artist')).toBeInTheDocument();
                expect(screen.getByText('Title')).toBeInTheDocument();
                expect(screen.getByText('Album')).toBeInTheDocument();
            });
        });

        test('should add new field when selected from popup', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value=""
                    onChange={mockOnChange}
                />
            );

            // Click add field button
            const addButton = screen.getByText('+ Add Field');
            await user.click(addButton);

            // Select artist field
            await waitFor(() => {
                const artistOption = screen.getByText('Artist');
                return user.click(artistOption);
            });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith('artist:?');
            });
        });

        test('should show operation selector when field pill is clicked', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                />
            );

            const artistPill = screen.getByText('artist');
            await user.click(artistPill);

            await waitFor(() => {
                expect(screen.getByText('Match')).toBeInTheDocument();
                expect(screen.getByText('Contains')).toBeInTheDocument();
                expect(screen.getByText('Similarity')).toBeInTheDocument();
            });
        });

        test('should update operation when selected from popup', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                />
            );

            const artistPill = screen.getByText('artist');
            await user.click(artistPill);

            await waitFor(() => {
                const containsOption = screen.getByText('Contains');
                return user.click(containsOption);
            });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith('artist:contains');
            });
        });

        test('should handle similarity operations with threshold selection', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                />
            );

            const artistPill = screen.getByText('artist');
            await user.click(artistPill);

            await waitFor(async () => {
                const similarityOption = screen.getByText('Similarity');
                await user.click(similarityOption);
                
                // Select 90% threshold
                const threshold90 = screen.getByLabelText('90%');
                await user.click(threshold90);
            });

            await waitFor(() => {
                expect(mockOnChange).toHaveBeenCalledWith('artist:similarity>=0.9');
            });
        });
    });

    describe('Complex Expression Generation', () => {
        test('should generate multi-condition expression correctly', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value=""
                    onChange={mockOnChange}
                />
            );

            // Add first field (artist)
            let addButton = screen.getByText('+ Add Field');
            await user.click(addButton);
            
            await waitFor(async () => {
                const artistOption = screen.getByText('Artist');
                await user.click(artistOption);
            });

            // Add second field (title)
            await waitFor(async () => {
                addButton = screen.getByText('+ Add Field');
                await user.click(addButton);
            });

            await waitFor(async () => {
                const titleOption = screen.getByText('Title');
                await user.click(titleOption);
            });

            // Verify final expression includes both fields
            await waitFor(() => {
                const calls = mockOnChange.mock.calls;
                const lastCall = calls[calls.length - 1];
                expect(lastCall[0]).toBe('artist:? AND title:?');
            });
        });

        test('should maintain expression format consistency', () => {
            const testExpressions = [
                'artist:match',
                'artist:match AND title:contains',
                'artist:similarity>=0.8 AND title:match AND album:contains',
                'artist:match OR title:contains',
                'artist:similarity>=0.75'
            ];

            testExpressions.forEach(expression => {
                const pills = expressionToPills(expression);
                const regenerated = pillsToExpression(pills);
                
                // Should maintain same semantic meaning
                expect(regenerated).toBeTruthy();
                expect(regenerated.includes('AND') || regenerated.includes('OR') || !regenerated.includes(' ')).toBe(true);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle malformed expressions gracefully', () => {
            const malformedExpressions = [
                'artist:', // Missing operation
                ':match', // Missing field
                'artist:invalidop', // Invalid operation
                'invalidfield:match', // Invalid field
                'artist:match AND', // Incomplete combinator
                'AND artist:match' // Leading combinator
            ];

            malformedExpressions.forEach(expression => {
                expect(() => {
                    renderWithTheme(
                        <PillEditor
                            value={expression}
                            onChange={mockOnChange}
                        />
                    );
                }).not.toThrow();
            });
        });

        test('should work when disabled', () => {
            renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                    disabled={true}
                />
            );

            const artistPill = screen.getByText('artist');
            expect(artistPill.closest('.MuiChip-root')).toHaveClass('Mui-disabled');
            
            const addButton = screen.getByText('+ Add Field');
            expect(addButton.closest('.MuiChip-root')).toHaveClass('Mui-disabled');
        });

        test('should handle rapid consecutive changes', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value=""
                    onChange={mockOnChange}
                />
            );

            // Rapidly add multiple fields
            for (let i = 0; i < 3; i++) {
                const addButton = screen.getByText('+ Add Field');
                await user.click(addButton);
                
                await waitFor(async () => {
                    const artistOption = screen.getByText('Artist');
                    await user.click(artistOption);
                });
            }

            // Should handle all changes without errors
            expect(mockOnChange).toHaveBeenCalled();
            expect(mockOnChange.mock.calls.length).toBeGreaterThan(0);
        });

        test('should maintain state consistency during updates', () => {
            const { rerender } = renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                />
            );

            // Update with new expression
            rerender(
                <ThemeProvider theme={theme}>
                    <PillEditor
                        value="artist:match AND title:contains"
                        onChange={mockOnChange}
                    />
                </ThemeProvider>
            );

            expect(screen.getByText('artist')).toBeInTheDocument();
            expect(screen.getByText('title')).toBeInTheDocument();
            expect(screen.getByText('AND')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA labels', () => {
            renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                />
            );

            const artistPill = screen.getByText('artist');
            expect(artistPill.closest('.MuiChip-root')).toHaveAttribute('role');
        });

        test('should support keyboard navigation', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                />
            );

            const artistPill = screen.getByText('artist');
            
            // Focus and activate with keyboard
            artistPill.focus();
            await user.keyboard('{Enter}');

            await waitFor(() => {
                expect(screen.getByText('Match')).toBeInTheDocument();
            });
        });

        test('should have proper focus management', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value=""
                    onChange={mockOnChange}
                />
            );

            const addButton = screen.getByText('+ Add Field');
            await user.click(addButton);

            await waitFor(() => {
                const popup = screen.getByText('Artist');
                expect(document.activeElement).not.toBe(addButton);
            });
        });
    });

    describe('Performance', () => {
        test('should handle large number of pills efficiently', () => {
            const largeExpression = Array(50).fill('artist:match').join(' AND ');
            
            const startTime = performance.now();
            renderWithTheme(
                <PillEditor
                    value={largeExpression}
                    onChange={mockOnChange}
                />
            );
            const renderTime = performance.now() - startTime;

            expect(renderTime).toBeLessThan(100); // Should render in <100ms
        });

        test('should update expression efficiently', async () => {
            const user = userEvent.setup();
            
            renderWithTheme(
                <PillEditor
                    value="artist:match"
                    onChange={mockOnChange}
                />
            );

            const startTime = performance.now();
            
            const artistPill = screen.getByText('artist');
            await user.click(artistPill);

            await waitFor(async () => {
                const containsOption = screen.getByText('Contains');
                await user.click(containsOption);
            });

            const updateTime = performance.now() - startTime;
            expect(updateTime).toBeLessThan(500); // Should update in <500ms
        });
    });
});

describe('PillEditor Backward Compatibility', () => {
    let mockOnChange: jest.Mock;

    beforeEach(() => {
        mockOnChange = jest.fn();
    });

    test('should work with existing ExpressionInput format', () => {
        const legacyExpressions = [
            'artist:match',
            'artist:match AND title:contains',
            'artist:similarity>=0.8',
            'artist:match AND title:contains AND album:match',
            'artist:similarity>=0.85 AND title:match'
        ];

        legacyExpressions.forEach(expression => {
            expect(() => {
                renderWithTheme(
                    <PillEditor
                        value={expression}
                        onChange={mockOnChange}
                    />
                );
            }).not.toThrow();
        });
    });

    test('should maintain same prop interface as ExpressionInput', () => {
        const props = {
            value: 'artist:match',
            onChange: mockOnChange,
            disabled: false,
            placeholder: 'Test placeholder',
            size: 'small' as const
        };

        expect(() => {
            renderWithTheme(<PillEditor {...props} />);
        }).not.toThrow();
    });

    test('should generate expression compatible with existing parsers', () => {
        const testCases = [
            { input: 'artist:match', expected: ['artist', 'match'] },
            { input: 'title:contains', expected: ['title', 'contains'] },
            { input: 'album:similarity>=0.8', expected: ['album', 'similarity>=0.8'] }
        ];

        testCases.forEach(({ input, expected }) => {
            const pills = expressionToPills(input);
            const output = pillsToExpression(pills);
            
            // Should contain the expected field and operation
            expect(output).toContain(expected[0]);
            expect(output).toContain(expected[1]);
        });
    });
});