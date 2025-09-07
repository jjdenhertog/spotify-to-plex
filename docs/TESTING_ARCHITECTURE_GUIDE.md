# Testing Architecture Guide - Vibe Kanban

## Executive Summary

This document outlines the comprehensive testing strategy implemented in the Vibe Kanban project. The testing architecture employs Vitest as the primary testing framework with a sophisticated multi-environment setup optimized for a TypeScript monorepo containing React/Next.js frontend applications, Node.js backend services, and shared utility packages.

## Testing Stack Overview

### Core Technologies
- **Test Runner**: Vitest 3.2.4 (ES module native, Vite-powered)
- **React Testing**: Testing Library React 16.3.0 (user-centric testing)
- **E2E Testing**: Playwright 1.55.0 (cross-browser automation)
- **Mocking**: MSW 2.11.1 (service worker based API mocking)
- **Coverage**: V8 Provider (native Node.js coverage)
- **Assertions**: Vitest built-in + Jest-DOM matchers

### Architecture Decisions

#### Why Vitest Over Jest
- **Native ES Modules**: First-class support for modern JavaScript without transpilation
- **Performance**: 2-3x faster than Jest due to Vite's transformation pipeline
- **TypeScript**: Zero-config TypeScript support with proper type checking
- **Watch Mode**: Intelligent test re-running based on actual dependencies
- **Configuration**: Unified configuration with Vite ecosystem

#### Testing Philosophy
- **User-Centric**: Tests focus on user behavior, not implementation details
- **Isolation**: Each test runs in complete isolation with fresh mocks
- **Performance**: Parallel execution with thread pooling
- **Coverage**: Enforced 80% threshold across all metrics

## Project Structure

### Test Organization

```
/
├── vitest.config.ts                 # Main Vitest configuration
├── tests/
│   ├── setup/
│   │   ├── vitest.setup.ts         # Global test setup
│   │   └── test-utils.tsx          # Shared test utilities
│   └── e2e/                        # Playwright E2E tests
├── apps/
│   └── web/
│       └── __tests__/
│           ├── components/         # Component unit tests
│           ├── hooks/              # Custom hook tests
│           ├── api/                # API route tests
│           ├── pages/              # Page integration tests
│           └── test-utils/         # App-specific utilities
└── packages/
    └── [package-name]/
        └── src/__tests__/          # Package-specific tests
```

### Configuration Hierarchy

1. **Root Configuration** (`vitest.config.ts`)
   - Defines global defaults
   - Sets up multi-project workspace
   - Configures coverage settings
   - Establishes path aliases

2. **Project-Specific Configuration**
   - Web app: JSdom environment for React
   - Packages: Node environment for pure logic
   - Individual setup files per workspace

3. **Setup Files**
   - Global: Browser API polyfills, React configuration
   - App-specific: Enhanced mocking, provider setup
   - Package-specific: Minimal Node.js requirements

## Test Categories and Patterns

### 1. Component Tests (`apps/web/__tests__/components/`)

Tests for React components focus on user interactions, accessibility, and visual states.

#### Pattern Example: ErrorProvider Tests

```typescript
describe('ErrorProvider', () => {
  it('should display error message via context', async () => {
    // Arrange: Component with error context consumer
    const TestComponent = () => {
      const { showError } = useError();
      return <button onClick={() => showError('Test error')}>Trigger</button>;
    };

    // Act: User interaction
    render(
      <ErrorProvider>
        <TestComponent />
      </ErrorProvider>
    );
    
    await userEvent.click(screen.getByRole('button'));

    // Assert: Error displayed
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```

**Key Testing Aspects:**
- Context API integration
- Snackbar display logic
- Error message queuing
- Auto-dismiss timing
- Component cleanup

**Failure Conditions:**
- Context not provided → Provider missing error
- Snackbar library failure → Display errors
- Message queuing issues → Lost error messages
- Memory leaks → Cleanup not performed

#### Pattern Example: MatchFilterEditor Tests

