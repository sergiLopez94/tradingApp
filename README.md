# Trading App

A full-stack trading application with React frontend and Spring Boot backend.

## Features

- Portfolio view with real-time asset valuation
- Transaction history and asset aggregation
- Client profile with file upload for processing (PDF, DOCX, TXT, MD)
- Real-time price updates using Marketstack API
- Filterable and sortable portfolio table

## Setup

### Prerequisites

- Java 17
- Node.js
- Maven

### Environment Configuration

#### 1. Get API Key

1. Sign up for a free Marketstack account: https://marketstack.com/
2. Copy your API key from the dashboard

#### 2. Configure Backend

Create a `.env` file in the project root:

```env
MARKETSTACK_API_KEY=your_api_key_here
SPRING_PROFILES_ACTIVE=development
```

Or use the provided template:
```bash
cp .env.example .env
# Then edit .env with your API key
```

#### 3. Configure Frontend

Create a `frontend/.env.local` file:

```env
VITE_MARKETSTACK_API_KEY=your_api_key_here
```

Or use the template:
```bash
cp frontend/.env.example frontend/.env.local
# Then edit frontend/.env.local with your API key
```

**Important:** Never commit `.env` or `.env.local` files to version control. These files are already in `.gitignore`.

### Backend

1. Navigate to `backend/` directory
2. Run `mvn clean install`
3. Run `mvn spring-boot:run`

The backend will start on `http://localhost:8080`

### Frontend

1. Navigate to `frontend/` directory
2. Run `npm install`
3. Run `npm run dev`

The frontend will start on `http://localhost:5173`

## API Endpoints

- `GET /api/transactions/{clientId}` - Get transaction history for a client
- `POST /api/upload` - Upload a file for processing
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
