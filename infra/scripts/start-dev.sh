#!/bin/bash
# AxonRH - Script de Inicializacao do Ambiente de Desenvolvimento
# Uso: ./start-dev.sh [docker|k8s]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infra/docker"
K8S_DIR="$PROJECT_ROOT/infra/kubernetes"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${BLUE}"
    echo "    _                      ____  _   _ "
    echo "   / \   __  __  ___  _ _ |  _ \| | | |"
    echo "  / _ \  \ \/ / / _ \| ' \| |_) | |_| |"
    echo " / ___ \  >  < | (_) | || |  _ <|  _  |"
    echo "/_/   \_\/_/\_\ \___/|_||_|_| \_\_| |_|"
    echo ""
    echo -e "${NC}Sistema Integrado de Gestao de RH e Departamento Pessoal"
    echo "========================================================="
    echo ""
}

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

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker nao encontrado. Por favor, instale o Docker."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon nao esta rodando."
        exit 1
    fi

    print_status "Docker encontrado e rodando"
}

check_kind() {
    if ! command -v kind &> /dev/null; then
        print_warning "Kind nao encontrado. Instale com: go install sigs.k8s.io/kind@latest"
        return 1
    fi
    print_status "Kind encontrado"
    return 0
}

check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_warning "kubectl nao encontrado."
        return 1
    fi
    print_status "kubectl encontrado"
    return 0
}

start_docker() {
    print_info "Iniciando ambiente Docker Compose..."

    cd "$DOCKER_DIR"

    # Copiar .env se nao existir
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Arquivo .env criado a partir do template"
    fi

    # Subir containers
    docker compose up -d

    print_info "Aguardando servicos ficarem saudaveis..."
    sleep 10

    # Verificar status
    docker compose ps

    echo ""
    print_status "Ambiente Docker iniciado com sucesso!"
    echo ""
    echo "Servicos disponiveis:"
    echo "  - PostgreSQL:  localhost:5432"
    echo "  - Redis:       localhost:6379"
    echo "  - MongoDB:     localhost:27017"
    echo "  - Kafka:       localhost:29092"
    echo "  - Kafka UI:    http://localhost:8090"
    echo "  - MinIO:       http://localhost:9000 (Console: 9001)"
    echo "  - Prometheus:  http://localhost:9090"
    echo "  - Grafana:     http://localhost:3000 (admin/axonrh_grafana_2026)"
    echo "  - Jaeger:      http://localhost:16686"
}

start_k8s() {
    print_info "Iniciando ambiente Kubernetes com Kind..."

    if ! check_kind; then
        print_error "Kind e necessario para o ambiente Kubernetes local"
        exit 1
    fi

    if ! check_kubectl; then
        print_error "kubectl e necessario para o ambiente Kubernetes"
        exit 1
    fi

    # Verificar se cluster ja existe
    if kind get clusters 2>/dev/null | grep -q "axonrh"; then
        print_warning "Cluster 'axonrh' ja existe"
    else
        print_info "Criando cluster Kind..."
        kind create cluster --config "$K8S_DIR/kind-config.yaml" --name axonrh
        print_status "Cluster Kind criado"
    fi

    # Aplicar configuracoes
    print_info "Aplicando configuracoes Kubernetes..."
    kubectl apply -k "$K8S_DIR/overlays/dev"

    print_info "Aguardando pods ficarem prontos..."
    kubectl wait --for=condition=ready pod -l app=postgres -n axonrh-dev --timeout=120s || true
    kubectl wait --for=condition=ready pod -l app=redis -n axonrh-dev --timeout=120s || true

    echo ""
    print_status "Ambiente Kubernetes iniciado com sucesso!"
    echo ""
    kubectl get pods -n axonrh-dev
}

# Main
print_banner
check_docker

MODE="${1:-docker}"

case $MODE in
    docker)
        start_docker
        ;;
    k8s|kubernetes)
        start_k8s
        ;;
    *)
        echo "Uso: $0 [docker|k8s]"
        echo "  docker - Iniciar ambiente com Docker Compose (padrao)"
        echo "  k8s    - Iniciar ambiente com Kubernetes (Kind)"
        exit 1
        ;;
esac

echo ""
print_info "Para parar o ambiente, execute: ./stop-dev.sh $MODE"
