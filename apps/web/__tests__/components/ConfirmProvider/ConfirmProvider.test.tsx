import React, { useContext } from 'react';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ConfirmProvider, { confirm } from '../../../src/components/ConfirmProvider/ConfirmProvider';
import { ConfirmContext } from '../../../src/components/ConfirmProvider/ConfirmContext';

const TestComponent = () => {
    const { confirm: contextConfirm } = useContext(ConfirmContext);
  
    return (
        <div>
            <button 
                type="button"
                onClick={() => contextConfirm({ title: 'Test Title', content: 'Test content' })}
                data-testid="trigger-confirm-context"
            >
                Trigger Confirm via Context
            </button>
            <button 
                type="button"
                onClick={() => confirm({ title: 'Exported Confirm', content: 'Exported content' })}
                data-testid="trigger-confirm-export"
            >
                Trigger Confirm via Export
            </button>
            <button 
                type="button"
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
        </div>
    );
};

const renderWithProvider = () => {
    return render(
        <ConfirmProvider>
            <TestComponent />
        </ConfirmProvider>
    );
};

describe('ConfirmProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Functionality', () => {
        it('should render without crashing', () => {
            renderWithProvider();
            expect(screen.getByTestId('trigger-confirm-context')).toBeInTheDocument();
        });

        it('should not display confirmation dialog initially', () => {
            renderWithProvider();
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        it('should display confirmation dialog when triggered', async () => {
            const user = userEvent.setup();
            renderWithProvider();

            await user.click(screen.getByTestId('trigger-confirm-context'));

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
                expect(screen.getByText('Test Title')).toBeInTheDocument();
                expect(screen.getByText('Test content')).toBeInTheDocument();
            });
        });

        it('should work with exported confirm function', async () => {
            const user = userEvent.setup();
            renderWithProvider();

            await user.click(screen.getByTestId('trigger-confirm-export'));

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
                expect(screen.getByText('Exported Confirm')).toBeInTheDocument();
                expect(screen.getByText('Exported content')).toBeInTheDocument();
            });
        });

        it('should display custom confirmation text', async () => {
            const user = userEvent.setup();
            renderWithProvider();

            await user.click(screen.getByTestId('trigger-confirm-custom'));

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
                expect(screen.getByText('Accept')).toBeInTheDocument();
                expect(screen.getByText('Decline')).toBeInTheDocument();
            });
        });

        it('should close dialog when confirm button is clicked', async () => {
            const user = userEvent.setup();
            renderWithProvider();

            await user.click(screen.getByTestId('trigger-confirm-context'));

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Confirm'));

            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
        });

        it('should close dialog when cancel button is clicked', async () => {
            const user = userEvent.setup();
            renderWithProvider();

            await user.click(screen.getByTestId('trigger-confirm-context'));

            await waitFor(() => {
                expect(screen.getByRole('dialog')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            });
        });
    });
});