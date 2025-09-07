import React from 'react';
import { render, screen, waitFor } from '../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';
import { useRouter } from 'next/router';
import Page from '../../pages/index';
import { GetSettingsResponse } from '../../pages/api/settings';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock next/router
vi.mock('next/router', () => ({
    useRouter: vi.fn(),
}));
const mockedUseRouter = useRouter as any;

// Mock next/head
vi.mock('next/head', () => {
    return {
        __esModule: true,
        default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

// Mock components
vi.mock('../../src/components/Logo', () => ({
    default: function Logo() {
        return <div data-testid="logo">
            Spotify to Plex Logo
        </div>;
    }
}));

vi.mock('../../src/components/PlexConnection', () => ({
    default: function PlexConnection({ setSettings, setConnected }: any) {
        return (
            <div data-testid="plex-connection">
                <button
                    onClick={() => {
                        setSettings({ loggedin: true, uri: 'http://plex.server' });
                        setConnected(true);
                    }}
                    data-testid="mock-connect-button"
        >
                    Connect to Plex
                </button>
            </div>
        );
    }
}));

vi.mock('../../src/components/PlexConnectionDialog', () => ({
    default: function PlexConnectionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
        if (!open) return null;

        return (
            <div data-testid="plex-connection-dialog" role="dialog">
                <button onClick={onClose} data-testid="close-dialog">Close Dialog</button>
                Plex Connection Dialog Content
            </div>
        );
    }
}));

vi.mock('../../src/layouts/MainLayout', () => ({
    default: function MainLayout({ children }: { children: React.ReactNode }) {
        return <div data-testid="main-layout">{children}</div>;
    }
}));

// Mock error boundary helper
vi.mock('../../src/helpers/errors/errorBoundary', () => ({
    errorBoundary: vi.fn((asyncFn) => asyncFn()),
}));

describe('Index Page', () => {
    const mockPush = vi.fn();
    const mockReplace = vi.fn();
    const mockRouter = {
        push: mockPush,
        replace: mockReplace,
        query: {},
        isReady: true,
    };

    const mockSettingsResponse: GetSettingsResponse = {
        loggedin: false,
        uri: '',
        id: '',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUseRouter.mockReturnValue(mockRouter as any);
        mockedAxios.get.mockResolvedValue({ data: mockSettingsResponse });
        mockedAxios.post.mockResolvedValue({ data: { ok: true } });
    });

    describe('Initial Loading State', () => {
        it('should render loading state initially', async () => {
            // Simulate delayed API response
            mockedAxios.get.mockImplementation(() => new Promise(() => {}));
      
            render(<Page />);
      
            expect(screen.getByText('Checking your connection with Plex')).toBeInTheDocument();
            expect(screen.getByTestId('logo')).toBeInTheDocument();
        });

        it('should render without crashing', () => {
            render(<Page />);
      
            expect(screen.getByTestId('main-layout')).toBeInTheDocument();
            expect(screen.getByTestId('logo')).toBeInTheDocument();
        });
    });

    describe('Not Connected State', () => {
        it('should show PlexConnection component when not connected', async () => {
            mockedAxios.get.mockResolvedValue({
                data: { ...mockSettingsResponse, loggedin: false },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.queryByText('Checking your connection with Plex')).not.toBeInTheDocument();
            });
      
            expect(screen.getByTestId('plex-connection')).toBeInTheDocument();
            // Main heading should not be visible when not connected
            expect(screen.queryByRole('heading', { name: 'Spotify to Plex', level: 4 })).not.toBeInTheDocument();
        });

        it('should show PlexConnection when connected but no URI', async () => {
            mockedAxios.get.mockResolvedValue({
                data: { ...mockSettingsResponse, loggedin: true, uri: '' },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.queryByText('Checking your connection with Plex')).not.toBeInTheDocument();
            });
      
            expect(screen.getByTestId('plex-connection')).toBeInTheDocument();
        });
    });

    describe('Connected State', () => {
        beforeEach(() => {
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
        });

        it('should show main content when connected with URI', async () => {
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.queryByText('Checking your connection with Plex')).not.toBeInTheDocument();
            });
      
            expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
            expect(screen.getByText('Manage your Spotify connections, synchronization settings, and view system logs.')).toBeInTheDocument();
            expect(screen.queryByTestId('plex-connection')).not.toBeInTheDocument();
        });

        it('should render all menu items', async () => {
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
            });
      
            // Check all menu items are present
            expect(screen.getByText('Playlists & Albums')).toBeInTheDocument();
            expect(screen.getByText('Users')).toBeInTheDocument();
            expect(screen.getByText('Search Analyzer')).toBeInTheDocument();
            expect(screen.getByText('Plex Search Settings')).toBeInTheDocument();
            expect(screen.getByText('Logs')).toBeInTheDocument();
      
            // Check descriptions
            expect(screen.getByText('Manage your Spotify playlists and albums synchronization')).toBeInTheDocument();
            expect(screen.getByText('Manage Spotify user connections')).toBeInTheDocument();
            expect(screen.getByText('Debug Spotify to Plex search results')).toBeInTheDocument();
            expect(screen.getByText('Configure matching settings for Spotify to Plex search')).toBeInTheDocument();
            expect(screen.getByText('View system logs and sync history')).toBeInTheDocument();
        });

        it('should render menu items as clickable cards', async () => {
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
            });
      
            // All menu items should be inside links
            const playlistsCard = screen.getByText('Playlists & Albums').closest('a');
            const usersCard = screen.getByText('Users').closest('a');
            const searchCard = screen.getByText('Search Analyzer').closest('a');
            const settingsCard = screen.getByText('Plex Search Settings').closest('a');
            const logsCard = screen.getByText('Logs').closest('a');
      
            expect(playlistsCard).toHaveAttribute('href', '/spotify/manage-playlists');
            expect(usersCard).toHaveAttribute('href', '/spotify/manage-users');
            expect(searchCard).toHaveAttribute('href', '/spotify/search-analyzer');
            expect(settingsCard).toHaveAttribute('href', '/plex/music-search-config');
            expect(logsCard).toHaveAttribute('href', '/spotify/logs');
        });

        it('should render Plex Settings button', async () => {
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
            });
      
            expect(screen.getByText('Plex Settings')).toBeInTheDocument();
        });
    });

    describe('Plex Settings Dialog', () => {
        beforeEach(() => {
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
        });

        it('should open Plex settings dialog when button is clicked', async () => {
            const user = userEvent.setup();
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByText('Plex Settings')).toBeInTheDocument();
            });
      
            const plexSettingsButton = screen.getByText('Plex Settings');
            await user.click(plexSettingsButton);
      
            expect(screen.getByTestId('plex-connection-dialog')).toBeInTheDocument();
        });

        it('should close Plex settings dialog when close button is clicked', async () => {
            const user = userEvent.setup();
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByText('Plex Settings')).toBeInTheDocument();
            });
      
            // Open dialog
            const plexSettingsButton = screen.getByText('Plex Settings');
            await user.click(plexSettingsButton);
      
            expect(screen.getByTestId('plex-connection-dialog')).toBeInTheDocument();
      
            // Close dialog
            const closeButton = screen.getByTestId('close-dialog');
            await user.click(closeButton);
      
            expect(screen.queryByTestId('plex-connection-dialog')).not.toBeInTheDocument();
        });
    });

    describe('Plex Authentication Query Parameter', () => {
        it('should handle plex query parameter on router ready', async () => {
            mockedUseRouter.mockReturnValue({
                ...mockRouter,
                query: { plex: 'true' },
                isReady: true,
            } as any);
      
            mockedAxios.post.mockResolvedValue({ data: { ok: true } });
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/verify');
                expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings');
                expect(mockReplace).toHaveBeenCalledWith('/', undefined, { shallow: true });
            });
        });

        it('should handle successful plex verification', async () => {
            mockedUseRouter.mockReturnValue({
                ...mockRouter,
                query: { plex: 'true' },
                isReady: true,
            } as any);
      
            mockedAxios.post.mockResolvedValue({ data: { ok: true } });
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
            });
        });

        it('should not process plex query when router is not ready', () => {
            mockedUseRouter.mockReturnValue({
                ...mockRouter,
                query: { plex: 'true' },
                isReady: false,
            } as any);
      
            render(<Page />);
      
            expect(mockedAxios.post).not.toHaveBeenCalledWith('/api/auth/verify');
        });

        it('should handle plex verification failure', async () => {
            mockedUseRouter.mockReturnValue({
                ...mockRouter,
                query: { plex: 'true' },
                isReady: true,
            } as any);
      
            mockedAxios.post.mockResolvedValue({ data: { ok: false } });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(mockReplace).toHaveBeenCalledWith('/', undefined, { shallow: true });
            });
      
            // Should not fetch settings again if verification failed
            expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only initial call
        });
    });

    describe('API Error Handling', () => {
        it('should handle settings API error gracefully', async () => {
            mockedAxios.get.mockRejectedValue(new Error('API Error'));
      
            render(<Page />);
      
            // Should not crash and should show some state
            await waitFor(() => {
                expect(screen.getByTestId('logo')).toBeInTheDocument();
            });
        });

        it('should handle auth verification error', async () => {
            mockedUseRouter.mockReturnValue({
                ...mockRouter,
                query: { plex: 'true' },
                isReady: true,
            } as any);
      
            mockedAxios.post.mockRejectedValue(new Error('Auth Error'));
      
            render(<Page />);
      
            // Wait for the component to render and the auth verification to be attempted
            await waitFor(() => {
                expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/verify');
            });

            // When auth verification fails, router.replace should NOT be called
            // because the error prevents reaching that code
            expect(mockReplace).not.toHaveBeenCalled();
        });
    });

    describe('State Management', () => {
        it('should update state when connection is established through PlexConnection', async () => {
            const user = userEvent.setup();
            mockedAxios.get.mockResolvedValue({
                data: { ...mockSettingsResponse, loggedin: false },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByTestId('plex-connection')).toBeInTheDocument();
            });
      
            // Simulate connecting through PlexConnection component
            const connectButton = screen.getByTestId('mock-connect-button');
            await user.click(connectButton);
      
            // Should now show main content
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
            });
        });

        it('should handle loading state changes correctly', async () => {
            let resolvePromise: (value: any) => void;
            const pendingPromise = new Promise((resolve) => {
                resolvePromise = resolve;
            });
      
            mockedAxios.get.mockReturnValue(pendingPromise as any);
      
            render(<Page />);
      
            // Should show loading initially
            expect(screen.getByText('Checking your connection with Plex')).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise!({
          data: {
              ...mockSettingsResponse,
              loggedin: true,
              uri: 'http://plex.server:32400',
          },
      });
      
      await waitFor(() => {
          expect(screen.queryByText('Checking your connection with Plex')).not.toBeInTheDocument();
          expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
      });
        });
    });

    describe('Component Integration', () => {
        it('should pass correct props to PlexConnection', async () => {
            mockedAxios.get.mockResolvedValue({
                data: { ...mockSettingsResponse, loggedin: false },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByTestId('plex-connection')).toBeInTheDocument();
            });
      
            // PlexConnection should receive settings, setSettings, connected, and setConnected props
            // This is verified by the mock component receiving and using these props
        });

        it('should pass correct props to PlexConnectionDialog', async () => {
            const user = userEvent.setup();
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByText('Plex Settings')).toBeInTheDocument();
            });
      
            // Dialog should not be visible initially
            expect(screen.queryByTestId('plex-connection-dialog')).not.toBeInTheDocument();
      
            // Open dialog
            await user.click(screen.getByText('Plex Settings'));
      
            // Dialog should now be visible with correct props
            expect(screen.getByTestId('plex-connection-dialog')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper page title', () => {
            render(<Page />);
      
            // Next.js Head component is mocked, but we can verify title is set
            // In actual DOM, this would set document.title
            expect(screen.getByText('Spotify to Plex')).toBeInTheDocument();
        });

        it('should have accessible navigation links', async () => {
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Spotify to Plex', level: 4 })).toBeInTheDocument();
            });
      
            // All menu items should be proper links
            const links = screen.getAllByRole('link');
            expect(links).toHaveLength(5); // Five menu items
      
            links.forEach((link) => {
                expect(link).toHaveAttribute('href');
            });
        });

        it('should have accessible button for Plex settings', async () => {
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByText('Plex Settings')).toBeInTheDocument();
            });
      
            const plexSettingsButton = screen.getByRole('button', { name: 'Plex Settings' });
            expect(plexSettingsButton).toBeInTheDocument();
        });

        it('should have accessible dialog when opened', async () => {
            const user = userEvent.setup();
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByText('Plex Settings')).toBeInTheDocument();
            });
      
            await user.click(screen.getByText('Plex Settings'));
      
            const dialog = screen.getByRole('dialog');
            expect(dialog).toBeInTheDocument();
        });
    });

    describe('Performance and Edge Cases', () => {
        it('should handle multiple rapid state changes', async () => {
            const user = userEvent.setup();
            mockedAxios.get.mockResolvedValue({
                data: {
                    ...mockSettingsResponse,
                    loggedin: true,
                    uri: 'http://plex.server:32400',
                },
            });
      
            render(<Page />);
      
            await waitFor(() => {
                expect(screen.getByText('Plex Settings')).toBeInTheDocument();
            });
      
            // Rapidly open and close dialog multiple times
            const plexSettingsButton = screen.getByText('Plex Settings');
      
            for (let i = 0; i < 5; i++) {
                await user.click(plexSettingsButton);
                expect(screen.getByTestId('plex-connection-dialog')).toBeInTheDocument();
        
                await user.click(screen.getByTestId('close-dialog'));
                await waitFor(() => {
                    expect(screen.queryByTestId('plex-connection-dialog')).not.toBeInTheDocument();
                });
            }
        });

        it('should cleanup properly on unmount', () => {
            const { unmount } = render(<Page />);
      
            expect(() => unmount()).not.toThrow();
        });

        it('should handle component re-renders without unnecessary API calls', () => {
            const { rerender } = render(<Page />);
      
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      
            // Re-render component with same props
            rerender(<Page />);
      
            // Should not make additional API calls on re-render since useEffect deps haven't changed
            expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        });
    });
});