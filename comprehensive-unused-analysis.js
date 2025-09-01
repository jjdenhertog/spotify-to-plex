#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Get all TypeScript files
function getAllTsFiles() {
    try {
        const result = execSync(`find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | sort`, { encoding: 'utf8' });
        return result.trim().split('\n').filter(f => f && !f.includes('analyze') && !f.includes('test'));
    } catch (error) {
        return [];
    }
}

// Get package files only
function getPackageTsFiles() {
    return getAllTsFiles().filter(f => f.startsWith('packages/'));
}

// Extract exports comprehensively
function extractExports(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const exports = new Set();
        
        // More comprehensive export patterns
        const patterns = [
            /export\s+(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s+type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s+enum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s+default\s+(?:(?:const|let|var|function|class)\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            /export\s*=\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        ];
        
        // Handle export { ... } syntax
        const exportListPattern = /export\s*\{\s*([^}]+)\s*\}/g;
        let match;
        while ((match = exportListPattern.exec(content)) !== null) {
            const exportList = match[1]
                .split(',')
                .map(e => e.trim().split(' as ')[0].trim())
                .filter(e => e && e !== 'default');
            exportList.forEach(exp => exports.add(exp));
        }
        
        // Handle regular exports
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1] && match[1] !== 'default') {
                    exports.add(match[1]);
                }
            }
        });
        
        return Array.from(exports);
    } catch (error) {
        return [];
    }
}

// Check if export is used with improved search
function isExportUsed(exportName, allFiles, sourceFile, packageName) {
    const escapedName = exportName.replace(/\$/g, '\\$');
    
    for (const file of allFiles) {
        if (file === sourceFile) continue;
        
        try {
            const content = fs.readFileSync(file, 'utf8');
            
            // Check various import patterns
            const importPatterns = [
                new RegExp(`import.*${escapedName}.*from`, 'g'),
                new RegExp(`import\\s*{[^}]*${escapedName}[^}]*}\\s*from`, 'g'),
                new RegExp(`import\\s+type\\s*{[^}]*${escapedName}[^}]*}\\s*from`, 'g'),
                new RegExp(`@spotify-to-plex/${packageName}[^'"]*/[^'"]*.${escapedName}`, 'g'),
            ];
            
            // Also check for direct usage (not in export context)
            const usagePattern = new RegExp(`(?<!export\\s+(?:type|interface)\\s+[^{]*?)\\b${escapedName}\\b(?![\\s]*[=:])`, 'g');
            
            for (const pattern of [...importPatterns, usagePattern]) {
                if (pattern.test(content)) {
                    return true;
                }
            }
        } catch (error) {
            continue;
        }
    }
    
    return false;
}

// Find files with no exports (potentially unused files)
function findFilesWithNoExports(packageFiles) {
    return packageFiles.filter(file => {
        const exports = extractExports(file);
        return exports.length === 0;
    });
}

// Find duplicate type definitions
function findDuplicateTypes(allFiles) {
    const typeMap = new Map();
    const duplicates = [];
    
    allFiles.forEach(file => {
        const exports = extractExports(file);
        exports.forEach(exportName => {
            if (!typeMap.has(exportName)) {
                typeMap.set(exportName, []);
            }
            typeMap.set(exportName, [...typeMap.get(exportName), file]);
        });
    });
    
    typeMap.forEach((files, typeName) => {
        if (files.length > 1) {
            duplicates.push({ type: typeName, files });
        }
    });
    
    return duplicates;
}

// Get package name from file path
function getPackageName(filePath) {
    const match = filePath.match(/packages\/([^\/]+)/);
    return match ? match[1] : 'unknown';
}

