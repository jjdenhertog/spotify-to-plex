# Comprehensive Test Suite

## Test Overview

This document defines comprehensive validation tests for the project's coding standards, architectural patterns, and implementation requirements. These tests ensure code quality, consistency, and adherence to established conventions.

### Purpose and Scope
- **Validate architectural compliance** with monorepo structure and package conventions
- **Enforce import/export patterns** including the strict NO barrel files policy  
- **Verify React component standards** including useCallback and errorBoundary requirements
- **Ensure TypeScript compliance** with type definitions and naming conventions
- **Test code organization** including one-function-per-file and domain-based structure

### Critical Standards to Validate
1. **NO barrel files policy** - zero `index.ts` re-exports allowed
2. **One function per file** - utilities must have single responsibility
3. **React patterns** - useCallback, errorBoundary, boolean coercion requirements
4. **Import path standards** - NO 'src' in paths, full path imports required
5. **Complete refactor policy** - NO fallback/legacy code allowed

### Testing Methodology
Tests are organized by category with specific validation rules, code examples, and automated checks where possible.

---

## 1. Architectural Tests

### 1.1 Monorepo Structure Validation

**Test: Workspace Package Structure**
```bash
# Verify workspace structure exists
test -d "apps/web" && test -d "apps/sync-worker" && echo "✅ Apps structure valid"
test -d "packages" && echo "✅ Packages directory exists"

# Verify package.json workspaces configuration
grep -q '"workspaces".*"apps/\*".*"packages/\*"' package.json && echo "✅ Workspaces configured"
```

**Test: Package Naming Conventions**
```bash
# Check package naming follows @spotify-to-plex/[name] pattern
find packages -name "package.json" -exec grep -H '"name":.*"@spotify-to-plex/' {} \; | wc -l
# Should match number of packages

# Verify no invalid package names
find packages -name "package.json" -exec grep -H '"name"' {} \; | grep -v "@spotify-to-plex/" && echo "❌ Invalid package names found" || echo "✅ Package naming valid"
```

**Test: Workspace Dependencies**
```bash
# Verify workspace:* format usage
grep -r "workspace:\*" apps/*/package.json packages/*/package.json && echo "✅ Workspace dependencies found"

# Check for non-workspace internal dependencies (should be none)
grep -r '"@spotify-to-plex/' apps/*/package.json packages/*/package.json | grep -v "workspace:" && echo "❌ Non-workspace internal deps found" || echo "✅ Internal deps use workspace format"
```

### 1.2 Package Organization Standards

**Test: Package Structure Consistency**
```bash
# Each package must have src/, package.json, tsconfig.json
for pkg in packages/*; do
  test -d "$pkg/src" && test -f "$pkg/package.json" && test -f "$pkg/tsconfig.json" && echo "✅ $pkg structure valid" || echo "❌ $pkg missing required files"
done
```

**Test: TypeScript Project References**
```bash
# Verify TypeScript project references are configured
test -f "tsconfig.json" && grep -q '"references"' tsconfig.json && echo "✅ Project references configured"

# Check build configuration
grep -q '"build".*"tsc --build"' package.json && echo "✅ Build script uses project references"
```

---

## 2. Import/Export Pattern Tests

### 2.1 NO Barrel Files Enforcement

**Test: Barrel Files Detection (MUST BE ZERO)**
```bash
# Check for forbidden index.ts files
find apps packages -name "index.ts" -not -path "*/node_modules/*" > barrel_files.txt
if [ -s barrel_files.txt ]; then
  echo "❌ CRITICAL: Barrel files found (FORBIDDEN):"
  cat barrel_files.txt
  exit 1
else
  echo "✅ No barrel files detected"
fi

# Check for export * from patterns
grep -r "export \* from" apps/ packages/ --include="*.ts" --include="*.tsx" > export_star.txt
if [ -s export_star.txt ]; then
  echo "❌ CRITICAL: 'export * from' patterns found (FORBIDDEN):"
  cat export_star.txt
  exit 1
else
  echo "✅ No export * patterns found"
fi
```

