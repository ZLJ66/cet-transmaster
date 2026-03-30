@echo off
echo Starting CET-TransMaster...
cd /d "%~dp0"
start http://localhost:3000
npm run dev
pause
