@echo off
REM ============================================================
REM   SBI Stock Predictor — Daily Data Updater
REM   Registers a Windows Task Scheduler job to run update_data.py
REM   every weekday at 4:00 PM (15 min after NSE market close).
REM ============================================================

setlocal

set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

set "PYTHON_EXE=%PROJECT_DIR%\venv\Scripts\python.exe"
set "SCRIPT_PATH=%PROJECT_DIR%\update_data.py"
set "LOG_PATH=%PROJECT_DIR%\logs\update_data.log"

set "TASK_NAME=SBI_Stock_Daily_Update"

echo.
echo === SBI Daily Updater — Task Scheduler Setup ===
echo Project dir : %PROJECT_DIR%
echo Python      : %PYTHON_EXE%
echo Script      : %SCRIPT_PATH%
echo Log file    : %LOG_PATH%
echo.

REM -- Sanity checks -------------------------------------------------
if not exist "%PYTHON_EXE%" (
    echo [ERROR] Python venv not found at: %PYTHON_EXE%
    echo Run:  python -m venv venv  then  pip install -r requirements.txt
    exit /b 1
)

if not exist "%SCRIPT_PATH%" (
    echo [ERROR] update_data.py not found at: %SCRIPT_PATH%
    exit /b 1
)

if not exist "%PROJECT_DIR%\logs" mkdir "%PROJECT_DIR%\logs"

REM -- Delete any prior task with the same name ----------------------
schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1

REM -- Register the task --------------------------------------------
REM /SC WEEKLY  /D MON,TUE,WED,THU,FRI  ->  weekdays only
REM /ST 16:00                          ->  4:00 PM (after NSE close at 3:30)
REM /RL HIGHEST                        ->  run with highest privileges
schtasks /Create ^
    /TN "%TASK_NAME%" ^
    /TR "\"%PYTHON_EXE%\" \"%SCRIPT_PATH%\" >> \"%LOG_PATH%\" 2>&1" ^
    /SC WEEKLY ^
    /D MON,TUE,WED,THU,FRI ^
    /ST 16:00 ^
    /RL HIGHEST ^
    /F

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to register task. Run this .bat as Administrator.
    exit /b 1
)

echo.
echo [OK] Task "%TASK_NAME%" registered successfully.
echo.
echo Quick checks:
echo   schtasks /Query /TN "%TASK_NAME%" /V /FO LIST
echo   schtasks /Run   /TN "%TASK_NAME%"          REM run now to test
echo.

endlocal
