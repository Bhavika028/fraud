@echo off
echo ======================================================
echo   AETHER GUARDIAN: Distributed Fraud Detection System
echo ======================================================

if not exist "dashboard\node_modules\" (
    echo [0/2] Installing Dashboard dependencies (npm install)...
    cmd /c "cd dashboard && npm install"
)

echo [1/2] Initializing Fraud Detection Backend (Spring Boot)...
start "BACKEND-API" cmd /k "cd ingestion-service && mvn spring-boot:run"

echo [2/2] Initializing Dashboard (React UI)...
start "DASHBOARD" cmd /k "cd dashboard && npm run dev"

echo.
echo All components are starting in separate windows.
echo Dashboard will be available at http://localhost:5173
echo ======================================================
pause
