#!/usr/bin/env node

const { JSXRestylerV2 } = require('./jsx-restyler-v2.js');
const path = require('path');
const fs = require('fs');

/**
 * Generate summary of JSX restyling opportunities
 */
async function generateSummary() {
    console.log('📊 JSX Restyling Analysis Summary\n');
    
    const webAppPath = path.join(__dirname, '../apps/web/src');
    const restyler = new JSXRestylerV2();
    
    let totalFiles = 0;
    let filesNeedingReformat = 0;
    let componentsAnalyzed = 0;
    let componentDetails = [];

    async function analyzeDirectory(dirPath) {
        const entries = fs.readdirSync(dirPath);
        
        for (const entry of entries) {
            if (entry.startsWith('.') || entry === 'node_modules') continue;
            
            const entryPath = path.join(dirPath, entry);
            const stats = fs.statSync(entryPath);
            
            if (stats.isDirectory()) {
                await analyzeDirectory(entryPath);
            } else if (restyler.isTSXFile(entryPath)) {
                totalFiles++;
                await analyzeFile(entryPath);
            }
        }
    }

    async function analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const reformatted = restyler.reformatJSX(content);
            
            if (content !== reformatted) {
                filesNeedingReformat++;
                
                // Count components in file
                const componentCount = (content.match(/<[A-Z]/g) || []).length;
                componentsAnalyzed += componentCount;
                
                componentDetails.push({
                    file: path.relative(webAppPath, filePath),
                    components: componentCount,
                    hasChanges: true
                });
                
                console.log(`📝 ${path.relative(webAppPath, filePath)} - ${componentCount} components can be reformatted`);
            } else {
                const componentCount = (content.match(/<[A-Z]/g) || []).length;
                componentsAnalyzed += componentCount;
                
                componentDetails.push({
                    file: path.relative(webAppPath, filePath),
                    components: componentCount,
                    hasChanges: false
                });
            }
        } catch (error) {
            console.error(`❌ Error analyzing ${filePath}: ${error.message}`);
        }
    }

    await analyzeDirectory(webAppPath);

    // Generate summary
    console.log('\n📋 Analysis Complete:\n');
    console.log(`📁 Total TSX/JSX files: ${totalFiles}`);
    console.log(`🎯 Files needing reformat: ${filesNeedingReformat}`);
    console.log(`🧩 Total components analyzed: ${componentsAnalyzed}`);
    console.log(`📈 Potential improvement: ${((filesNeedingReformat / totalFiles) * 100).toFixed(1)}% of files`);

    console.log('\n📂 File Details:');
    componentDetails.forEach(detail => {
        const status = detail.hasChanges ? '🎨' : '✅';
        console.log(`  ${status} ${detail.file} (${detail.components} components)`);
    });

    console.log('\n🚀 Next Steps:');
    console.log('1. Review the analysis above');
    console.log('2. Run: node apply-restyling.js --dry-run  # Preview changes');
    console.log('3. Run: node apply-restyling.js           # Apply changes');
    console.log('4. Review: git diff                       # Check results');
    console.log('5. Commit: git commit -m "Reformat JSX"   # Save changes');

    return {
        totalFiles,
        filesNeedingReformat,
        componentsAnalyzed,
        improvementPercentage: (filesNeedingReformat / totalFiles) * 100
    };
}

if (require.main === module) {
    generateSummary().catch(error => {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = { generateSummary };