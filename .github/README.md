# GitHub Actions CI/CD Workflows

This directory contains comprehensive GitHub Actions workflows for automated testing, security, and deployment.

## Workflows Overview

### 🧪 test.yml - Main Test Suite
**Triggers**: Push/PR to `main` or `develop` branches
**Purpose**: Comprehensive testing pipeline with parallel execution

**Jobs**:
- **Changes Detection**: Smart path filtering to optimize job execution
- **Setup**: Environment preparation with pnpm caching
- **Code Quality**: Linting and type checking on Node.js 18.x & 20.x
- **Unit Tests**: Parallel execution across all workspaces
- **Integration Tests**: Cross-component testing
- **E2E Tests**: End-to-end testing with Playwright
- **Coverage**: Code coverage reporting with Codecov
- **Performance**: Bundle size and performance benchmarks (main branch only)
- **Security**: Dependency auditing
- **Build Verification**: Multi-version build testing

**Key Features**:
- Matrix testing on Node.js 18.x and 20.x
- Parallel execution for maximum efficiency
- Smart caching for dependencies and node_modules
- Artifact upload for test results and coverage
- Excludes sync-worker from all test suites (per requirements)
- Performance testing only on main branch

### 🛡️ codeql.yml - Security Analysis
**Triggers**: Push/PR to main branches, weekly schedule
**Purpose**: Static code analysis for security vulnerabilities

**Features**:
- JavaScript and TypeScript analysis
- Security-extended queries
- Automated security alerts

### 📦 dependencies.yml - Dependency Management
**Triggers**: Weekly schedule, manual dispatch, dependency changes
**Purpose**: Automated dependency updates and security monitoring

**Features**:
- Weekly dependency updates via PR
- Security audit on every dependency change
- Automated testing after updates
- Dependency review on PRs

### ✅ pr-validation.yml - Pull Request Validation
**Triggers**: PR opened/updated
**Purpose**: Enhanced PR validation and feedback

**Features**:
- Semantic PR title validation
- Bundle size analysis
- Change impact analysis
- Automated PR commenting
- Breaking change detection

## Configuration Files

### playwright.config.ts
End-to-end test configuration:
- Chromium-based testing
- HTML and JUnit reporting
- Screenshot on failure
- Retry on CI failure

### E2E Tests
- Located in `tests/e2e/`
- Basic home page functionality tests
- Responsive design testing
- Navigation testing

## Project-Specific Exclusions

**sync-worker Exclusion**:
- Explicitly excluded from all test suites
- No test configuration for sync-worker workspace
- Documented in vitest configurations
- MQTT functionality excluded from testing

## Caching Strategy

**Dependencies**:
- pnpm store caching
- node_modules caching per lockfile hash
- Build artifact caching (short retention)

**Artifacts**:
- Test results: 7 days retention
- Coverage reports: 30 days retention  
- Security audits: 30 days retention
- Playwright reports: 30 days retention

## Environment Variables

**Required Secrets**:
- `CODECOV_TOKEN`: For coverage reporting
- `GITHUB_TOKEN`: For automated PRs and comments

**Environment Variables**:
- `NODE_ENV=test`: For test execution
- `FORCE_COLOR=1`: Colored output in CI
- `PLAYWRIGHT_WORKERS=2`: E2E test parallelization

## Workflow Triggers Summary

| Workflow | Push | PR | Schedule | Manual |
|----------|------|----|---------|---------| 
| test.yml | ✅ main/develop | ✅ main/develop | ❌ | ❌ |
| codeql.yml | ✅ main/develop | ✅ main/develop | ✅ Weekly | ❌ |
| dependencies.yml | ✅ dep changes | ❌ | ✅ Weekly | ✅ |
| pr-validation.yml | ❌ | ✅ main/develop | ❌ | ❌ |

## Monitoring and Reporting

**GitHub Checks**:
- All workflows appear as status checks
- Required checks can be configured in branch protection
- Detailed step summaries in workflow runs

**Notifications**:
- Failed workflow notifications
- PR comments with validation results
- Security alert notifications

## Performance Optimizations

1. **Concurrency**: Cancels old workflow runs on new pushes
2. **Path Filtering**: Skips jobs when irrelevant files change
3. **Parallel Execution**: Matrix strategies and job parallelization
4. **Smart Caching**: Multi-level dependency caching
5. **Conditional Jobs**: Skip unnecessary work based on changes

## Best Practices Implemented

- ✅ Fail fast on critical issues
- ✅ Comprehensive error handling
- ✅ Artifact retention policies
- ✅ Security scanning integration
- ✅ Performance monitoring
- ✅ Automated dependency management
- ✅ PR feedback automation
- ✅ Matrix testing for compatibility