```typescript
describe('MatchFilterEditor', () => {
  it('should handle mode switching between JSON and visual', async () => {
    // Setup: Complex dual-mode editor
    const onChange = vi.fn();
    render(
      <MatchFilterEditor
        value={mockFilter}
        onChange={onChange}
        mode="visual"
      />
    );

    // Interaction: Toggle between modes
    await userEvent.click(screen.getByRole('tab', { name: /JSON/ }));

    // Validation: Mode change and data preservation
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'json' })
    );
  });
});
```

**Key Testing Aspects:**
- Dual-mode editing (visual/JSON)
- Data synchronization between modes
- Monaco Editor integration
- Validation logic
- Performance with large configs

**Failure Conditions:**
- Mode sync issues → Data loss on switch
- Monaco initialization → Editor not loading
- Validation errors → Invalid configs accepted
- Memory issues → Large config handling

### 2. Hook Tests (`apps/web/__tests__/hooks/`)

Custom React hooks tested in isolation using renderHook.

#### Pattern Example: useDualModeEditor Tests

```typescript
describe('useDualModeEditor', () => {
  it('should synchronize JSON and visual modes', () => {
    // Setup: Hook with initial state
    const { result } = renderHook(() => 
      useDualModeEditor({
        initialMode: 'visual',
        initialValue: mockConfig
      })
    );

    // Mutation: Update in visual mode
    act(() => {
      result.current.updateVisual({ field: 'newValue' });
    });

    // Verification: JSON reflects change
    expect(result.current.jsonValue).toContain('"field":"newValue"');
  });
});
```

**Key Testing Aspects:**
- State synchronization
- Mode transition logic
- Validation during updates
- Error recovery
- Performance optimization

**Failure Conditions:**
- Desync between modes → Data inconsistency
- Invalid JSON parsing → Mode switch failure
- Validation bypass → Invalid states
- Infinite update loops → Performance issues

### 3. API Tests (`apps/web/__tests__/api/`)

Next.js API route testing with mocked HTTP layers.

#### Pattern Example: API Helper Tests

```typescript
describe('API Routes', () => {
  it('should handle authentication correctly', async () => {
    // Mock: External service
    const mockAxios = vi.mocked(axios);
    mockAxios.post.mockResolvedValue({
      data: { token: 'valid-token' }
    });

    // Execute: API call
    const response = await request(handler)
      .post('/api/auth')
      .send({ username: 'test', password: 'pass' });

    // Verify: Proper handling
    expect(response.status).toBe(200);
    expect(response.body.token).toBe('valid-token');
  });
});
```

**Key Testing Aspects:**
- Request/response handling
- Authentication flows
- Error status codes
- Rate limiting
- Data transformation

**Failure Conditions:**
- Network timeouts → 500 errors
- Invalid auth → 401/403 responses
- Malformed requests → 400 errors
- Service unavailable → 503 responses

### 4. Page Tests (`apps/web/__tests__/pages/`)

Full page integration tests with all components.

#### Pattern Example: Index Page Tests

```typescript
describe('Index Page', () => {
  it('should complete full user workflow', async () => {
    // Setup: Full page with providers
    render(<IndexPage />, { wrapper: AllProviders });

    // Workflow: Multi-step interaction
    await userEvent.type(
      screen.getByLabelText('Search'), 
      'test query'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));
    
    // Verification: Results displayed
    await waitFor(() => {
      expect(screen.getByText('Results (10)')).toBeInTheDocument();
    });
  });
});
```

**Key Testing Aspects:**
- Full component integration
- Router navigation
- State management
- API interactions
- Loading states

**Failure Conditions:**
- Component mounting → Hydration errors
- Router issues → Navigation failures
- State corruption → UI inconsistencies
- API failures → Error boundaries triggered

### 5. Package Tests (`packages/*/src/__tests__/`)

Pure logic testing for shared utilities and services.

#### Pattern Example: HTTP Client Tests

```typescript
describe('AxiosRequest', () => {
  it('should handle retry logic correctly', async () => {
    // Setup: Failing then succeeding requests
    mockAdapter
      .onGet('/test')
      .replyOnce(500)
      .onGet('/test')
      .replyOnce(200, { data: 'success' });

    // Execute: Request with retry
    const client = new AxiosRequest({ maxRetries: 2 });
    const response = await client.get('/test');

    // Verify: Retry succeeded
    expect(response.data).toBe('success');
    expect(mockAdapter.history.get.length).toBe(2);
  });
});
```

