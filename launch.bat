@echo off
REM Trading App Launch Script (Windows)
REM Starts both backend (Spring Boot) and frontend (Vite React)

echo.
echo ========================================
echo Trading App Launch Script
echo ========================================
echo.

REM Get the directory where the script is located
setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0

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
