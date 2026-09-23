@echo off
title NOVA CARRY - Local Server
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    py -m venv .venv
)

echo Installing requirements...
".venv\Scripts\python.exe" -m pip install -r requirements.txt

echo.
echo Starting NOVA CARRY...
echo Open http://127.0.0.1:5000 in your browser.
echo Press CTRL+C to stop.
echo.
".venv\Scripts\python.exe" app.py
pause
