@echo off
echo ========================================
echo   TripTogether - Starting Backend Server
echo ========================================
echo.
echo Installing dependencies...
cd backend
pip install -r requirements.txt
echo.
echo Starting FastAPI server...
echo Server will run at http://localhost:8000
echo.
python main.py
pause
