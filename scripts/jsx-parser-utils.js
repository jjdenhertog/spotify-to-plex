/**
 * Advanced JSX Parsing Utilities
 * 
 * Provides robust parsing capabilities for complex JSX patterns
 */

/**
 * AST-like JSX parser for more accurate component analysis
 */
class JSXParser {
    constructor() {
        this.tokenTypes = {
            COMPONENT_START: 'COMPONENT_START',
            PROP: 'PROP',
            STRING_VALUE: 'STRING_VALUE',
            OBJECT_VALUE: 'OBJECT_VALUE',
            BOOLEAN_PROP: 'BOOLEAN_PROP',
            SELF_CLOSING: 'SELF_CLOSING',
            TAG_END: 'TAG_END',
            CHILDREN: 'CHILDREN',
            COMPONENT_END: 'COMPONENT_END'
        };
    }

    /**
     * Parse JSX component into structured tokens
     */
    parseComponent(componentText) {
        const tokens = [];
        let position = 0;
        
        // Extract component name
        const componentMatch = componentText.match(/^(\s*)<([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*)/);
        if (!componentMatch) {
            throw new Error('Invalid JSX component');
        }

        const indent = componentMatch[1];
        const componentName = componentMatch[2];
        
        tokens.push({
            type: this.tokenTypes.COMPONENT_START,
            value: componentName,
            indent
        });

        // Parse props
        const propsText = this.extractPropsText(componentText);
        const props = this.parseProps(propsText);
        
        tokens.push(...props);

        // Determine if self-closing or has children
        if (componentText.includes('/>')) {
            tokens.push({
                type: this.tokenTypes.SELF_CLOSING
            });
        } else {
            tokens.push({
                type: this.tokenTypes.TAG_END
            });
            
            // Extract children if present
            const children = this.extractChildren(componentText);
            if (children) {
                tokens.push({
                    type: this.tokenTypes.CHILDREN,
                    value: children
                });
                
                tokens.push({
                    type: this.tokenTypes.COMPONENT_END,
                    value: componentName
                });
            }
        }

        return tokens;
    }

    /**
     * Extract props text from component
     */
    extractPropsText(componentText) {
        // Find text between component name and > or />
        const match = componentText.match(/^(\s*)<([^>\s]+)\s+(.*?)(?:\/>|>)/s);
        return match ? match[3] : '';
    }

    /**
     * Parse props from props text
     */
    parseProps(propsText) {
        const props = [];
        let remaining = propsText;
        
        // Handle object props first (they can contain spaces and complex structures)
        const objectMatches = [...remaining.matchAll(/(\w+)=(\{(?:[^{}]|\{[^}]*\})*\})/g)];
        for (const match of objectMatches) {
            props.push({
                type: this.tokenTypes.OBJECT_VALUE,
                name: match[1],
                value: match[2],
                raw: match[0]
            });
            remaining = remaining.replace(match[0], '');
        }

        // Handle string props
        const stringMatches = [...remaining.matchAll(/(\w+)=("[^"]*"|'[^']*')/g)];
        for (const match of stringMatches) {
            props.push({
                type: this.tokenTypes.STRING_VALUE,
                name: match[1],
                value: match[2],
                raw: match[0]
            });
            remaining = remaining.replace(match[0], '');
        }

        // Handle boolean props
        const booleanMatches = [...remaining.matchAll(/\b(\w+)(?=\s|$|>)/g)];
        for (const match of booleanMatches) {
            if (match[1] && !['true', 'false'].includes(match[1])) {
                props.push({
                    type: this.tokenTypes.BOOLEAN_PROP,
                    name: match[1],
                    value: true,
                    raw: match[0]
                });
            }
        }

        return props;
    }

    /**
     * Extract children from component
     */
    extractChildren(componentText) {
        // Match content between opening and closing tags
        const childrenMatch = componentText.match(/>([^]*?)<\/[^>]+>$/);
        return childrenMatch ? childrenMatch[1] : null;
    }

    /**
     * Reconstruct component from tokens
     */
    reconstructComponent(tokens) {
        let result = '';
        let indent = '';
        let componentName = '';
        
        for (const token of tokens) {
            switch (token.type) {
                case this.tokenTypes.COMPONENT_START:
                    indent = token.indent;
                    componentName = token.value;
                    result += `${indent}<${componentName}`;
                    break;
                    
                case this.tokenTypes.STRING_VALUE:
                case this.tokenTypes.OBJECT_VALUE:
                    result += ` ${token.name}=${token.value}`;
                    break;
                    
                case this.tokenTypes.BOOLEAN_PROP:
                    result += ` ${token.name}`;
                    break;
                    
                case this.tokenTypes.SELF_CLOSING:
                    result += ' />';
                    break;
                    
                case this.tokenTypes.TAG_END:
                    result += '>';
                    break;
                    
                case this.tokenTypes.CHILDREN:
                    result += token.value;
                    break;
                    
                case this.tokenTypes.COMPONENT_END:
                    result += `</${token.value}>`;
                    break;
            }
        }
        
        return result;
    }
}

/**
 * JSX Validation utilities
 */
class JSXValidator {
    /**
     * Validate JSX syntax
     */
    static isValidJSX(text) {
        // Basic validation checks
        const openTags = (text.match(/</g) || []).length;
        const closeTags = (text.match(/>/g) || []).length;
        
        // Should have balanced < and >
        return openTags === closeTags;
    }

    /**
     * Check if component should be reformatted
     */
    static shouldReformat(componentText, propCount) {
        // Don't reformat if already single line and prop count is acceptable
        if (!componentText.includes('\n') && propCount <= 6) {
            return false;
        }
        
        // Don't reformat complex sx objects
        if (componentText.includes('sx={{') && componentText.includes('\n')) {
            const sxContent = componentText.match(/sx=\{([^}]+)\}/s);
            if (sxContent && sxContent[1].includes('\n')) {
                return false;
            }
        }
        
        return propCount <= 6;
    }

    /**
     * Check for special cases that should preserve formatting
     */
    static hasSpecialFormatting(componentText) {
        const specialCases = [
            // Multi-line sx objects
            /sx=\{[^}]*\n[^}]*\}/,
            
            // Event handlers with complex logic
            /on\w+={[^}]*=>[^}]*\n[^}]*}/,
            
            // Spread operators
            /\.\.\.\w+/,
            
            // Complex children
            /{[^}]*\n[^}]*}/
        ];
        
        return specialCases.some(pattern => pattern.test(componentText));
    }
}

/**
 * Configuration for different formatting styles
 */
class FormattingConfig {
    static presets = {
        compact: {
            maxPropsForSingleLine: 8,
            preferSingleLine: true,
            preserveComplexSx: true
        },
        
        readable: {
            maxPropsForSingleLine: 4,
            preferSingleLine: false,
            preserveComplexSx: true
        },
        
        standard: {
            maxPropsForSingleLine: 6,
            preferSingleLine: true,
            preserveComplexSx: true
        }
    };

    static getConfig(preset = 'standard') {
        return this.presets[preset] || this.presets.standard;
    }
}

module.exports = {
    JSXParser,
    JSXValidator,
    FormattingConfig
};