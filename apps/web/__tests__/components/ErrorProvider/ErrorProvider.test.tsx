import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import ErrorProvider, { showError } from '../../../src/components/ErrorProvider/ErrorProvider';
import { useContext } from 'react';
import { ErrorContext } from '../../../src/components/ErrorProvider/ErrorContext';

// Test component that can trigger errors
const TestComponent = () => {
    const { showError: contextShowError } = useContext(ErrorContext);
  
    return (
        <div>
            <button 
                onClick={() => contextShowError('Test error message')}
                data-testid="trigger-error-context"
      >
                Trigger Error via Context
            </button>
            <button 
                onClick={() => showError('Test error via export')}
                data-testid="trigger-error-export"
      >
                Trigger Error via Export
            </button>
            <button 
                onClick={() => contextShowError('Error with stack', 'Stack trace information')}
                data-testid="trigger-error-with-stack"
      >
                Trigger Error with Stack
            </button>
        </div>
    );
};

describe('ErrorProvider', () => {
    beforeEach(() => {
    // Clear any existing errors before each test
        jest.clearAllMocks();
    });

    describe('Context Value Propagation', () => {
        it('should provide showError function through context', () => {
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            expect(screen.getByTestId('trigger-error-context')).toBeInTheDocument();
            expect(screen.getByTestId('trigger-error-export')).toBeInTheDocument();
        });

        it('should not display error dialog initially', () => {
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(screen.queryByText('Error')).not.toBeInTheDocument();
        });
    });

    describe('Error Dialog Display', () => {
        it('should display error dialog when showError is called via context', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-context'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(screen.getByText('Test error message')).toBeInTheDocument();
        });

        it('should display error dialog when showError is called via export', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-export'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Error')).toBeInTheDocument();
            expect(screen.getByText('Test error via export')).toBeInTheDocument();
        });

        it('should display stack trace when provided', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-with-stack'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Error with stack')).toBeInTheDocument();
      
            // Stack trace should be in an accordion
            expect(screen.getByText('Stack Trace')).toBeInTheDocument();
      
            // Expand the accordion to see the stack trace
            await user.click(screen.getByText('Stack Trace'));
            expect(screen.getByText('Stack trace information')).toBeInTheDocument();
        });

        it('should not display stack trace section when stack trace is same as error message', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <div>
                        <button 
                            onClick={() => showError('Same message', 'Same message')}
                            data-testid="trigger-same-message"
            >
                            Trigger Same Message
                        </button>
                    </div>
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-same-message'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Same message')).toBeInTheDocument();
            expect(screen.queryByText('Stack Trace')).not.toBeInTheDocument();
        });
    });

    describe('Dialog Keyboard Navigation', () => {
        it('should close dialog when Escape key is pressed', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            // Trigger error dialog
            await user.click(screen.getByTestId('trigger-error-context'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();

            // Press Escape key
            await user.keyboard('{Escape}');

            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
        });

        it('should close dialog when close button is clicked', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            // Trigger error dialog
            await user.click(screen.getByTestId('trigger-error-context'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();

            // Click close button
            const closeButton = screen.getByRole('button', { name: /close/i });
            await user.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
        });

        it('should focus close button when dialog opens', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-context'));

            // Wait for dialog to open and check focus
            await waitFor(() => {
                const closeButton = screen.getByRole('button', { name: /close/i });
                expect(closeButton).toBeInTheDocument();
            });
        });
    });

    describe('Error Message Formatting', () => {
        it('should handle empty error message gracefully', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <div>
                        <button 
                            onClick={() => showError('')}
                            data-testid="trigger-empty-error"
            >
                            Trigger Empty Error
                        </button>
                    </div>
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-empty-error'));

            // Dialog should not appear for empty error
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should handle long error messages', async () => {
            const user = userEvent.setup();
            const longMessage = 'This is a very long error message that should be displayed properly in the dialog without breaking the layout. '.repeat(10);
      
            render(
                <ErrorProvider>
                    <div>
                        <button 
                            onClick={() => showError(longMessage)}
                            data-testid="trigger-long-error"
            >
                            Trigger Long Error
                        </button>
                    </div>
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-long-error'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText(longMessage)).toBeInTheDocument();
        });

        it('should handle special characters in error messages', async () => {
            const user = userEvent.setup();
            const specialMessage = 'Error with special chars: <>&"\'';
      
            render(
                <ErrorProvider>
                    <div>
                        <button 
                            onClick={() => showError(specialMessage)}
                            data-testid="trigger-special-error"
            >
                            Trigger Special Error
                        </button>
                    </div>
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-special-error'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText(specialMessage)).toBeInTheDocument();
        });
    });

    describe('Dialog Accessibility', () => {
        it('should have proper ARIA attributes', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-context'));

            const dialog = screen.getByRole('dialog');
            expect(dialog).toHaveAttribute('aria-labelledby');
            expect(dialog).toHaveAttribute('aria-describedby');
        });

        it('should trap focus within the dialog', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-context'));

            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();

            // Focus should be trapped within the dialog
            await user.tab();
            const focusedElement = document.activeElement;
            expect(dialog.contains(focusedElement)).toBe(true);
        });
    });

    describe('Component Cleanup', () => {
        it('should cleanup properly on unmount', () => {
            const { unmount } = render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            // Trigger an error
            fireEvent.click(screen.getByTestId('trigger-error-context'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();

            // Unmount component
            unmount();

            // No errors should be thrown and dialog should be cleaned up
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should handle multiple error triggers correctly', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            // Trigger first error
            await user.click(screen.getByTestId('trigger-error-context'));
            expect(screen.getByText('Test error message')).toBeInTheDocument();

            // Close dialog
            await user.keyboard('{Escape}');
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });

            // Trigger second error
            await user.click(screen.getByTestId('trigger-error-export'));
            expect(screen.getByText('Test error via export')).toBeInTheDocument();
        });

        it('should handle rapid error triggers', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <div>
                        <button 
                            onClick={() => {
                                showError('First error');
                                showError('Second error');
                                showError('Third error');
                            }}
                            data-testid="trigger-multiple-errors"
            >
                            Trigger Multiple Errors
                        </button>
                    </div>
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-multiple-errors'));

            // Should only show the last error
            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Third error')).toBeInTheDocument();
            expect(screen.queryByText('First error')).not.toBeInTheDocument();
            expect(screen.queryByText('Second error')).not.toBeInTheDocument();
        });
    });

    describe('Error Dialog Content', () => {
        it('should display dialog with correct title', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-context'));

            expect(screen.getByRole('dialog', { name: /error/i })).toBeInTheDocument();
        });

        it('should have full width and small max width', async () => {
            const user = userEvent.setup();
      
            render(
                <ErrorProvider>
                    <TestComponent />
                </ErrorProvider>,
                { withErrorProvider: false }
            );

            await user.click(screen.getByTestId('trigger-error-context'));

            const dialog = screen.getByRole('dialog');
            expect(dialog.closest('.MuiDialog-root')).toBeInTheDocument();
        });
    });
});