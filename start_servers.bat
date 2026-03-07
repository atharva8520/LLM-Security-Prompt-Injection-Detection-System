@echo off
echo ==================================================
echo   🚀 STARTING FULL LLM SECURITY SHIELD SYSTEM 🚀
echo ==================================================
echo.

echo [1/3] Starting Python ML Server on port 5001...
start "" cmd /c "cd ml && python ml_server.py || echo Failed to start ML Server. Did you install requirements? && pause"

echo [2/3] Starting Node.js Backend Server on port 5000...
start "" cmd /c "cd backend && npm install && node server.js || echo Failed to start Backend. && pause"

echo [3/3] Starting React Frontend Server on port 5173...
start "" cmd /c "cd frontend && npm install && npm run dev || echo Failed to start Frontend. && pause"

echo.
echo All 3 servers have been signaled to start in separate windows!
echo It might take 5-10 seconds for everything to completely spin up.
echo - React Frontend: http://localhost:5173
echo - Node Backend:   http://localhost:5000/api/health
echo - Python ML API:  http://localhost:5001/health
echo.
pause
