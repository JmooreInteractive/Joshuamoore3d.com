@echo off
rem Opens the site editor. Keep the small server window open while editing; close it when done.
cd /d "%~dp0"
where python >/dev/null 2>/dev/null || (echo Python is needed to run the editor: https://www.python.org/downloads/ & pause & exit /b 1)
start "Website editor server (close when done)" /min python -m http.server 8080
timeout /t 2 /nobreak >nul
start "" "http://localhost:8080/editor/"
