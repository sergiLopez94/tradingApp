#!/bin/bash

# Trading App Launch Script
# Starts both backend (Spring Boot) and frontend (Vite React)
# Automatically installs dependencies and compiles the project

echo "🚀 Starting Trading App..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup on script exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down Trading App...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ App stopped${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Setup Backend
echo -e "${YELLOW}Setting up Backend (installing dependencies and compiling)...${NC}"
cd "$SCRIPT_DIR/backend"
if ! mvn clean install -q > /tmp/trading_backend_setup.log 2>&1; then
    echo -e "${RED}✗ Backend setup failed. Check /tmp/trading_backend_setup.log${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend setup complete${NC}"

# Setup Frontend
echo -e "${YELLOW}Setting up Frontend (installing dependencies)...${NC}"
cd "$SCRIPT_DIR/frontend"
if ! npm install -q > /tmp/trading_frontend_setup.log 2>&1; then
    echo -e "${RED}✗ Frontend setup failed. Check /tmp/trading_frontend_setup.log${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend setup complete${NC}"

# Start Backend
echo -e "${YELLOW}Starting Backend (Spring Boot)...${NC}"
cd "$SCRIPT_DIR/backend"
mvn spring-boot:run > /tmp/trading_backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo "  Logs: /tmp/trading_backend.log"
sleep 3

# Start Frontend
echo -e "${YELLOW}Starting Frontend (Vite React)...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev > /tmp/trading_frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo "  Logs: /tmp/trading_frontend.log"
sleep 2

echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Trading App is running!${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend:  http://localhost:8080"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the app${NC}"
echo ""

# Keep the script running
wait
