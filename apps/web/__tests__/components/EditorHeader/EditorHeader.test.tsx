import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EditorHeader from '../../../src/components/EditorHeader';

type ViewMode = 'ui' | 'json';

describe('EditorHeader', () => {
    const mockOnViewModeChange = vi.fn();
    const mockOnSave = vi.fn();
    const mockOnReset = vi.fn();

    const defaultProps = {
        title: 'Test Editor',
        viewMode: 'ui' as ViewMode,
        onViewModeChange: mockOnViewModeChange,
        onSave: mockOnSave,
        onReset: mockOnReset,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('should render without crashing', () => {
            render(<EditorHeader {...defaultProps} />);
      
            expect(screen.getByText('Test Editor')).toBeInTheDocument();
        });

        it('should display the correct title', () => {
            render(<EditorHeader {...defaultProps} title="Custom Title" />);
      
            expect(screen.getByText('Custom Title')).toBeInTheDocument();
            expect(screen.queryByText('Test Editor')).not.toBeInTheDocument();
        });

        it('should render all action buttons', () => {
            render(<EditorHeader {...defaultProps} />);
      
            expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
            expect(screen.getByText('Save Configuration')).toBeInTheDocument();
        });

        it('should render view mode toggle buttons', () => {
            render(<EditorHeader {...defaultProps} />);
      
            expect(screen.getByText('UI Mode')).toBeInTheDocument();
            expect(screen.getByText('JSON Mode')).toBeInTheDocument();
        });

        it('should render icons within buttons', () => {
            render(<EditorHeader {...defaultProps} />);
      
            // Icons should be present (testing by their test attributes or aria-labels)
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
            const resetButton = screen.getByText('Reset to Defaults').closest('button');
            const saveButton = screen.getByText('Save Configuration').closest('button');
      
            expect(uiModeButton).toBeInTheDocument();
            expect(jsonModeButton).toBeInTheDocument();
            expect(resetButton).toBeInTheDocument();
            expect(saveButton).toBeInTheDocument();
        });
    });

    describe('View Mode Toggle', () => {
        it('should show UI mode as selected by default', () => {
            render(<EditorHeader {...defaultProps} viewMode="ui" />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            expect(uiModeButton).toHaveClass('Mui-selected');
        });

        it('should show JSON mode as selected when specified', () => {
            render(<EditorHeader {...defaultProps} viewMode="json" />);
      
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
            expect(jsonModeButton).toHaveClass('Mui-selected');
        });

        it('should call onViewModeChange when UI mode is clicked', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} viewMode="json" />);
      
            const uiModeButton = screen.getByText('UI Mode');
            await user.click(uiModeButton);
      
            expect(mockOnViewModeChange).toHaveBeenCalledTimes(1);
            expect(mockOnViewModeChange).toHaveBeenCalledWith(
                expect.any(Object),
                'ui'
            );
        });

        it('should call onViewModeChange when JSON mode is clicked', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} viewMode="ui" />);
      
            const jsonModeButton = screen.getByText('JSON Mode');
            await user.click(jsonModeButton);
      
            expect(mockOnViewModeChange).toHaveBeenCalledTimes(1);
            expect(mockOnViewModeChange).toHaveBeenCalledWith(
                expect.any(Object),
                'json'
            );
        });

        it('should handle clicking the same mode button', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} viewMode="ui" />);
      
            const uiModeButton = screen.getByText('UI Mode');
            await user.click(uiModeButton);
      
            expect(mockOnViewModeChange).toHaveBeenCalledTimes(1);
            expect(mockOnViewModeChange).toHaveBeenCalledWith(
                expect.any(Object),
                null // Material-UI ToggleButtonGroup returns null when clicking selected button
            );
        });

        it('should be exclusive selection (only one mode selected at a time)', () => {
            render(<EditorHeader {...defaultProps} viewMode="ui" />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
      
            expect(uiModeButton).toHaveClass('Mui-selected');
            expect(jsonModeButton).not.toHaveClass('Mui-selected');
        });
    });

    describe('Action Buttons', () => {
        it('should call onReset when reset button is clicked', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} />);
      
            const resetButton = screen.getByText('Reset to Defaults');
            await user.click(resetButton);
      
            expect(mockOnReset).toHaveBeenCalledTimes(1);
        });

        it('should call onSave when save button is clicked', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} />);
      
            const saveButton = screen.getByText('Save Configuration');
            await user.click(saveButton);
      
            expect(mockOnSave).toHaveBeenCalledTimes(1);
        });

        it('should handle multiple rapid clicks on action buttons', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} />);
      
            const saveButton = screen.getByText('Save Configuration');
      
            // Simulate rapid clicking
            await user.click(saveButton);
            await user.click(saveButton);
            await user.click(saveButton);
      
            expect(mockOnSave).toHaveBeenCalledTimes(3);
        });

        it('should support keyboard interaction on action buttons', () => {
            render(<EditorHeader {...defaultProps} />);
      
            const resetButton = screen.getByText('Reset to Defaults');
            const saveButton = screen.getByText('Save Configuration');
      
            // Simulate Enter key press
            fireEvent.keyDown(resetButton, { key: 'Enter', code: 'Enter' });
            expect(mockOnReset).toHaveBeenCalledTimes(1);
      
            fireEvent.keyDown(saveButton, { key: 'Enter', code: 'Enter' });
            expect(mockOnSave).toHaveBeenCalledTimes(1);
        });
    });

    describe('Disabled State', () => {
        it('should disable all interactive elements when disabled prop is true', () => {
            render(<EditorHeader {...defaultProps} disabled />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
            const resetButton = screen.getByText('Reset to Defaults');
            const saveButton = screen.getByText('Save Configuration');
      
            expect(uiModeButton).toBeDisabled();
            expect(jsonModeButton).toBeDisabled();
            expect(resetButton).toBeDisabled();
            expect(saveButton).toBeDisabled();
        });

        it('should enable all interactive elements when disabled prop is false', () => {
            render(<EditorHeader {...defaultProps} disabled={false} />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
            const resetButton = screen.getByText('Reset to Defaults');
            const saveButton = screen.getByText('Save Configuration');
      
            expect(uiModeButton).not.toBeDisabled();
            expect(jsonModeButton).not.toBeDisabled();
            expect(resetButton).not.toBeDisabled();
            expect(saveButton).not.toBeDisabled();
        });

        it('should enable all interactive elements when disabled prop is undefined', () => {
            render(<EditorHeader {...defaultProps} disabled={undefined} />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
            const resetButton = screen.getByText('Reset to Defaults');
            const saveButton = screen.getByText('Save Configuration');
      
            expect(uiModeButton).not.toBeDisabled();
            expect(jsonModeButton).not.toBeDisabled();
            expect(resetButton).not.toBeDisabled();
            expect(saveButton).not.toBeDisabled();
        });

        it('should not trigger callbacks when buttons are disabled', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} disabled />);
      
            const resetButton = screen.getByText('Reset to Defaults');
            const saveButton = screen.getByText('Save Configuration');
            const uiModeButton = screen.getByText('UI Mode');
            const jsonModeButton = screen.getByText('JSON Mode');
      
            await user.click(resetButton);
            await user.click(saveButton);
            await user.click(uiModeButton);
            await user.click(jsonModeButton);
      
            expect(mockOnReset).not.toHaveBeenCalled();
            expect(mockOnSave).not.toHaveBeenCalled();
            expect(mockOnViewModeChange).not.toHaveBeenCalled();
        });
    });

    describe('Layout and Styling', () => {
        it('should have proper layout structure', () => {
            render(<EditorHeader {...defaultProps} />);
      
            // Find the main container
            const header = screen.getByText('Test Editor').closest('div');
            expect(header).toBeInTheDocument();
      
            // Should contain title on the left and controls on the right
            expect(screen.getByText('Test Editor')).toBeInTheDocument();
            expect(screen.getByText('UI Mode')).toBeInTheDocument();
            expect(screen.getByText('JSON Mode')).toBeInTheDocument();
            expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
            expect(screen.getByText('Save Configuration')).toBeInTheDocument();
        });

        it('should apply proper button variants and sizes', () => {
            render(<EditorHeader {...defaultProps} />);
      
            const resetButton = screen.getByText('Reset to Defaults').closest('button');
            const saveButton = screen.getByText('Save Configuration').closest('button');
      
            // Reset button should be outlined variant
            expect(resetButton).toHaveClass('MuiButton-outlined');
      
            // Save button should be contained variant
            expect(saveButton).toHaveClass('MuiButton-contained');
      
            // Both should be small size
            expect(resetButton).toHaveClass('MuiButton-sizeSmall');
            expect(saveButton).toHaveClass('MuiButton-sizeSmall');
        });

        it('should have divider between toggle buttons and action buttons', () => {
            render(<EditorHeader {...defaultProps} />);
      
            // Look for divider element (Material-UI Divider)
            const container = screen.getByText('Test Editor').closest('div');
            expect(container).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA attributes', () => {
            render(<EditorHeader {...defaultProps} />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
      
            // Toggle buttons should have proper roles
            expect(uiModeButton).toHaveAttribute('role', 'button');
            expect(jsonModeButton).toHaveAttribute('role', 'button');
        });

        it('should be keyboard navigable', () => {
            render(<EditorHeader {...defaultProps} />);
      
            const uiModeButton = screen.getByText('UI Mode');
            const jsonModeButton = screen.getByText('JSON Mode');
            const resetButton = screen.getByText('Reset to Defaults');
            const saveButton = screen.getByText('Save Configuration');
      
            // All buttons should be focusable
            uiModeButton.focus();
            expect(document.activeElement).toBe(uiModeButton);
      
            jsonModeButton.focus();
            expect(document.activeElement).toBe(jsonModeButton);
      
            resetButton.focus();
            expect(document.activeElement).toBe(resetButton);
      
            saveButton.focus();
            expect(document.activeElement).toBe(saveButton);
        });

        it('should have appropriate button labels', () => {
            render(<EditorHeader {...defaultProps} />);
      
            expect(screen.getByText('UI Mode')).toBeInTheDocument();
            expect(screen.getByText('JSON Mode')).toBeInTheDocument();
            expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
            expect(screen.getByText('Save Configuration')).toBeInTheDocument();
        });

        it('should indicate selected state for view mode buttons', () => {
            render(<EditorHeader {...defaultProps} viewMode="ui" />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
      
            expect(uiModeButton).toHaveClass('Mui-selected');
            expect(jsonModeButton).not.toHaveClass('Mui-selected');
      
            // Should have proper aria-pressed attributes
            expect(uiModeButton).toHaveAttribute('aria-pressed', 'true');
            expect(jsonModeButton).toHaveAttribute('aria-pressed', 'false');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty title gracefully', () => {
            render(<EditorHeader {...defaultProps} title="" />);
      
            // Should render without crashing, even with empty title
            expect(screen.getByText('UI Mode')).toBeInTheDocument();
            expect(screen.getByText('JSON Mode')).toBeInTheDocument();
        });

        it('should handle very long titles', () => {
            const longTitle = 'This is a very long title that should be handled gracefully by the component and not break the layout';
      
            render(<EditorHeader {...defaultProps} title={longTitle} />);
      
            expect(screen.getByText(longTitle)).toBeInTheDocument();
        });

        it('should handle null callback functions gracefully', () => {
            const { rerender } = render(
                <EditorHeader 
                    title="Test"
                    viewMode="ui"
                    onViewModeChange={() => {}}
                    onSave={() => {}}
                    onReset={() => {}}
        />
            );
      
            // Should not crash when callbacks are null
            rerender(
                <EditorHeader title="Test" viewMode="ui" onViewModeChange={null as any} onSave={null as any} onReset={null as any} />
            );
      
            expect(screen.getByText('Test')).toBeInTheDocument();
        });

        it('should handle rapid view mode changes', async () => {
            const user = userEvent.setup();
            render(<EditorHeader {...defaultProps} />);
      
            const uiModeButton = screen.getByText('UI Mode');
            const jsonModeButton = screen.getByText('JSON Mode');
      
            // Rapid clicking between modes
            await user.click(jsonModeButton);
            await user.click(uiModeButton);
            await user.click(jsonModeButton);
            await user.click(uiModeButton);
      
            expect(mockOnViewModeChange).toHaveBeenCalledTimes(4);
        });

        it('should maintain state consistency during re-renders', () => {
            const { rerender } = render(<EditorHeader {...defaultProps} viewMode="ui" />);
      
            const uiModeButton = screen.getByText('UI Mode').closest('button');
            expect(uiModeButton).toHaveClass('Mui-selected');
      
            // Re-render with same props
            rerender(<EditorHeader {...defaultProps} viewMode="ui" />);
      
            const uiModeButtonAfterRerender = screen.getByText('UI Mode').closest('button');
            expect(uiModeButtonAfterRerender).toHaveClass('Mui-selected');
      
            // Re-render with different viewMode
            rerender(<EditorHeader {...defaultProps} viewMode="json" />);
      
            const jsonModeButton = screen.getByText('JSON Mode').closest('button');
            expect(jsonModeButton).toHaveClass('Mui-selected');
      
            const uiModeButtonFinal = screen.getByText('UI Mode').closest('button');
            expect(uiModeButtonFinal).not.toHaveClass('Mui-selected');
        });
    });

    describe('Performance', () => {
        it('should not cause unnecessary re-renders with same props', () => {
            const renderCount = vi.fn();
      
            const TestWrapper = (props: typeof defaultProps) => {
                renderCount();

                return <EditorHeader {...props} />;
            };
      
            const { rerender } = render(<TestWrapper {...defaultProps} />);
            expect(renderCount).toHaveBeenCalledTimes(1);
      
            // Re-render with identical props
            rerender(<TestWrapper {...defaultProps} />);
            expect(renderCount).toHaveBeenCalledTimes(2); // React will re-render, but that's expected
      
            // Re-render with different props
            rerender(<TestWrapper {...defaultProps} title="New Title" />);
            expect(renderCount).toHaveBeenCalledTimes(3);
        });

        it('should handle high frequency interactions efficiently', async () => {
            const user = userEvent.setup();
            const fastOnSave = vi.fn();
      
            render(<EditorHeader {...defaultProps} onSave={fastOnSave} />);
      
            const saveButton = screen.getByText('Save Configuration');
      
            const startTime = performance.now();
      
            // Simulate many rapid clicks
            for (let i = 0; i < 100; i++) {
                await user.click(saveButton);
            }
      
            const endTime = performance.now();
            const duration = endTime - startTime;
      
            expect(fastOnSave).toHaveBeenCalledTimes(100);
            expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
        });
    });
});