# Trading App

A full-stack trading application with React frontend and Spring Boot backend, featuring comprehensive test coverage and automated testing infrastructure.

## 📋 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Setup Guide](#setup-guide)
- [Testing](#testing)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)

## ✨ Features

- **Portfolio Management**: Real-time asset valuation and aggregation
- **Transaction History**: Complete transaction tracking with profit/loss calculations
- **File Processing**: Upload and process trading documents (PDF, DOCX, TXT, MD)
- **Market Data**: Real-time price updates using Marketstack API
- **Interactive UI**: Filterable and sortable portfolio table
- **Responsive Design**: Trade Republic-inspired modern interface

## 🚀 Quick Start

### Prerequisites

- **Java 17+** ([Download](https://adoptium.net/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Maven 3.6+**
  - macOS: `brew install maven`
  - Ubuntu: `sudo apt install maven`
  - Windows: [Download](https://maven.apache.org/)

### One-Command Test Execution

Run all tests with automatic dependency checking:

```bash
./run-tests.sh
```

This automated script:
- ✅ Verifies all dependencies (Java, Maven, Node.js, npm)
- ✅ Performs clean backend build
- ✅ Auto-installs/updates frontend dependencies
- ✅ Runs all backend unit & integration tests
- ✅ Runs all frontend unit tests  
- ✅ Generates HTML coverage reports
- ✅ Copies reports to `test-reports/` directory

**Coverage Results**:
- Backend: View at `test-reports/backend-coverage/index.html`
- Frontend: View at `test-reports/frontend-coverage/index.html`

### Manual Application Startup

**Terminal 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Access the application at `http://localhost:5173`

## 🔧 Setup Guide

### 1. API Configuration

Get a free Marketstack API key: https://marketstack.com/

**Backend Configuration** (`.env` in project root):
```env
MARKETSTACK_API_KEY=your_api_key_here
SPRING_PROFILES_ACTIVE=development
```

**Frontend Configuration** (`frontend/.env.local`):
```env
VITE_MARKETSTACK_API_KEY=your_api_key_here
```

Or use the templates:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
# Then edit with your API keys
```

⚠️ **Important**: Never commit `.env` files to version control

### 2. Backend Setup

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

Server starts on `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Application starts on `http://localhost:5173`

## 🧪 Testing

### Test Coverage Overview

| Component | Type | Coverage | Tool |
|-----------|------|----------|------|
| Backend | Unit Tests | 100% passing | JUnit 5 + Mockito |
| Backend | Integration Tests | 100% passing | Spring Boot Test |
| Frontend | Unit Tests | 92.53% coverage | Vitest + React Testing Library |
| E2E | Functional Tests | 8+ scenarios | Selenium WebDriver |
| Load | Performance Tests | 500ms p95 | K6 |

### Running Tests

**All Automated Tests (Recommended):**
```bash
./run-tests.sh
```

**Backend Tests Only:**
```bash
cd backend
mvn test                    # All tests
mvn test -Dtest=*Test       # Unit tests only
mvn test -Dtest=*IntegrationTest  # Integration tests only
mvn jacoco:report           # Generate coverage
```

**Frontend Tests Only:**
```bash
cd frontend
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:ui             # UI mode
npm run test:coverage       # With coverage
```

**E2E Tests (Selenium):**
```bash
# Prerequisites: Start backend and frontend first
cd e2e
npm install
npm run test:e2e           # Normal mode
npm run test:e2e:headless  # Headless mode
```

**Features:**
- ✅ Automatic ChromeDriver management (Selenium Manager)
- ✅ Works with any Chrome version
- ✅ No manual driver installation needed

**Load Tests (K6):**
```bash
# Prerequisites: Start backend first
cd load-tests
k6 run load-test.js
```

Install K6:
- macOS: `brew install k6`
- Linux: See [K6 Installation Guide](https://k6.io/docs/get-started/installation/)

### Test Coverage Goals

- **Line Coverage**: >70%
- **Branch Coverage**: >70%
- **Function Coverage**: >80%
- **Current Achievement**: Backend 100%, Frontend 92.53%

### Test Files Structure

```
backend/src/test/java/
├── controller/
│   └── TradingControllerIntegrationTest.java  # API integration tests
└── service/
    └── FileProcessingServiceTest.java         # Unit tests

frontend/src/
├── test/
│   ├── App.test.tsx                           # App component tests
│   └── components/
│       ├── Header.test.tsx
│       ├── ClientView.test.tsx
│       ├── PortfolioView.test.tsx
│       └── HistoryView.test.tsx
└── utils/
    ├── calculations.test.ts                    # Portfolio calculations
    ├── aggregation.test.ts                     # Data aggregation
    └── filtering.test.ts                       # Filter/sort utilities

e2e/tests/
└── e2e.spec.ts                                 # Selenium E2E tests

load-tests/
└── load-test.js                                # K6 performance tests
```

## 💻 Development

### Project Structure

```
tradingApp/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/example/tradingapp/
│   │       ├── controller/  # REST controllers
│   │       ├── model/       # JPA entities
│   │       ├── repository/  # Data access
│   │       └── service/     # Business logic
│   └── src/test/java/       # Tests
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── utils/           # Utilities & calculations
│   │   └── assets/          # Static assets
│   └── coverage/            # Test coverage reports
├── e2e/                     # Selenium E2E tests
├── load-tests/              # K6 performance tests
├── test-reports/            # Consolidated test reports
│   ├── backend-coverage/
│   └── frontend-coverage/
└── run-tests.sh             # Automated test runner
```

### Available Scripts

**Backend:**
- `mvn clean install` - Build project
- `mvn spring-boot:run` - Start server
- `mvn test` - Run tests
- `mvn jacoco:report` - Generate coverage

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run test:coverage` - Coverage report
- `npm run lint` - Lint code
- `npm run preview` - Preview production build

### Code Quality

**Backend:**
- JUnit 5 for unit testing
- Mockito for mocking
- JaCoCo for coverage reporting
- Spring Boot Test for integration tests

**Frontend:**
- Vitest for unit testing
- React Testing Library for component tests
- V8 coverage provider
- ESLint for code quality
- TypeScript for type safety

## 📡 API Documentation

### REST Endpoints

**Transactions:**
```http
GET /api/transactions/{clientId}
Response: List<Transaction>
```

**Client Info:**
```http
GET /api/client/{clientId}
Response: Client
```

**File Upload:**
```http
POST /api/upload
Content-Type: multipart/form-data
Body: file (PDF, DOCX, TXT, MD)
Response: Client (with processed transactions)
```

**Market Data:**
```http
GET /api/market/prices?symbols=AAPL,MSFT
Response: Map<String, BigDecimal>
```

### Database Schema

**Client:**
- `id` (Long, Primary Key)
- `name` (String)
- `email` (String)
- `createdAt` (LocalDateTime)

**Transaction:**
- `id` (Long, Primary Key, Auto-generated)
- `clientId` (Long)
- `symbol` (String)
- `quantity` (BigDecimal)
- `price` (BigDecimal)
- `date` (LocalDate)
- `type` (String: BUY/SELL)

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Spring Boot 3.2.0
- Java 17
- Spring Data JPA
- H2 Database (dev) / PostgreSQL (prod)
- Maven
- JaCoCo (coverage)

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Vitest

**Testing:**
- JUnit 5 + Mockito (backend unit)
- Spring Boot Test (backend integration)
- Vitest + React Testing Library (frontend)
- Selenium WebDriver (E2E)
- K6 (load testing)

### Key Design Patterns

- **MVC**: Clean separation of concerns
- **Repository Pattern**: Data access abstraction  
- **Service Layer**: Business logic encapsulation
- **Component-Based**: Reusable React components
- **Utility Functions**: Separated calculations and data manipulation

### Development Workflow

1. **Feature Development**: Create feature branch
2. **Write Tests**: TDD approach (test first)
3. **Implementation**: Write code to pass tests
4. **Local Testing**: Run `./run-tests.sh`
5. **Code Review**: Ensure >80% coverage
6. **Integration**: Merge to main branch

## 📝 Additional Notes

### Environment Variables

All sensitive configuration should use environment variables:
- API keys
- Database credentials
- Service URLs
- Feature flags

### Troubleshooting

**Backend won't start:**
- Check Java version: `java -version` (need 17+)
- Check port 8080 availability
- Verify Maven installation: `mvn -version`

**Frontend won't start:**
- Check Node version: `node --version` (need 18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 5173 availability

**E2E tests fail:**
- Ensure backend running on port 8080
- Ensure frontend running on port 5173
- Chrome browser must be installed
- First run may take time (Selenium Manager downloads driver)

**Test coverage low:**
- Run `./run-tests.sh` to see current coverage
- Check test-reports/ for detailed HTML reports
- Focus on untested components/services

## 📄 License

MIT License - See LICENSE file for details
- `GET /api/client/{id}` - Get client information

## File Upload

Supports uploading depot statements in the following formats:
- PDF files
- Word documents (.docx)
- Text files (.txt)
- Markdown files (.md)
- HTML files (.html)

The system extracts and stores:
- Securities/Assets with ISIN codes
- Ticker symbols for real-time pricing
- Asset types (Stock, ETF, Bond, etc.)
- Transaction quantities and values
