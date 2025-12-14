# Trading App

A full-stack trading application with React frontend and Spring Boot backend.

## Features

- Portfolio view with asset values
- Transaction history
- Client profile with file upload for processing

## Setup

### Prerequisites

- Java 17
- Node.js
- Maven

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

Upload a text file with the following format:

First line: clientId,name,email,birthDate

Subsequent lines: clientId,transactionId,date,asset,quantity,unitPrice,totalValue