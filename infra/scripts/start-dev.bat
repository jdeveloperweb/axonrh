@echo off
REM AxonRH - Script de Inicializacao do Ambiente de Desenvolvimento (Windows)
REM Uso: start-dev.bat [docker|k8s]

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."
set "DOCKER_DIR=%PROJECT_ROOT%\infra\docker"
set "K8S_DIR=%PROJECT_ROOT%\infra\kubernetes"

echo.
echo     _                      ____  _   _
echo    / \   __  __  ___  _ _ ^|  _ \^| ^| ^| ^|
echo   / _ \  \ \/ / / _ \^| ' \^| ^|_^) ^| ^|_^| ^|
echo  / ___ \  ^>  ^< ^| (_) ^| ^|^| ^|  _ ^<^|  _  ^|
echo /_/   \_\/_/\_\ \___/^|_^|^|_^|_^| \_\_^| ^|_^|
echo.
echo Sistema Integrado de Gestao de RH e Departamento Pessoal
echo =========================================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker nao encontrado. Por favor, instale o Docker Desktop.
    exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker daemon nao esta rodando. Inicie o Docker Desktop.
    exit /b 1
)

echo [OK] Docker encontrado e rodando

set "MODE=%~1"
if "%MODE%"=="" set "MODE=docker"

if /i "%MODE%"=="docker" goto :start_docker
if /i "%MODE%"=="k8s" goto :start_k8s
if /i "%MODE%"=="kubernetes" goto :start_k8s

echo Uso: %~nx0 [docker^|k8s]
echo   docker - Iniciar ambiente com Docker Compose (padrao)
echo   k8s    - Iniciar ambiente com Kubernetes (Kind)
exit /b 1

:start_docker
echo [INFO] Iniciando ambiente Docker Compose...

cd /d "%DOCKER_DIR%"

REM Copiar .env se nao existir
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo [OK] Arquivo .env criado a partir do template
)

REM Subir containers
docker compose up -d

echo [INFO] Aguardando servicos ficarem saudaveis...
timeout /t 10 /nobreak >nul

REM Verificar status
docker compose ps

echo.
echo [OK] Ambiente Docker iniciado com sucesso!
echo.
echo Servicos disponiveis:
echo   - PostgreSQL:  localhost:5432
echo   - Redis:       localhost:6379
echo   - MongoDB:     localhost:27017
echo   - Kafka:       localhost:29092
echo   - Kafka UI:    http://localhost:8090
echo   - MinIO:       http://localhost:9000 (Console: 9001)
echo   - Prometheus:  http://localhost:9090
echo   - Grafana:     http://localhost:3000 (admin/axonrh_grafana_2026)
echo   - Jaeger:      http://localhost:16686
echo.
echo Para parar o ambiente, execute: stop-dev.bat docker
goto :eof

:start_k8s
echo [INFO] Iniciando ambiente Kubernetes com Kind...

kind version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Kind nao encontrado. Instale com: choco install kind
    exit /b 1
)

kubectl version --client >nul 2>&1
if errorlevel 1 (
    echo [ERROR] kubectl nao encontrado. Instale com: choco install kubernetes-cli
    exit /b 1
)

REM Verificar se cluster ja existe
kind get clusters 2>nul | findstr /c:"axonrh" >nul
if not errorlevel 1 (
    echo [WARN] Cluster 'axonrh' ja existe
) else (
    echo [INFO] Criando cluster Kind...
    kind create cluster --config "%K8S_DIR%\kind-config.yaml" --name axonrh
    echo [OK] Cluster Kind criado
)

REM Aplicar configuracoes
echo [INFO] Aplicando configuracoes Kubernetes...
kubectl apply -k "%K8S_DIR%\overlays\dev"

echo [INFO] Aguardando pods ficarem prontos...
kubectl wait --for=condition=ready pod -l app=postgres -n axonrh-dev --timeout=120s 2>nul
kubectl wait --for=condition=ready pod -l app=redis -n axonrh-dev --timeout=120s 2>nul

echo.
echo [OK] Ambiente Kubernetes iniciado com sucesso!
echo.
kubectl get pods -n axonrh-dev
echo.
echo Para parar o ambiente, execute: stop-dev.bat k8s
goto :eof
