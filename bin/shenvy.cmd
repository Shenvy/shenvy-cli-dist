@echo off
setlocal
set "basedir=%~dp0"

if exist "%basedir%\shenvy.exe" (
  "%basedir%\shenvy.exe" %*
) else (
  node "%basedir%\install.js" && "%basedir%\shenvy.exe" %*
)