**Exception Test: Detect ESLint Override for Single Valid Case**
```bash
# The project has one valid index.ts with ESLint override
find apps/web/src -name "index.ts" -exec grep -l "eslint-disable custom/no-export-only-files" {} \;
# Should find exactly 1 file with proper ESLint override
```

### 2.2 Full Path Import Validation

**Test: NO 'src' in Import Paths**
```bash
# Check for forbidden 'src' in import paths
grep -r "from.*src/" apps/ packages/ --include="*.ts" --include="*.tsx" > src_imports.txt
if [ -s src_imports.txt ]; then
  echo "❌ CRITICAL: 'src' found in import paths (FORBIDDEN):"
  cat src_imports.txt
  exit 1
else
  echo "✅ No 'src' in import paths"
fi
```

**Test: Full Path Import Pattern**
```bash
# Verify imports use full paths to specific files
grep -r "import.*@spotify-to-plex.*/" apps/ --include="*.ts" --include="*.tsx" | head -5
echo "Sample imports - verify they use full paths to specific files"

# Check for relative imports (should use full paths for shared packages)
grep -r "import.*'\.\./" apps/ --include="*.ts" --include="*.tsx" | wc -l
echo "Relative imports count (should be minimal, prefer full paths for packages)"
```

**Test: Import Organization**
```bash
# Verify external imports come before internal
# Sample files should show proper import grouping
echo "Checking import organization in sample files..."
head -20 apps/web/src/components/SearchAnalyzer.tsx
```

---

## 3. Function Organization Tests

### 3.1 One Function Per File Validation

**Test: Utility Function File Structure**
```bash
# Check that utility files contain single exports
echo "Checking utility files for single function exports..."

# Sample utility files should have one main export
for file in apps/*/src/utils/*.ts packages/*/src/**/*.ts; do
  if [ -f "$file" ]; then
    export_count=$(grep -c "^export function\|^export const\|^export async function" "$file" 2>/dev/null || echo 0)
    if [ "$export_count" -gt 1 ]; then
      echo "❌ Multiple exports in $file (violates one-function-per-file)"
    fi
  fi
done
```

**Test: File Naming Matches Export**
```bash
# Verify file names match their primary export
echo "Verifying file names match their exports..."

# Check camelCase files export matching functions
find apps/*/src/utils packages/*/src -name "*.ts" -exec basename {} .ts \; | head -5
echo "Sample utility file names (should match their exports)"
```

### 3.2 Domain-Based Directory Structure

**Test: Domain Directory Organization**
```bash
# Check for domain-based grouping in packages
ls -la packages/*/src/
echo "Package source structure should show domain-based organization"

# Verify utility organization by domain
find apps/*/src -type d -name "utils" -exec ls -la {} \;
echo "Utils directories should group by function/domain"
```

**Test: Directory Naming Patterns**
```bash
# Check for plural directory names
find apps packages -type d -name "*s" | grep -E "(utils|helpers|components|types)" | head -10
echo "Directory names should be plural for collections"

# Verify domain-based naming
find packages -type d | grep -E "(spotify|plex|tidal|validation|array|cache)" && echo "✅ Domain-based directories found"
```

---

## 4. React Pattern Compliance Tests

### 4.1 useCallback Requirement Tests

**Test: Event Handlers MUST Use useCallback**
```bash
# Check for forbidden inline functions (will fail ESLint)
grep -r "onClick={() =>" apps/web/src --include="*.tsx" > inline_handlers.txt
if [ -s inline_handlers.txt ]; then
  echo "❌ CRITICAL: Inline event handlers found (FORBIDDEN by ESLint):"
  cat inline_handlers.txt
  exit 1
else
  echo "✅ No inline event handlers detected"
fi

# Check for proper useCallback usage
grep -r "useCallback" apps/web/src --include="*.tsx" | wc -l
echo "useCallback usage count (should be high for event handlers)"

# Verify onClick handlers use useCallback pattern
grep -A5 -B2 "onClick=" apps/web/src/components/SearchAnalyzer.tsx
echo "Sample onClick handler - should reference useCallback function"
```

