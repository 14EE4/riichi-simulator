@echo off
chcp 65001 > nul
title Riichi Mahjong Simulator

echo ========================================================
echo    Riichi Mahjong Simulator (vs Mortal AI x3)
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo [1/2] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH!
    pause
    exit /b 1
)

echo [2/2] Starting Mahjong Simulator Server...
echo Game will automatically open in your default browser at:
echo http://localhost:8000
echo.

python backend/server.py

pause
