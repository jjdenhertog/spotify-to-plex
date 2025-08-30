#!/usr/bin/env node

/**
 * JSX Restyling Tools - Main Entry Point
 * 
 * Provides a unified interface to all JSX restyling capabilities
 */

const { JSXRestyler } = require('./jsx-restyler.js');
const { JSXRestylerV2 } = require('./jsx-restyler-v2.js');
const { generateSummary } = require('./jsx-restyler-summary.js');
const { applyRestyling, dryRun } = require('./apply-restyling.js');

/**
 * Main CLI interface
 */
class JSXRestylingCLI {
    constructor() {
        this.commands = {
            'analyze': this.analyze.bind(this),
            'format': this.format.bind(this),
            'dry-run': this.dryRun.bind(this),
            'summary': this.summary.bind(this),
            'help': this.help.bind(this),
            '--help': this.help.bind(this),
            '-h': this.help.bind(this)
        };
    }

    async run(args = process.argv.slice(2)) {
        if (args.length === 0) {
            this.help();
            return;
        }

        const command = args[0];
        const commandFn = this.commands[command];
        
        if (commandFn) {
            await commandFn(args.slice(1));
        } else {
            // Assume it's a path to format
            await this.format([command, ...args.slice(1)]);
        }
    }

    async analyze() {
        console.log('🔍 Analyzing JSX components for restyling opportunities...\n');
        await generateSummary();
    }

    async format(args) {
        const targetPath = args[0] || '../apps/web/src';
        console.log(`🎨 Formatting JSX components in: ${targetPath}\n`);
        
        const restyler = new JSXRestylerV2();
        const result = await restyler.processPath(targetPath);
        
        console.log('\n📊 Formatting Results:');
        console.log(`✓ Files processed: ${result.processed}`);
        
        if (result.errors.length > 0) {
            console.log(`✗ Errors: ${result.errors.length}`);
            result.errors.forEach(error => console.log(`  - ${error}`));
        } else {
            console.log('🎉 All files processed successfully!');
        }
    }

    async dryRun() {
        console.log('👀 Dry run mode - previewing changes without modifying files...\n');
        await dryRun();
    }

    async summary() {
        await generateSummary();
    }

    help() {
        console.log(`
🎨 JSX Restyling Tools v2.0

COMMANDS:
  analyze                    # Analyze components for restyling opportunities
  format [path]              # Apply restyling to path (default: ../apps/web/src)
  dry-run                    # Preview changes without modifying files
  summary                    # Generate detailed analysis summary
  help                       # Show this help

DIRECT USAGE:
  node index.js <path>       # Format specific path
  node index.js analyze      # Analyze codebase
  node index.js dry-run      # Preview all changes

EXAMPLES:
  node index.js analyze                    # Analyze entire codebase
  node index.js dry-run                    # Preview all changes
  node index.js format src/components      # Format components directory
  node index.js ../apps/web/src/layouts    # Format layouts directory

FEATURES:
  ✅ Components with ≤6 props → Single line format
  ✅ Components with >6 props → Preserve multi-line
  ✅ Children always on separate lines when needed
  ✅ Preserves complex sx objects and event handlers
  ✅ Safe processing with validation
  ✅ Comprehensive error handling
  ✅ Recursive directory processing

WORKFLOW:
  1. node index.js analyze     # See what can be improved
  2. node index.js dry-run     # Preview changes
  3. node index.js format      # Apply changes  
  4. git diff                  # Review changes
  5. git commit                # Save improvements
        `);
    }
}

// Export for use as module
module.exports = {
    JSXRestylingCLI,
    JSXRestyler,
    JSXRestylerV2,
    generateSummary,
    applyRestyling,
    dryRun
};

// CLI execution
if (require.main === module) {
    const cli = new JSXRestylingCLI();
    cli.run().catch(error => {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    });
}