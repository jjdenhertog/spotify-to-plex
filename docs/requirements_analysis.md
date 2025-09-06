# Test Requirements Analysis - Spotify-to-Plex Project

## 🔍 Executive Summary

This document extracts and analyzes the key requirements from the comprehensive test implementation guide for the Spotify-to-Plex monorepo project. The project requires a complete test suite implementation focusing on web application components, API routes, and shared packages while explicitly excluding sync-worker functionality.

## 📋 Core Project Context

### Architecture Overview
- **Structure**: pnpm monorepo with 3 applications and 8 shared packages
- **Frontend**: Next.js 14.2.32 with React 18.3.1 and Material-UI v6
- **Backend**: Node.js sync-worker (EXCLUDED from testing)
- **Scraper**: Python Flask service for Spotify data extraction
- **TypeScript**: Version 5.7.2 with strict type checking
- **Package Management**: pnpm 10.15.0 with workspace support

### Key Applications
1. **apps/web**: Next.js frontend with 44 React components and 34 API routes
2. **apps/sync-worker**: Background synchronization service (**EXCLUDED FROM TESTING**)
3. **apps/spotify-scraper**: Python Flask API for playlist data scraping

### Shared Packages
- `shared-types`: Common TypeScript type definitions
- `shared-utils`: Utility functions (NO barrel exports)
- `plex-helpers`: Plex API integration utilities
- `music-search`: Core music matching algorithms
- `http-client`: Axios-based HTTP utilities
- `plex-config`: Configuration management
- `plex-music-search`: Plex-specific search implementation
- `tidal-music-search`: Tidal-specific search implementation

## 🎯 Core Testing Requirements

### 1. Testing Framework & Technology Stack

#### Primary Framework: Vitest
**Rationale**: 4-20x faster than Jest for TypeScript projects with built-in ES modules support

#### Required Dependencies
```bash
# Core testing
pnpm add -D vitest @vitest/ui @vitest/coverage-v8
pnpm add -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
pnpm add -D jsdom happy-dom

# API testing
pnpm add -D supertest node-mocks-http msw

# Backend specific
pnpm add -D mock-fs

# E2E testing
pnpm add -D @playwright/test

# Type definitions
pnpm add -D @types/supertest @types/node-mocks-http
```

### 2. Testing Philosophy & Approach

#### Core Principles
1. **Test User Behavior, Not Implementation**
2. **Meaningful Test Coverage** (Quality over quantity)
3. **Maintainable Tests** (Easy to understand and modify)
4. **Fast Feedback Loops** (Unit tests in milliseconds)

#### Testing Pyramid Distribution
- **Unit Tests**: 40% - Utilities, algorithms, business logic
- **Component Tests**: 30% - React components with user interactions
- **Integration Tests**: 25% - API routes, service communication
- **E2E Tests**: 5% - Critical user journeys

## ⚠️ CRITICAL EXCLUSIONS

### Absolutely NO Testing Required For:
1. **sync-worker application** - All background synchronization functionality
2. **MQTT communication** - All MQTT-related features
3. **Background job processing** - Queue management and job scheduling
4. **Service-to-service communication** - Inter-service messaging

**Note**: These exclusions are intentional architectural decisions to focus testing efforts on the web application and shared packages only.

## 📊 Test Coverage Requirements

### Coverage Targets by Component Type

| Component Type | Line Coverage | Branch Coverage | Function Coverage |
|---------------|---------------|-----------------|-------------------|
| Utility Functions | 95% | 90% | 100% |
| React Components | 85% | 80% | 85% |
| Custom Hooks | 90% | 85% | 90% |
| API Routes | 85% | 80% | 85% |
| Integration Tests | 75% | 70% | 75% |

### Critical Path Coverage (100% Required)
- Authentication flow
- Data deletion operations
- Security-sensitive operations
- Error boundaries and error handling

## 🧪 Specific Testing Requirements by Component

### 1. React Components (High Priority)

#### ErrorProvider (Context Provider)
- Context value propagation to children
- showError function displays dialog correctly
- Dialog keyboard navigation (Escape key)
- Error message formatting
- Cleanup on unmount
- Multiple error handling

#### MatchFilterEditor (Complex Editor Component)
- Mode switching between UI and JSON views
- Validation of filter expressions
- Save and load operations
- Error display for invalid JSON
- Undo/redo functionality
- Keyboard shortcuts
- Integration with Monaco editor

#### PillEditor (Expression Builder)
- Expression parsing and validation
- Autocomplete functionality
- Pill creation and deletion
- Drag and drop reordering
- Keyboard navigation
- Copy/paste operations
- Invalid input handling

### 2. Custom Hooks Testing

#### useDualModeEditor Hook
- View mode switching
- Content synchronization between modes
- Validation state management
- Save callbacks with proper data
- Error state handling
- Loading state transitions

### 3. API Routes Testing (Next.js)

#### Key Endpoints to Test
- `/api/plex/*` - Plex integration endpoints
- `/api/spotify/*` - Spotify OAuth and data endpoints
- `/api/tidal/*` - Tidal search endpoints
- `/api/settings/*` - Configuration management
- `/api/sync/*` - Synchronization triggers

#### Test Requirements
- Request validation
- Authentication middleware
- Error responses and status codes
- Rate limiting (if implemented)
- CRUD operations

### 4. Shared Packages Testing

#### Music Search Package
- String similarity algorithms
- Search string normalization
- Filter word removal
- Multiple search approach strategies
- Performance with large datasets

#### Utility Functions
- String manipulation functions
- Array processing utilities
- Date/time utilities
- Type guards and validation functions
- Error handling utilities
- HTTP client wrapper functions

