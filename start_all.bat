@echo off
title AutoValuate Launcher
echo ========================================================
echo   AutoValuate: Starting Full System (Backend + Frontend)
echo ========================================================
start "AutoValuate Backend (Port 8000)" cmd /k ""C:\Users\lemsb\anaconda3\python.exe" run_backend.py"
start "AutoValuate Frontend (Port 3000)" cmd /k "npm --prefix frontend run dev"
echo.
echo Both servers have been launched in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000
echo - Docs:     http://localhost:8000/docs
echo.
echo You can minimize this window.
timeout /t 5