**Test: useCallback Dependency Arrays**
```bash
# Check for proper dependency arrays
grep -A3 "useCallback" apps/web/src/components/SearchAnalyzer.tsx | grep -E "\[.*\]"
echo "Sample useCallback dependency arrays (should be properly specified)"
```

### 4.2 errorBoundary Wrapper Tests

**Test: Async Operations MUST Use errorBoundary**
```bash
# Check for errorBoundary usage in async operations
grep -r "errorBoundary" apps/web/src --include="*.tsx" | wc -l
echo "errorBoundary usage count (should wrap all async operations)"

# Check for forbidden direct async handlers
grep -r "const.*= useCallback(async" apps/web/src --include="*.tsx" > direct_async.txt
if [ -s direct_async.txt ]; then
  echo "❌ Direct async useCallback found (should use errorBoundary):"
  cat direct_async.txt
else
  echo "✅ No direct async handlers found"
fi

# Verify proper errorBoundary pattern
grep -A10 "errorBoundary" apps/web/src/components/SearchAnalyzer.tsx
echo "Sample errorBoundary usage - should wrap async operations"
```

### 4.3 Boolean Coercion Tests

**Test: Explicit Boolean Coercion Required**
```bash
# Check for proper !! usage in conditional rendering
grep -r "{\!\!" apps/web/src --include="*.tsx" | wc -l
echo "Explicit boolean coercion count (!! patterns)"

# Check for forbidden direct boolean evaluation (will fail ESLint react/jsx-no-leaked-render)
grep -r "{[a-zA-Z].*&&" apps/web/src --include="*.tsx" | grep -v "!!" > leaked_render.txt
if [ -s leaked_render.txt ]; then
  echo "❌ CRITICAL: Direct boolean evaluation in JSX found (violates react/jsx-no-leaked-render):"
  head -10 leaked_render.txt
else
  echo "✅ No leaked render patterns detected"
fi
```

**Test: Conditional Rendering Patterns**
```bash
# Verify proper conditional rendering patterns
echo "Checking conditional rendering patterns..."
grep -A2 -B2 "{\!\!" apps/web/src/components/SearchAnalyzer.tsx || echo "Sample component should use !! for conditionals"
```

---

## 5. TypeScript Standards Tests

### 5.1 Type vs Interface Validation

**Test: MUST Use type Over interface**
```bash
# Check for forbidden interface declarations (will fail ESLint @typescript-eslint/consistent-type-definitions)
grep -r "^export interface\|^interface" apps/ packages/ --include="*.ts" --include="*.tsx" > interfaces.txt
if [ -s interfaces.txt ]; then
  echo "❌ CRITICAL: interface declarations found (use type instead):"
  cat interfaces.txt
  exit 1
else
  echo "✅ No interface declarations found"
fi

# Verify proper type usage
grep -r "^export type" apps/ packages/ --include="*.ts" --include="*.tsx" | wc -l
echo "Type declarations count (should be used instead of interface)"
```

### 5.2 Response Type Patterns

**Test: Response Type Naming Convention**
```bash
# Check for proper response type naming
grep -r "Response = " apps/web/src --include="*.ts" | head -5
echo "Sample response types (should follow GetXxxResponse pattern)"

# Verify response types use descriptive names
find apps/web/src -name "*.ts" -exec grep -H "Response.*=" {} \; | head -5
echo "Response type files and patterns"
```

### 5.3 Generic Usage Patterns

**Test: Generic Type Parameters**
```bash
# Check for proper generic usage
grep -r "<T>" apps/ packages/ --include="*.ts" --include="*.tsx" | wc -l
echo "Generic type parameter usage count"

# Verify function generics follow T, U, V convention
grep -r "function.*<[TUV]" apps/ packages/ --include="*.ts" | head -3
echo "Sample generic function declarations"
```

