# Test Utilities

This directory contains comprehensive test utilities designed to reduce code duplication and improve test maintainability across the entire test suite.

## Quick Start

```typescript
// Import utilities
import { 
  useTestSuite, 
  spotifyDataFactory, 
  apiResponseFactory,
  renderHookWithProviders 
} from '@test-utils';

// Or with relative path
import { useTestSuite } from '../tests/test-utils';

describe('My Test Suite', () => {
  useTestSuite(); // Automatic setup/cleanup
  
  it('should work with mock data', () => {
    const track = spotifyDataFactory.track();
    const response = apiResponseFactory.success(track);
    // ... test logic
  });
});
```

## Files

- **`test-utils.ts`** - Main utilities file with all factories and helpers
- **`TEST_UTILS_GUIDE.md`** - Comprehensive usage guide with examples  
- **`examples/`** - Example refactored tests showing before/after patterns
- **`README.md`** - This file

## Key Features

### 🏭 **Data Factories**
- `spotifyDataFactory` - Generate Spotify tracks, playlists, users
- `plexDataFactory` - Generate Plex servers, tracks, libraries
- `userDataFactory` - Generate user accounts and profiles
- `matchFilterFactory` - Generate match filter expressions
- `apiResponseFactory` - Generate API responses and errors

### 🧪 **Testing Utilities**
- `useTestSuite()` - Automatic test setup and cleanup
- `renderHookWithProviders()` - Enhanced hook testing with providers
- `createTestCases()` - Data-driven test case generation
- `measurePerformance()` - Performance testing utilities
- `expectToThrow()` / `expectToThrowAsync()` - Error testing helpers

### 🎭 **Mock Utilities**
- `mockAxios` - Pre-configured axios mock with all HTTP methods
- `mockNotifications` - Notification system mocks (notistack)
- `mockNextRouter` - Complete Next.js router mock
- Global mocks for window objects (ResizeObserver, IntersectionObserver, etc.)

### 🎯 **API Testing**
- `createMockApiRequestResponse()` - Next.js API route testing
- `expectApiResponse()` - API response validation
- `withMockEnv()` - Environment variable mocking

## Benefits

### ❌ Before (Old Pattern)
```typescript
// Lots of manual setup in every test file
beforeEach(() => {
  vi.clearAllMocks();
  mockAxios.get.mockReset();
  // ... 20+ lines of setup
});

// Manual mock data creation every time
const mockTrack = {
  id: 'track-123',
  name: 'Test Track',
  artists: [{ name: 'Test Artist' }],
  // ... 30+ fields repeated in every test
};
```

### ✅ After (New Pattern) 
```typescript
// One line handles all setup
useTestSuite();

// Factory creates consistent, valid data
const track = spotifyDataFactory.track({ name: 'Custom Name' });
```

## Usage Patterns

### Hook Testing
```typescript
import { useTestSuite, renderHookWithProviders, mockAxios, apiResponseFactory } from '@test-utils';

describe('useApiHook', () => {
  useTestSuite();

  it('should load data', async () => {
    mockAxios.get.mockResolvedValue(apiResponseFactory.success(mockData));
    
    const { result } = renderHookWithProviders(() => useApiHook());
    // ... test logic
  });
});
```

### Utility Testing
```typescript
import { createTestCases, edgeCases } from '@test-utils';

createTestCases(
  'utility function tests',
  [
    { name: 'case 1', input: 'input1', expected: 'output1' },
    { name: 'case 2', input: 'input2', expected: 'output2' }
  ],
  (input, expected) => {
    expect(myUtility(input)).toBe(expected);
  }
);
```

### API Route Testing
```typescript
import { createMockApiRequestResponse, expectApiResponse } from '@test-utils';

it('should handle API request', async () => {
  const { req, res } = createMockApiRequestResponse({
    method: 'POST',
    body: { data: 'test' }
  });

  await handler(req, res);
  
  expectApiResponse(res, 200, expectedData);
});
```

## Migration Guide

Replace old imports with new ones:

```typescript
// Old
import { renderHookWithSetup } from './hook-test-utils';
import { createMockAxiosResponse } from './api-test-helpers';

// New  
import { renderHookWithProviders, apiResponseFactory } from '@test-utils';
```

## Best Practices

1. **Always use `useTestSuite()`** for setup/cleanup
2. **Prefer factories over manual data** creation
3. **Use data-driven testing** for similar test cases  
4. **Test edge cases** using provided edge case generators
5. **Measure performance** for operations that could be slow

## Contributing

When adding new utilities:

1. Follow the existing patterns and naming conventions
2. Add comprehensive JSDoc documentation  
3. Include usage examples in the guide
4. Ensure type safety with proper TypeScript types
5. Follow the "Rule of 3" - extract patterns used in 3+ places

---

**Rule of 3**: If you see a testing pattern repeated 3 times across different test files, extract it into these utilities!