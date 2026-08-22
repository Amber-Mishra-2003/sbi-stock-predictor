@echo off
REM Removes the daily update task registered by setup_scheduler.bat.

set "TASK_NAME=SBI_Stock_Daily_Update"

echo Removing scheduled task: %TASK_NAME%
schtasks /Delete /TN "%TASK_NAME%" /F

if %ERRORLEVEL% EQU 0 (
    echo [OK] Task removed.
) else (
    echo [INFO] Task did not exist or could not be removed.
)
