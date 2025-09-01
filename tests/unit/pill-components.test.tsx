/**
 * Unit tests for individual pill components
 * Tests FieldPill, AddPill, and popup components in isolation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FieldPill from '../../apps/web/src/components/pills/FieldPill';
import AddPill from '../../apps/web/src/components/pills/AddPill';
import FieldSelectorPopup from '../../apps/web/src/components/popups/FieldSelectorPopup';
import OperationSelectorPopup from '../../apps/web/src/components/popups/OperationSelectorPopup';
import { FieldType, OperationType } from '../../apps/web/src/types/MatchFilterTypes';

// Mock theme for Material-UI components
const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(
        <ThemeProvider theme={theme}>
            {component}
        </ThemeProvider>
    );
};

describe('FieldPill Component', () => {
    let mockOnClick: jest.Mock;

    beforeEach(() => {
        mockOnClick = jest.fn();
    });

    test('should render field name correctly', () => {
        renderWithTheme(
            <FieldPill
                field="artist"
                onClick={mockOnClick}
            />
        );

        expect(screen.getByText('artist')).toBeInTheDocument();
    });

    test('should show configured state when isConfigured is true', () => {
        renderWithTheme(
            <FieldPill
                field="artist"
                isConfigured={true}
                onClick={mockOnClick}
            />
        );

        const chip = screen.getByText('artist').closest('.MuiChip-root');
        expect(chip).toHaveClass('MuiChip-filled');
    });

    test('should show unconfigured state when isConfigured is false', () => {
        renderWithTheme(
            <FieldPill
                field="artist"
                isConfigured={false}
                onClick={mockOnClick}
            />
        );

        const chip = screen.getByText('artist').closest('.MuiChip-root');
        expect(chip).toHaveClass('MuiChip-outlined');
    });

    test('should call onClick when clicked', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <FieldPill
                field="artist"
                onClick={mockOnClick}
            />
        );

        const pill = screen.getByText('artist');
        await user.click(pill);

        expect(mockOnClick).toHaveBeenCalledWith('artist');
    });

    test('should not call onClick when disabled', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <FieldPill
                field="artist"
                onClick={mockOnClick}
                disabled={true}
            />
        );

        const pill = screen.getByText('artist');
        await user.click(pill);

        expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('should render all field types correctly', () => {
        const fields: FieldType[] = ['artist', 'title', 'album', 'artistWithTitle', 'artistInTitle'];
        
        fields.forEach(field => {
            const { unmount } = renderWithTheme(
                <FieldPill
                    field={field}
                    onClick={mockOnClick}
                />
            );

            expect(screen.getByText(field)).toBeInTheDocument();
            unmount();
        });
    });
});

describe('AddPill Component', () => {
    let mockOnClick: jest.Mock;

    beforeEach(() => {
        mockOnClick = jest.fn();
    });

    test('should render with default label', () => {
        renderWithTheme(
            <AddPill onClick={mockOnClick} />
        );

        expect(screen.getByText('+ Add Field')).toBeInTheDocument();
    });

    test('should render with custom label', () => {
        renderWithTheme(
            <AddPill onClick={mockOnClick} label="+ Custom Label" />
        );

        expect(screen.getByText('+ Custom Label')).toBeInTheDocument();
    });

    test('should call onClick when clicked', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <AddPill onClick={mockOnClick} />
        );

        const addButton = screen.getByText('+ Add Field');
        await user.click(addButton);

        expect(mockOnClick).toHaveBeenCalled();
    });

    test('should not call onClick when disabled', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <AddPill onClick={mockOnClick} disabled={true} />
        );

        const addButton = screen.getByText('+ Add Field');
        await user.click(addButton);

        expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('should have proper disabled styling', () => {
        renderWithTheme(
            <AddPill onClick={mockOnClick} disabled={true} />
        );

        const chip = screen.getByText('+ Add Field').closest('.MuiChip-root');
        expect(chip).toHaveClass('Mui-disabled');
    });
});

describe('FieldSelectorPopup Component', () => {
    let mockOnClose: jest.Mock;
    let mockOnFieldSelect: jest.Mock;
    let anchorElement: HTMLElement;

    beforeEach(() => {
        mockOnClose = jest.fn();
        mockOnFieldSelect = jest.fn();
        
        // Create anchor element
        anchorElement = document.createElement('div');
        document.body.appendChild(anchorElement);
    });

    afterEach(() => {
        document.body.removeChild(anchorElement);
    });

    test('should not render when closed', () => {
        renderWithTheme(
            <FieldSelectorPopup
                open={false}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onFieldSelect={mockOnFieldSelect}
            />
        );

        expect(screen.queryByText('Artist')).not.toBeInTheDocument();
    });

    test('should render all field options when open', () => {
        renderWithTheme(
            <FieldSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onFieldSelect={mockOnFieldSelect}
            />
        );

        expect(screen.getByText('Artist')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(screen.getByText('Album')).toBeInTheDocument();
        expect(screen.getByText('Artist with Title')).toBeInTheDocument();
        expect(screen.getByText('Artist in Title')).toBeInTheDocument();
    });

    test('should call onFieldSelect when field is clicked', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <FieldSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onFieldSelect={mockOnFieldSelect}
            />
        );

        const artistOption = screen.getByText('Artist');
        await user.click(artistOption);

        expect(mockOnFieldSelect).toHaveBeenCalledWith('artist');
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('should call onClose when backdrop is clicked', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <FieldSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onFieldSelect={mockOnFieldSelect}
            />
        );

        // Click outside the popup (on backdrop)
        await user.keyboard('{Escape}');

        expect(mockOnClose).toHaveBeenCalled();
    });
});

describe('OperationSelectorPopup Component', () => {
    let mockOnClose: jest.Mock;
    let mockOnOperationSelect: jest.Mock;
    let anchorElement: HTMLElement;

    beforeEach(() => {
        mockOnClose = jest.fn();
        mockOnOperationSelect = jest.fn();
        
        // Create anchor element
        anchorElement = document.createElement('div');
        document.body.appendChild(anchorElement);
    });

    afterEach(() => {
        document.body.removeChild(anchorElement);
    });

    test('should render all operation options when open', () => {
        renderWithTheme(
            <OperationSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onOperationSelect={mockOnOperationSelect}
            />
        );

        expect(screen.getByText('Match')).toBeInTheDocument();
        expect(screen.getByText('Contains')).toBeInTheDocument();
        expect(screen.getByText('Similarity')).toBeInTheDocument();
    });

    test('should call onOperationSelect for simple operations', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <OperationSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onOperationSelect={mockOnOperationSelect}
            />
        );

        const matchOption = screen.getByText('Match');
        await user.click(matchOption);

        expect(mockOnOperationSelect).toHaveBeenCalledWith('match', undefined);
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('should handle similarity operation with threshold selection', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <OperationSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onOperationSelect={mockOnOperationSelect}
            />
        );

        const similarityOption = screen.getByText('Similarity');
        await user.click(similarityOption);

        // Default threshold (85%) should be selected, so clicking similarity should use it
        expect(mockOnOperationSelect).toHaveBeenCalledWith('similarity', 85);
        expect(mockOnClose).toHaveBeenCalled();
    });

    test('should render threshold options for similarity', () => {
        renderWithTheme(
            <OperationSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onOperationSelect={mockOnOperationSelect}
            />
        );

        // Should show threshold radio buttons
        expect(screen.getByLabelText('70%')).toBeInTheDocument();
        expect(screen.getByLabelText('75%')).toBeInTheDocument();
        expect(screen.getByLabelText('80%')).toBeInTheDocument();
        expect(screen.getByLabelText('85%')).toBeInTheDocument();
        expect(screen.getByLabelText('90%')).toBeInTheDocument();
        expect(screen.getByLabelText('95%')).toBeInTheDocument();
    });

    test('should update threshold selection', async () => {
        const user = userEvent.setup();
        
        renderWithTheme(
            <OperationSelectorPopup
                open={true}
                anchorEl={anchorElement}
                onClose={mockOnClose}
                onOperationSelect={mockOnOperationSelect}
            />
        );

        // Select 90% threshold
        const threshold90 = screen.getByLabelText('90%');
        await user.click(threshold90);

        // Now click similarity
        const similarityOption = screen.getByText('Similarity');
        await user.click(similarityOption);

        expect(mockOnOperationSelect).toHaveBeenCalledWith('similarity', 90);
    });
});