@echo off
rem Starts the site editor: a small local server that shows your site and saves the editor's changes.
rem Works in any browser. Keep this window open while you edit; close it when you're done.
cd /d "%~dp0"
title Website editor - close this window when you're done

set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY where py >nul 2>nul && set "PY=py"
if not defined PY (
  echo Python is needed to run the editor: https://www.python.org/downloads/
  pause
  exit /b 1
)

%PY% editor\server.py
pause