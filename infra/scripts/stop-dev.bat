@echo off
REM AxonRH - Script de Teardown do Ambiente de Desenvolvimento (Windows)
REM Uso: stop-dev.bat [docker|k8s] [--clean]

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."
set "DOCKER_DIR=%PROJECT_ROOT%\infra\docker"
set "K8S_DIR=%PROJECT_ROOT%\infra\kubernetes"

set "MODE=%~1"
set "CLEAN=%~2"

if "%MODE%"=="" set "MODE=docker"

if /i "%MODE%"=="docker" goto :stop_docker
if /i "%MODE%"=="k8s" goto :stop_k8s
if /i "%MODE%"=="kubernetes" goto :stop_k8s

echo Uso: %~nx0 [docker^|k8s] [--clean]
echo   docker     - Parar ambiente Docker Compose
echo   k8s        - Parar ambiente Kubernetes
echo   --clean    - Remover volumes/cluster (perda de dados)
exit /b 1

:stop_docker
echo [INFO] Parando ambiente Docker Compose...

cd /d "%DOCKER_DIR%"

if /i "%CLEAN%"=="--clean" (
    echo [WARN] Removendo containers E volumes (dados serao perdidos)...
    docker compose down -v --remove-orphans
    echo [OK] Containers e volumes removidos
) else (
    docker compose down --remove-orphans
    echo [OK] Containers parados (volumes preservados)
)
goto :done

:stop_k8s
echo [INFO] Parando ambiente Kubernetes...

if /i "%CLEAN%"=="--clean" (
    echo [WARN] Deletando cluster Kind (todos os dados serao perdidos)...
    kind delete cluster --name axonrh 2>nul
    echo [OK] Cluster Kind deletado
) else (
    echo [INFO] Deletando recursos do namespace...
    kubectl delete -k "%K8S_DIR%\overlays\dev" --ignore-not-found 2>nul
    echo [OK] Recursos deletados (cluster preservado)
)
goto :done

:done
echo.
echo [OK] Ambiente parado com sucesso!
