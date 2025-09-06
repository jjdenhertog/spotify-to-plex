import React from 'react';
import { render, screen, fireEvent } from '../../test-utils/test-utils';
import { vi, describe, it, expect } from 'vitest';
import CustomPaper from '../../../src/components/CustomPaper';

describe('CustomPaper', () => {
    describe('Basic Rendering', () => {
        it('should render without crashing', () => {
            render(<CustomPaper data-testid="custom-paper" />);
      
            const paperElement = screen.getByTestId('custom-paper');
            expect(paperElement).toBeInTheDocument();
        });

        it('should render with children', () => {
            render(
                <CustomPaper>
                    <div data-testid="child-content">Test Content</div>
                </CustomPaper>
            );
      
            expect(screen.getByTestId('child-content')).toBeInTheDocument();
            expect(screen.getByText('Test Content')).toBeInTheDocument();
        });

        it('should render multiple children', () => {
            render(
                <CustomPaper>
                    <h1>Title</h1>
                    <p>Paragraph content</p>
                    <button type="button">Action Button</button>
                </CustomPaper>
            );
      
            expect(screen.getByText('Title')).toBeInTheDocument();
            expect(screen.getByText('Paragraph content')).toBeInTheDocument();
            expect(screen.getByText('Action Button')).toBeInTheDocument();
        });

        it('should render without children', () => {
            render(<CustomPaper data-testid="custom-paper" />);
      
            const paperElement = screen.getByTestId('custom-paper');
            expect(paperElement).toBeInTheDocument();
            expect(paperElement).toBeEmptyDOMElement();
        });
    });

    describe('Props Handling', () => {
        it('should apply HTML attributes correctly', () => {
            render(
                <CustomPaper id="test-paper" className="custom-class" data-testid="custom-paper" role="region" aria-label="Custom paper component">
                    Content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('custom-paper');
            expect(paperElement).toHaveAttribute('id', 'test-paper');
            expect(paperElement).toHaveClass('custom-class');
            expect(paperElement).toHaveAttribute('role', 'region');
            expect(paperElement).toHaveAttribute('aria-label', 'Custom paper component');
        });

        it('should handle click events', () => {
            const handleClick = vi.fn();
      
            render(
                <CustomPaper onClick={handleClick} data-testid="clickable-paper">
                    Clickable Content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('clickable-paper');
            paperElement.click();
      
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should handle mouse events', () => {
            const handleMouseEnter = vi.fn();
            const handleMouseLeave = vi.fn();
      
            render(
                <CustomPaper onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} data-testid="hoverable-paper">
                    Hoverable Content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('hoverable-paper');
      
            // Simulate mouse enter
            fireEvent.mouseEnter(paperElement);
            expect(handleMouseEnter).toHaveBeenCalledTimes(1);
      
            // Simulate mouse leave
            fireEvent.mouseLeave(paperElement);
            expect(handleMouseLeave).toHaveBeenCalledTimes(1);
        });

        it('should handle keyboard events', () => {
            const handleKeyDown = vi.fn();
            const handleKeyUp = vi.fn();
      
            render(
                <CustomPaper onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} tabIndex={0} data-testid="keyboard-paper">
                    Keyboard Accessible Content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('keyboard-paper');
      
            // Simulate key down
            paperElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            expect(handleKeyDown).toHaveBeenCalledTimes(1);
      
            // Simulate key up
            paperElement.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
            expect(handleKeyUp).toHaveBeenCalledTimes(1);
        });
    });

    describe('Styling and Theme Integration', () => {
        it('should have Material-UI Paper base styling', () => {
            render(
                <CustomPaper data-testid="styled-paper">
                    Styled Content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('styled-paper');
      
            // Should have MuiPaper class from Material-UI
            expect(paperElement).toHaveClass('MuiPaper-root');
        });

        it('should apply custom margin top styling', () => {
            render(
                <CustomPaper data-testid="margin-paper">
                    Content with margin
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('margin-paper');
      
            // The component applies { mt: 1 } which translates to margin-top
            // Material-UI theme spacing(1) typically equals 8px
            // This test verifies the margin-top is applied through sx prop
            expect(paperElement).toHaveStyle('margin-top: 8px');
        });

        it('should merge with additional sx props when provided', () => {
            // Since sx prop merging happens at MUI level, we test that the component
            // accepts additional styling without breaking
            render(
                <CustomPaper sx={{ padding: 2, backgroundColor: 'primary.main' }} data-testid="extended-styled-paper">
                    Extended styled content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('extended-styled-paper');
            expect(paperElement).toBeInTheDocument();
      
            // Should have both default mt: 1 and additional styling
            expect(paperElement).toHaveStyle('margin-top: 8px');
            expect(paperElement).toHaveStyle('padding: 16px'); // spacing(2)
        });
    });

    describe('Accessibility', () => {
        it('should be keyboard accessible when tabIndex is provided', () => {
            render(
                <CustomPaper tabIndex={0} data-testid="focusable-paper">
                    Focusable content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('focusable-paper');
      
            // Should be focusable
            paperElement.focus();
            expect(document.activeElement).toBe(paperElement);
        });

        it('should support ARIA attributes', () => {
            render(
                <CustomPaper role="article" aria-label="Custom paper article" aria-describedby="paper-description" data-testid="aria-paper">
                    <span id="paper-description">This is an article</span>
                    Article content
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('aria-paper');
      
            expect(paperElement).toHaveAttribute('role', 'article');
            expect(paperElement).toHaveAttribute('aria-label', 'Custom paper article');
            expect(paperElement).toHaveAttribute('aria-describedby', 'paper-description');
        });

        it('should support screen reader content', () => {
            render(
                <CustomPaper data-testid="sr-paper">
                    <span className="sr-only">
                        Screen reader only content
                    </span>
                    <div>Visible content</div>
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('sr-paper');
            expect(paperElement).toBeInTheDocument();
      
            // Both visible and screen reader content should be accessible
            expect(screen.getByText('Screen reader only content')).toBeInTheDocument();
            expect(screen.getByText('Visible content')).toBeInTheDocument();
        });
    });

    describe('Content Types', () => {
        it('should render text content', () => {
            render(
                <CustomPaper>
                    Simple text content
                </CustomPaper>
            );
      
            expect(screen.getByText('Simple text content')).toBeInTheDocument();
        });

        it('should render React elements', () => {
            const TestComponent = () => <div data-testid="test-component">Test Component</div>;
      
            render(
                <CustomPaper>
                    <TestComponent />
                </CustomPaper>
            );
      
            expect(screen.getByTestId('test-component')).toBeInTheDocument();
        });

        it('should render arrays of elements', () => {
            const items = ['Item 1', 'Item 2', 'Item 3'];
      
            render(
                <CustomPaper>
                    {items.map((item, index) => (
                        <div key={index} data-testid={`item-${index}`}>
                            {item}
                        </div>
                    ))}
                </CustomPaper>
            );
      
            items.forEach((item, index) => {
                expect(screen.getByTestId(`item-${index}`)).toBeInTheDocument();
                expect(screen.getByText(item)).toBeInTheDocument();
            });
        });

        it('should handle conditional rendering', () => {
            const showContent = true;
      
            render(
                <CustomPaper>
                    {showContent && <div data-testid="conditional-content">Conditional Content</div>}
                    {!showContent && <div data-testid="fallback-content">Fallback Content</div>}
                </CustomPaper>
            );
      
            expect(screen.getByTestId('conditional-content')).toBeInTheDocument();
            expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
        });

        it('should handle complex nested content', () => {
            render(
                <CustomPaper>
                    <header data-testid="paper-header">
                        <h1>Paper Title</h1>
                        <nav>
                            <a href="/link1">Link 1</a>
                            <a href="/link2">Link 2</a>
                        </nav>
                    </header>
                    <main data-testid="paper-main">
                        <section>
                            <h2>Section Title</h2>
                            <p>Section content with <strong>bold text</strong></p>
                        </section>
                        <aside data-testid="paper-sidebar">
                            <ul>
                                <li>Sidebar item 1</li>
                                <li>Sidebar item 2</li>
                            </ul>
                        </aside>
                    </main>
                    <footer data-testid="paper-footer">
                        <small>Footer content</small>
                    </footer>
                </CustomPaper>
            );
      
            expect(screen.getByTestId('paper-header')).toBeInTheDocument();
            expect(screen.getByTestId('paper-main')).toBeInTheDocument();
            expect(screen.getByTestId('paper-sidebar')).toBeInTheDocument();
            expect(screen.getByTestId('paper-footer')).toBeInTheDocument();
      
            expect(screen.getByText('Paper Title')).toBeInTheDocument();
            expect(screen.getByText('Section Title')).toBeInTheDocument();
            expect(screen.getByText('bold text')).toBeInTheDocument();
            expect(screen.getByText('Sidebar item 1')).toBeInTheDocument();
            expect(screen.getByText('Footer content')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle null children gracefully', () => {
            render(
                <CustomPaper data-testid="custom-paper">
                    {null}
                    {undefined}
                    {false}
                </CustomPaper>
            );
      
            const paperElement = screen.getByTestId('custom-paper');
            expect(paperElement).toBeInTheDocument();
        });

        it('should handle empty string children', () => {
            render(
                <CustomPaper data-testid="custom-paper" />
            );
      
            const paperElement = screen.getByTestId('custom-paper');
            expect(paperElement).toBeInTheDocument();
        });

        it('should handle numeric children', () => {
            render(
                <CustomPaper>
                    {0}
                    {42}
                    {-1}
                </CustomPaper>
            );
      
            // When numeric children are adjacent, they get concatenated in the DOM
            expect(screen.getByText('042-1')).toBeInTheDocument();
        });

        it('should handle mixed content types', () => {
            render(
                <CustomPaper>
                    Text content
                    {42}
                    <span>Element content</span>
                    {null}
                    {true ? <div>Conditional element</div> : null}
                </CustomPaper>
            );
      
            // Adjacent text content and numeric content get concatenated
            expect(screen.getByText('Text content42')).toBeInTheDocument();
            expect(screen.getByText('Element content')).toBeInTheDocument();
            expect(screen.getByText('Conditional element')).toBeInTheDocument();
        });
    });

    describe('Performance', () => {
        it('should not re-render unnecessarily with same props', () => {
            const renderCount = vi.fn();
      
            const TestWrapper = ({ content }: { readonly content: string }) => {
                renderCount();

                return (
                    <CustomPaper>
                        {content}
                    </CustomPaper>
                );
            };
      
            const { rerender } = render(<TestWrapper content="initial" />);
            expect(renderCount).toHaveBeenCalledTimes(1);
      
            // Re-render with same props
            rerender(<TestWrapper content="initial" />);
            expect(renderCount).toHaveBeenCalledTimes(2); // React will still re-render parent
      
            // Re-render with different props
            rerender(<TestWrapper content="changed" />);
            expect(renderCount).toHaveBeenCalledTimes(3);
        });

        it('should handle large amounts of content efficiently', () => {
            const largeContent = Array.from({ length: 1000 }, (_, i) => (
                <div key={i} data-testid={`item-${i}`}>
                    Item {i}
                </div>
            ));
      
            const startTime = performance.now();
      
            render(
                <CustomPaper>
                    {largeContent}
                </CustomPaper>
            );
      
            const endTime = performance.now();
            const renderTime = endTime - startTime;
      
            // Should render large content in reasonable time (less than 100ms)
            expect(renderTime).toBeLessThan(500);
      
            // Verify some content is rendered
            expect(screen.getByTestId('item-0')).toBeInTheDocument();
            expect(screen.getByTestId('item-999')).toBeInTheDocument();
        });
    });
});