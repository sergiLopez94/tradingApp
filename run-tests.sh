#!/bin/bash

# ============================================================================
# Trading App - Complete Test Suite Execution Script
# ============================================================================
#
# This script automatically runs all tests with dependency checking and
# clean builds. It's designed to work on any machine without manual setup.
#
# FEATURES:
#   ✅ Automatic dependency verification (Java, Maven, Node.js, npm)
#   ✅ Clean backend compilation before tests
#   ✅ Automatic frontend dependency installation
#   ✅ Backend unit and integration tests with coverage
#   ✅ Frontend unit tests with coverage
#   ✅ Generates HTML coverage reports
#
# USAGE:
#   ./run-tests.sh
#
# REQUIREMENTS:
#   - Java 17+  : https://adoptium.net/
#   - Maven 3.6+: brew install maven (macOS) or https://maven.apache.org/
#   - Node.js 18+: https://nodejs.org/
#
# OUTPUT:
#   - Test results displayed in terminal
#   - Coverage reports: test-reports/backend-coverage/index.html
#                      test-reports/frontend-coverage/index.html
#
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# ============================================================================
# DEPENDENCY CHECKS
# ============================================================================
print_header "Checking Required Dependencies"

# Check for Java
print_info "Checking for Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}')
    print_success "Java found: $JAVA_VERSION"
else
    print_error "Java not found. Please install Java 17 or higher."
    echo "   Download from: https://adoptium.net/"
    exit 1
fi

# Check for Maven
print_info "Checking for Maven..."
if command -v mvn &> /dev/null; then
    MVN_VERSION=$(mvn -version | head -n 1 | awk '{print $3}')
    print_success "Maven found: $MVN_VERSION"
else
    print_error "Maven not found. Please install Maven 3.6 or higher."
    echo "   macOS:   brew install maven"
    echo "   Ubuntu:  sudo apt install maven"
    echo "   Windows: Download from https://maven.apache.org/"
    exit 1
fi

# Check for Node.js
print_info "Checking for Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18 or higher."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check for npm
print_info "Checking for npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. It should come with Node.js installation."
    exit 1
fi

echo ""
print_success "All required dependencies are installed!"
echo ""

# Create reports directory
mkdir -p test-reports

print_header "Trading App - Complete Test Suite"
echo ""
echo "This script will run:"
echo "  1. Backend Unit Tests (JUnit)"
echo "  2. Backend Integration Tests"
echo "  3. Backend Code Coverage (JaCoCo)"
echo "  4. Frontend Unit Tests (Vitest)"
echo "  5. Frontend Code Coverage"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# ============================================================================
# 1. BACKEND CLEAN BUILD & UNIT TESTS
# ============================================================================
print_header "1. Backend Clean Build & Unit Tests"
cd backend

print_info "Cleaning previous build artifacts..."
if mvn clean; then
    print_success "Build artifacts cleaned"
else
    print_warning "Clean command had issues, continuing..."
fi

print_info "Compiling backend and running unit tests..."
if mvn test -Dtest=*Test; then
    print_success "Backend compilation and unit tests passed"
else
    print_error "Backend unit tests failed"
    cd ..
    exit 1
fi

cd ..

# ============================================================================
# 2. BACKEND INTEGRATION TESTS
# ============================================================================
print_header "2. Running Backend Integration Tests"
cd backend

if mvn test -Dtest=*IntegrationTest; then
    print_success "Backend integration tests passed"
else
    print_error "Backend integration tests failed"
    exit 1
fi

cd ..

# ============================================================================
# 3. BACKEND CODE COVERAGE
# ============================================================================
print_header "3. Generating Backend Code Coverage Report"
cd backend

if mvn jacoco:report; then
    print_success "Backend coverage report generated"
    echo "   📊 Report: backend/target/site/jacoco/index.html"
    
    # Copy report to test-reports
    if [ -d "target/site/jacoco" ]; then
        cp -r target/site/jacoco ../test-reports/backend-coverage
        print_success "Coverage report copied to test-reports/backend-coverage/"
    fi
else
    print_warning "Backend coverage report generation failed"
fi

cd ..

# ============================================================================
# 4. FRONTEND DEPENDENCY INSTALLATION & UNIT TESTS
# ============================================================================
print_header "4. Frontend Dependency Installation & Unit Tests"
cd frontend

# Always ensure dependencies are up to date
if [ ! -d "node_modules" ]; then
    print_info "node_modules not found, installing dependencies..."
    if npm install; then
        print_success "Frontend dependencies installed"
    else
        print_error "Failed to install frontend dependencies"
        cd ..
        exit 1
    fi
else
    print_info "Verifying frontend dependencies are up to date..."
    if npm ci --quiet 2>/dev/null || npm install; then
        print_success "Frontend dependencies verified"
    else
        print_warning "Dependency check had issues, continuing with existing packages..."
    fi
fi

print_info "Running frontend unit tests..."
if npm test -- --run; then
    print_success "Frontend unit tests passed"
else
    print_error "Frontend unit tests failed"
    cd ..
    exit 1
fi

cd ..

# ============================================================================
# 5. FRONTEND CODE COVERAGE
# ============================================================================
print_header "5. Generating Frontend Code Coverage Report"
cd frontend

if npm run test:coverage; then
    print_success "Frontend coverage report generated"
    echo "   📊 Report: frontend/coverage/index.html"
    
    # Copy report to test-reports
    if [ -d "coverage" ]; then
        cp -r coverage ../test-reports/frontend-coverage
        print_success "Coverage report copied to test-reports/frontend-coverage/"
    fi
else
    print_warning "Frontend coverage report generation failed"
fi

cd ..

# ============================================================================
# SUMMARY
# ============================================================================
print_header "Test Suite Summary"

echo ""
print_success "All automated tests completed successfully! 🎉"
echo ""
echo "📊 Coverage Reports:"
echo "   - Backend:  test-reports/backend-coverage/index.html"
echo "   - Frontend: test-reports/frontend-coverage/index.html"
echo ""
echo "📈 Quick Stats:"
if [ -f "test-reports/backend-coverage/index.html" ]; then
    echo "   - Backend tests: ✅ Passed"
fi
if [ -f "test-reports/frontend-coverage/index.html" ]; then
    echo "   - Frontend tests: ✅ Passed"
fi
echo ""
echo "📝 Additional Tests (Manual Execution):"
echo ""
echo "   E2E Tests (Selenium):"
echo "   ---------------------"
echo "   1. Start backend:  cd backend && mvn spring-boot:run"
echo "   2. Start frontend: cd frontend && npm run dev"
echo "   3. Run E2E tests:  cd e2e && npm install && npm run test:e2e"
echo ""
echo "   Load Tests (K6):"
echo "   ----------------"
echo "   1. Start backend:  cd backend && mvn spring-boot:run"
echo "   2. Run load test:  cd load-tests && k6 run load-test.js"
echo ""
echo "🔍 To view coverage reports:"
echo "   - Backend:  open test-reports/backend-coverage/index.html"
echo "   - Frontend: open test-reports/frontend-coverage/index.html"
echo ""
print_success "Test execution complete! All dependencies verified and tests passed! 🎉"
