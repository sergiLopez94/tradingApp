# Trading App - End-to-End Tests

Selenium WebDriver tests for the Trading App.

## Requirements

- Node.js 18+
- Chrome browser installed
- **No ChromeDriver installation needed!** ✨

### Automatic Driver Management

This project uses Selenium WebDriver 4.x with **Selenium Manager**, which automatically:
- Detects your Chrome browser version
- Downloads the matching ChromeDriver version
- Manages driver updates when Chrome updates

**No manual ChromeDriver installation or version management required!** This works seamlessly across different machines with different Chrome versions.

## Installation

```bash
npm install
```

## Running Tests

### Normal Mode (with browser visible)
```bash
npm run test:e2e
```

### Headless Mode
```bash
npm run test:e2e:headless
```

## Prerequisites

Before running E2E tests, make sure:
1. Backend is running on http://localhost:8080
2. Frontend is running on http://localhost:5173

### Start Backend
```bash
cd ../backend
mvn spring-boot:run
```

### Start Frontend
```bash
cd ../frontend
npm run dev
```

## Environment Variables

- `FRONTEND_URL` - Frontend URL (default: http://localhost:5173)
- `BACKEND_URL` - Backend API URL (default: http://localhost:8080)

## Test Coverage

Tests cover:
- Frontend loads correctly
- Navigation between views (Portfolio, History, Client)
- Portfolio display and functionality
- Transaction history display
- Client profile and file upload
- Filtering and sorting
- Complete user workflows

## Troubleshooting

### Chrome Version Issues
If you encounter ChromeDriver version mismatches, simply:
1. Update Chrome to the latest version
2. Run `npm install` again
3. Selenium Manager will auto-download the correct driver

### First Run
The first time you run tests, Selenium Manager will download the ChromeDriver. This may take a few seconds.