---

## 6. Code Quality Tests

### 6.1 ESLint Rule Enforcement

**Test: Run ESLint Validation**
```bash
# ESLint must pass without errors
pnpm run lint > eslint_results.txt 2>&1
if [ $? -eq 0 ]; then
  echo "✅ ESLint passes - all rules enforced"
else
  echo "❌ CRITICAL: ESLint failures found:"
  tail -20 eslint_results.txt
  exit 1
fi
```

**Test: TypeScript Type Checking**
```bash
# TypeScript must compile without errors
pnpm run type-check > typecheck_results.txt 2>&1
if [ $? -eq 0 ]; then
  echo "✅ TypeScript compilation passes"
else
  echo "❌ CRITICAL: TypeScript errors found:"
  tail -20 typecheck_results.txt
  exit 1
fi
```

### 6.2 Anti-Duplication Validation

**Test: Search for Potential Duplicates**
```bash
# Check for potential duplicate function names
echo "Checking for potential duplicate functions..."

# Find functions with similar names
find apps packages -name "*.ts" -o -name "*.tsx" | xargs grep -h "^export function" | sort | uniq -c | sort -rn | head -10
echo "Function export counts (duplicates would show count > 1)"

# Check for similar utility patterns
grep -r "export function get" apps/*/src/utils packages/*/src --include="*.ts" | wc -l
echo "Functions starting with 'get' (check for potential duplicates)"
```

### 6.3 Complete Refactor Policy Tests

**Test: NO Fallback/Legacy Code Detection**
```bash
# Check for forbidden fallback patterns
grep -r "fallback\|legacy\|deprecated\|compatibility" apps/ packages/ --include="*.ts" --include="*.tsx" | grep -i -E "(function|const|type)" > legacy_code.txt
if [ -s legacy_code.txt ]; then
  echo "❌ CRITICAL: Legacy/fallback code found (FORBIDDEN):"
  cat legacy_code.txt
  exit 1
else
  echo "✅ No legacy/fallback code detected"
fi

# Check for old vs new function patterns
grep -r -E "(old|new).*function" apps/ packages/ --include="*.ts" --include="*.tsx" > old_new_patterns.txt
if [ -s old_new_patterns.txt ]; then
  echo "❌ Old/new function patterns found (should be refactored completely):"
  cat old_new_patterns.txt
else
  echo "✅ No old/new function patterns detected"
fi
```

---

## 7. Test Execution Commands

### 7.1 How to Run Each Test Category

**Run All Architectural Tests:**
```bash
chmod +x docs/test.md
# Extract and run architectural tests
sed -n '/### 1.1/,/### 1.2/p' docs/test.md | grep -A20 "^```bash" | grep -v "^```" | bash
```

**Run Import/Export Tests:**
```bash
# NO barrel files validation
find apps packages -name "index.ts" -not -path "*/node_modules/*" | wc -l
# Should be 0 or only valid ESLint-disabled files

# NO 'src' in imports test
grep -r "from.*src/" apps/ packages/ --include="*.ts" --include="*.tsx" | wc -l
# Should be 0
```

**Run React Pattern Tests:**
```bash
# useCallback enforcement
grep -r "onClick={() =>" apps/web/src --include="*.tsx" | wc -l
# Should be 0 (ESLint enforced)

# errorBoundary usage
grep -c "errorBoundary" apps/web/src/components/SearchAnalyzer.tsx
# Should be > 0 for async operations
```

**Run TypeScript Tests:**
```bash
# Type vs interface
grep -r "^interface" apps/ packages/ --include="*.ts" --include="*.tsx" | wc -l
# Should be 0 (ESLint enforced)

# Full type checking
pnpm run type-check
# Must pass without errors
```

### 7.2 Expected Outcomes

**✅ PASS Criteria:**
- Zero barrier files detected
- Zero 'src' in import paths
- Zero inline event handlers  
- Zero interface declarations
- ESLint passes completely
- TypeScript compilation succeeds
- No legacy/fallback code found

