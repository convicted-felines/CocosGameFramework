@echo off
set CMD=%1
if "%CMD%"=="" set CMD=all
cd /d "%~dp0tools\DataTableGenerator"
node DataTableGenerator.js %CMD%
pause

