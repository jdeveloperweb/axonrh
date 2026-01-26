#!/bin/bash
# AxonRH - Script de Teardown do Ambiente de Desenvolvimento
# Uso: ./stop-dev.sh [docker|k8s] [--clean]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

stop_docker() {
    local clean=$1
    print_info "Parando ambiente Docker Compose..."

    cd "$DOCKER_DIR"

    if [ "$clean" = "--clean" ]; then
        print_warning "Removendo containers E volumes (dados serao perdidos)..."
        docker compose down -v --remove-orphans
        print_status "Containers e volumes removidos"
    else
        docker compose down --remove-orphans
        print_status "Containers parados (volumes preservados)"
    fi
}

stop_k8s() {
    local clean=$1
    print_info "Parando ambiente Kubernetes..."

    if [ "$clean" = "--clean" ]; then
        print_warning "Deletando cluster Kind (todos os dados serao perdidos)..."
        kind delete cluster --name axonrh || true
        print_status "Cluster Kind deletado"
    else
        print_info "Deletando recursos do namespace..."
        kubectl delete -k "$PROJECT_ROOT/infra/kubernetes/overlays/dev" --ignore-not-found || true
        print_status "Recursos deletados (cluster preservado)"
    fi
}

# Main
MODE="${1:-docker}"
CLEAN="${2:-}"

case $MODE in
    docker)
        stop_docker "$CLEAN"
        ;;
    k8s|kubernetes)
        stop_k8s "$CLEAN"
        ;;
    *)
        echo "Uso: $0 [docker|k8s] [--clean]"
        echo "  docker     - Parar ambiente Docker Compose"
        echo "  k8s        - Parar ambiente Kubernetes"
        echo "  --clean    - Remover volumes/cluster (perda de dados)"
        exit 1
        ;;
esac

echo ""
print_status "Ambiente parado com sucesso!"