**❌ FAIL Scenarios:**
- Any barrel files found (index.ts re-exports)
- 'src' directory in import paths
- Direct boolean evaluation in JSX
- interface instead of type declarations
- ESLint or TypeScript errors
- Duplicate functions without proper consolidation
- Legacy compatibility code detected

### 7.3 Automated Test Runner

**Complete Test Suite:**
```bash
#!/bin/bash
echo "🚀 Running Coding Standards Test Suite..."

# Counter for failed tests
FAILED_TESTS=0

# Test 1: NO Barrel Files
echo "📁 Testing NO barrel files policy..."
BARREL_COUNT=$(find apps packages -name "index.ts" -not -path "*/node_modules/*" | wc -l)
if [ "$BARREL_COUNT" -gt 1 ]; then  # Allow 1 for the valid ESLint-disabled case
  echo "❌ Barrel files policy violation"
  FAILED_TESTS=$((FAILED_TESTS + 1))
else
  echo "✅ NO barrel files policy enforced"
fi

# Test 2: NO 'src' in imports
echo "📥 Testing import path standards..."
SRC_IMPORTS=$(grep -r "from.*src/" apps/ packages/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$SRC_IMPORTS" -gt 0 ]; then
  echo "❌ 'src' found in import paths"
  FAILED_TESTS=$((FAILED_TESTS + 1))
else
  echo "✅ Import paths exclude 'src' directory"
fi

# Test 3: ESLint compliance
echo "📋 Testing ESLint compliance..."
if pnpm run lint > /dev/null 2>&1; then
  echo "✅ ESLint passes"
else
  echo "❌ ESLint failures found"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 4: TypeScript compliance  
echo "🔧 Testing TypeScript compliance..."
if pnpm run type-check > /dev/null 2>&1; then
  echo "✅ TypeScript compilation passes"
else
  echo "❌ TypeScript errors found"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 5: Interface vs Type
echo "📝 Testing type declarations..."
INTERFACE_COUNT=$(grep -r "^interface\|^export interface" apps/ packages/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
if [ "$INTERFACE_COUNT" -gt 0 ]; then
  echo "❌ interface declarations found (use type instead)"
  FAILED_TESTS=$((FAILED_TESTS + 1))
else
  echo "✅ Uses type over interface"
fi

# Final Results
echo ""
echo "📊 Test Results Summary:"
if [ "$FAILED_TESTS" -eq 0 ]; then
  echo "🎉 ALL TESTS PASSED! Coding standards fully compliant."
  exit 0
else
  echo "💥 $FAILED_TESTS TESTS FAILED! See details above."
  exit 1
fi
```

---

## 8. Validation Criteria

### 8.1 Critical Requirements (MUST PASS)

1. **Zero barrel files** - NO index.ts re-exports allowed
2. **NO 'src' in import paths** - imports must exclude src directory
3. **useCallback for event handlers** - ESLint enforced, zero exceptions
4. **errorBoundary for async operations** - all React async must be wrapped
5. **Explicit boolean coercion** - use !! for conditional rendering
6. **type over interface** - ESLint enforced declarations
7. **One function per file** - utilities have single responsibility
8. **Complete refactors only** - NO fallback/legacy code allowed

### 8.2 Quality Metrics

- **ESLint compliance**: 100% pass rate required
- **TypeScript compilation**: Zero errors required  
- **Import consistency**: Full path imports for all packages
- **React patterns**: useCallback + errorBoundary coverage
- **Code organization**: Domain-based directory structure
- **Naming conventions**: camelCase files, PascalCase components/types

### 8.3 Failure Response

When tests fail:

1. **Immediate fix required** for critical violations
2. **Refactor completely** - don't add compatibility layers
3. **Update all usage sites** when changing function signatures
4. **Search and consolidate** before creating new functions
5. **Run full test suite** before committing changes

This comprehensive test suite ensures the project maintains its high coding standards and architectural consistency throughout development.