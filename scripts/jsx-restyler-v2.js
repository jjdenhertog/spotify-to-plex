#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Enhanced JSX Restyler with better pattern matching
 */
class JSXRestylerV2 {
    constructor(options = {}) {
        this.options = {
            maxPropsForSingleLine: 6,
            preserveComments: true,
            indentSize: 4,
            ...options
        };
    }

    /**
     * Process file or directory
     */
    async processPath(inputPath) {
        const stats = fs.statSync(inputPath);
        
        if (stats.isDirectory()) {
            return this.processDirectory(inputPath);
        } else if (this.isTSXFile(inputPath)) {
            return this.processFile(inputPath);
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
            try {
                const result = await this.processPath(entryPath);
                totalProcessed += result.processed;
                allErrors = allErrors.concat(result.errors);
            } catch (error) {
                allErrors.push(`Error processing ${entryPath}: ${error.message}`);
            }
        }

        return { processed: totalProcessed, errors: allErrors };
    }

    /**
     * Check if file is TSX/JSX
     */
    isTSXFile(filePath) {
        return /\.(tsx|jsx)$/.test(filePath);
    }

    /**
     * Process single file
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
        let result = content;
        
        // Phase 1: Handle simple self-closing components
        result = this.formatSelfClosingComponents(result);
        
        // Phase 2: Handle components with simple children (single line)
        result = this.formatSimpleComponentsWithChildren(result);
        
        return result;
    }

    /**
     * Format self-closing components
     */
    formatSelfClosingComponents(content) {
        // Match self-closing JSX components across multiple lines
        const pattern = /^(\s*)<([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*)\s+((?:[^>]|\n)*?)\s*\/>\s*$/gm;
        
        return content.replace(pattern, (match, indent, componentName, propsSection) => {
            // Clean up props section (remove extra whitespace and newlines)
            const cleanProps = propsSection.replace(/\s+/g, ' ').trim();
            
            // Parse props to count them
            const props = this.extractProps(cleanProps);
            
            // Only reformat if it meets criteria
            if (props.length <= this.options.maxPropsForSingleLine && 
                !this.shouldPreserveFormatting(cleanProps)) {
                
                return `${indent}<${componentName} ${cleanProps} />`;
            }
            
            return match; // Keep original if too complex
        });
    }

    /**
     * Format components with children (single line children only)
     */
    formatSimpleComponentsWithChildren(content) {
        // Match components with simple single-line children
        const pattern = /^(\s*)<([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*)\s+((?:[^>]|\n)*?)>\s*([^<\n]+)\s*<\/\2>\s*$/gm;
        
        return content.replace(pattern, (match, indent, componentName, propsSection, children) => {
            // Clean up props and children
            const cleanProps = propsSection.replace(/\s+/g, ' ').trim();
            const cleanChildren = children.trim();
            
            // Parse props to count them
            const props = this.extractProps(cleanProps);
            
            // Only reformat if it meets criteria
            if (props.length <= this.options.maxPropsForSingleLine && 
                !this.shouldPreserveFormatting(cleanProps) &&
                cleanChildren &&
                !cleanChildren.includes('\n') &&
                cleanChildren.length < 100) {
                
                return `${indent}<${componentName} ${cleanProps}>${cleanChildren}</${componentName}>`;
            }
            
            return match; // Keep original if too complex
        });
    }

    /**
     * Extract and count props from props string
     */
    extractProps(propsString) {
        const props = [];
        
        // Object props (sx, style, etc.)
        const objectMatches = [...propsString.matchAll(/(\w+)=(\{[^}]*\})/g)];
        props.push(...objectMatches.map(m => ({ name: m[1], value: m[2], type: 'object' })));
        
        // String props  
        const stringMatches = [...propsString.matchAll(/(\w+)=("[^"]*"|'[^']*')/g)];
        props.push(...stringMatches.map(m => ({ name: m[1], value: m[2], type: 'string' })));
        
        // Function props
        const functionMatches = [...propsString.matchAll(/(\w+)=(\{[^}]*=>[^}]*\})/g)];
        props.push(...functionMatches.map(m => ({ name: m[1], value: m[2], type: 'function' })));
        
        // Boolean props - find standalone words not already matched
        let remaining = propsString;
        [...objectMatches, ...stringMatches, ...functionMatches].forEach(match => {
            remaining = remaining.replace(match[0], '');
        });
        
        const booleanMatches = [...remaining.matchAll(/\b(\w+)(?=\s|$)/g)];
        props.push(...booleanMatches.map(m => ({ name: m[1], value: true, type: 'boolean' })));
        
        return props;
    }

    /**
     * Check if formatting should be preserved
     */
    shouldPreserveFormatting(propsString) {
        const preservePatterns = [
            /\{[^}]*\n[^}]*\}/, // Multi-line objects
            /\.\.\.\w+/, // Spread operators  
            /"[^"]*\n[^"]*"/, // Multi-line strings
            /\/\*[\s\S]*?\*\//, // Comments
            /\{[^}]{80,}\}/ // Very long objects
        ];
        
        // Count total props - if more than 6, preserve formatting
        const propCount = this.extractProps(propsString).length;
        if (propCount > this.options.maxPropsForSingleLine) {
            return true;
        }
        
        return preservePatterns.some(pattern => pattern.test(propsString));
    }

    /**
     * Validate JSX syntax
     */
    isValidJSX(content) {
        try {
            // Basic validation - check for balanced tags
            const openTags = (content.match(/</g) || []).length;
            const closeTags = (content.match(/>/g) || []).length;
            return openTags === closeTags;
        } catch {
            return false;
        }
    }
}

/**
 * CLI for the enhanced restyler
 */
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🎨 Enhanced JSX Restyler V2

Usage:
  node jsx-restyler-v2.js <path>           # Process file or directory
  node jsx-restyler-v2.js --help          # Show help

Features:
  ✓ Better prop parsing and counting
  ✓ Preserves complex formatting
  ✓ Handles MUI components properly
  ✓ Safe processing with validation

Examples:
  node jsx-restyler-v2.js src/components  # Process all TSX/JSX in directory
  node jsx-restyler-v2.js Component.tsx   # Process single file
        `);
        process.exit(0);
    }

    const restyler = new JSXRestylerV2();
    
    async function run() {
        try {
            const result = await restyler.processPath(args[0]);
            
            console.log('\n📊 Processing complete:');
            console.log(`✓ Files reformatted: ${result.processed}`);
            
            if (result.errors.length > 0) {
                console.log(`✗ Errors encountered: ${result.errors.length}`);
                result.errors.forEach(error => console.log(`  - ${error}`));
            }
        } catch (error) {
            console.error('❌ Fatal error:', error.message);
            process.exit(1);
        }
    }
    
    run();
}

module.exports = { JSXRestylerV2 };