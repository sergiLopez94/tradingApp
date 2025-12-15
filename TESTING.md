# Trading App - Testing Suite Documentation

## Overview

Comprehensive testing suite covering unit tests, integration tests, functional E2E tests, and load testing for the Trading App.

## Test Coverage Goals

- **Line Coverage**: >70%
- **Branch Coverage**: >70%
- **Function Coverage**: >80%
- **Multiple Condition Coverage**: >70%

## Test Types

### 1. Backend Unit Tests (JUnit 5)

**Location**: `backend/src/test/java/`

**Dependencies**:
- JUnit 5
- Mockito
- Spring Boot Test

**Coverage**:
- ✅ REQ-007: File upload processing
- ✅ REQ-013: Line-by-line file parsing with randomized data
- ✅ Edge cases: empty files, malformed data, special characters

**Run tests**:
```bash
cd backend
mvn test
```

**Run with coverage**:
```bash
mvn test jacoco:report
# View report: backend/target/site/jacoco/index.html
```

**Files**:
- `FileProcessingServiceTest.java` - 10+ test cases with randomized data
- Tests markdown, PDF, text file processing
- Tests transaction aggregation and averaging

### 2. Backend Integration Tests

**Location**: `backend/src/test/java/com/example/tradingapp/controller/`

**Coverage**:
- ✅ REQ-008: Frontend to backend file transfer
- ✅ REQ-010: REST API HTTP communication
- ✅ REQ-011: All API methods (GET transactions, GET client, POST upload)
- ✅ REQ-014: Database persistence and retrieval

**Run tests**:
```bash
cd backend
mvn test -Dtest=TradingControllerIntegrationTest
```

**Test scenarios**:
- API endpoint functionality
- Database integration (H2/PostgreSQL)
- Complete upload → persist → retrieve workflow
- CORS and content type handling

### 3. Frontend Unit Tests (Vitest)

**Location**: `frontend/src/utils/`

**Dependencies**:
- Vitest
- @testing-library/react
- @testing-library/jest-dom
- jsdom

**Coverage**:
- ✅ REQ-005: Portfolio value calculations
- ✅ Asset aggregation algorithms
- ✅ Profit/loss calculations
- ✅ REQ-017: Filtering and sorting utilities

**Run tests**:
```bash
cd frontend
npm test
```

**Run with UI**:
```bash
npm run test:ui
```

**Run with coverage**:
```bash
npm run test:coverage
# View report: frontend/coverage/index.html
```

**Files**:
- `calculations.test.ts` - Portfolio calculations (10+ test cases)
- `aggregation.test.ts` - Asset aggregation (5+ test cases)
- `filtering.test.ts` - Filter/sort utilities (8+ test cases)

### 4. E2E Tests (Selenium WebDriver)

**Location**: `e2e/tests/`

**Dependencies**:
- selenium-webdriver 4.x (with Selenium Manager)
- TypeScript
- ts-node

**Coverage**:
- ✅ REQ-001: Responsive frontend
- ✅ REQ-003: Header navigation
- ✅ REQ-005: Portfolio display
- ✅ REQ-006: History view
- ✅ REQ-007: Client view and file upload
- ✅ REQ-017: Filtering and sorting

**Prerequisites**:
```bash
# Terminal 1 - Start backend
cd backend && mvn spring-boot:run

# Terminal 2 - Start frontend
cd frontend && npm run dev

# Terminal 3 - Run E2E tests
cd e2e
npm install
npm run test:e2e
```

**ChromeDriver Management**:
- ✅ Automatic driver management via Selenium Manager
- ✅ Works with any Chrome version
- ✅ No manual installation required

**Test scenarios**:
- Frontend loads successfully
- Navigation between views (Portfolio, History, Client)
- Portfolio display and interactions
- Transaction history display
- File upload workflow
- Filtering and sorting functionality
- Complete user workflows

### 5. Load Tests (K6)

**Location**: `load-tests/`

**Dependencies**:
- K6 (install via brew on macOS or package manager on Linux)

**Coverage**:
- ✅ REQ-010: REST API performance
- ✅ Response time thresholds (p95 < 500ms)
- ✅ Error rate thresholds (< 5%)
- ✅ Concurrent user simulation

**Install K6**:
```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Run tests**:
```bash
# Prerequisites: Start backend first
cd backend && mvn spring-boot:run

