@echo off
title Verificar a conexao do Heelcloth
cd /d "%~dp0"
echo.
if not exist package.json goto semprojeto
where node >nul 2>nul
if errorlevel 1 goto semnode
node verificar-env.mjs
goto fim

:semprojeto
echo ERRO: coloque este arquivo na pasta do projeto, ao lado do package.json.
goto fim

:semnode
echo ERRO: o Node.js nao esta instalado.

:fim
echo.
pause
