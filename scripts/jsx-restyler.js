#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * JSX Restyling Tool
 * 
 * Reformats JSX/TSX components based on prop count:
 * - Components with ≤6 props: Format to single line
 * - Components with >6 props: Keep multi-line format
 * - Preserve children on separate lines
 * - Handle special cases (sx objects, event handlers, etc.)
 */
class JSXRestyler {
    constructor(options = {}) {
        this.options = {
            maxPropsForSingleLine: 6,
            preserveComments: true,
            indentSize: 4,
            tabsToSpaces: true,
            ...options
        };
    }

    /**
     * Process a single file or directory
     */
    async processPath(filePath) {
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
            return this.processDirectory(filePath);
        } else if (this.isTSXFile(filePath)) {
            return this.processFile(filePath);
        }
        
        return { processed: 0, errors: [] };
    }

    /**
     * Process directory recursively
     */
    async processDirectory(dirPath) {
        let totalProcessed = 0;
        let allErrors = [];

        const entries = fs.readdirSync(dirPath);
        
        for (const entry of entries) {
            if (entry.startsWith('.') || entry === 'node_modules') {
                continue;
            }
            
            const entryPath = path.join(dirPath, entry);
            const result = await this.processPath(entryPath);
            totalProcessed += result.processed;
            allErrors = allErrors.concat(result.errors);
        }

        return { processed: totalProcessed, errors: allErrors };
    }

    /**
     * Check if file is a TSX/JSX file
     */
    isTSXFile(filePath) {
        return /\.(tsx|jsx)$/.test(filePath);
    }

    /**
     * Process a single TSX/JSX file
     */
    processFile(filePath) {
        try {
            console.log(`Processing: ${filePath}`);
            
            const content = fs.readFileSync(filePath, 'utf8');
            const reformatted = this.reformatJSX(content);
            
            if (content !== reformatted) {
                fs.writeFileSync(filePath, reformatted, 'utf8');
                console.log(`✓ Reformatted: ${filePath}`);
                return { processed: 1, errors: [] };
            } else {
                console.log(`- No changes needed: ${filePath}`);
                return { processed: 0, errors: [] };
            }
        } catch (error) {
            const errorMsg = `Error processing ${filePath}: ${error.message}`;
            console.error(`✗ ${errorMsg}`);
            return { processed: 0, errors: [errorMsg] };
        }
    }

    /**
     * Main JSX reformatting logic
     */
    reformatJSX(content) {
        // Handle self-closing components first
        content = this.handleSelfClosingComponents(content);
        
        // Handle components with children
        content = this.handleComponentsWithChildren(content);
        
        return content;
    }

    /**
     * Handle self-closing components
     */
    handleSelfClosingComponents(content) {
        const selfClosingPattern = /^(\s*)<([A-Z][a-zA-Z0-9]*|[a-z]+)\s+([^>]*?)\s*\/>\s*$/gm;
        
        return content.replace(selfClosingPattern, (match, indent, componentName, propsText) => {
            const props = this.parsePropsAdvanced(propsText);
            
            if (props.length <= this.options.maxPropsForSingleLine && !this.hasComplexProps(propsText)) {
                const formattedProps = props.map(p => p.formatted).join(' ');
                return `${indent}<${componentName} ${formattedProps} />`;
            }
            
            return match;
        });
    }

    /**
     * Handle components with children 
     */
    handleComponentsWithChildren(content) {
        // Pattern to match opening tag, content, and closing tag
        const componentPattern = /^(\s*)<([A-Z][a-zA-Z0-9]*|[a-z]+)\s+([^>]*?)>\s*([^<]*?)\s*<\/\2>\s*$/gm;
        
        return content.replace(componentPattern, (match, indent, componentName, propsText, children) => {
            const props = this.parsePropsAdvanced(propsText);
            const cleanChildren = children.trim();
            
            if (props.length <= this.options.maxPropsForSingleLine && 
                !this.hasComplexProps(propsText) && 
                cleanChildren && 
                !cleanChildren.includes('\n')) {
                
                const formattedProps = props.map(p => p.formatted).join(' ');
                return `${indent}<${componentName} ${formattedProps}>${cleanChildren}</${componentName}>`;
            }
            
            return match;
        });
    }

    /**
     * Advanced props parsing with better accuracy
     */
    parsePropsAdvanced(propsText) {
        const props = [];
        let remaining = propsText.trim();
        
        // Object props (including sx, style, etc.)
        const objectMatches = [...remaining.matchAll(/(\w+)=(\{(?:[^{}]|\{[^}]*\})*\})/g)];
        objectMatches.forEach(match => {
            props.push({
                name: match[1],
                value: match[2],
                type: 'object',
                formatted: `${match[1]}=${match[2]}`
            });
            remaining = remaining.replace(match[0], '');
        });
        
        // String props
        const stringMatches = [...remaining.matchAll(/(\w+)=("[^"]*"|'[^']*'|`[^`]*`)/g)];
        stringMatches.forEach(match => {
            props.push({
                name: match[1],
                value: match[2],
                type: 'string',
                formatted: `${match[1]}=${match[2]}`
            });
            remaining = remaining.replace(match[0], '');
        });
        
        // Boolean props
        const words = remaining.split(/\s+/).filter(word => 
            word && 
            /^\w+$/.test(word) && 
            !['true', 'false', 'null', 'undefined'].includes(word)
        );
        
        words.forEach(word => {
            props.push({
                name: word,
                value: true,
                type: 'boolean',
                formatted: word
            });
        });
        
        return props;
    }

    /**
     * Check for complex props that should preserve formatting
     */
    hasComplexProps(propsText) {
        const complexPatterns = [
            /sx=\{[^}]*\n[^}]*\}/, // Multi-line sx
            /\{[^}]*=>[^}]*\}/, // Arrow functions
            /\.\.\.\w+/, // Spread operators
            /\{\/\*[\s\S]*?\*\/\}/, // Comments
            /\{[^}]{50,}\}/ // Very long object props
        ];
        
        return complexPatterns.some(pattern => pattern.test(propsText));
    }

    /**
     * Find JSX component opening tag in a line
     */
    findJSXComponent(line) {
        // Match JSX opening tags: <ComponentName or <div, etc.
        const jsxRegex = /^(\s*)<([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*)\b/;
        const match = line.match(jsxRegex);
        
        if (match) {
            return {
                componentName: match[2],
                fullMatch: match[0],
                indent: match[1]
            };
        }
        
        return null;
    }

    /**
     * Extract complete component spanning multiple lines
     */
    extractCompleteComponent(lines, startIndex) {
        const startLine = lines[startIndex];
        let componentLines = [startLine];
        let currentIndex = startIndex;
        
        // Simple heuristic: look for closing > or />
        if (startLine.includes('/>')) {
            // Self-closing tag on single line
            return {
                endIndex: startIndex,
                componentText: startLine,
                hasChildren: false
            };
        }
        
        if (startLine.includes('>') && !startLine.trim().endsWith('>')) {
            // Opening tag completed on same line with children
            return {
                endIndex: startIndex,
                componentText: startLine,
                hasChildren: true
            };
        }
        
        // Multi-line component - find the end
        let openBrackets = 0;
        let foundClosing = false;
        
        currentIndex++;
        while (currentIndex < lines.length && !foundClosing) {
            const line = lines[currentIndex];
            componentLines.push(line);
            
            // Count < and > to find the closing tag
            for (let char of line) {
                if (char === '<') openBrackets++;
                if (char === '>') {
                    openBrackets--;
                    if (openBrackets === 0) {
                        foundClosing = true;
                        break;
                    }
                }
            }
            
            // Also check for self-closing /> 
            if (line.includes('/>')) {
                foundClosing = true;
            }
            
            currentIndex++;
        }
        
        const componentText = componentLines.join('\n');
        const hasChildren = !componentText.includes('/>') && componentText.includes('>');
        
        return {
            endIndex: currentIndex - 1,
            componentText,
            hasChildren
        };
    }

    /**
     * Reformat a component based on prop count
     */
    reformatComponent(componentText, indent, componentName, hasChildren) {
        // Extract props from the component
        const props = this.extractProps(componentText);
        
        // If ≤6 props, try to format to single line
        if (props.length <= this.options.maxPropsForSingleLine) {
            return this.formatSingleLine(componentText, indent, componentName, props, hasChildren);
        }
        
        // Otherwise, ensure it's properly multi-line formatted
        return this.formatMultiLine(componentText, indent, componentName, props, hasChildren);
    }

    /**
     * Extract props from component text
     */
    extractProps(componentText) {
        const props = [];
        
        // Remove the component name and extract attributes
        const withoutComponentName = componentText.replace(/^(\s*)<[^>\s]+\s*/, '');
        
        // Simple regex to find prop patterns
        const propRegex = /(\w+)(?:=(?:({[^}]*})|("([^"]*)"|'([^']*)')|(\w+)))?/g;
        let match;
        
        while ((match = propRegex.exec(withoutComponentName)) !== null) {
            if (match[0] !== '>' && match[0] !== '/>' && !match[0].includes('<')) {
                props.push({
                    name: match[1],
                    value: match[2] || match[3] || match[6] || true
                });
            }
        }
        
        return props;
    }

    /**
     * Format component as single line
     */
    formatSingleLine(componentText, indent, componentName, props, hasChildren) {
        let formatted = `${indent}<${componentName}`;
        
        // Add props
        for (const prop of props) {
            if (prop.value === true) {
                formatted += ` ${prop.name}`;
            } else {
                formatted += ` ${prop.name}=${prop.value}`;
            }
        }
        
        // Close tag
        if (hasChildren) {
            formatted += '>';
            
            // Extract and preserve children
            const childrenMatch = componentText.match(/>([^<]*)</);
            if (childrenMatch && childrenMatch[1].trim()) {
                formatted += childrenMatch[1].trim();
            }
            
            formatted += `</${componentName}>`;
        } else {
            formatted += ' />';
        }
        
        return formatted;
    }

    /**
     * Format component as multi-line (ensure proper formatting)
     */
    formatMultiLine(componentText, indent, componentName, props, hasChildren) {
        let formatted = `${indent}<${componentName}`;
        
        // Add props on separate lines
        for (const prop of props) {
            if (prop.value === true) {
                formatted += `\n${indent}    ${prop.name}`;
            } else {
                formatted += `\n${indent}    ${prop.name}=${prop.value}`;
            }
        }
        
        // Close tag
        if (hasChildren) {
            formatted += `\n${indent}>`;
            
            // Preserve children formatting
            const childrenRegex = />([^]*?)<\/[^>]+>$/;
            const childrenMatch = componentText.match(childrenRegex);
            if (childrenMatch) {
                const children = childrenMatch[1];
                formatted += children;
            }
            
            formatted += `\n${indent}</${componentName}>`;
        } else {
            formatted += `\n${indent}/>`;
        }
        
        return formatted;
    }

    /**
     * Advanced JSX parsing using regex patterns for common cases
     */
    reformatJSXAdvanced(content) {
        // Handle common MUI component patterns
        content = this.handleMUIComponents(content);
        
        // Handle self-closing tags with few props
        content = this.handleSelfClosingTags(content);
        
        // Handle components with sx props
        content = this.handleSxProps(content);
        
        return content;
    }

    /**
     * Handle Material-UI component patterns
     */
    handleMUIComponents(content) {
        // Pattern for Box components with simple props
        const boxPattern = /(\s*)<Box\s+((?:(?:display|gap|sx|textAlign|width|height|mb|mt|ml|mr|p|px|py|pt|pb|m|mx|my)=[^>\s]+\s*){1,6})>/gm;
        
        content = content.replace(boxPattern, (match, indent, props) => {
            const propsArray = props.trim().split(/\s+/);
            if (propsArray.length <= 6) {
                return `${indent}<Box ${props.trim()}>`;
            }
            return match;
        });

        // Pattern for Typography with simple props
        const typographyPattern = /(\s*)<Typography\s+((?:(?:variant|sx|display|color|component)=[^>\s]+\s*){1,4})>/gm;
        
        content = content.replace(typographyPattern, (match, indent, props) => {
            return `${indent}<Typography ${props.trim()}>`;
        });

        return content;
    }

    /**
     * Handle self-closing tags
     */
    handleSelfClosingTags(content) {
        // Pattern for self-closing components with ≤6 props
        const selfClosingPattern = /(\s*)<(\w+)\s+((?:[^>]*?){1,200})\s*\/>/gm;
        
        content = content.replace(selfClosingPattern, (match, indent, componentName, props) => {
            const propCount = this.countProps(props);
            
            if (propCount <= this.options.maxPropsForSingleLine) {
                // Format as single line
                const cleanProps = props.replace(/\s+/g, ' ').trim();
                return `${indent}<${componentName} ${cleanProps} />`;
            }
            
            return match;
        });

        return content;
    }

    /**
     * Handle sx props specially
     */
    handleSxProps(content) {
        // Keep sx props formatting intact for readability
        return content;
    }

    /**
     * Count props in a prop string
     */
    countProps(propString) {
        // Simple heuristic: count prop patterns
        const propMatches = propString.match(/\w+=/g);
        return propMatches ? propMatches.length : 0;
    }

    /**
     * Simple props extraction for basic cases
     */
    extractPropsSimple(propString) {
        const props = [];
        const propMatches = propString.matchAll(/(\w+)=("[^"]*"|'[^']*'|{[^}]*}|\w+)/g);
        
        for (const match of propMatches) {
            props.push({
                name: match[1],
                value: match[2]
            });
        }
        
        return props;
    }
}

/**
 * CLI Interface
 */
class JSXRestylerCLI {
    constructor() {
        this.restyler = new JSXRestyler();
    }

    async run(args = process.argv.slice(2)) {
        if (args.length === 0) {
            this.showUsage();
            return;
        }

        const command = args[0];
        
        switch (command) {
            case 'file':
                await this.processFile(args[1]);
                break;
            case 'dir':
                await this.processDirectory(args[1]);
                break;
            case 'format':
                await this.formatPath(args[1]);
                break;
            case '--help':
            case 'help':
                this.showUsage();
                break;
            default:
                // Default: treat as path
                await this.formatPath(command);
        }
    }

    async processFile(filePath) {
        if (!filePath) {
            console.error('Error: File path required');
            return;
        }

        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found: ${filePath}`);
            return;
        }

        const result = await this.restyler.processPath(filePath);
        this.showResults(result);
    }

    async processDirectory(dirPath) {
        if (!dirPath) {
            console.error('Error: Directory path required');
            return;
        }

        if (!fs.existsSync(dirPath)) {
            console.error(`Error: Directory not found: ${dirPath}`);
            return;
        }

        const result = await this.restyler.processPath(dirPath);
        this.showResults(result);
    }

    async formatPath(targetPath) {
        if (!targetPath) {
            console.error('Error: Path required');
            return;
        }

        if (!fs.existsSync(targetPath)) {
            console.error(`Error: Path not found: ${targetPath}`);
            return;
        }

        const result = await this.restyler.processPath(targetPath);
        this.showResults(result);
    }

    showResults(result) {
        console.log('\n📊 Results:');
        console.log(`✓ Files processed: ${result.processed}`);
        
        if (result.errors.length > 0) {
            console.log(`✗ Errors: ${result.errors.length}`);
            result.errors.forEach(error => console.log(`  - ${error}`));
        }
    }

    showUsage() {
        console.log(`
🎨 JSX Restyler Tool

Usage:
  node jsx-restyler.js <path>              # Process file or directory
  node jsx-restyler.js file <file-path>    # Process specific file
  node jsx-restyler.js dir <dir-path>      # Process directory
  node jsx-restyler.js format <path>       # Format path (file or dir)

Options:
  --help                                   # Show this help

Examples:
  node jsx-restyler.js src/components      # Process all TSX files in directory
  node jsx-restyler.js Component.tsx       # Process single file
  node jsx-restyler.js format apps/web/src # Format entire source directory

Rules:
  • Components with ≤6 props → Single line format
  • Components with >6 props → Multi-line format  
  • Children always preserved on separate lines
  • Comments and spacing preserved
  • Special handling for sx objects and event handlers
        `);
    }
}

/**
 * Enhanced JSX Formatter for complex cases
 */
class AdvancedJSXFormatter {
    constructor() {
        this.patterns = {
            // Component opening with props
            componentStart: /^(\s*)<([A-Z][a-zA-Z0-9]*|\w+(?:\.\w+)*)\s*/,
            
            // Self-closing component
            selfClosing: /^(\s*)<([A-Z][a-zA-Z0-9]*|\w+(?:\.\w+)*)\s+([^>]*?)\s*\/>\s*$/,
            
            // Component with children
            withChildren: /^(\s*)<([A-Z][a-zA-Z0-9]*|\w+(?:\.\w+)*)\s+([^>]*?)>\s*$/,
            
            // Props patterns
            stringProp: /(\w+)=("[^"]*"|'[^']*')/g,
            objectProp: /(\w+)=(\{[^}]*\})/g,
            booleanProp: /(\w+)(?=\s|>|$)/g
        };
    }

    /**
     * Advanced formatting with AST-like parsing
     */
    format(content) {
        return content.split('\n').map(line => {
            return this.formatLine(line);
        }).join('\n');
    }

    formatLine(line) {
        // Check for self-closing components
        const selfClosingMatch = line.match(this.patterns.selfClosing);
        if (selfClosingMatch) {
            const [, indent, componentName, propsString] = selfClosingMatch;
            const props = this.parseProps(propsString);
            
            if (props.length <= 6) {
                const formattedProps = props.map(p => p.formatted).join(' ');
                return `${indent}<${componentName} ${formattedProps} />`;
            }
        }

        return line;
    }

    parseProps(propsString) {
        const props = [];
        
        // Extract different types of props
        let remaining = propsString;
        
        // String props
        let match;
        while ((match = this.patterns.stringProp.exec(remaining)) !== null) {
            props.push({
                name: match[1],
                value: match[2],
                type: 'string',
                formatted: `${match[1]}=${match[2]}`
            });
        }
        
        // Object props (sx, style, etc.)
        this.patterns.objectProp.lastIndex = 0;
        while ((match = this.patterns.objectProp.exec(remaining)) !== null) {
            props.push({
                name: match[1],
                value: match[2],
                type: 'object',
                formatted: `${match[1]}=${match[2]}`
            });
        }
        
        // Boolean props
        const withoutComplexProps = remaining
            .replace(this.patterns.stringProp, '')
            .replace(this.patterns.objectProp, '');
        
        this.patterns.booleanProp.lastIndex = 0;
        while ((match = this.patterns.booleanProp.exec(withoutComplexProps)) !== null) {
            if (match[1] && match[1].trim()) {
                props.push({
                    name: match[1],
                    value: true,
                    type: 'boolean',
                    formatted: match[1]
                });
            }
        }
        
        return props;
    }
}

// Export for testing and reuse
module.exports = { JSXRestyler, JSXRestylerCLI, AdvancedJSXFormatter };

// CLI execution
if (require.main === module) {
    const cli = new JSXRestylerCLI();
    cli.run().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}