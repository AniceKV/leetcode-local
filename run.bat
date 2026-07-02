@echo off
title LeetCode Company-wise Explorer Launcher
echo ==========================================================
echo       LeetCode Company-wise Interview Explorer Launcher
echo ==========================================================
echo.

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org to run this application.
    echo.
    pause
    exit /b 1
)

:: Check if node_modules directory exists
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies ...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Please check your internet connection and try again.
        pause
        exit /b 1
    )
)

:: Start Vite dev server and open browser automatically
echo [INFO] Starting Vite server and opening dashboard...
call npm run dev -- --open

pause
