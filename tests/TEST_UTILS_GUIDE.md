# Test Utils Guide

This guide explains how to use the comprehensive test utilities to reduce code duplication and follow testing best practices.

## Quick Start

```typescript
import { 
  useTestSuite, 
  apiResponseFactory, 
  spotifyDataFactory,
  renderHookWithProviders,
  createTestCases,
  expectApiResponse
} from '../tests/test-utils';

describe('My Component', () => {
  // Automatic setup/cleanup
  useTestSuite();
  
  it('should work with mock data', () => {
    const track = spotifyDataFactory.track();
    const response = apiResponseFactory.success(track);
    // ... test logic
  });
});
```

## Core Utilities

### 1. Test Suite Setup

**Before (repetitive):**
```typescript
beforeEach(() => {
  vi.clearAllMocks();
  mockAxios.get.mockReset();
  // ... lots of manual cleanup
});
```

**After (clean):**
```typescript
import { useTestSuite } from '../tests/test-utils';

describe('My Test', () => {
  useTestSuite(); // Handles all setup/cleanup automatically
});
```

### 2. Mock Data Factories

**Before (repetitive):**
```typescript
const mockTrack = {
  id: 'track-123',
  name: 'Test Track',
  artists: [{ name: 'Test Artist' }],
  // ... 20+ fields every time
};
```

**After (concise):**
```typescript
import { spotifyDataFactory } from '../tests/test-utils';

const track = spotifyDataFactory.track({ name: 'Custom Name' });
const tracks = Array.from({ length: 5 }, () => spotifyDataFactory.track());
```

### 3. API Response Mocking

**Before (verbose):**
```typescript
mockAxios.get.mockResolvedValue({
  data: mockData,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {}
});
```

**After (clean):**
```typescript
import { mockAxios, apiResponseFactory } from '../tests/test-utils';

mockAxios.get.mockResolvedValue(apiResponseFactory.success(mockData));
mockAxios.post.mockRejectedValue(apiResponseFactory.validationError(['Name required']));
```

## Data Factories

### Spotify Data Factory

```typescript
import { spotifyDataFactory } from '../tests/test-utils';

// Create single track
const track = spotifyDataFactory.track();
const customTrack = spotifyDataFactory.track({ name: 'Custom Track Name' });

// Create playlist with tracks
const playlist = spotifyDataFactory.playlist({ 
  name: 'My Playlist',
  tracks: { total: 10 }
});

// Create user
const user = spotifyDataFactory.user({ display_name: 'John Doe' });
```

### User Data Factory

```typescript
import { userDataFactory } from '../tests/test-utils';

const user = userDataFactory.create();
const adminUser = userDataFactory.create({ role: 'admin' });
const users = userDataFactory.createMany(5); // Creates 5 users
```

### Match Filter Factory

```typescript
import { matchFilterFactory } from '../tests/test-utils';

const simple = matchFilterFactory.simple('artist', 'match');
// Result: "artist:match"

const complex = matchFilterFactory.complex([
  { field: 'artist', operator: 'match' },
  { field: 'title', operator: 'contains', value: 'love' }
]);
// Result: "artist:match AND title:contains(love)"

const similarity = matchFilterFactory.similarity('artist', 0.9);
// Result: "artist:similarity>=0.9"

const { valid, invalid } = matchFilterFactory.validationCases();
```

## Hook Testing

### Basic Hook Testing

**Before:**
```typescript
import { renderHook, act } from '@testing-library/react';

const { result } = renderHook(() => useMyHook());
```

**After:**
```typescript
import { renderHookWithProviders, act } from '../tests/test-utils';

const { result } = renderHookWithProviders(() => useMyHook());
```

### Hook Testing with Providers

```typescript
import { renderHookWithProviders } from '../tests/test-utils';
import { ThemeProvider } from '@mui/material/styles';

const { result } = renderHookWithProviders(
  () => useMyHook(),
  {
    providers: [ThemeProvider],
    setupMocks: () => {
      // Custom mock setup
    },
    cleanupMocks: () => {
      // Custom cleanup
    }
  }
);
```

### Async Hook Operations

```typescript
import { renderHookWithProviders, waitForHookAsync } from '../tests/test-utils';

it('should handle async operations', async () => {
  const { result } = renderHookWithProviders(() => useAsyncHook());
  
  act(() => {
    result.current.loadData();
  });
  
  await waitForHookAsync(100); // Wait for async operation
  
  expect(result.current.data).toBeDefined();
});
```

## API Testing

### Next.js API Route Testing

**Before:**
```typescript
import { createMocks } from 'node-mocks-http';

const { req, res } = createMocks({
  method: 'GET',
  // ... lots of setup
});
```

**After:**
```typescript
import { createMockApiRequestResponse, expectApiResponse } from '../tests/test-utils';

const { req, res } = createMockApiRequestResponse({
  method: 'GET',
  headers: { authorization: 'Bearer token' }
});

await handler(req, res);

expectApiResponse(res, 200, expectedData);
```

### Environment Variable Mocking

```typescript
import { withMockEnv } from '../tests/test-utils';

describe('API with env vars', () => {
  withMockEnv({ API_KEY: 'test-key' }, () => {
    it('should use env vars', async () => {
      // Test logic here - env vars automatically set/reset
    });
  });
});
```