// Main comprehensive analysis
function runComprehensiveAnalysis() {
    const allFiles = getAllTsFiles();
    const packageFiles = getPackageTsFiles();
    
    console.log('🔍 COMPREHENSIVE UNUSED CODE ANALYSIS');
    console.log('=====================================');
    console.log(`📁 Total files analyzed: ${allFiles.length}`);
    console.log(`📦 Package files: ${packageFiles.length}`);
    console.log('');
    
    // 1. Find unused exports
    console.log('1. UNUSED EXPORTS ANALYSIS');
    console.log('---------------------------');
    
    const unusedExports = [];
    const packageGroups = packageFiles.reduce((acc, file) => {
        const pkg = getPackageName(file);
        if (!acc[pkg]) acc[pkg] = [];
        acc[pkg].push(file);
        return acc;
    }, {});
    
    for (const [packageName, files] of Object.entries(packageGroups)) {
        for (const file of files) {
            const exports = extractExports(file);
            for (const exportName of exports) {
                if (!isExportUsed(exportName, allFiles, file, packageName)) {
                    unusedExports.push({
                        file,
                        export: exportName,
                        package: packageName,
                        fullPackageName: `@spotify-to-plex/${packageName}`
                    });
                }
            }
        }
    }
    
    if (unusedExports.length === 0) {
        console.log('✅ No unused exports found!');
    } else {
        const byPackage = unusedExports.reduce((acc, item) => {
            if (!acc[item.fullPackageName]) acc[item.fullPackageName] = [];
            acc[item.fullPackageName].push(item);
            return acc;
        }, {});
        
        Object.entries(byPackage).forEach(([packageName, items]) => {
            console.log(`\n📦 ${packageName} (${items.length} unused):`);
            items.forEach(item => {
                console.log(`  ❌ ${item.export} (${item.file})`);
            });
        });
    }
    
    // 2. Find files with no exports
    console.log('\n\n2. FILES WITH NO EXPORTS (POTENTIALLY UNUSED)');
    console.log('----------------------------------------------');
    
    const noExportFiles = findFilesWithNoExports(packageFiles);
    if (noExportFiles.length === 0) {
        console.log('✅ All package files have exports');
    } else {
        console.log(`Found ${noExportFiles.length} files with no exports:`);
        noExportFiles.forEach(file => {
            const pkg = getPackageName(file);
            console.log(`  ⚠️  ${file} (@spotify-to-plex/${pkg})`);
        });
    }
    
    // 3. Find duplicate type definitions
    console.log('\n\n3. DUPLICATE TYPE DEFINITIONS');
    console.log('------------------------------');
    
    const duplicates = findDuplicateTypes(allFiles);
    if (duplicates.length === 0) {
        console.log('✅ No duplicate type definitions found');
    } else {
        console.log(`Found ${duplicates.length} duplicate types:`);
        duplicates.forEach(({ type, files }) => {
            console.log(`\n🔄 ${type} (${files.length} definitions):`);
            files.forEach(file => {
                const isPackage = file.startsWith('packages/');
                const location = isPackage ? `@spotify-to-plex/${getPackageName(file)}` : file;
                console.log(`  📍 ${location}: ${file}`);
            });
        });
    }
    
    // 4. Summary and recommendations
    console.log('\n\n4. SUMMARY & RECOMMENDATIONS');
    console.log('=============================');
    
    console.log(`📊 Results:`);
    console.log(`  - Unused exports: ${unusedExports.length}`);
    console.log(`  - Files with no exports: ${noExportFiles.length}`);
    console.log(`  - Duplicate type definitions: ${duplicates.length}`);
    
    if (unusedExports.length > 0 || noExportFiles.length > 0) {
        console.log('\n💡 Recommendations:');
        if (unusedExports.length > 0) {
            console.log('  • Remove unused exports to reduce bundle size');
        }
        if (noExportFiles.length > 0) {
            console.log('  • Review files with no exports - they might be unused');
        }
        if (duplicates.length > 0) {
            console.log('  • Consider consolidating duplicate type definitions');
        }
    }
    
    return {
        unusedExports,
        noExportFiles,
        duplicates,
        totalFiles: allFiles.length,
        packageFiles: packageFiles.length
    };
}

// Run analysis
const results = runComprehensiveAnalysis();

// Export results for potential further processing
module.exports = results;