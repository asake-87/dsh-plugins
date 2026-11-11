@echo off
rem Publish this repository to GitHub.
rem
rem Needs a GitHub personal access token with the "repo" scope (classic) or
rem "Contents: read and write" + "Administration: read and write" (fine-grained).
rem
rem Usage:
rem   set GITHUB_TOKEN=ghp_xxx
rem   publish.cmd
rem
rem Optional:
rem   set GITHUB_OWNER=your-user      (defaults to the token's own account)
rem   set REPO_NAME=dsh-plugins
rem   set REPO_PRIVATE=true           (false by default)

setlocal EnableDelayedExpansion
cd /d "%~dp0"

if "%GITHUB_TOKEN%"=="" (
  echo Set GITHUB_TOKEN with the "repo" scope before running this script.
  exit /b 1
)
if "%REPO_NAME%"=="" set REPO_NAME=dsh-plugins
if "%REPO_PRIVATE%"=="" set REPO_PRIVATE=false

rem 1. Resolve the account behind the token when no owner was given.
if "%GITHUB_OWNER%"=="" (
  for /f "usebackq delims=" %%i in (`curl -s -H "Authorization: token %GITHUB_TOKEN%" -H "User-Agent: dsh-publisher" https://api.github.com/user ^| findstr /r /c:"\"login\""`) do (
    set "LOGINLINE=%%i"
  )
  for /f "tokens=2 delims=:," %%a in ("!LOGINLINE!") do (
    set "GITHUB_OWNER=%%~a"
    set "GITHUB_OWNER=!GITHUB_OWNER: =!"
    set "GITHUB_OWNER=!GITHUB_OWNER:"=!"
  )
)
if "%GITHUB_OWNER%"=="" (
  echo Could not resolve the GitHub account from the token.
  exit /b 1
)
echo Publishing to %GITHUB_OWNER%/%REPO_NAME%

rem 2. Create the repository (an existing one is reused).
set "BODY={\"name\":\"%REPO_NAME%\",\"description\":\"DeepSeek Harness plugins: Mission Control and Checkpoint\",\"private\":%REPO_PRIVATE%,\"has_issues\":true,\"has_wiki\":false,\"auto_init\":false}"
curl -s -o "%TEMP%\dsh-create.json" -w "%%{http_code}" -X POST ^
  -H "Authorization: token %GITHUB_TOKEN%" ^
  -H "Accept: application/vnd.github+json" ^
  -H "User-Agent: dsh-publisher" ^
  -H "Content-Type: application/json" ^
  -d "%BODY%" https://api.github.com/user/repos > "%TEMP%\dsh-create-code.txt"
set /p CREATE_CODE=<"%TEMP%\dsh-create-code.txt"
if "%CREATE_CODE%"=="201" echo Repository created.
if "%CREATE_CODE%"=="422" echo Repository already exists; reusing it.
if not "%CREATE_CODE%"=="201" if not "%CREATE_CODE%"=="422" (
  echo Repository creation failed with HTTP %CREATE_CODE%:
  type "%TEMP%\dsh-create.json"
  exit /b 1
)

rem 3. Point origin at the repository and push main.
set "REMOTE=https://github.com/%GITHUB_OWNER%/%REPO_NAME%.git"
git remote get-url origin >nul 2>&1
if errorlevel 1 (git remote add origin "%REMOTE%") else (git remote set-url origin "%REMOTE%")

rem The token rides a one-shot header so it stays out of .git\config and the command line.
set "BASIC="
for /f "usebackq delims=" %%b in (`powershell -NoProfile -Command "[Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('x-access-token:%GITHUB_TOKEN%'))"`) do set "BASIC=%%b"
git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic %BASIC%" push -u origin main
if errorlevel 1 (
  echo Push failed.
  exit /b 1
)

echo.
echo Published: https://github.com/%GITHUB_OWNER%/%REPO_NAME%
echo Clone with: git clone %REMOTE%
endlocal
