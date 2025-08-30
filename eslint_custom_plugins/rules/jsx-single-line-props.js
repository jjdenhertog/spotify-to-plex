module.exports = {
    meta: {
        docs: {
            description: "Enforce single-line format for JSX components with 6 or fewer props",
            category: "Stylistic Issues",
            recommended: false
        },
        fixable: "whitespace",
        schema: [
            {
                type: "object",
                properties: {
                    maxPropsForSingleLine: {
                        type: "integer",
                        minimum: 1,
                        default: 6
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create: function(context) {
        const sourceCode = context.getSourceCode();
        const options = context.options[0] || {};
        const maxProps = options.maxPropsForSingleLine || 6;

        /**
         * Check if a JSX attribute contains complex values that should preserve formatting
         */
        function hasComplexValues(attributes) {
            return attributes.some(attr => {
                if (attr.type === 'JSXSpreadAttribute') {
                    return true; // Preserve spread attributes
                }
                
                if (attr.value && attr.value.type === 'JSXExpressionContainer') {
                    const expression = attr.value.expression;
                    
                    // Check for multi-line objects (like sx props)
                    if (expression.type === 'ObjectExpression') {
                        const objText = sourceCode.getText(expression);
                        if (objText.includes('\n')) {
                            return true; // Multi-line object
                        }
                        if (objText.length > 80) {
                            return true; // Very long object
                        }
                    }
                    
                    // Check for arrow functions
                    if (expression.type === 'ArrowFunctionExpression') {
                        return true;
                    }
                }
                
                return false;
            });
        }

        /**
         * Check if the JSX opening element should be formatted as single line
         */
        function checkJSXOpeningElement(node) {
            const attributes = node.attributes;
            const attrCount = attributes.length;
            
            // Only check components with maxProps or fewer attributes
            if (attrCount === 0 || attrCount > maxProps) {
                return;
            }
            
            // Skip if has complex values that should preserve formatting
            if (hasComplexValues(attributes)) {
                return;
            }
            
            const startLine = node.loc.start.line;
            const endLine = node.loc.end.line;
            
            // If it spans multiple lines, report error
            if (startLine !== endLine) {
                context.report({
                    node,
                    message: `JSX components with ${attrCount} or fewer props should be on a single line`,
                    fix: function(fixer) {
                        // Get the full text of the opening element
                        const elementText = sourceCode.getText(node);
                        
                        // More careful approach: preserve attribute structure
                        let singleLineText = elementText;
                        
                        // Step 1: Replace newlines and indentation with single spaces
                        singleLineText = singleLineText.replace(/\n\s+/g, ' ');
                        
                        // Step 2: Clean up multiple consecutive spaces (but not within strings)
                        singleLineText = singleLineText.replace(/\s{2,}/g, ' ');
                        
                        // Step 3: Remove spaces around equals signs
                        singleLineText = singleLineText.replace(/\s*=\s*/g, '=');
                        
                        // Step 4: Ensure single space after component name if there are attributes
                        singleLineText = singleLineText.replace(/(<[A-Za-z][A-Za-z0-9]*)\s+([A-Za-z])/g, '$1 $2');
                        
                        // Step 5: Ensure spaces between attributes (but not within attribute names)
                        singleLineText = singleLineText.replace(/(["}])\s*([A-Za-z_$][A-Za-z0-9_$]*=)/g, '$1 $2');
                        
                        // Step 6: Clean up any trailing spaces before the closing >
                        singleLineText = singleLineText.replace(/\s+>$/, '>');
                        
                        // Step 7: Trim any leading/trailing whitespace
                        singleLineText = singleLineText.trim();
                        
                        return fixer.replaceText(node, singleLineText);
                    }
                });
            }
        }

        return {
            JSXOpeningElement(node) {
                checkJSXOpeningElement(node);
            }
        };
    }
};