**Key Testing Aspects:**
- HTTP method implementations
- Retry logic
- Timeout handling
- Error transformation
- Request/response interceptors

**Failure Conditions:**
- Network errors → Retry exhaustion
- Timeout exceeded → Request cancellation
- Invalid responses → Parser errors
- Memory leaks → Unclosed connections

#### Pattern Example: Music Search Tests

```typescript
describe('compareTitles', () => {
  it('should handle unicode normalization', () => {
    // Test: Special characters
    expect(compareTitles('Café', 'Cafe')).toBeGreaterThan(0.8);
    
    // Test: Accents and diacritics
    expect(compareTitles('naïve', 'naive')).toBeGreaterThan(0.9);
    
    // Test: Different scripts
    expect(compareTitles('Tokyo 東京', 'Tokyo')).toBeGreaterThan(0.5);
  });
});
```

**Key Testing Aspects:**
- String similarity algorithms
- Unicode handling
- Performance with long strings
- Edge cases (empty, null)
- Fuzzy matching thresholds

**Failure Conditions:**
- Unicode errors → Comparison failures
- Performance issues → Timeout on long strings
- Threshold issues → False positives/negatives
- Memory issues → Large string handling

## Mock Strategy

### Mock Architecture

```typescript
// apps/web/__tests__/test-utils/mocks.ts

// 1. API Mocking
export const mockAxios = {
  get: vi.fn(() => Promise.resolve({ data: {} })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
  // ... full axios interface
};

// 2. Browser API Mocking
export const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve(''))
};

// 3. Component Mocking
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange }) => (
    <textarea value={value} onChange={e => onChange(e.target.value)} />
  ))
}));
```

### Mock Categories

1. **Network Mocks**
   - Axios for HTTP requests
   - Fetch for native browser API
   - WebSocket for real-time communication

2. **Browser API Mocks**
   - localStorage/sessionStorage
   - Clipboard API
   - File/Blob operations
   - Observer APIs (Intersection, Resize)

3. **Third-Party Library Mocks**
   - Monaco Editor → textarea
   - Next.js Router → mock navigation
   - Next.js Image → standard img

4. **Component Mocks**
   - Heavy components replaced with stubs
   - External dependencies simplified
   - Async components synchronous

## Coverage Strategy

### Coverage Configuration

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/',
    'dist/', 'build/', '.next/',
    'apps/sync-worker/**',      // Excluded: separate service
    'apps/spotify-scraper/**',  // Excluded: Python code
    '**/*.d.ts',                // Type definitions
    '**/*.config.{js,ts}',      // Configurations
  ],
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Coverage Goals

- **80% Global Coverage**: Balanced between thoroughness and maintainability
- **Critical Path 100%**: Authentication, data mutations, error handling
- **UI Components 70%**: Focus on interactions over visual details
- **Utilities 90%**: Pure functions should be thoroughly tested

### Coverage Exceptions

- **Build artifacts**: Already tested source
- **Type definitions**: No runtime code
- **Configuration files**: Environment-specific
- **External services**: Tested via integration
- **Generated code**: Trusted third-party output

## Performance Optimization

### Test Execution Strategy

```typescript
pool: 'threads',
poolOptions: {
  threads: {
    singleThread: false  // Enable parallel execution
  }
},
testTimeout: 10000,      // 10 second timeout
hookTimeout: 10000       // 10 second hook timeout
```

### Optimization Techniques

1. **Parallel Execution**
   - Thread pool for CPU-bound tests
   - Isolated test environments
   - No shared state between tests

2. **Smart File Watching**
   - Only re-run affected tests
   - Dependency graph analysis
   - Exclude non-test directories

3. **Mock Optimization**
   - Lazy mock initialization
   - Shared mock instances where safe
   - Mock reset vs recreation

4. **Coverage Caching**
   - V8 native coverage
   - Incremental coverage updates
   - Coverage data persistence

## CI/CD Integration

