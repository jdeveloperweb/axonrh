#!/bin/bash

# AxonRH Development Startup Script
# Run this from WSL to start the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   AxonRH - Development Environment    ${NC}"
echo -e "${BLUE}========================================${NC}"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}Project root: $PROJECT_ROOT${NC}"

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Docker is not running. Please start Docker Desktop first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Docker is running${NC}"
}

git_pull() {
    echo -e "\n${YELLOW}Pulling latest changes...${NC}"
    cd "$PROJECT_ROOT"
    git pull
}

pause_for_user() {
    read -r -p "Pressione Enter para voltar ao menu..." _
}

tail_docker_log() {
    local container_name="$1"

    if docker ps --format '{{.Names}}' | rg -q "^${container_name}$"; then
        echo -e "\n${BLUE}==== Logs: ${container_name} ====${NC}"
        docker logs --tail 200 "$container_name"
    else
        echo -e "${RED}Container ${container_name} não está em execução.${NC}"
    fi

    pause_for_user
}

logs_menu() {
    local app_services=(
        "axonrh-config-service"
        "axonrh-auth-service"
        "axonrh-core-service"
        "axonrh-employee-service"
        "axonrh-timesheet-service"
        "axonrh-vacation-service"
        "axonrh-performance-service"
        "axonrh-learning-service"
        "axonrh-ai-assistant-service"
        "axonrh-notification-service"
        "axonrh-integration-service"
        "axonrh-api-gateway"
        "axonrh-frontend"
    )

    local infra_services=(
        "axonrh-postgres"
        "axonrh-mongodb"
        "axonrh-redis"
        "axonrh-rabbitmq"
        "axonrh-mailhog"
        "axonrh-minio"
    )

    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}   Logs - AxonRH                         ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}Logs de aplicações:${NC}"
    local index=1
    for service in "${app_services[@]}"; do
        echo -e "  ${index}) ${service}"
        index=$((index + 1))
    done

    echo -e "\n${YELLOW}Logs de infraestrutura (Docker):${NC}"
    for service in "${infra_services[@]}"; do
        echo -e "  ${index}) ${service}"
        index=$((index + 1))
    done

    echo -e "  ${index}) Voltar"

    read -r -p "Escolha um serviço para ver os logs: " log_choice

    local total_apps=${#app_services[@]}
    local total_infra=${#infra_services[@]}
    local back_option=$((total_apps + total_infra + 1))

    if [[ "$log_choice" =~ ^[0-9]+$ ]]; then
        if [ "$log_choice" -ge 1 ] && [ "$log_choice" -le "$total_apps" ]; then
            tail_docker_log "${app_services[$((log_choice - 1))]}"
        elif [ "$log_choice" -gt "$total_apps" ] && [ "$log_choice" -le $((total_apps + total_infra)) ]; then
            tail_docker_log "${infra_services[$((log_choice - total_apps - 1))]}"
        elif [ "$log_choice" -eq "$back_option" ]; then
            return
        else
            echo -e "${RED}Opção inválida.${NC}"
            pause_for_user
        fi
    else
        echo -e "${RED}Opção inválida.${NC}"
        pause_for_user
    fi

    logs_menu
}

# Start infrastructure services (PostgreSQL, MongoDB, Redis, etc.)
start_infrastructure() {
    echo -e "\n${YELLOW}Starting infrastructure services...${NC}"

    cd "$PROJECT_ROOT"
    docker compose up -d

    echo -e "${GREEN}✓ Infrastructure services started${NC}"
    echo -e "  - PostgreSQL: localhost:5433"
    echo -e "  - MongoDB: localhost:27017"
    echo -e "  - Redis: localhost:6379"
    echo -e "  - RabbitMQ: localhost:5672 (Management: http://localhost:15672)"
    echo -e "  - MailHog: http://localhost:8025"
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    echo -e "\n${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    until docker exec axonrh-postgres pg_isready -U axonrh > /dev/null 2>&1; do
        sleep 1
    done
    echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
}

# Start backend services
start_backend() {
    echo -e "\n${YELLOW}Starting backend services...${NC}"

    cd "$PROJECT_ROOT"
    docker compose --profile backend up -d --build

    echo -e "${GREEN}✓ Backend services starting...${NC}"
    echo -e "  - Config Service: http://localhost:8888"
    echo -e "  - Auth Service: http://localhost:8081"
    echo -e "  - Core Service: http://localhost:8082"
    echo -e "  - API Gateway: http://localhost:8180"
}

# Start frontend
start_frontend() {
    echo -e "\n${YELLOW}Starting frontend...${NC}"

    cd "$PROJECT_ROOT"
    docker compose --profile frontend up -d --build

    echo -e "${GREEN}✓ Frontend started at http://localhost:3000${NC}"
}

# Start a single backend service
start_single_backend_service() {
    local service="$1"

    cd "$PROJECT_ROOT"
    echo -e "${YELLOW}Starting ${service}...${NC}"
    docker compose --profile backend up -d --build "${service}"
}

select_backend_service() {
    local services=(
        "config-service"
        "auth-service"
        "core-service"
        "employee-service"
        "timesheet-service"
        "vacation-service"
        "performance-service"
        "learning-service"
        "ai-assistant-service"
        "notification-service"
        "integration-service"
        "api-gateway"
    )

    echo -e "\n${YELLOW}Select a backend service to redeploy:${NC}"
    select service in "${services[@]}"; do
        if [ -n "$service" ]; then
            start_single_backend_service "$service"
            break
        else
            echo -e "${RED}Invalid option. Please try again.${NC}"
        fi
    done
}

menu() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}   Redeploy menu - AxonRH               ${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "${YELLOW}Choose an option:${NC}"
    echo -e "  1) Redeploy all (infra + backend + frontend)"
    echo -e "  2) Redeploy backend (all services)"
    echo -e "  3) Redeploy a single backend service"
    echo -e "  4) Redeploy frontend only"
    echo -e "  5) Start infrastructure only"
    echo -e "  6) Ver logs dos serviços"
    echo -e "  7) Exit"

    read -r -p "Enter your choice [1-7]: " choice

    case "$choice" in
        1)
            check_docker
            git_pull
            echo -e "\n${YELLOW}Starting all services with Docker Compose...${NC}"
            cd "$PROJECT_ROOT"
            docker compose --profile backend --profile frontend up -d --build
            ;;
        2)
            check_docker
            git_pull
            start_backend
            ;;
        3)
            git_pull
            select_backend_service
            ;;
        4)
            git_pull
            start_frontend
            ;;
        5)
            check_docker
            start_infrastructure
            wait_for_postgres
            ;;
        6)
            logs_menu
            ;;
        7)
            echo -e "${YELLOW}Exiting.${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option.${NC}"
            menu
            ;;
    esac
}

# Main execution
main() {
    menu
}

# Run main function
main "$@"
