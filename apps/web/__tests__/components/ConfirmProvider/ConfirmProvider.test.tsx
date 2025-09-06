import React, { useContext } from 'react';
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConfirmProvider, { confirm } from '../../../src/components/ConfirmProvider/ConfirmProvider';
import { ConfirmContext } from '../../../src/components/ConfirmProvider/ConfirmContext';

// Mock the ConfirmContext
const TestComponent = () => {
    const { confirm: contextConfirm } = useContext(ConfirmContext);
  
    return (
        <div>
            <button 
                onClick={() => contextConfirm({ title: 'Test Title', content: 'Test content' })}
                data-testid="trigger-confirm-context"
      >
                Trigger Confirm via Context
            </button>
            <button 
                onClick={() => confirm({ title: 'Exported Confirm', content: 'Exported content' })}
                data-testid="trigger-confirm-export"
      >
                Trigger Confirm via Export
            </button>
            <button 
                onClick={() => contextConfirm({ 
                    title: 'Custom Options', 
                    content: 'Custom content',
                    confirmationText: 'Accept',
                    cancellationText: 'Decline',
                    rejectOnCancel: true 
                })}
                data-testid="trigger-confirm-custom"
      >
                Trigger Custom Confirm
            </button>
            <button
                onClick={() => contextConfirm({
                    title: 'No Cancel Button',
                    content: 'This dialog has no cancel button',
                    hideCancelButton: true
                })}
                data-testid="trigger-confirm-no-cancel"
      >
                Trigger No Cancel
            </button>
        </div>
    );
};

