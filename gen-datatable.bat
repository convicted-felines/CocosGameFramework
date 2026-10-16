@echo off
set CMD=%1
if "%CMD%"=="" set CMD=all
cd /d "%~dp0tools\DataTableGenerator"
if not exist "node_modules\jszip\package.json" (
    echo [DataTableGenerator] 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [DataTableGenerator] 依赖安装失败，请检查 Node.js 与网络环境。
        pause
        exit /b 1
    )
)
node DataTableGenerator.js %CMD%
pause
