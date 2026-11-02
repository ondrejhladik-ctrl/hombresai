@echo off
title hombresai
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed.
  echo   Download the LTS version from https://nodejs.org and run this file again.
  echo.
  pause
  exit /b 1
)
node server.js --open
if errorlevel 1 pause
