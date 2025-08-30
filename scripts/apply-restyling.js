#!/usr/bin/env node

const { JSXRestylerV2 } = require('./jsx-restyler-v2.js');
const path = require('path');

/**
 * Apply JSX restyling to the entire web application
 */
async function applyRestyling() {
    console.log('🎨 Applying JSX restyling to web application...\n');
    
    const restyler = new JSXRestylerV2();
    const webAppPath = path.join(__dirname, '../apps/web/src');
    
    console.log(`Target directory: ${webAppPath}`);
    
    try {
        const result = await restyler.processPath(webAppPath);
        
        console.log('\n📊 Restyling Results:');
        console.log(`✓ Files processed: ${result.processed}`);
        console.log(`✗ Errors: ${result.errors.length}`);
        
        if (result.errors.length > 0) {
            console.log('\nErrors encountered:');
            result.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        if (result.processed > 0) {
            console.log('\n🎉 JSX restyling completed successfully!');
            console.log('💡 Run `git diff` to review changes before committing.');
        } else {
            console.log('\n📋 No files needed reformatting.');
        }
        
        return result;
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

/**
 * Dry run mode - show what would be changed without modifying files
 */
async function dryRun() {
    console.log('🔍 Dry run mode - showing potential changes...\n');
    
    // Override the file writing to just show what would change
    const originalWriteFile = require('fs').writeFileSync;
    const changes = [];
    
    require('fs').writeFileSync = (filePath, content) => {
        changes.push({
            file: filePath,
            content: content
        });
        console.log(`📝 Would modify: ${filePath}`);
    };
    
    try {
        await applyRestyling();
        
        console.log(`\n📊 Dry run complete: ${changes.length} files would be modified`);
        
        if (changes.length > 0) {
            console.log('\nFiles that would be changed:');
            changes.forEach(change => console.log(`  - ${path.basename(change.file)}`));
        }
    } finally {
        // Restore original writeFile
        require('fs').writeFileSync = originalWriteFile;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--dry-run') || args.includes('-n')) {
        dryRun();
    } else if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🎨 JSX Restyling Application Tool

Usage:
  node apply-restyling.js              # Apply restyling to web app
  node apply-restyling.js --dry-run    # Show what would change
  node apply-restyling.js --help       # Show this help

Features:
  ✓ Processes all TSX/JSX files in apps/web/src
  ✓ Formats components with ≤6 props to single line
  ✓ Preserves complex formatting and multi-line objects
  ✓ Safe processing with validation and error handling

Example workflow:
  1. node apply-restyling.js --dry-run   # Preview changes
  2. node apply-restyling.js             # Apply changes
  3. git diff                            # Review changes
  4. git commit -m "Reformat JSX components"
        `);
    } else {
        applyRestyling();
    }
}

module.exports = { applyRestyling, dryRun };