#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files in the entire codebase
function getAllTsFiles() {
    try {
        const result = execSync(`find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | sort`, { encoding: 'utf8' });
        return result.trim().split('\n').filter(f => f && f !== './analyze-unused-exports.js' && f !== './analyze-packages-exports.js');
    } catch (error) {
        return [];
    }
}

// Get only package TypeScript files
function getPackageTsFiles() {
    try {
        const result = execSync(`find packages -name "*.ts" | grep -v node_modules | grep -v dist | sort`, { encoding: 'utf8' });
        return result.trim().split('\n').filter(f => f);
    } catch (error) {
        return [];
    }
}

// Extract exports from a TypeScript file with more comprehensive patterns
function extractExports(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const exports = new Set();
        
        // Match different export patterns
        const patterns = [
            // export const/let/var name = 
            { regex: /export\s+(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export function name
            { regex: /export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export class name
            { regex: /export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export interface name
            { regex: /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export type name
            { regex: /export\s+type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export enum name
            { regex: /export\s+enum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export default
            { regex: /export\s+default\s+(?:(?:const|let|var|function|class)\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export = name
            { regex: /export\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g, group: 1 },
            // export { name1, name2, ... }
            { regex: /export\s*\{\s*([^}]+)\s*\}/g, group: 1, isMultiple: true }
        ];
        
        patterns.forEach(({ regex, group, isMultiple }) => {
            let match;
            while ((match = regex.exec(content)) !== null) {
                if (isMultiple) {
                    // Handle export { ... } syntax
                    const exportList = match[group]
                        .split(',')
                        .map(e => e.trim().split(' as ')[0].trim())
                        .filter(e => e && e !== 'default');
                    exportList.forEach(exp => exports.add(exp));
                } else if (match[group] && match[group] !== 'default') {
                    exports.add(match[group]);
                }
            }
        });
        
        return Array.from(exports);
    } catch (error) {
        console.error(`Error reading file ${filePath}: ${error.message}`);
        return [];
    }
}

// Check if an export is used anywhere in the codebase
function isExportUsed(exportName, allFiles, sourceFile, packageName) {
    const searchPatterns = [
        // Direct import
        `import.*${exportName}.*from`,
        // Named import
        `import\\s*{[^}]*${exportName}[^}]*}\\s*from`,
        // Type import
        `import\\s+type\\s*{[^}]*${exportName}[^}]*}\\s*from`,
        // Usage in code (not in export or interface context)
        `(?<!export\\s+(?:type|interface)\\s+[^{]*?)\\b${exportName}\\b(?!\\s*[=:])`
    ];
    
    for (const file of allFiles) {
        if (file === sourceFile) continue;
        
        try {
            const content = fs.readFileSync(file, 'utf8');
            
            // Special check for package imports using the no-barrel-files pattern
            const packageImportPattern = new RegExp(`@spotify-to-plex/${packageName}[^'"]*.*/[^'"]*.${exportName}`, 'g');
            if (packageImportPattern.test(content)) {
                return true;
            }
            
            for (const pattern of searchPatterns) {
                const regex = new RegExp(pattern, 'gm');
                if (regex.test(content)) {
                    return true;
                }
            }
        } catch (error) {
            continue;
        }
    }
    
    return false;
}

// Get package name from file path
function getPackageName(filePath) {
    const match = filePath.match(/packages\/([^\/]+)/);
    return match ? match[1] : 'unknown';
}

// Main analysis function focused on packages
function analyzePackageExports() {
    const allFiles = getAllTsFiles();
    const packageFiles = getPackageTsFiles();
    const unusedExports = [];
    
    console.log(`Analyzing ${packageFiles.length} package files against ${allFiles.length} total files...`);
    
    // Group files by package
    const packageGroups = packageFiles.reduce((acc, file) => {
        const pkg = getPackageName(file);
        if (!acc[pkg]) acc[pkg] = [];
        acc[pkg].push(file);
        return acc;
    }, {});
    
    // Analyze each package
    for (const [packageName, files] of Object.entries(packageGroups)) {
        console.log(`\nAnalyzing package: ${packageName}`);
        
        for (const file of files) {
            const exports = extractExports(file);
            console.log(`  ${file}: Found ${exports.length} exports`);
            
            for (const exportName of exports) {
                if (!isExportUsed(exportName, allFiles, file, packageName)) {
                    unusedExports.push({
                        file: file,
                        export: exportName,
                        package: packageName,
                        fullPackageName: `@spotify-to-plex/${packageName}`
                    });
                }
            }
        }
    }
    
    return unusedExports;
}

// Generate detailed report
function generateDetailedReport(unusedExports) {
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED UNUSED EXPORTS ANALYSIS REPORT');
    console.log('='.repeat(80) + '\n');
    
    if (unusedExports.length === 0) {
        console.log('✅ No unused exports found in packages!');
        return;
    }
    
    const byPackage = unusedExports.reduce((acc, item) => {
        if (!acc[item.fullPackageName]) {
            acc[item.fullPackageName] = [];
        }
        acc[item.fullPackageName].push(item);
        return acc;
    }, {});
    
    for (const [packageName, items] of Object.entries(byPackage)) {
        console.log(`## ${packageName}`);
        console.log(`Found ${items.length} unused exports:\n`);
        
        items.forEach((item, index) => {
            console.log(`${index + 1}. **${item.export}**`);
            console.log(`   - File: ${item.file}`);
            console.log(`   - Package: ${item.fullPackageName}`);
            console.log(`   - Reason: No imports found across the entire codebase`);
            console.log(`   - Expected import pattern: import { ${item.export} } from '${item.fullPackageName}/src/...'`);
            console.log('');
        });
        
        console.log('-'.repeat(80) + '\n');
    }
    
    console.log(`📊 SUMMARY`);
    console.log(`- Total unused exports: ${unusedExports.length}`);
    console.log(`- Packages affected: ${Object.keys(byPackage).length}`);
    console.log(`- Packages analyzed: @spotify-to-plex/shared-types, shared-utils, plex-helpers, http-client, and others`);
}

// Run the analysis
console.log('Starting comprehensive package export analysis...');
const unusedExports = analyzePackageExports();
generateDetailedReport(unusedExports);