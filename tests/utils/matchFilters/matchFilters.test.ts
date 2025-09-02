import { convertMatchFiltersJsonToUI, convertMatchFiltersUIToJson, validateUIMatchFilterConfig } from '../../../apps/web/src/utils/matchFilters';

// Test data
const testExpressions = [
    'artist:match AND title:contains',
    'artist:similarity>=0.8',
    'artist:match OR title:match',
    'artist:match AND title:contains OR album:similarity>=0.9',
    ''
];

// Run conversion tests
function testConversions() {
    console.log('=== Match Filter Conversion Tests ===\n');

    testExpressions.forEach((expression, index) => {
        console.log(`Test ${index + 1}: "${expression}"`);
        
        // Convert to UI format
        const uiConfig = convertMatchFiltersJsonToUI(expression);
        console.log('UI Config:', JSON.stringify(uiConfig, null, 2));
        
        // Validate UI config
        const validation = validateUIMatchFilterConfig(uiConfig);
        console.log('Validation:', validation);
        
        // Convert back to expression
        const backToExpression = convertMatchFiltersUIToJson(uiConfig);
        console.log('Back to Expression:', backToExpression);
        
        // Check round-trip consistency (allowing for normalization)
        const normalizedOriginal = expression.trim();
        const roundTripMatch = normalizedOriginal === backToExpression || 
                             (normalizedOriginal === '' && backToExpression === '');
        console.log('Round-trip consistent:', roundTripMatch);
        console.log('---\n');
    });
}

// Run the tests if this file is executed directly
if (typeof window === 'undefined') {
    testConversions();
}