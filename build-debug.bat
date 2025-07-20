@echo off
cd /d "C:\Users\Administrator\Desktop\杂项\stock-scan\stock-backtest-frontend"
echo Starting build process...
pnpm run build
echo Build process completed with exit code: %ERRORLEVEL%
pause