## Data-Driven Testing

### Create Test Cases

**Before (repetitive):**
```typescript
it('should handle case 1', () => { /* test logic */ });
it('should handle case 2', () => { /* test logic */ });
// ... repeated for each case
```

**After (DRY):**
```typescript
import { createTestCases } from '../tests/test-utils';

createTestCases(
  'removeFeaturing function',
  [
    { name: 'should remove feat', input: 'Song feat. Artist', expected: 'Song ' },
    { name: 'should remove parentheses', input: 'Song (Live)', expected: 'Song ' },
    { name: 'should handle empty', input: '', expected: '' }
  ],
  (input, expected) => {
    expect(removeFeaturing(input)).toBe(expected);
  }
);
```

### Edge Cases Testing

```typescript
import { createTestCases, edgeCases } from '../tests/test-utils';

createTestCases(
  'string edge cases',
  edgeCases.strings,
  ({ value }) => {
    expect(() => myFunction(value)).not.toThrow();
  }
);
```

## Performance Testing

### Measure Performance

```typescript
import { measurePerformance, benchmark } from '../tests/test-utils';

it('should perform efficiently', async () => {
  const { result, duration } = await measurePerformance(() => {
    return expensiveOperation();
  });
  
  expect(duration).toBeLessThan(100); // Should complete in under 100ms
  expect(result).toBeDefined();
});

// Or run a full benchmark
await benchmark('expensive operation', () => expensiveOperation(), {
  iterations: 1000,
  maxDuration: 50
});
```

## Error Testing

### Synchronous Errors

```typescript
import { expectToThrow } from '../tests/test-utils';

expectToThrow(
  () => functionThatThrows(),
  ValidationError,
  'Expected error message'
);
```

### Asynchronous Errors

```typescript
import { expectToThrowAsync } from '../tests/test-utils';

await expectToThrowAsync(
  () => asyncFunctionThatThrows(),
  ApiError,
  /Network error/
);
```

## Common Patterns

### API Hook Testing Pattern

```typescript
import { 
  useTestSuite, 
  mockAxios, 
  apiResponseFactory, 
  renderHookWithProviders,
  waitForHookAsync
} from '../tests/test-utils';

describe('useApiHook', () => {
  useTestSuite();

  it('should load data successfully', async () => {
    // Arrange
    const mockData = { id: 1, name: 'Test' };
    mockAxios.get.mockResolvedValue(apiResponseFactory.success(mockData));
    
    // Act
    const { result } = renderHookWithProviders(() => useApiHook());
    
    act(() => {
      result.current.loadData();
    });
    
    await waitForHookAsync();
    
    // Assert
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    // Arrange
    mockAxios.get.mockRejectedValue(apiResponseFactory.error('API Error'));
    
    // Act & Assert
    const { result } = renderHookWithProviders(() => useApiHook());
    
    act(() => {
      result.current.loadData();
    });
    
    await waitForHookAsync();
    
    expect(result.current.error).toBe('API Error');
    expect(result.current.loading).toBe(false);
  });
});
```

### Utility Function Testing Pattern

```typescript
import { createTestCases, edgeCases } from '../tests/test-utils';

describe('utility function', () => {
  createTestCases(
    'normal cases',
    [
      { name: 'should handle case A', input: 'inputA', expected: 'outputA' },
      { name: 'should handle case B', input: 'inputB', expected: 'outputB' }
    ],
    (input, expected) => {
      expect(myUtility(input)).toBe(expected);
    }
  );

  createTestCases(
    'edge cases',
    edgeCases.strings,
    ({ value }) => {
      expect(() => myUtility(value)).not.toThrow();
    }
  );
});
```

## Migration Guide

### From Old Hook Utils

**Before:**
```typescript
import { renderHookWithSetup, mockAxiosInstance } from './hook-test-utils';
```

**After:**
```typescript
import { renderHookWithProviders, mockAxios } from '../tests/test-utils';
```

### From Old API Helpers

**Before:**
```typescript
import { createMockAxiosResponse } from './api-test-helpers';
```

**After:**
```typescript
import { apiResponseFactory } from '../tests/test-utils';

// Old way
createMockAxiosResponse(data, 200)

// New way
apiResponseFactory.success(data)
```

## Best Practices

1. **Always use `useTestSuite()`** for automatic setup/cleanup
2. **Prefer factories over manual mock data** - they're more maintainable
3. **Use data-driven testing** for multiple similar test cases
4. **Test performance** for operations that could be slow
5. **Test edge cases** using the provided edge case generators
6. **Use type-safe patterns** - the utilities are fully typed

## Custom Extensions

You can extend the utilities for your specific needs:

```typescript
// In your test file
import testUtils, { spotifyDataFactory } from '../tests/test-utils';

const customFactory = {
  ...spotifyDataFactory,
  complexPlaylist: (trackCount: number) => ({
    ...spotifyDataFactory.playlist(),
    tracks: {
      total: trackCount,
      items: Array.from({ length: trackCount }, () => 
        spotifyDataFactory.track()
      )
    }
  })
};
```

This approach follows the DRY principle and the "Rule of 3" - if you see a pattern repeated 3 times, extract it into the utilities.