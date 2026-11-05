@echo off
chcp 65001 > nul
title Riichi Mahjong Simulator

echo ========================================================
echo    Riichi Mahjong Simulator (vs Mortal AI x3)
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if not exist ".venv\Scripts\python.exe" (
    echo [1/3] Python virtual environment (.venv) not found. Creating .venv...
    python -m venv .venv --system-site-packages
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create virtual environment! Ensure Python 3.10+ is installed.
        pause
        exit /b 1
    )
    echo [2/3] Installing backend dependencies into .venv...
    ".venv\Scripts\python.exe" -m pip install -r backend/requirements.txt
) else (
    echo [1/2] Using virtual environment: .venv\Scripts\python.exe
)

echo [Run] Starting Mahjong Simulator Server...
echo Game will automatically open in your default browser at:
echo http://localhost:8000
echo.

".venv\Scripts\python.exe" backend/server.py

pause
