module.exports = {
    meta: {
        docs: {
            description: "Enforce multiline format for JSX elements with simple text children",
            category: "Stylistic Issues", 
            recommended: false
        },
        fixable: "whitespace",
        schema: [
            {
                type: "object",
                properties: {
                    minTextLength: {
                        type: "integer",
                        minimum: 0,
                        default: 1
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create: function(context) {
        const sourceCode = context.getSourceCode();
        const options = context.options[0] || {};
        const minTextLength = options.minTextLength || 1;

        /**
         * Check if JSX element has simple text children that should be multiline
         */
        function checkJSXElement(node) {
            // Only check elements that have children
            if (!node.children || node.children.length === 0) {
                return;
            }

            // Only handle elements with a single text child for now
            if (node.children.length !== 1) {
                return;
            }

            const child = node.children[0];
            
            // Only check JSXText nodes (simple text content)
            if (child.type !== 'JSXText') {
                return;
            }

            // Skip if text is too short
            const textContent = child.value.trim();
            if (textContent.length < minTextLength) {
                return;
            }

            // Skip if text already contains newlines (already multiline)
            if (textContent.includes('\n')) {
                return;
            }

            const openingElement = node.openingElement;
            const closingElement = node.closingElement;
            
            // Skip self-closing elements
            if (!closingElement) {
                return;
            }

            // Check if opening tag, text, and closing tag are all on the same line
            const openingLine = openingElement.loc.end.line;
            const textLine = child.loc.start.line;
            const closingLine = closingElement.loc.start.line;

            if (openingLine === textLine && textLine === closingLine) {
                context.report({
                    node,
                    message: `JSX elements with text children should use multiline format`,
                    fix: function(fixer) {
                        // Get current indentation by looking at the opening element
                        const openingElementText = sourceCode.getText(openingElement);
                        const beforeOpening = sourceCode.getText().substring(0, openingElement.range[0]);
                        const lastNewlineIndex = beforeOpening.lastIndexOf('\n');
                        const currentIndentation = lastNewlineIndex >= 0 
                            ? beforeOpening.substring(lastNewlineIndex + 1).match(/^\s*/)[0]
                            : '';
                        
                        // Add extra indentation for the content (4 spaces)
                        const contentIndentation = currentIndentation + '    ';
                        
                        // Create the multiline format
                        const componentName = openingElement.name.name;
                        const attributesText = openingElement.attributes.length > 0 
                            ? ' ' + sourceCode.getText().substring(
                                openingElement.name.range[1],
                                openingElement.range[1] - 1
                              ).trim()
                            : '';
                            
                        const newText = `<${componentName}${attributesText}>\n${contentIndentation}${textContent.trim()}\n${currentIndentation}</${componentName}>`;
                        
                        return fixer.replaceText(node, newText);
                    }
                });
            }
        }

        return {
            JSXElement(node) {
                checkJSXElement(node);
            }
        };
    }
};