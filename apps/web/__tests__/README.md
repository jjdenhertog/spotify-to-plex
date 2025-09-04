# Web App Test Suite

This directory contains comprehensive React component tests for the Vibe Kanban web application, focusing on high-priority components as specified in the requirements.

## Test Structure

```
__tests__/
├── components/
│   ├── ErrorProvider/
│   │   └── ErrorProvider.test.tsx
│   ├── MatchFilterEditor/
│   │   └── MatchFilterEditor.test.tsx
│   └── PillEditor/
│       └── PillEditor.test.tsx
├── test-utils/
│   ├── index.ts
│   ├── test-utils.tsx
│   ├── mocks.ts
│   └── setup-tests.ts
└── README.md
```

## Components Tested

### 1. ErrorProvider Component
- **Location**: `src/components/ErrorProvider/ErrorProvider.tsx`
- **Test Coverage**:
  - Context value propagation
  - Error dialog display and interaction
  - Keyboard navigation (Escape key)
  - Error message formatting
  - Component cleanup on unmount
  - Accessibility features

### 2. MatchFilterEditor Component
- **Location**: `src/components/MatchFilterEditor.tsx`
- **Test Coverage**:
  - Mode switching between UI and JSON views
  - Filter expression validation
  - Save and load operations
  - Error display for invalid JSON
  - Keyboard navigation and shortcuts
  - Loading states and disabled controls

### 3. PillEditor Component  
- **Location**: `src/components/PillEditor.tsx`
- **Test Coverage**:
  - Expression parsing and validation
  - Autocomplete functionality (field and operation selection)
  - Pill creation and deletion
  - Keyboard navigation
  - Invalid input handling
  - Accessibility features

## Test Utilities

### Custom Render Function
The test suite uses a custom render function that includes:
- Material-UI ThemeProvider
- CssBaseline for consistent styling
- SnackbarProvider for notifications
- ErrorProvider context
- Configurable provider options

### Mocks
Comprehensive mocking setup for:
- Axios HTTP client
- Notistack notifications
- Next.js router
- Window methods (confirm, alert)
- Browser APIs (localStorage, IntersectionObserver, etc.)

## Running Tests

```bash
# Run all web app tests
npm run test:web

# Run tests in watch mode
npm run test:web-watch

# Run specific test file
vitest run __tests__/components/ErrorProvider/ErrorProvider.test.tsx

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Patterns

### User-Centered Testing
Tests focus on user behavior rather than implementation details:
```tsx
// ✅ Good: Testing user interaction
await user.click(screen.getByRole('button', { name: /save/i }));
expect(screen.getByText('Configuration saved')).toBeInTheDocument();

// ❌ Bad: Testing implementation
expect(component.state.isSaved).toBe(true);
```

### Accessibility Testing
All tests include accessibility considerations:
```tsx
// Test keyboard navigation
await user.keyboard('{Escape}');
expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

// Test ARIA attributes
expect(dialog).toHaveAttribute('aria-labelledby');
```

### Error Boundary Testing
Components are tested for graceful error handling:
```tsx
mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
// Component should not crash and show appropriate fallback
```

## Coverage Goals

- **Statements**: >80%
- **Branches**: >75%  
- **Functions**: >80%
- **Lines**: >80%

## Mock Strategy

External dependencies are mocked at the module level:
- UI components that are not under test
- API calls and HTTP requests
- Browser APIs and global objects
- Third-party libraries

## Excluded Components

The following components are explicitly excluded from testing as per requirements:
- Sync-worker related components
- MQTT functionality components
- Authentication components that handle sensitive data

## Best Practices Followed

1. **Test First Approach**: Tests define expected behavior
2. **One Assertion Per Test**: Each test verifies one specific behavior
3. **Descriptive Test Names**: Test names explain what and why
4. **Arrange-Act-Assert**: Clear test structure
5. **Mock External Dependencies**: Keep tests isolated
6. **Test Data Builders**: Use factories for consistent test data
7. **Avoid Test Interdependence**: Each test runs independently

## Configuration

Tests are configured via:
- `vitest.config.ts` - Vitest configuration
- `setup-tests.ts` - Global test setup
- `test-utils.tsx` - Custom render utilities
- `mocks.ts` - Mock implementations