@echo off
echo ======================================================
echo   AETHER GUARDIAN: Consolidated Backend Engine
echo ======================================================
echo.

REM Check Java is installed
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in your PATH.
    echo.
    echo Please install Java 17 from: https://adoptium.net/
    echo After installing, reopen this terminal and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Java found.
echo.
echo Starting Spring Boot backend via Maven Wrapper...
echo Dashboard will be available at: http://localhost:8080
echo (Wait for "Started FraudDetectionApplication" message, then open your browser)
echo.

cd ingestion-service && mvnw.cmd spring-boot:run
pause
