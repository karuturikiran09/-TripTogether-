@echo off
echo ========================================
echo   TripTogether - Starting Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server on port 8080...
cd backend
start "TripTogether Backend" cmd /k "python main.py"
cd ..

echo.
echo [2/2] Starting Frontend Server on port 3000...
cd frontend
start "TripTogether Frontend" cmd /k "python -m http.server 3000"
cd ..

echo.
echo ========================================
echo   Servers Started Successfully!
echo ========================================
echo.
echo Backend API: http://localhost:8080
echo Frontend: http://localhost:3000
echo Admin Panel: http://localhost:3000/admin/admin.html
echo.
echo Wait 5 seconds for servers to start, then:
timeout /t 5 /nobreak > nul
echo Opening website...
start "" "http://localhost:3000"

echo.
echo Press any key to close this window...
pause > nul