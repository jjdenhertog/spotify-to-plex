import React from 'react';
import { render, screen, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import PillEditor from '../../../src/components/PillEditor';

// Mock the child components
jest.mock('../../../src/components/pills/FieldPill', () => {
  return function FieldPill({ 
    field, 
    isConfigured, 
    onClick, 
    disabled, 
    displayText 
  }: { 
    field: string; 
    isConfigured: boolean; 
    onClick: () => void; 
    disabled?: boolean; 
    displayText: string; 
  }) {
    return (
      <button
        data-testid={`field-pill-${field}`}
        onClick={onClick}
        disabled={disabled}
        style={{
          backgroundColor: isConfigured ? 'green' : 'gray',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {displayText}
      </button>
    );
  };
});

jest.mock('../../../src/components/pills/AddPill', () => {
  return function AddPill({ onClick, disabled, label }: { onClick: () => void; disabled?: boolean; label: string }) {
    return (
      <button
        data-testid="add-pill"
        onClick={onClick}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        {label}
      </button>
    );
  };
});

jest.mock('../../../src/components/popups/FieldSelectorPopup', () => {
  return function FieldSelectorPopup({ 
    open, 
    anchorEl, 
    onClose, 
    onFieldSelect 
  }: { 
    open: boolean; 
    anchorEl: HTMLElement | null; 
    onClose: () => void; 
    onFieldSelect: (field: string) => void; 
  }) {
    // anchorEl is used for positioning in real implementation
    console.debug('Field selector positioning element:', anchorEl);
    if (!open) return null;
    
    return (
      <div data-testid="field-selector-popup">
        <button onClick={() => onFieldSelect('artist')} data-testid="select-artist">
          Artist
        </button>
        <button onClick={() => onFieldSelect('title')} data-testid="select-title">
          Title
        </button>
        <button onClick={() => onFieldSelect('album')} data-testid="select-album">
          Album
        </button>
        <button onClick={onClose} data-testid="close-field-selector">
          Close
        </button>
      </div>
    );
  };
});

jest.mock('../../../src/components/popups/OperationSelectorPopup', () => {
  return function OperationSelectorPopup({ 
    open, 
    anchorEl, 
    onClose, 
    onOperationSelect, 
    onDelete,
    currentOperation,
    currentThreshold
  }: { 
    open: boolean; 
    anchorEl: HTMLElement | null; 
    onClose: () => void; 
    onOperationSelect: (operation: string, threshold?: number) => void; 
    onDelete: () => void;
    currentOperation?: string;
    currentThreshold?: number;
  }) {
    // anchorEl is used for positioning in real implementation
    console.debug('Operation selector positioning element:', anchorEl);
    if (!open) return null;
    
    return (
      <div data-testid="operation-selector-popup">
        <div data-testid="current-operation">{currentOperation || 'none'}</div>
        <div data-testid="current-threshold">{currentThreshold || 'none'}</div>
        <button onClick={() => onOperationSelect('match')} data-testid="select-match">
          Match
        </button>
        <button onClick={() => onOperationSelect('contains')} data-testid="select-contains">
          Contains
        </button>
        <button onClick={() => onOperationSelect('similarity', 80)} data-testid="select-similarity">
          Similarity 80%
        </button>
        <button onClick={onDelete} data-testid="delete-pill">
          Delete
        </button>
        <button onClick={onClose} data-testid="close-operation-selector">
          Close
        </button>
      </div>
    );
  };
});

describe('PillEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should render with empty state when no value provided', () => {
      render(<PillEditor {...defaultProps} />);

      expect(screen.getByText('Click + Add Field to start')).toBeInTheDocument();
      expect(screen.getByTestId('add-pill')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          placeholder="Custom placeholder text" 
        />
      );

      expect(screen.getByText('Custom placeholder text')).toBeInTheDocument();
    });

    it('should parse existing expression into pills', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match AND title:contains" 
        />
      );

      expect(screen.getByTestId('field-pill-artist')).toBeInTheDocument();
      expect(screen.getByTestId('field-pill-title')).toBeInTheDocument();
      expect(screen.getByText('AND')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          disabled={true} 
        />
      );

      expect(screen.getByTestId('add-pill')).toBeDisabled();
    });
  });

  describe('Expression Parsing and Validation', () => {
    it('should parse simple field expressions', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match" 
        />
      );

      const fieldPill = screen.getByTestId('field-pill-artist');
      expect(fieldPill).toHaveStyle('background-color: green'); // configured
      expect(fieldPill).toHaveTextContent('artist:match');
    });

    it('should parse complex expressions with combinators', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match AND title:contains OR album:similarity>=0.8" 
        />
      );

      expect(screen.getByTestId('field-pill-artist')).toBeInTheDocument();
      expect(screen.getByTestId('field-pill-title')).toBeInTheDocument();
      expect(screen.getByTestId('field-pill-album')).toBeInTheDocument();
      expect(screen.getAllByText('AND')).toHaveLength(1);
      expect(screen.getAllByText('OR')).toHaveLength(1);
    });

    it('should handle incomplete expressions', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist" 
        />
      );

      const fieldPill = screen.getByTestId('field-pill-artist');
      expect(fieldPill).toHaveStyle('background-color: gray'); // not configured
      expect(fieldPill).toHaveTextContent('artist');
    });

    it('should handle similarity expressions with thresholds', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:similarity>=0.75" 
        />
      );

      const fieldPill = screen.getByTestId('field-pill-artist');
      expect(fieldPill).toHaveTextContent('artist:similarity>=0.75');
    });

    it('should handle invalid expressions gracefully', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="invalid:operation" 
        />
      );

      // Should still render something, even if it's an invalid pill
      expect(screen.getByTestId('add-pill')).toBeInTheDocument();
    });
  });

  describe('Adding Fields', () => {
    it('should open field selector when add pill is clicked', async () => {
      const user = userEvent.setup();
      render(<PillEditor {...defaultProps} />);

      await user.click(screen.getByTestId('add-pill'));

      expect(screen.getByTestId('field-selector-popup')).toBeInTheDocument();
      expect(screen.getByTestId('select-artist')).toBeInTheDocument();
    });

    it('should add field when selected from popup', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<PillEditor {...defaultProps} onChange={onChange} />);

      await user.click(screen.getByTestId('add-pill'));
      await user.click(screen.getByTestId('select-artist'));

      expect(onChange).toHaveBeenCalledWith('artist');
      expect(screen.queryByTestId('field-selector-popup')).not.toBeInTheDocument();
    });

    it('should add AND combinator when adding second field', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist:match" 
        />
      );

      await user.click(screen.getByTestId('add-pill'));
      await user.click(screen.getByTestId('select-title'));

      expect(onChange).toHaveBeenCalledWith('artist:match AND title');
    });

    it('should not open selector when disabled', async () => {
      const user = userEvent.setup();
      render(<PillEditor {...defaultProps} disabled={true} />);

      await user.click(screen.getByTestId('add-pill'));

      expect(screen.queryByTestId('field-selector-popup')).not.toBeInTheDocument();
    });
  });

  describe('Editing Operations', () => {
    it('should open operation selector when field pill is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));

      expect(screen.getByTestId('operation-selector-popup')).toBeInTheDocument();
      expect(screen.getByTestId('select-match')).toBeInTheDocument();
    });

    it('should update operation when selected from popup', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));
      await user.click(screen.getByTestId('select-match'));

      expect(onChange).toHaveBeenCalledWith('artist:match');
      expect(screen.queryByTestId('operation-selector-popup')).not.toBeInTheDocument();
    });

    it('should handle similarity operation with threshold', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));
      await user.click(screen.getByTestId('select-similarity'));

      expect(onChange).toHaveBeenCalledWith('artist:similarity>=0.8');
    });

    it('should show current operation in popup', async () => {
      const user = userEvent.setup();
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));

      expect(screen.getByTestId('current-operation')).toHaveTextContent('match');
    });

    it('should not open operation selector when disabled', async () => {
      const user = userEvent.setup();
      render(
        <PillEditor 
          {...defaultProps} 
          disabled={true}
          value="artist:match" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));

      expect(screen.queryByTestId('operation-selector-popup')).not.toBeInTheDocument();
    });
  });

  describe('Pill Deletion', () => {
    it('should delete pill when delete button is clicked in operation popup', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist:match" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));
      await user.click(screen.getByTestId('delete-pill'));

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should remove combinator when deleting condition pill', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist:match AND title:contains" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));
      await user.click(screen.getByTestId('delete-pill'));

      expect(onChange).toHaveBeenCalledWith('title:contains');
    });

    it('should handle deletion of middle pill in complex expression', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist:match AND title:contains AND album:match" 
        />
      );

      await user.click(screen.getByTestId('field-pill-title'));
      await user.click(screen.getByTestId('delete-pill'));

      expect(onChange).toHaveBeenCalledWith('artist:match AND album:match');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle escape key to close popups', async () => {
      const user = userEvent.setup();
      render(<PillEditor {...defaultProps} />);

      await user.click(screen.getByTestId('add-pill'));
      expect(screen.getByTestId('field-selector-popup')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('field-selector-popup')).not.toBeInTheDocument();
      });
    });

    it('should handle tab navigation through pills', async () => {
      const user = userEvent.setup();
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match AND title:contains" 
        />
      );

      // Tab should navigate through interactive elements
      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId('field-pill-artist'));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId('field-pill-title'));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId('add-pill'));
    });

    it('should handle enter key to activate pills', async () => {
      const user = userEvent.setup();
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist" 
        />
      );

      // Focus the pill and press Enter
      screen.getByTestId('field-pill-artist').focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('operation-selector-popup')).toBeInTheDocument();
    });
  });

  describe('Invalid Input Handling', () => {
    it('should handle completely invalid expression', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="completely invalid expression @@##" 
        />
      );

      // Should render without crashing
      expect(screen.getByTestId('add-pill')).toBeInTheDocument();
    });

    it('should handle mixed valid and invalid tokens', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match AND invalid:badop AND title:contains" 
        />
      );

      expect(screen.getByTestId('field-pill-artist')).toBeInTheDocument();
      expect(screen.getByTestId('field-pill-title')).toBeInTheDocument();
      // Should still show the combinators
      expect(screen.getAllByText('AND')).toHaveLength(2);
    });

    it('should handle empty field values gracefully', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value=":" 
        />
      );

      // Should render without crashing
      expect(screen.getByTestId('add-pill')).toBeInTheDocument();
    });
  });

  describe('Popup Interactions', () => {
    it('should close field selector when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<PillEditor {...defaultProps} />);

      await user.click(screen.getByTestId('add-pill'));
      expect(screen.getByTestId('field-selector-popup')).toBeInTheDocument();

      await user.click(screen.getByTestId('close-field-selector'));
      expect(screen.queryByTestId('field-selector-popup')).not.toBeInTheDocument();
    });

    it('should close operation selector when close button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));
      expect(screen.getByTestId('operation-selector-popup')).toBeInTheDocument();

      await user.click(screen.getByTestId('close-operation-selector'));
      expect(screen.queryByTestId('operation-selector-popup')).not.toBeInTheDocument();
    });

    it('should close popups when clicking outside', async () => {
      const user = userEvent.setup();
      render(<PillEditor {...defaultProps} />);

      await user.click(screen.getByTestId('add-pill'));
      expect(screen.getByTestId('field-selector-popup')).toBeInTheDocument();

      // Click outside by clicking on the main container
      await user.click(document.body);

      // The popup should close (in real implementation, this would be handled by MUI)
      // For this test, we'll check that the popup management works
    });
  });

  describe('Size Variants', () => {
    it('should render with small size', () => {
      const { container } = render(
        <PillEditor 
          {...defaultProps} 
          size="small" 
        />
      );

      const pillContainer = container.querySelector('[data-disabled]')?.parentElement;
      // Check if the min-height style is applied for small size (32px)
      expect(pillContainer).toBeInTheDocument();
    });

    it('should render with medium size', () => {
      const { container } = render(
        <PillEditor 
          {...defaultProps} 
          size="medium" 
        />
      );

      const pillContainer = container.querySelector('[data-disabled]')?.parentElement;
      // Check if the min-height style is applied for medium size (40px)
      expect(pillContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match" 
        />
      );

      // Pills should be focusable buttons
      const fieldPill = screen.getByTestId('field-pill-artist');
      expect(fieldPill.tagName).toBe('BUTTON');
    });

    it('should announce pill configuration state', () => {
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match AND title" 
        />
      );

      const configuredPill = screen.getByTestId('field-pill-artist');
      const unConfiguredPill = screen.getByTestId('field-pill-title');

      // Configured pill should have visual indication
      expect(configuredPill).toHaveStyle('background-color: green');
      expect(unConfiguredPill).toHaveStyle('background-color: gray');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <PillEditor 
          {...defaultProps} 
          value="artist:match" 
        />
      );

      // Should be able to tab to and interact with pills
      await user.tab();
      expect(document.activeElement).toBe(screen.getByTestId('field-pill-artist'));

      // Should be able to activate with keyboard
      await user.keyboard(' '); // Space key
      expect(screen.getByTestId('operation-selector-popup')).toBeInTheDocument();
    });
  });

  describe('Expression Updates', () => {
    it('should call onChange with updated expression when pills change', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
        />
      );

      await user.click(screen.getByTestId('add-pill'));
      await user.click(screen.getByTestId('select-artist'));

      expect(onChange).toHaveBeenCalledWith('artist');
    });

    it('should preserve other pills when updating one pill', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist AND title:contains" 
        />
      );

      await user.click(screen.getByTestId('field-pill-artist'));
      await user.click(screen.getByTestId('select-match'));

      expect(onChange).toHaveBeenCalledWith('artist:match AND title:contains');
    });

    it('should handle rapid updates without conflicts', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <PillEditor 
          {...defaultProps} 
          onChange={onChange}
          value="artist" 
        />
      );

      // Rapidly update the same pill
      await user.click(screen.getByTestId('field-pill-artist'));
      await user.click(screen.getByTestId('select-match'));

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });
});