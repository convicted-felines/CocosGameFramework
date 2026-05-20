@echo off
:: DataTable Generator — 从项目根目录运行
:: 用法: gen-datatable.bat [excel|code|all]
::   excel  — Excel → txt
::   code   — txt → DRXxx.ts + .bytes
::   all    — 全部（默认）

set CMD=%1
if "%CMD%"=="" set CMD=all

cd /d "%~dp0tools\DataTableGenerator"
node DataTableGenerator.js %CMD%
cd /d "%~dp0"
