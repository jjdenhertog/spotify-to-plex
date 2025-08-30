#!/usr/bin/env node

const { JSXRestyler } = require('./jsx-restyler.js');

/**
 * Test cases for JSX Restyler
 */
function runTests() {
    console.log('🧪 Running JSX Restyler Tests...\n');
    
    const restyler = new JSXRestyler();
    let passed = 0;
    let failed = 0;

    function test(name, input, expected) {
        const result = restyler.reformatJSX(input);
        if (result.trim() === expected.trim()) {
            console.log(`✓ ${name}`);
            passed++;
        } else {
            console.log(`✗ ${name}`);
            console.log(`  Expected: ${expected.trim()}`);
            console.log(`  Got:      ${result.trim()}`);
            failed++;
        }
    }

    // Test 1: Simple component with few props
    test('Simple Box with 3 props', 
        `    <Box display="flex" gap={1} sx={{ mb: 2 }}>
        Content
    </Box>`,
        `    <Box display="flex" gap={1} sx={{ mb: 2 }}>Content</Box>`
    );

    // Test 2: Self-closing component with few props  
    test('Self-closing component',
        `    <CircularProgress 
        size={20} 
        color="primary" 
    />`,
        `    <CircularProgress size={20} color="primary" />`
    );

    // Test 3: Component with many props (should stay multi-line)
    test('Component with many props',
        `    <TextField
        id="name"
        label="Name"
        value={value}
        onChange={onChange}
        variant="outlined"
        fullWidth
        required
        error={hasError}
        helperText={errorText}
    />`,
        `    <TextField
        id="name"
        label="Name"
        value={value}
        onChange={onChange}
        variant="outlined"
        fullWidth
        required
        error={hasError}
        helperText={errorText}
    />`
    );

    // Test 4: Component with children
    test('Typography with children',
        `    <Typography 
        variant="h6" 
        color="primary"
    >
        Hello World
    </Typography>`,
        `    <Typography variant="h6" color="primary">Hello World</Typography>`
    );

    // Test 5: Complex sx object (should preserve structure)
    test('Complex sx object',
        `    <Paper
        elevation={2}
        sx={{
            p: 2,
            mb: 1,
            display: 'flex',
            alignItems: 'center'
        }}
    >`,
        `    <Paper
        elevation={2}
        sx={{
            p: 2,
            mb: 1,
            display: 'flex',
            alignItems: 'center'
        }}
    >`
    );

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed!');
        return true;
    } else {
        console.log('❌ Some tests failed');
        return false;
    }
}

// Run tests if called directly
if (require.main === module) {
    const success = runTests();
    process.exit(success ? 0 : 1);
}

module.exports = { runTests };