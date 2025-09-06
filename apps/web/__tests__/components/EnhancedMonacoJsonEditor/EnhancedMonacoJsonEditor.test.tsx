import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import EnhancedMonacoJsonEditor from '../../../src/components/EnhancedMonacoJsonEditor';

// Simple Monaco Editor mock
vi.mock('@monaco-editor/react', () => ({
    __esModule: true,
    default: ({ value, onChange }: any) => (
        <div data-testid="monaco-editor">
            <textarea
                data-testid="monaco-textarea"
                value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || '{}'}
                onChange={(e) => {
                    try {
                        const parsed = JSON.parse(e.target.value);
                        onChange?.(parsed);
                    } catch {
                        // Invalid JSON, don't call onChange
                    }
                }}
            />
        </div>
    ),
}));

describe('EnhancedMonacoJsonEditor', () => {
    const mockOnChange = vi.fn();
    const defaultProps = {
        value: { test: 'value', number: 42 },
        onChange: mockOnChange,
    };

    it('should render without crashing', () => {
        render(<EnhancedMonacoJsonEditor {...defaultProps} />);
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should display JSON value', () => {
        render(<EnhancedMonacoJsonEditor {...defaultProps} />);
        const textarea = screen.getByTestId('monaco-textarea');
        expect(textarea).toHaveValue('{\n  "test": "value",\n  "number": 42\n}');
    });

    it('should handle valid JSON changes', () => {
        render(<EnhancedMonacoJsonEditor {...defaultProps} />);
        const textarea = screen.getByTestId('monaco-textarea');
        
        fireEvent.change(textarea, { target: { value: '{"new": "value"}' } });
        expect(mockOnChange).toHaveBeenCalledWith({ new: 'value' });
    });

    it('should handle null value gracefully', () => {
        render(<EnhancedMonacoJsonEditor value={null} onChange={mockOnChange} />);
        expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });
});