### 5. Integration Testing Requirements

#### Cross-Service Communication
- Web app API calls
- File system settings persistence
- Cross-package dependency resolution
- OAuth flow integration
- **Note**: sync-worker communication is NOT tested

## 🏗️ Implementation Strategy (5 Phases)

### Phase 1: Foundation (Week 1)
- Setup Vitest and core configuration
- Configure workspace testing
- Create test utilities and helpers
- Utility function testing (90%+ coverage)

### Phase 2: Component Testing (Week 2)
- Critical component tests (ErrorProvider, MatchFilterEditor, etc.)
- Custom hook testing
- Form components with validation

### Phase 3: API Testing (Week 3)
- API route tests
- Authentication endpoints
- CRUD operations
- Error scenarios

### Phase 4: Integration Testing (Week 4)
- Cross-service tests
- Settings persistence
- E2E critical paths

### Phase 5: Performance & Optimization (Week 5)
- Performance tests
- Large dataset handling
- CI/CD integration
- Coverage reporting

## 📁 Required Directory Structure

```
spotify-to-plex/
├── tests/                          # Root test directory
│   ├── setup/                     # Test configuration and setup
│   ├── fixtures/                  # Test data fixtures
│   └── e2e/                      # E2E test scenarios
├── apps/
│   ├── web/
│   │   ├── __tests__/            # Component and hook tests
│   │   │   ├── components/       # React component tests
│   │   │   ├── hooks/           # Custom hook tests
│   │   │   ├── pages/           # Page component tests
│   │   │   └── api/             # API route tests
│   │   └── tests/               # Integration tests
│   ├── sync-worker/              # NO TESTS - Excluded
│   └── spotify-scraper/
│       └── tests/               # Python Flask tests
└── packages/
    └── [package-name]/
        └── __tests__/           # Package-specific tests
```

## 🎯 Core Acceptance Criteria

### Functional Requirements
1. ✅ Complete test coverage for all React components in apps/web
2. ✅ API route testing for all 34 endpoints
3. ✅ Utility function testing for all shared packages
4. ✅ Custom hook testing with realistic scenarios
5. ✅ Integration testing for cross-package functionality
6. ✅ E2E testing for critical user journeys

### Quality Standards
1. ✅ Meet all coverage thresholds specified
2. ✅ All tests must run in under 30 seconds (unit tests)
3. ✅ Less than 1% flakiness rate
4. ✅ Less than 0.1% false positive rate
5. ✅ Tests maintain compatibility with existing code patterns

### Technical Requirements
1. ✅ Use Vitest as primary testing framework
2. ✅ Follow NO barrel exports pattern in test imports
3. ✅ Place tests in appropriate `__tests__` directories
4. ✅ Use full path imports without 'src' directory
5. ✅ One function per test file for utilities

### CI/CD Integration Requirements
1. ✅ GitHub Actions workflow configuration
2. ✅ Coverage reporting integration
3. ✅ Branch protection rules
4. ✅ Automated PR checks
5. ✅ Performance regression detection

## 🚀 Success Metrics

### Test Quality Metrics
- **Test execution time**: < 30 seconds for unit tests
- **Coverage targets met**: All specified thresholds achieved
- **Flakiness rate**: < 1% of test runs
- **False positive rate**: < 0.1%

### Business Impact Metrics
- **Bug detection rate**: 90%+ bugs caught before production
- **Deployment confidence**: Zero rollbacks due to bugs
- **Development velocity**: 20% increase after implementation
- **Code review time**: 30% reduction with automated testing

## 📋 Implementation Checklist Summary

### Setup Phase (8 items)
- Install Vitest and dependencies
- Configure workspace testing
- Setup utilities and mocks
- Configure coverage thresholds

### Unit Tests (8 major categories)
- Shared-utils package functions
- Music-search algorithms
- HTTP client wrappers
- Configuration utilities
- Type guards and validation
- Error handling utilities
- Date/time utilities
- Array manipulation functions

### Component Tests (10 major components)
- ErrorProvider, ConfirmProvider, BSnackbarProvider
- MatchFilterEditor and PillEditor
- MonacoJsonEditor
- PlexConnection
- ManageUsers
- SearchAnalyzer
- Form components

### API Route Tests (10 categories)
- Plex connection endpoints
- Spotify OAuth flow
- CRUD operations
- User management
- Settings persistence
- Error responses
- Authentication middleware
- Request validation

### Integration Tests (6 areas)
- API endpoint integration
- Settings file persistence
- Cross-package imports
- OAuth flows
- Error propagation
- User workflows

### E2E Tests (8 flows)
- User onboarding
- Plex connection setup
- Spotify authentication
- Playlist synchronization UI
- Settings management
- Error recovery
- Responsive design
- Keyboard navigation

## 🔄 Quick Commands for Implementation

```bash
# Install all test dependencies
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom supertest node-mocks-http msw

# Run tests
pnpm test           # Run all tests everywhere
pnpm lint          # Lint all code
pnpm type-check    # Check TypeScript types
```

## 🎯 Key Quality Standards

1. **NO Implementation Testing** - Focus on user behavior and outcomes
2. **Full Path Imports** - No barrel exports, explicit imports only
3. **Organized File Structure** - Tests adjacent to source code
4. **Performance Focus** - Tests must be fast and reliable
5. **Integration First** - Test how components work together
6. **User-Centric** - Test what users can do, not internal mechanics

This requirements analysis provides a complete roadmap for implementing the test suite according to the specifications outlined in the comprehensive test implementation guide.