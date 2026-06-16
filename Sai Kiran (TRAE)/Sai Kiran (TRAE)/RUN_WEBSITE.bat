@echo off
echo ========================================
echo   TripTogether - Complete Setup
echo ========================================
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python main.py"
cd ..

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Opening Website...
start "" "frontend\index.html"

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Backend Server: http://localhost:8000
echo Frontend: Opened in default browser
echo Admin Panel: frontend/admin/admin.html
echo.
echo Press any key to exit...
pause > nul