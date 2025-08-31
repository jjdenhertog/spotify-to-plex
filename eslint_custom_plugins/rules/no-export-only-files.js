module.exports = {
    meta: {
        docs: {
            description: "Disallow files that only contain multiple export statements (barrel files). Should be fixed. Two optiones, optione 1: re-export files: Remove the file entirely and update all import references to point directly to source files. Option 2: For files with actual definitions (types, interfaces, etc.): Create separate files for each export and update import references accordingly.",
            category: "Best Practices",
            recommended: false
        },
        type: "suggestion",
        schema: []
    },

    create: function(context) {
        return {
            Program(node) {
                // Skip only src/index.ts files as they are legitimate entry points
                const filename = context.getFilename();
                if (filename.endsWith('/src/index.ts') || filename.endsWith('\\src\\index.ts')) {
                    return;
                }
                // Filter out imports and exports
                const nonImportExportStatements = node.body.filter(statement => {
                    return statement.type !== 'ImportDeclaration' &&
                           statement.type !== 'ExportNamedDeclaration' &&
                           statement.type !== 'ExportDefaultDeclaration' &&
                           statement.type !== 'ExportAllDeclaration';
                });

                // Count export statements
                const exportStatements = node.body.filter(statement => {
                    return statement.type === 'ExportNamedDeclaration' ||
                           statement.type === 'ExportDefaultDeclaration' ||
                           statement.type === 'ExportAllDeclaration';
                });

                // Count different types of exports separately
                let typeAliasCount = 0;
                let interfaceCount = 0;
                let functionExportCount = 0;
                let constExportCount = 0;
                let otherExportCount = 0;

                exportStatements.forEach(statement => {
                    if (statement.type === 'ExportNamedDeclaration') {
                        if (statement.declaration) {
                            // Direct export declarations
                            if (statement.declaration.type === 'TSTypeAliasDeclaration') {
                                typeAliasCount++;
                            } else if (statement.declaration.type === 'TSInterfaceDeclaration') {
                                interfaceCount++;
                            } else if (statement.declaration.type === 'FunctionDeclaration') {
                                functionExportCount++;
                            } else if (statement.declaration.type === 'VariableDeclaration') {
                                // Check if it's an arrow function or const
                                const declarations = statement.declaration.declarations || [];
                                const hasArrowFunction = declarations.some(decl => 
                                    decl.init && 
                                    (decl.init.type === 'ArrowFunctionExpression' || 
                                     decl.init.type === 'FunctionExpression')
                                );
                                if (hasArrowFunction) {
                                    functionExportCount++;
                                } else {
                                    constExportCount++;
                                }
                            } else {
                                otherExportCount++;
                            }
                        } else if (statement.specifiers) {
                            // Re-exports or named exports - count as other
                            otherExportCount += statement.specifiers.length;
                        }
                    } else if (statement.type === 'ExportDefaultDeclaration') {
                        functionExportCount++;
                    } else if (statement.type === 'ExportAllDeclaration') {
                        otherExportCount++;
                    }
                });

                const totalExports = typeAliasCount + interfaceCount + functionExportCount + constExportCount + otherExportCount;

                // Only report if file has only exports (no implementation) AND violates rules:
                // Rule 0: Allow any single export
                // Rule 1: More than 3 type aliases
                // Rule 2: More than 3 interfaces
                // Rule 3: More than 3 const exports
                // Rule 4: More than 1 function export
                // Rule 5: Has "other" exports BUT no function exports (pure barrel/re-export file)
                if (nonImportExportStatements.length === 0 && totalExports > 1) {
                    const exceedsTypeAliasLimits = typeAliasCount > 3;
                    const exceedsInterfaceLimits = interfaceCount > 3;
                    const exceedsConstLimits = constExportCount > 3;
                    const exceedsFunctionLimits = functionExportCount > 1;
                    const hasOtherExportsWithoutFunctions = otherExportCount > 0 && functionExportCount === 0;
                    
                    if (exceedsTypeAliasLimits || exceedsInterfaceLimits || exceedsConstLimits || exceedsFunctionLimits || hasOtherExportsWithoutFunctions) {
                        context.report({
                            node,
                            message: "Files should not contain only multiple export statements. Consider consolidating exports or adding implementation."
                        });
                    }
                }
            }
        };
    }
};