### GitHub Actions Workflow

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: pnpm install
    - run: pnpm test:run
    - run: pnpm test:coverage
    - uses: codecov/codecov-action@v3
```

### Test Reporting

1. **JUnit XML**: CI test result parsing
2. **Coverage Reports**: HTML for humans, JSON for tools
3. **Performance Metrics**: Test execution times
4. **Failure Logs**: Detailed error traces

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should handle user input', async () => {
     // Arrange
     const onChange = vi.fn();
     render(<Input onChange={onChange} />);
     
     // Act
     await userEvent.type(screen.getByRole('textbox'), 'test');
     
     // Assert
     expect(onChange).toHaveBeenCalledWith('test');
   });
   ```

2. **Test User Behavior, Not Implementation**
   - ✅ `screen.getByRole('button', { name: 'Submit' })`
   - ❌ `container.querySelector('.submit-btn')`

3. **Explicit Waits Over Fixed Delays**
   - ✅ `await waitFor(() => expect(...).toBeInTheDocument())`
   - ❌ `await new Promise(r => setTimeout(r, 1000))`

4. **Comprehensive Mock Cleanup**
   ```typescript
   afterEach(() => {
     vi.clearAllMocks();  // Clear call history
     cleanup();           // Clean DOM
   });
   ```

### Test Naming

- **Descriptive**: "should display error when API fails"
- **Behavior-focused**: "handles concurrent requests correctly"
- **Scenario-specific**: "validates email format on blur"

### Mock Management

1. **Centralized Mock Definitions**: Single source of truth
2. **Type-Safe Mocks**: Match actual interfaces
3. **Realistic Responses**: Include delays, errors
4. **Reset Between Tests**: Prevent test pollution

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. "Cannot find module" Errors
**Cause**: Path alias misconfiguration
**Solution**: Verify aliases in vitest.config.ts match tsconfig.json

#### 2. "ReferenceError: document is not defined"
**Cause**: Running browser code in Node environment
**Solution**: Ensure test file uses `environment: 'jsdom'`

#### 3. "Warning: An update to Component inside a test was not wrapped in act(...)"
**Cause**: Async state updates not awaited
**Solution**: Use `waitFor` or `act` for async operations

#### 4. Mock Not Working
**Cause**: Mock defined after import
**Solution**: Move mock to top of file or setup file

#### 5. Timeout Errors
**Cause**: Async operation taking too long
**Solution**: Increase timeout or optimize async code

#### 6. Coverage Not Meeting Threshold
**Cause**: Untested code paths
**Solution**: Add tests for error cases, edge conditions

## Future Enhancements

### Planned Improvements

1. **Visual Regression Testing**
   - Screenshot comparison
   - Component visual diffs
   - Responsive design validation

2. **Performance Testing**
   - Bundle size monitoring
   - Runtime performance metrics
   - Memory leak detection

3. **Mutation Testing**
   - Code mutation to verify test quality
   - Automatic test improvement suggestions

4. **Contract Testing**
   - API contract validation
   - Type safety verification
   - Breaking change detection

### Maintenance Guidelines

1. **Regular Updates**
   - Keep testing libraries current
   - Update mock definitions with API changes
   - Review and adjust coverage thresholds

2. **Test Refactoring**
   - Extract common patterns to utilities
   - Consolidate duplicate test logic
   - Improve test readability

3. **Documentation**
   - Update this guide with new patterns
   - Document complex test scenarios
   - Share testing knowledge

## Conclusion

This testing architecture provides a robust foundation for maintaining code quality in the Vibe Kanban project. The combination of Vitest's performance, Testing Library's user-centric approach, and comprehensive mocking ensures that tests are both fast and reliable.

The 80% coverage threshold strikes a balance between thoroughness and maintainability, while the focus on user behavior over implementation details ensures tests remain valuable even as the codebase evolves.

Key strengths of this setup:
- **Performance**: Parallel execution and smart caching
- **Maintainability**: Clear organization and patterns
- **Reliability**: Comprehensive mocking and isolation
- **Developer Experience**: Fast feedback and clear errors

By following these patterns and practices, the team can confidently refactor and extend the application while maintaining quality and preventing regressions.