#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files in packages, apps, and web/src
function getAllTsFiles() {
    try {
        const result = execSync(`find /var/tmp/vibe-kanban/worktrees/vk-163c-fix-duplic -name "*.ts" -o -name "*.tsx" | grep -E "(packages|apps|web/src)" | sort`, { encoding: 'utf8' });
        return result.trim().split('\n').filter(f => f);
    } catch (error) {
        return [];
    }
}

// Extract exports from a TypeScript file
function extractExports(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const exports = new Set();
        
        // Regular expressions to match different export patterns
        const exportPatterns = [
            /export\s+(?:const|let|var|function|class|interface|type|enum)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s*\{\s*([^}]+)\s*\}/g,
            /export\s+default\s+(?:(?:const|let|var|function|class)\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g
        ];
        
        exportPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (pattern.source.includes('\\{')) {
                    // Handle export { ... } syntax
                    const exportList = match[1].split(',').map(e => e.trim().split(' as ')[0].trim());
                    exportList.forEach(exp => exports.add(exp));
                } else {
                    exports.add(match[1]);
                }
            }
        });
        
        return Array.from(exports);
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
        return [];
    }
}

// Check if an export is used in any of the files
function isExportUsed(exportName, allFiles, sourceFile) {
    // Create search patterns for the export
    const patterns = [
        `import.*${exportName}.*from`,
        `import.*{.*${exportName}.*}.*from`,
        `\\b${exportName}\\b(?!.*export)` // Use the export name but not in export context
    ];
    
    for (const file of allFiles) {
        if (file === sourceFile) continue; // Skip the source file
        
        try {
            const content = fs.readFileSync(file, 'utf8');
            
            for (const pattern of patterns) {
                const regex = new RegExp(pattern, 'g');
                if (regex.test(content)) {
                    return true;
                }
            }
        } catch (error) {
            // Skip files that can't be read
            continue;
        }
    }
    
    return false;
}

// Main analysis function
function analyzeUnusedExports() {
    const allFiles = getAllTsFiles();
    const unusedExports = [];
    
    console.log(`Analyzing ${allFiles.length} TypeScript files...`);
    
    for (const file of allFiles) {
        const exports = extractExports(file);
        
        for (const exportName of exports) {
            if (!isExportUsed(exportName, allFiles, file)) {
                unusedExports.push({
                    file: file,
                    export: exportName,
                    package: file.includes('/packages/') ? 
                        file.split('/packages/')[1].split('/')[0] : 
                        (file.includes('/apps/') ? file.split('/apps/')[1].split('/')[0] : 'other')
                });
            }
        }
    }
    
    return unusedExports;
}

// Generate report
function generateReport(unusedExports) {
    console.log('\n=== UNUSED EXPORTS ANALYSIS REPORT ===\n');
    
    if (unusedExports.length === 0) {
        console.log('No unused exports found!');
        return;
    }
    
    const byPackage = unusedExports.reduce((acc, item) => {
        if (!acc[item.package]) {
            acc[item.package] = [];
        }
        acc[item.package].push(item);
        return acc;
    }, {});
    
    for (const [packageName, items] of Object.entries(byPackage)) {
        console.log(`## ${packageName.toUpperCase()}`);
        console.log(`Found ${items.length} unused exports:\n`);
        
        items.forEach(item => {
            console.log(`- **${item.export}**`);
            console.log(`  - File: ${item.file}`);
            console.log(`  - Reason: No imports found across the entire codebase\n`);
        });
        
        console.log('---\n');
    }
    
    console.log(`**SUMMARY**: ${unusedExports.length} total unused exports found across ${Object.keys(byPackage).length} packages/modules.`);
}

// Run the analysis
const unusedExports = analyzeUnusedExports();
generateReport(unusedExports);