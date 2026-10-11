@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title OpenTTD AI API MCP - One-Click Installer

:welcome
cls
echo.
echo =====================================================
echo   OpenTTD AI API MCP - One-Click Installer
echo =====================================================
echo.
echo I will install everything and connect it for you.
echo You do not need to know npm, JSON, MCP paths, or terminals.
echo.
echo I will:
echo   1. Check/install Node.js
echo   2. Install this MCP server
echo   3. Download/index the OpenTTD AI API docs
echo   4. Ask which AI app you use
echo   5. Connect the MCP automatically
echo.
echo Press any key to begin.
pause >nul

where node >nul 2>nul
if errorlevel 1 goto install_node
goto have_node

:install_node
cls
echo.
echo Node.js is missing. I will try to install it for you.
echo.
where winget >nul 2>nul
if errorlevel 1 goto no_node_installer

echo Installing Node.js LTS with Windows Package Manager...
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
if errorlevel 1 goto failed
set "PATH=%ProgramFiles%\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto rerun
goto have_node

:no_node_installer
cls
echo.
echo =====================================================
echo   One tiny thing needs your help
echo =====================================================
echo.
echo Windows does not have 'winget', so I cannot install Node.js automatically.
echo.
echo 1. Install Node.js LTS from:
echo    https://nodejs.org/
echo 2. Come back here.
echo 3. Double-click INSTALL-WINDOWS.cmd again.
echo.
pause
exit /b 1

:rerun
cls
echo.
echo Node.js was installed successfully, but Windows has not refreshed PATH yet.
echo.
echo Close this window and double-click INSTALL-WINDOWS.cmd one more time.
echo After that, the rest is automatic.
echo.
pause
exit /b 0

:have_node
cls
echo.
echo =====================================================
echo   Installing the MCP
echo =====================================================
echo.
echo Found Node.js:
node --version
for /f %%V in ('node -p "process.versions.node.split('.')[0]"') do set "NODE_MAJOR=%%V"
if %NODE_MAJOR% LSS 20 goto old_node

call npm --version >nul 2>nul
if errorlevel 1 goto failed

echo.
echo [1/3] Installing the little pieces it needs...
call npm install
if errorlevel 1 goto failed

echo.
echo [2/3] Downloading and indexing the OpenTTD documentation...
call npm run index
if errorlevel 1 goto failed

echo.
echo [3/3] Preparing MCP settings...
node scripts\write-configs.js
if errorlevel 1 goto failed

goto choose_client

:old_node
cls
echo.
echo Your Node.js is too old. Node.js 20 or newer is required.
echo Install the current Node.js LTS from https://nodejs.org/
echo then run this installer again.
echo.
pause
exit /b 1

:choose_client
cls
echo.
echo =====================================================
echo   Almost done - which AI app do you use?
echo =====================================================
echo.
echo   [1] Cursor
echo   [2] VS Code / GitHub Copilot
echo   [3] Claude Desktop
echo   [4] Claude Code
echo   [5] Other MCP app
echo   [6] Connect every app I can detect
echo.
echo You can run this installer again later to add another app.
echo.
choice /c 123456 /n /m "Press 1, 2, 3, 4, 5, or 6: "

if errorlevel 6 goto connect_detected
if errorlevel 5 goto connect_other
if errorlevel 4 goto connect_claude_code
if errorlevel 3 goto connect_claude_desktop
if errorlevel 2 goto connect_vscode
if errorlevel 1 goto connect_cursor
goto choose_client

:connect_cursor
node scripts\connect-client.js cursor
if errorlevel 1 goto connect_failed
goto done_cursor

:connect_vscode
node scripts\connect-client.js vscode
if errorlevel 1 goto connect_failed
goto done_vscode

:connect_claude_desktop
node scripts\connect-client.js claude-desktop
if errorlevel 1 goto connect_failed
goto done_claude_desktop

:connect_claude_code
node scripts\connect-client.js claude-code
if errorlevel 1 goto connect_failed
goto done_claude_code

:connect_other
node scripts\connect-client.js other
goto done_other

:connect_detected
node scripts\connect-client.js detected
if errorlevel 1 goto connect_failed
goto done_detected

:done_cursor
cls
echo.
echo =====================================================
echo   DONE!  Cursor is connected.
echo =====================================================
echo.
echo Restart Cursor if it was open.
echo Then try asking:
echo.
echo   Using the OpenTTD AI API docs,
echo   explain AIRail::GetRailStationDirection.
echo.
goto finish

:done_vscode
cls
echo.
echo =====================================================
echo   DONE!  VS Code is connected.
echo =====================================================
echo.
echo Restart VS Code if it was open.
echo VS Code may ask you once whether you trust/start this local MCP server.
echo.
echo Then try asking:
echo.
echo   Using the OpenTTD AI API docs,
echo   explain AIRail::GetRailStationDirection.
echo.
goto finish

:done_claude_desktop
cls
echo.
echo =====================================================
echo   DONE!  Claude Desktop is connected.
echo =====================================================
echo.
echo IMPORTANT: Fully quit Claude Desktop, then open it again.
echo Closing only the window may not fully quit it.
echo.
echo Then try asking:
echo.
echo   Using the OpenTTD AI API docs,
echo   explain AIRail::GetRailStationDirection.
echo.
goto finish

:done_claude_code
cls
echo.
echo =====================================================
echo   DONE!  Claude Code is connected.
echo =====================================================
echo.
echo The OpenTTD docs MCP is available at user scope.
echo Start Claude Code normally and use it from any project.
echo.
goto finish

:done_other
cls
echo.
echo =====================================================
echo   MCP installed - generic config is ready.
echo =====================================================
echo.
echo Open this file:
echo   generated\mcp-generic.json
echo.
echo Copy the openttd-ai-api entry into your MCP app.
echo.
start "" explorer.exe /select,"%CD%\generated\mcp-generic.json" >nul 2>nul
goto finish

:done_detected
cls
echo.
echo =====================================================
echo   DONE!  Detected apps were connected.
echo =====================================================
echo.
echo Restart any AI apps that were already open.
echo.
goto finish

:connect_failed
cls
echo.
echo =====================================================
echo   The MCP installed, but app connection failed
echo =====================================================
echo.
echo The OpenTTD MCP itself is ready.
echo Rerun INSTALL-WINDOWS.cmd and choose your app again,
echo or choose [5] Other to get the generic config.
echo.
pause
exit /b 1

:finish
echo You never need to manually start the MCP server.
echo Your AI app starts it automatically when needed.
echo.
echo Want it in another app too?
echo Just run INSTALL-WINDOWS.cmd again and choose that app.
echo.
pause
exit /b 0

:failed
cls
echo.
echo =====================================================
echo   Something failed :(
echo =====================================================
echo.
echo Scroll up if you want the technical error.
echo Your existing MCP app settings were not intentionally replaced.
echo.
pause
exit /b 1
