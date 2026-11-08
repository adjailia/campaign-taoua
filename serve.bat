@echo off
setlocal
cd /d "%~dp0"

set PORT=8080

where py >nul 2>nul
if %errorlevel%==0 (
  echo فتح الصفحة على http://localhost:%PORT%
  start "" /min cmd /c "timeout /t 2 >nul & start http://localhost:%PORT%"
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo فتح الصفحة على http://localhost:%PORT%
  start "" /min cmd /c "timeout /t 2 >nul & start http://localhost:%PORT%"
  python -m http.server %PORT%
  goto :eof
)

echo.
echo Python غير مثبت على هذا الجهاز.
echo يمكنك استخدام إضافة Live Server في VS Code، أو النشر على GitHub Pages.
echo.
pause
