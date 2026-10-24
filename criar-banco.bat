@echo off
title Criar tabelas e usuarios do Heelcloth
cd /d "%~dp0"
echo.
echo ==== PASSO 1: conferindo os arquivos ====
if not exist package.json goto semprojeto
if not exist .env if exist env move /y env .env >nul
if not exist .env if exist env.txt move /y env.txt .env >nul
if not exist .env if exist .env.txt move /y .env.txt .env >nul
if not exist .env goto semenv
where node >nul 2>nul
if errorlevel 1 goto semnode
echo OK: projeto, .env e Node.js encontrados.
echo.
echo ==== PASSO 2: instalando os programas do projeto (pode demorar alguns minutos) ====
call npm install
if errorlevel 1 goto erro
echo.
echo ==== PASSO 3: criando as tabelas no banco ====
call npx prisma db push
if errorlevel 1 goto erro
echo.
echo ==== PASSO 4: criando os usuarios ====
call npx prisma db seed
if errorlevel 1 goto erro
echo.
echo ==================================================
echo PRONTO! As tabelas e os usuarios foram criados.
echo Agora abra o site, pagina /login, e entre com:
echo   admin@heelcloth.com.br  /  admin123
echo ==================================================
goto fim

:semprojeto
echo ERRO: este arquivo precisa ficar na pasta do projeto, ao lado do arquivo package.json.
goto fim

:semenv
echo ERRO: nao achei o arquivo .env nesta pasta. Coloque o .env ao lado deste arquivo.
goto fim

:semnode
echo ERRO: o Node.js nao esta instalado.
echo Instale a versao LTS em https://nodejs.org e depois abra este arquivo de novo.
goto fim

:erro
echo.
echo ERRO: um dos passos acima falhou. Leia a mensagem em vermelho logo acima e me envie.
echo (Nao copie a senha do banco se ela aparecer.)

:fim
echo.
pause
