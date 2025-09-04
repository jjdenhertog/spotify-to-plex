# API Routes Test Suite

Comprehensive test suite for Next.js API routes focusing on key endpoints. This test suite provides thorough coverage of API functionality while excluding specific components as noted.

## 📁 Test Structure

```
__tests__/api/
├── README.md                    # This documentation
├── index.test.ts               # Test suite entry point
├── api-test-helpers.ts         # Shared testing utilities
├── plex-connection.test.ts     # Plex server connection tests
├── plex-tracks.test.ts         # Plex library data tests  
├── sync-operations.test.ts     # Sync operations tests
├── spotify-auth.test.ts        # Spotify OAuth flow tests
├── spotify-data.test.ts        # Spotify data fetching tests
└── settings.test.ts            # Settings CRUD tests
```

## 🎯 Test Coverage

### ✅ Included API Routes

#### Plex API Routes
- **`/api/plex/resources`** - Plex server connection validation
  - Authentication verification
  - Server discovery and connection testing
  - Error handling for network issues
  - HTTPS requirement handling

- **`/api/plex/tracks`** - Plex library data fetching
  - Track listing and searching
  - Pagination support
  - Performance with large libraries
  - Authentication requirements

- **`/api/sync/[type]`** - Sync operations (albums, playlists, users)
  - Album synchronization
  - Playlist synchronization  
  - User synchronization
  - Error handling and recovery

#### Spotify API Routes
- **`/api/spotify/login`** - OAuth authentication flow
  - Authorization URL generation
  - Scope configuration
  - Environment variable validation
  - Security considerations

- **`/api/spotify/users`** - User profile data
- **`/api/spotify/track`** - Individual track data
- **`/api/spotify/users/[id]/items`** - User playlists and saved tracks
  - Authentication handling
  - Rate limiting
  - Data validation
  - Error responses

#### Settings API Routes
- **`/api/settings`** - Settings CRUD operations
  - GET: Retrieve current settings
  - POST: Update settings with validation
  - File system persistence
  - Concurrent update handling

### ❌ Excluded From Testing

The following are explicitly excluded as specified:

- **Sync-worker endpoints** - Not tested per requirements
- **MQTT functionality** - Excluded from testing scope
- **Python Flask/Spotify scraper** - Out of scope
- **Performance testing** - Not part of current test suite
- **Inappropriate OAuth/Payment processing** - Security concern exclusion

## 🧪 Testing Patterns

### Test Categories

1. **Request Validation**
   - HTTP method validation
   - Parameter validation
   - Authentication checks
   - Input sanitization

2. **Error Handling**
   - Network failures
   - Invalid authentication
   - Malformed requests
   - Rate limiting
   - Server errors

3. **Edge Cases**
   - Empty responses
   - Large datasets
   - Concurrent requests
   - Timeout scenarios

4. **Security Testing**
   - Authentication middleware
   - Input validation
   - Error message sanitization
   - Environment variable protection

### Mock Strategy

- **External APIs**: Axios calls to Plex and Spotify APIs are mocked
- **File System**: Settings persistence operations are mocked
- **Environment Variables**: Controlled via test helpers
- **Error Conditions**: Simulated network and system errors

## 🔧 Test Utilities

### `api-test-helpers.ts`

Core testing utilities providing:

- `createMockRequestResponse()` - HTTP request/response mocking
- `expectResponse()` - Response validation helper
- `mockEnvVars()` - Environment variable management
- `createMockAxiosResponse()` - Axios response mocking
- `createMockAxiosError()` - Error response mocking
- `mockPlexResponses` - Predefined Plex API responses
- `mockSpotifyResponses` - Predefined Spotify API responses

### Example Usage

```typescript
import { 
  createMockRequestResponse, 
  expectResponse, 
  mockPlexResponses 
} from './api-test-helpers';

it('should validate API endpoint', async () => {
  const { req, res } = createMockRequestResponse({ 
    method: 'GET',
    query: { id: 'test' }
  });

  await handler(req, res);

  expectResponse(res, 200, mockPlexResponses.settings);
});
```

## 🚀 Running Tests

```bash
# Run all API tests
npm run test __tests__/api

# Run specific test file
npm run test __tests__/api/plex-connection.test.ts

# Run with coverage
npm run test:coverage __tests__/api

# Watch mode
npm run test:watch __tests__/api
```

## 📊 Coverage Goals

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## 🔍 Test Quality Standards

### Request Testing
- All HTTP methods tested
- Query parameters validated
- Request body validation
- Header requirements checked

### Response Testing
- Status codes verified
- Response data structure validated
- Error responses tested
- Content-type headers checked

### Authentication Testing
- Valid token scenarios
- Invalid/expired tokens
- Missing authentication
- Scope validation

### Error Handling
- Network errors
- Timeout scenarios
- Invalid input data
- System errors

### Performance Considerations
- Large dataset handling
- Concurrent request testing
- Memory usage validation
- Response time verification

## 🔒 Security Testing

- Input sanitization
- Authentication bypass attempts
- Error message information leakage
- Environment variable exposure
- SQL injection prevention (where applicable)

## 📝 Best Practices

1. **Test Isolation**: Each test is independent and can run in any order
2. **Mock External Dependencies**: All external API calls are mocked
3. **Clear Test Names**: Descriptive test names explain the scenario
4. **Comprehensive Coverage**: Both happy path and error scenarios
5. **Performance Aware**: Tests complete within reasonable timeframes
6. **Security Focused**: Tests validate security measures

## 🔄 Maintenance

- Tests are updated when API routes change
- Mock responses reflect current API contracts
- Test utilities are kept up to date with dependencies
- Coverage reports are monitored for completeness

---

**Note**: This test suite is designed to provide comprehensive coverage of the Next.js API routes while maintaining clear boundaries around excluded functionality. All tests follow the established patterns and security guidelines.