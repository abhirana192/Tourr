@echo off
setlocal
cd /d "%~dp0"
title Tour Manager Launcher

where node >nul 2>&1
if errorlevel 1 goto missing_node

node -e "const [major,minor] = process.versions.node.split('.').map(Number); process.exit((major === 20 && minor >= 19) || (major === 22 && minor >= 12) || major > 22 ? 0 : 1)"
if errorlevel 1 goto wrong_node_version

set "PNPM_CMD=pnpm"
where pnpm >nul 2>&1
if errorlevel 1 (
  where corepack >nul 2>&1
  if errorlevel 1 goto missing_pnpm
  set "PNPM_CMD=corepack pnpm"
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Installing project dependencies...
  call %PNPM_CMD% install --frozen-lockfile
  if errorlevel 1 goto startup_failed
)

echo Building Tour Manager...
call %PNPM_CMD% build
if errorlevel 1 goto startup_failed

powershell -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/api/ping' -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if errorlevel 1 (
  echo Starting the local server...
  start "Tour Manager Server" cmd /k "cd /d ""%~dp0"" && call %PNPM_CMD% start"
  powershell -NoProfile -Command "$deadline = (Get-Date).AddSeconds(45); do { try { $response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/api/ping' -TimeoutSec 2; if ($response.StatusCode -eq 200) { exit 0 } } catch {}; Start-Sleep -Seconds 1 } while ((Get-Date) -lt $deadline); exit 1"
  if errorlevel 1 goto server_failed
)

start "" "http://localhost:3000"
echo Tour Manager is running at http://localhost:3000
pause
exit /b 0

:missing_node
echo Node.js 22.12 or later is required. Install Node.js, then run this file again.
goto startup_failed

:wrong_node_version
echo This app needs Node.js 20.19+, 22.12+, or a newer supported release.
goto startup_failed

:missing_pnpm
echo pnpm or Corepack is required. Install Node.js with Corepack, then run this file again.
goto startup_failed

:server_failed
echo The server did not respond. Check the Tour Manager Server window for errors.
goto startup_failed

:startup_failed
echo Tour Manager could not start. Fix the message above and run this file again.
pause
exit /b 1
