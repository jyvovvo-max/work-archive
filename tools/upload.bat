@echo off
cd /d "%~dp0"

echo.
echo  Portfolio Upload Tool
echo  =====================
echo  1. Upload all
echo  2. Dry-run preview
echo  3. Upload specific project
echo  4. Force re-upload all
echo  5. Force re-upload specific project
echo.
set CHOICE=
set /p CHOICE=Select 1-5:

if "%CHOICE%"=="1" goto upload_all
if "%CHOICE%"=="2" goto dry_run
if "%CHOICE%"=="3" goto specific
if "%CHOICE%"=="4" goto reorder_all
if "%CHOICE%"=="5" goto reorder_specific
echo Invalid choice: %CHOICE%
goto end

:upload_all
node upload.js
goto end

:dry_run
node upload.js --dry-run
goto end

:specific
set PROJECT=
set /p PROJECT=Folder name e.g. 2025-03_my-project:
node upload.js %PROJECT%
goto end

:reorder_all
node upload.js --reorder
goto end

:reorder_specific
set PROJECT=
set /p PROJECT=Folder name e.g. 2025-03_my-project:
node upload.js --reorder %PROJECT%
goto end

:end
echo.
pause
