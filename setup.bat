@echo off
REM SafeHer MVP - Quick Start Setup Script (Windows)
REM This script helps you set up the development environment quickly

echo ========================================
echo   SafeHer MVP - Quick Start Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    echo         Download from: https://nodejs.org/
    pause
    exit /b 1
)

node -v
echo [OK] Node.js detected
echo.

REM Check for .env files
echo [STEP] Checking environment files...

if not exist ".env" (
    echo [WARN] Frontend .env not found. Creating from template...
    copy .env.example .env >nul
    echo [OK] Created .env - Please fill in your Firebase credentials
    set ENV_NEEDS_CONFIG=1
)

if not exist "backend\.env" (
    echo [WARN] Backend .env not found. Creating from template...
    copy backend\.env.example backend\.env >nul
    echo [OK] Created backend\.env - Please fill in your configuration
    set ENV_NEEDS_CONFIG=1
)

if defined ENV_NEEDS_CONFIG (
    echo.
    echo [IMPORTANT] Environment files created but need configuration!
    echo   1. Edit .env with your Firebase credentials
    echo   2. Edit backend\.env with your service account and API keys
    echo   3. See README.md for detailed setup instructions
    echo.
    pause
)

echo.
echo [STEP] Installing dependencies...
echo.

REM Install frontend dependencies
echo Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend dependency installation failed
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend dependency installation failed
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Backend dependencies installed

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start the development servers:
echo.
echo   Option 1 - Run both servers together:
echo   npm run dev:all
echo.
echo   Option 2 - Run servers separately:
echo   Terminal 1: cd backend ^&^& npm run dev
echo   Terminal 2: npm run dev
echo.
echo For detailed setup instructions, see README.md
echo For troubleshooting, see README.md -^> Troubleshooting section
echo.
echo Access the app at: http://localhost:5173
echo Backend API at: http://localhost:5000
echo.
pause
