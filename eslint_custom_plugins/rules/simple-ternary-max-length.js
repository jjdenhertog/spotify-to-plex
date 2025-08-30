module.exports = {
    meta: {
        docs: {
            description: "Disallow overly complex ternary expressions that exceed max line length",
            category: "Stylistic Issues",
            recommended: false
        },
        fixable: null,
        schema: [
            {
                type: "object",
                properties: {
                    maxLineLength: {
                        type: "integer",
                        minimum: 0,
                        default: 80
                    }
                },
                additionalProperties: false
            }
        ]
    },

    create: function(context) {
        const sourceCode = context.getSourceCode();
        const options = context.options[0] || {};
        const maxLineLength = options.maxLineLength || 80;

        function checkTernaryExpression(node) {
            // Get the full text of the ternary expression
            const nodeText = sourceCode.getText(node);
            
            // Check if it's on a single line
            const startLine = node.loc.start.line;
            const endLine = node.loc.end.line;
            
            // Check if arrays or objects are involved (complex values)
            const hasComplexValue = checkForComplexValues(node);
            
            // Calculate the total length as if it were on a single line
            // Remove all newlines and extra spaces
            const singleLineText = nodeText.replace(/\s+/g, ' ').trim();
            // Use the length of the ternary expression itself, not including position on line
            const totalLength = singleLineText.length;
            
            // Only report if it has complex values AND exceeds max length
            if (hasComplexValue && totalLength > maxLineLength) {
                context.report({
                    node,
                    message: `You cannot have expressions like this longer than ${maxLineLength} characters. Use an if-else statement instead.`
                });
            }
        }

        function checkForComplexValues(node) {
            // Check if consequent or alternate are arrays, objects, or contain multiple elements
            const isComplex = (value) => {
                if (value.type === 'ArrayExpression') 
                    return true;
                if (value.type === 'ObjectExpression') 
                    return true;
                if (value.type === 'CallExpression') 
                    return true;
                if (value.type === 'MemberExpression' && value.computed) 
                    return true;
                return false;
            };

            return isComplex(node.consequent) || isComplex(node.alternate);
        }

        return {
            ConditionalExpression(node) {
                checkTernaryExpression(node);
            }
        };
    }
};