#!/usr/bin/env node

const { JSXRestylerV2 } = require('./jsx-restyler-v2.js');
const fs = require('fs');

/**
 * Test the restyler against real components from the project
 */
async function testRealComponents() {
    console.log('🔍 Testing JSX Restyler V2 against real components...\n');
    
    const restyler = new JSXRestylerV2();
    
    // Test cases from real components
    const testCases = [
        {
            name: 'BSnackbarProvider - Should format to single line',
            input: `        <SnackbarProvider
            autoHideDuration={3000}
            transitionDuration={300}
            dense
            variant="success"
            style={{ fontWeight: 400, fontFamily: theme.typography.fontFamily }}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            {...props}
        />`,
            expectChange: true
        },
        
        {
            name: 'Logo Box - Simple props should format to single line',
            input: `                <Box 
                    display="flex" 
                    gap={.2} 
                    pb={1} 
                    alignItems="center" 
                    justifyContent="center" 
                    maxWidth={400} 
                    margin="0 auto"
                >`,
            expectChange: false // Too many props (>6)
        },
        
        {
            name: 'Typography - Should format to single line',
            input: `                <Typography 
                    sx={{ mb: 2 }} 
                    variant="body2"
                >Spotify to Plex</Typography>`,
            expectChange: true
        },
        
        {
            name: 'CircularProgress - Simple self-closing',
            input: `                    <CircularProgress 
                        size={20} 
                    />`,
            expectChange: true
        },
        
        {
            name: 'Complex sx object - Should preserve formatting',
            input: `        <Paper 
            elevation={0} 
            sx={{ 
                p: 1, 
                mb: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: 1, 
                bgcolor: 'action.hover' 
            }}
        >`,
            expectChange: false // Complex sx should be preserved
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log(`\n📝 Testing: ${testCase.name}`);
        console.log(`Input:`);
        console.log(testCase.input);
        
        const result = restyler.reformatJSX(testCase.input);
        const changed = result !== testCase.input;
        
        console.log(`\nOutput:`);
        console.log(result);
        console.log(`Changed: ${changed}, Expected change: ${testCase.expectChange}`);
        
        if (changed === testCase.expectChange) {
            console.log('✅ PASS');
            passed++;
        } else {
            console.log('❌ FAIL');
            failed++;
        }
        
        console.log('-'.repeat(50));
    }
    
    console.log(`\n📊 Final Results: ${passed} passed, ${failed} failed`);
    return failed === 0;
}

// Test on a sample component file
async function testActualFile() {
    console.log('\n🧪 Testing on actual component file...');
    
    const sampleFilePath = '/var/tmp/vibe-kanban/worktrees/vk-4ecf-jsx-restyl/apps/web/src/components/BMoment.tsx';
    
    if (!fs.existsSync(sampleFilePath)) {
        console.log('Sample file not found, skipping file test');
        return true;
    }
    
    // Create a backup
    const content = fs.readFileSync(sampleFilePath, 'utf8');
    const backupPath = `${sampleFilePath}.backup`;
    fs.writeFileSync(backupPath, content, 'utf8');
    
    try {
        const restyler = new JSXRestylerV2();
        const result = restyler.reformatJSX(content);
        
        console.log('Original vs Reformatted:');
        console.log('ORIGINAL:');
        console.log(content.substring(0, 500) + '...');
        console.log('\nREFORMATTED:');
        console.log(result.substring(0, 500) + '...');
        
        // Check if valid JSX
        if (restyler.isValidJSX(result)) {
            console.log('✅ Output is valid JSX');
            return true;
        } else {
            console.log('❌ Output is invalid JSX');
            return false;
        }
    } finally {
        // Restore from backup
        fs.writeFileSync(sampleFilePath, content, 'utf8');
        fs.unlinkSync(backupPath);
    }
}

// Run tests
async function runAllTests() {
    const test1 = await testRealComponents();
    const test2 = await testActualFile();
    
    if (test1 && test2) {
        console.log('\n🎉 All tests passed! JSX Restyler V2 is ready for use.');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed. Review implementation.');
        process.exit(1);
    }
}

if (require.main === module) {
    runAllTests();
}

module.exports = { testRealComponents, testActualFile };