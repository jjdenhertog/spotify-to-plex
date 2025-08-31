module.exports = {
    meta: {
        docs: {
            description: "Enforce props destructuring inside forwardRef function body instead of parameter destructuring",
            category: "Stylistic Issues",
            recommended: false
        },
        fixable: "code",
        schema: []
    },

    create: function(context) {
        const sourceCode = context.getSourceCode();

        /**
         * Check if a CallExpression is a forwardRef call
         */
        function isForwardRefCall(node) {
            return node.callee && 
                   (node.callee.name === 'forwardRef' || 
                    (node.callee.type === 'MemberExpression' && 
                     node.callee.object.name === 'React' && 
                     node.callee.property.name === 'forwardRef'));
        }

        /**
         * Check if the first parameter uses destructuring
         */
        function hasDestructuredFirstParam(params) {
            return params.length > 0 && params[0].type === 'ObjectPattern';
        }

        /**
         * Extract property names from destructuring pattern
         */
        function extractDestructuredProps(objectPattern) {
            return objectPattern.properties.map(prop => {
                if (prop.type === 'Property') {
                    return {
                        name: prop.key.name,
                        value: prop.value.name || prop.key.name,
                        hasDefault: prop.value.type === 'AssignmentPattern'
                    };
                }
                if (prop.type === 'RestElement') {
                    return {
                        name: '...' + prop.argument.name,
                        value: '...' + prop.argument.name,
                        hasDefault: false
                    };
                }
                return null;
            }).filter(Boolean);
        }

        /**
         * Generate the fixed code
         */
        function generateFixedCode(node, destructuredProps) {
            const arrowFunction = node.arguments[0];
            const params = arrowFunction.params;
            const body = arrowFunction.body;
            
            // Create new parameter list with 'props' and ref
            const newParams = ['props'];
            if (params.length > 1) {
                newParams.push(sourceCode.getText(params[1]));
            }
            
            // Create destructuring statement
            const destructuringProps = destructuredProps.map(prop => {
                if (prop.name.startsWith('...')) {
                    return prop.name;
                }
                return prop.hasDefault ? `${prop.name} = ${getDefaultValue(prop, params[0])}` : prop.name;
            }).join(',\n        ');
            
            const destructuringStatement = `const {\n        ${destructuringProps}\n    } = props;`;
            
            // Build the new function body
            let newBody;
            if (body.type === 'BlockStatement') {
                // Function has a block body
                const bodyText = sourceCode.getText(body);
                const bodyContent = bodyText.slice(1, -1).trim(); // Remove { and }
                newBody = `{\n    ${destructuringStatement}\n${bodyContent ? '\n    ' + bodyContent : ''}\n}`;
            } else {
                // Function has an expression body
                const bodyText = sourceCode.getText(body);
                newBody = `{\n    ${destructuringStatement}\n\n    return ${bodyText};\n}`;
            }
            
            // Reconstruct the arrow function
            const newFunction = `((${newParams.join(', ')}) => ${newBody})`;
            
            return newFunction;
        }

        /**
         * Get default value for a property from the original destructuring pattern
         */
        function getDefaultValue(prop, originalParam) {
            const originalProp = originalParam.properties.find(p => 
                p.type === 'Property' && p.key.name === prop.name
            );
            
            if (originalProp && originalProp.value.type === 'AssignmentPattern') {
                return sourceCode.getText(originalProp.value.right);
            }
            
            return 'undefined';
        }

        return {
            CallExpression(node) {
                // Check if this is a forwardRef call
                if (!isForwardRefCall(node)) {
                    return;
                }

                // Check if it has arguments and the first argument is an arrow function
                if (node.arguments.length === 0 || node.arguments[0].type !== 'ArrowFunctionExpression') {
                    return;
                }

                const arrowFunction = node.arguments[0];
                const params = arrowFunction.params;

                // Check if the first parameter uses destructuring
                if (hasDestructuredFirstParam(params)) {
                    const destructuredProps = extractDestructuredProps(params[0]);
                    
                    context.report({
                        node: arrowFunction,
                        message: "forwardRef should use 'props' parameter with destructuring inside the function body",
                        fix: function(fixer) {
                            const newFunction = generateFixedCode(node, destructuredProps);
                            return fixer.replaceText(node.arguments[0], newFunction);
                        }
                    });
                }
            }
        };
    }
};