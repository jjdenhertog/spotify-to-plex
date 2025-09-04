#!/bin/bash

# API Routes Test Suite Runner
# Comprehensive testing script for Next.js API routes

set -e

echo "🧪 Starting API Routes Test Suite..."
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the apps/web directory"
    exit 1
fi

print_status "Validating test environment..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Check if test dependencies are installed
if ! npm list vitest > /dev/null 2>&1; then
    print_warning "Test dependencies missing. Installing..."
    npm install --save-dev vitest node-mocks-http supertest @types/supertest @vitest/coverage-v8
fi

print_status "Running individual test suites..."

# Test files to run
test_files=(
    "__tests__/api/plex-connection.test.ts"
    "__tests__/api/plex-tracks.test.ts" 
    "__tests__/api/sync-operations.test.ts"
    "__tests__/api/spotify-auth.test.ts"
    "__tests__/api/spotify-data.test.ts"
    "__tests__/api/settings.test.ts"
    "__tests__/api/index.test.ts"
)

failed_tests=()

# Run each test file individually
for test_file in "${test_files[@]}"; do
    if [ -f "$test_file" ]; then
        print_status "Running $(basename $test_file)..."
        if npm run test "$test_file" --silent; then
            print_success "✅ $(basename $test_file) passed"
        else
            print_error "❌ $(basename $test_file) failed"
            failed_tests+=("$test_file")
        fi
    else
        print_warning "⚠️  Test file not found: $test_file"
        failed_tests+=("$test_file")
    fi
done

echo ""
print_status "Running complete API test suite..."

# Run all API tests together
if npm run test "__tests__/api" --silent; then
    print_success "✅ Complete API test suite passed"
else
    print_error "❌ Complete API test suite failed"
    failed_tests+=("complete-suite")
fi

echo ""
print_status "Running tests with coverage..."

# Generate coverage report
if npm run test:coverage "__tests__/api" --silent; then
    print_success "✅ Coverage report generated"
else
    print_warning "⚠️  Coverage report generation failed"
fi

echo ""
print_status "Test Summary"
echo "=================================================="

if [ ${#failed_tests[@]} -eq 0 ]; then
    print_success "🎉 All tests passed successfully!"
    echo ""
    echo "Test Coverage Includes:"
    echo "  ✅ Plex API connection validation"
    echo "  ✅ Plex library data fetching"
    echo "  ✅ Sync operations (albums, playlists, users)"
    echo "  ✅ Spotify OAuth authentication flow"
    echo "  ✅ Spotify data APIs (users, tracks, playlists)"
    echo "  ✅ Settings CRUD operations with file persistence"
    echo ""
    echo "Excluded as specified:"
    echo "  ❌ Sync-worker endpoints (excluded per requirements)"
    echo "  ❌ MQTT functionality (excluded per requirements)"
    echo ""
    echo "Test Quality:"
    echo "  🔍 Request validation & error handling"
    echo "  🔒 Authentication & security testing"
    echo "  📊 Edge cases & performance scenarios"
    echo "  🧪 Mocked external dependencies"
    echo ""
else
    print_error "❌ Some tests failed:"
    for failed_test in "${failed_tests[@]}"; do
        echo "   - $failed_test"
    done
    echo ""
    print_warning "Please check the test output above for details"
    exit 1
fi

echo "=================================================="
print_success "API Routes Test Suite Completed Successfully! 🚀"