# In another terminal
cd load-tests
k6 run load-test.js
```

**Test scenarios**:
- GET /api/transactions - Load test
- POST /api/upload - File upload performance
- Ramp-up, sustained load, and ramp-down phases
- 50 virtual users maximum
- 30-second duration

## Automated Test Execution

### Quick Run - All Tests

```bash
./run-tests.sh
```

This script automatically:
1. ✅ Checks dependencies (Java, Maven, Node.js, npm)
2. ✅ Performs clean backend build
3. ✅ Runs backend unit tests
4. ✅ Runs backend integration tests
5. ✅ Generates backend coverage report
6. ✅ Installs/updates frontend dependencies
7. ✅ Runs frontend unit tests
8. ✅ Generates frontend coverage report
9. ✅ Copies reports to `test-reports/` directory

**Output**:
- Backend coverage: `test-reports/backend-coverage/index.html`
- Frontend coverage: `test-reports/frontend-coverage/index.html`

## Test Coverage Reports

### Backend Coverage (JaCoCo)

**View report**:
```bash
open test-reports/backend-coverage/index.html
```

**Metrics**:
- Line coverage
- Branch coverage
- Instruction coverage
- Complexity

### Frontend Coverage (Vitest + V8)

**View report**:
```bash
open test-reports/frontend-coverage/index.html
```

**Metrics**:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

**Current Achievement**:
- Statements: 92.53%
- Branches: 84.21%
- Functions: 88.89%
- Lines: 92.53%

## Test Data

### Sample Test File

Location: `test_data.md`

This file contains a sample trading portfolio document that can be uploaded to test the file processing functionality. It includes:
- Various asset types (stocks, ETFs)
- Multiple currencies
- Different quantity formats
- Real-world data structure

## Troubleshooting

### Backend Tests Fail

**Check Java version**:
```bash
java -version  # Should be 17+
```

**Check Maven version**:
```bash
mvn -version  # Should be 3.6+
```

**Clean and rebuild**:
```bash
cd backend
mvn clean install
```

### Frontend Tests Fail

**Check Node.js version**:
```bash
node --version  # Should be 18+
```

**Reinstall dependencies**:
```bash
cd frontend
rm -rf node_modules
npm install
```

**Clear Vitest cache**:
```bash
npx vitest --clearCache
```

### E2E Tests Fail

**Prerequisites not met**:
- Backend must be running on port 8080
- Frontend must be running on port 5173
- Chrome browser must be installed

**First-time setup**:
```bash
cd e2e
npm install
```

**ChromeDriver issues**:
- Selenium Manager handles this automatically
- No manual configuration needed
- Works with any Chrome version

### Load Tests Fail

**K6 not installed**:
```bash
brew install k6  # macOS
```

**Backend not running**:
```bash
cd backend
mvn spring-boot:run
```

**Port conflicts**:
- Ensure port 8080 is not in use
- Check with: `lsof -i :8080`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Run backend tests
        run: cd backend && mvn test
      - name: Generate coverage
        run: cd backend && mvn jacoco:report

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests
        run: cd frontend && npm run test:coverage
```

## Best Practices

### Test Organization

1. **Keep tests close to source**: Test files should mirror source structure
2. **Use descriptive names**: Test names should explain what they verify
3. **One assertion per test**: Focus each test on a single concern
4. **Use test data builders**: Create reusable test data factories
5. **Mock external dependencies**: Isolate units under test

### Coverage Guidelines

1. **Aim for 80%+ coverage**: Balance between thoroughness and maintainability
2. **Focus on critical paths**: Prioritize business logic and edge cases
3. **Don't chase 100%**: Some code (getters/setters) doesn't need tests
4. **Test behavior, not implementation**: Focus on what code does, not how

### Continuous Testing

1. **Run tests before commit**: Use pre-commit hooks
2. **Run full suite before push**: Ensure nothing breaks
3. **Monitor coverage trends**: Track coverage over time
4. **Fix failing tests immediately**: Don't accumulate technical debt

## Summary

| Test Type | Location | Tool | Coverage |
|-----------|----------|------|----------|
| Backend Unit | `backend/src/test/java/` | JUnit 5 + Mockito | 100% passing |
| Backend Integration | `backend/src/test/java/` | Spring Boot Test | 100% passing |
| Frontend Unit | `frontend/src/test/` | Vitest + RTL | 92.53% coverage |
| E2E | `e2e/tests/` | Selenium WebDriver | 8+ scenarios |
| Load | `load-tests/` | K6 | Performance validated |

**Quick Commands**:
- All automated tests: `./run-tests.sh`
- Backend only: `cd backend && mvn test`
- Frontend only: `cd frontend && npm test`
- E2E: `cd e2e && npm run test:e2e` (requires running servers)
- Load: `cd load-tests && k6 run load-test.js` (requires running backend)