describe('ConfirmProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Provider Setup', () => {
        it('should render without crashing', () => {
            render(
                <ConfirmProvider />
            );
      
            // No dialog should be visible initially
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should provide confirm function through context', () => {
            render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            expect(screen.getByTestId('trigger-confirm-context')).toBeInTheDocument();
            expect(screen.getByTestId('trigger-confirm-export')).toBeInTheDocument();
        });

        it('should not display confirmation dialog initially', () => {
            render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    describe('Dialog Display and Content', () => {
        it('should display confirmation dialog with default options', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-confirm-context'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Test Title')).toBeInTheDocument();
            expect(screen.getByText('Test content')).toBeInTheDocument();
            expect(screen.getByText('Yes, delete')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('should display confirmation dialog with custom options', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-confirm-custom'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Custom Options')).toBeInTheDocument();
            expect(screen.getByText('Custom content')).toBeInTheDocument();
            expect(screen.getByText('Accept')).toBeInTheDocument();
            expect(screen.getByText('Decline')).toBeInTheDocument();
        });

        it('should display dialog without cancel button when hideCancelButton is true', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-confirm-no-cancel'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('No Cancel Button')).toBeInTheDocument();
            expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
            expect(screen.getByText('Yes, delete')).toBeInTheDocument();
        });

        it('should work with exported confirm function', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-confirm-export'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Exported Confirm')).toBeInTheDocument();
            expect(screen.getByText('Exported content')).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should resolve promise when confirm button is clicked', async () => {
            const user = userEvent.setup();
            let resolveValue: any;
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={async () => {
                                try {
                                    await confirm({ title: 'Test', content: 'Test' });
                                    resolveValue = 'confirmed';
                                } catch {
                                    resolveValue = 'cancelled';
                                }
                            }}
                            data-testid="trigger-promise-test"
            >
                            Test Promise
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-promise-test'));
      
            expect(screen.getByRole('dialog')).toBeInTheDocument();
      
            await user.click(screen.getByText('Yes, delete'));
      
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
      
            // Allow promise to resolve
            await waitFor(() => {
                expect(resolveValue).toBe('confirmed');
            });
        });

        it('should not reject promise on cancel by default', async () => {
            const user = userEvent.setup();
            let resolveValue: any;
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={async () => {
                                try {
                                    await confirm({ title: 'Test', content: 'Test' });
                                    resolveValue = 'confirmed';
                                } catch {
                                    resolveValue = 'cancelled';
                                }
                            }}
                            data-testid="trigger-cancel-test"
            >
                            Test Cancel
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-cancel-test'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();
      
            await user.click(screen.getByText('Cancel'));
      
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
      
            // Promise should neither resolve nor reject
            expect(resolveValue).toBeUndefined();
        });

        it('should reject promise on cancel when rejectOnCancel is true', async () => {
            const user = userEvent.setup();
            let resolveValue: any;
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={async () => {
                                try {
                                    await confirm({ 
                                        title: 'Test', 
                                        content: 'Test', 
                                        rejectOnCancel: true 
                                    });
                                    resolveValue = 'confirmed';
                                } catch {
                                    resolveValue = 'rejected';
                                }
                            }}
                            data-testid="trigger-reject-test"
            >
                            Test Reject
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-reject-test'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();
      
            await user.click(screen.getByText('Cancel'));
      
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
      
            await waitFor(() => {
                expect(resolveValue).toBe('rejected');
            });
        });
    });

    describe('Keyboard Navigation', () => {
        it('should confirm dialog when Enter key is pressed', async () => {
            const user = userEvent.setup();
            let resolveValue: any;
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={async () => {
                                try {
                                    await confirm({ title: 'Test', content: 'Test' });
                                    resolveValue = 'confirmed';
                                } catch {
                                    resolveValue = 'cancelled';
                                }
                            }}
                            data-testid="trigger-enter-test"
            >
                            Test Enter
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-enter-test'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();
      
            await user.keyboard('{Enter}');
      
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
      
            await waitFor(() => {
                expect(resolveValue).toBe('confirmed');
            });
        });

        it('should not trigger confirm on Enter when dialog is not open', async () => {
            const user = userEvent.setup();
            let resolveValue: any;
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={async () => {
                                resolveValue = 'clicked';
                            }}
                            data-testid="trigger-no-dialog"
            >
                            No Dialog Button
                        </button>
                    </div>
                </ConfirmProvider>
            );

            // Press Enter without opening dialog
            await user.keyboard('{Enter}');
      
            // Should not trigger anything
            expect(resolveValue).toBeUndefined();
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    describe('Dialog Options', () => {
        it('should handle empty options gracefully', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={() => confirm({})}
                            data-testid="trigger-empty-options"
            >
                            Empty Options
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-empty-options'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('Are you sure?')).toBeInTheDocument(); // Default title
            expect(screen.getByText('Yes, delete')).toBeInTheDocument(); // Default confirm text
            expect(screen.getByText('Cancel')).toBeInTheDocument(); // Default cancel text
        });

        it('should apply custom dialog props', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={() => confirm({
                                title: 'Custom Dialog',
                                content: 'Custom content',
                                dialogProps: { 
                                    maxWidth: 'md'
                                }
                            })}
                            data-testid="trigger-custom-dialog"
            >
                            Custom Dialog Props
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-custom-dialog'));

            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();
            expect(screen.getByText('Custom Dialog')).toBeInTheDocument();
        });

        it('should handle button order configuration', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={() => confirm({
                                title: 'Button Order Test',
                                content: 'Test content',
                                buttonOrder: ['confirm', 'cancel']
                            })}
                            data-testid="trigger-button-order"
            >
                            Button Order
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-button-order'));

            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();
      
            const buttons = screen.getAllByRole('button');
            const actionButtons = buttons.slice(-2); // Last two buttons should be the action buttons
      
            expect(actionButtons[0]).toHaveTextContent('Yes, delete');
            expect(actionButtons[1]).toHaveTextContent('Cancel');
        });
    });

    describe('Multiple Confirmations', () => {
        it('should handle sequential confirmations correctly', async () => {
            const user = userEvent.setup();
            let resolveCount = 0;
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={async () => {
                                try {
                                    await confirm({ title: 'First', content: 'First confirmation' });
                                    resolveCount++;
                                    await confirm({ title: 'Second', content: 'Second confirmation' });
                                    resolveCount++;
                                } catch {
                                    // Handle rejection
                                }
                            }}
                            data-testid="trigger-sequential"
            >
                            Sequential Confirmations
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-sequential'));

            // First dialog
            expect(screen.getByText('First')).toBeInTheDocument();
            await user.click(screen.getByText('Yes, delete'));
      
            await waitFor(() => {
                expect(screen.queryByText('First')).not.toBeInTheDocument();
            });

            // Second dialog should appear
            await waitFor(() => {
                expect(screen.getByText('Second')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Yes, delete'));
      
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });

            await waitFor(() => {
                expect(resolveCount).toBe(2);
            });
        });

        it('should handle overlapping confirmations by showing the latest', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={() => {
                                confirm({ title: 'First', content: 'First confirmation' });
                                confirm({ title: 'Second', content: 'Second confirmation' });
                                confirm({ title: 'Third', content: 'Third confirmation' });
                            }}
                            data-testid="trigger-overlapping"
            >
                            Overlapping Confirmations
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-overlapping'));

            // Should only show the last dialog
            expect(screen.getByText('Third')).toBeInTheDocument();
            expect(screen.getByText('Third confirmation')).toBeInTheDocument();
            expect(screen.queryByText('First')).not.toBeInTheDocument();
            expect(screen.queryByText('Second')).not.toBeInTheDocument();
        });
    });

    describe('Component Cleanup', () => {
        it('should cleanup event listeners on unmount', () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
            const { unmount } = render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
            unmount();
      
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
            addEventListenerSpy.mockRestore();
            removeEventListenerSpy.mockRestore();
        });

        it('should handle unmount while dialog is open', async () => {
            const user = userEvent.setup();
      
            const { unmount } = render(
                <ConfirmProvider>
                    <TestComponent />
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-confirm-context'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();

            // Should not throw error on unmount
            expect(() => unmount()).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid button clicks gracefully', async () => {
            const user = userEvent.setup();
            let resolveCount = 0;
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={async () => {
                                try {
                                    await confirm({ title: 'Test', content: 'Test' });
                                    resolveCount++;
                                } catch {
                                    // Handle rejection
                                }
                            }}
                            data-testid="trigger-rapid-clicks"
            >
                            Rapid Clicks Test
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-rapid-clicks'));
            expect(screen.getByRole('dialog')).toBeInTheDocument();

            const confirmButton = screen.getByText('Yes, delete');
      
            // Simulate rapid clicking
            await user.click(confirmButton);
            await user.click(confirmButton);
            await user.click(confirmButton);
      
            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });

            // Should only resolve once
            await waitFor(() => {
                expect(resolveCount).toBe(1);
            });
        });

        it('should handle null/undefined content gracefully', async () => {
            const user = userEvent.setup();
      
            render(
                <ConfirmProvider>
                    <div>
                        <button
                            onClick={() => confirm({
                                title: 'No Content Test',
                                content: null
                            })}
                            data-testid="trigger-null-content"
            >
                            Null Content
                        </button>
                    </div>
                </ConfirmProvider>
            );

            await user.click(screen.getByTestId('trigger-null-content'));

            expect(screen.getByRole('dialog')).toBeInTheDocument();
            expect(screen.getByText('No Content Test')).toBeInTheDocument();
            // Dialog should still render without content section
        });
    });
});