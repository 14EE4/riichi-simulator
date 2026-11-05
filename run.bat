@echo off
chcp 65001 > nul
title Riichi Mahjong Simulator

echo ========================================================
echo    Riichi Mahjong Simulator - vs Mortal AI x3
echo ========================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

if exist ".venv\Scripts\python.exe" goto :RUN_SERVER

echo [1/3] Creating Python virtual environment [.venv]...
python -m venv .venv --system-site-packages
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create virtual environment! Ensure Python 3.10+ is installed.
    pause
    exit /b 1
)

echo [2/3] Installing backend dependencies into .venv...
".venv\Scripts\python.exe" -m pip install -r backend/requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies!
    pause
    exit /b 1
)

:RUN_SERVER
echo [1/2] Using virtual environment: .venv\Scripts\python.exe
echo [2/2] Starting Mahjong Simulator Server on http://localhost:8000 ...
echo.

".venv\Scripts\python.exe" backend/server.py

pause
