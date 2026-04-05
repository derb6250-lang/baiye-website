@echo off
chcp 65001 >nul
cd /d "%~dp0"

where python >nul 2>&1
if errorlevel 1 (
  echo 未找到 Python。请安装 Python 并勾选 Add to PATH。
  pause
  exit /b 1
)

echo 正在启动 http://127.0.0.1:8765/ ...
start "BaiYe-Server" /MIN cmd /c "cd /d "%~dp0" && python -m http.server 8765"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8765/"
echo.
echo 已用浏览器打开。服务器在名为 BaiYe-Server 的最小化窗口里运行，关掉该窗口即停止服务。
pause
