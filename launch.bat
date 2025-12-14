@echo off
REM Trading App Launch Script (Windows)
REM Starts both backend (Spring Boot) and frontend (Vite React)
REM Automatically installs dependencies and compiles the project

echo.
echo ========================================
echo Trading App Launch Script
echo ========================================
echo.

REM Get the directory where the script is located
setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0

REM Setup Backend
echo Setting up Backend (installing dependencies and compiling)...
cd /d "%SCRIPT_DIR%backend"
call mvn clean install -q
if errorlevel 1 (
    echo ERROR: Backend setup failed. Check Maven logs above.
    pause
    exit /b 1
)
echo Backend setup complete.
echo.

REM Setup Frontend
echo Setting up Frontend (installing dependencies)...
cd /d "%SCRIPT_DIR%frontend"
call npm install -q
if errorlevel 1 (
    echo ERROR: Frontend setup failed. Check npm logs above.
    pause
    exit /b 1
)
echo Frontend setup complete.
echo.

REM Start Backend
echo Starting Backend (Spring Boot)...
cd /d "%SCRIPT_DIR%backend"
start "Trading App Backend" cmd /k "mvn spring-boot:run"
timeout /t 3 /nobreak

REM Start Frontend
echo Starting Frontend (Vite React)...
cd /d "%SCRIPT_DIR%frontend"
start "Trading App Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak

echo.
echo ========================================
echo Trading App is running!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8080
echo.
echo Close the command windows to stop the app.
echo.
pause
