module.exports = {
    meta: {
        docs: {
            description: "Enforce new line after if condition",
            category: "Best Practices",
            recommended: false
        },
        fixable: "whitespace"
    },

    create: function (context) {

        //----------------------------------------------------------------------
        // Helpers
        //----------------------------------------------------------------------

        /**
         * Check if there's a newline after if condition, report if it is missing.
         * @param {ASTNode} node The first IfStatement node of the chain.
         */
        function checkNewlineAfterIf(node) {
            const sourceCode = context.getSourceCode();
            const testEndLine = node.test.loc.end.line;
            const consequentStartLine = node.consequent.loc.start.line;

            // Return value is allright in one statement
            const isSimpleReturnStatement = (
                node.consequent.type === 'ReturnStatement' ||
                (node.consequent.type === 'ExpressionStatement' &&
                    node.consequent.expression.type === 'Literal' &&
                    node.consequent.expression.value === null)
            );

            if (isSimpleReturnStatement) {
                return;
            }

            let valid = false;
            if (node.consequent.type === 'BlockStatement') {
                // Check if the block statement starts on a new line or the first statement in the block starts on a new line
                valid = (consequentStartLine > testEndLine) || (node.consequent.loc.start.line === testEndLine && node.consequent.body.length > 0 && node.consequent.body[0].loc.start.line > testEndLine);
            } else {
                // Check if the single-line consequent starts on a new line
                valid = (consequentStartLine > testEndLine);
            }
            if (!valid) {
                context.report({
                    node,
                    message: `Expected one newline after if condition.`,
                    fix: function (fixer) {
                        const lineIndentation = ' '.repeat(node.loc.start.column);
                        const additionalIndentation = ' '.repeat(4); // Assume 4 spaces for an additional indentation level
                        const newlineWithIndent = `\n${lineIndentation}${additionalIndentation}`;

                        const closingParen = sourceCode.getTokenBefore(node.consequent, { filter: token => token.value === ')' });
                        const openingBrace = sourceCode.getTokenAfter(closingParen)

                        if (openingBrace && openingBrace.value === '{' && openingBrace.loc.start.line === closingParen.loc.start.line) {
                            const afterBraceRange = [openingBrace.range[1], openingBrace.range[1] + (openingBrace.range[1] - openingBrace.range[0])];
                            const afterBraceText = sourceCode.getText().slice(...afterBraceRange).replace(/^\s+/, '');
                            return fixer.replaceTextRange(afterBraceRange, newlineWithIndent + afterBraceText);
                        } else {
                            const afterParenRange = [closingParen.range[1], closingParen.range[1] + (closingParen.range[1] - closingParen.range[0])];
                            const afterParenText = sourceCode.getText().slice(...afterParenRange).replace(/^\s+/, '');
                            return fixer.replaceTextRange(afterParenRange, newlineWithIndent + afterParenText);
                        }
                    }
                });
            }
        }

        //----------------------------------------------------------------------
        // Public
        //----------------------------------------------------------------------

        return {
            IfStatement(node) {
                if (node.parent.type !== "IfStatement") {
                    checkNewlineAfterIf(node);
                }
            }
        };
    }
};