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

PROCESS_DIR="$PROJECT_ROOT/.dev-processes"

ensure_process_dir() {
    mkdir -p "$PROCESS_DIR"
}

process_pid_file() {
    local process_name="$1"
    echo "$PROCESS_DIR/${process_name}.pid"
}

stop_process_if_running() {
    local process_name="$1"
    local pid_file
    pid_file="$(process_pid_file "$process_name")"

    if [ -f "$pid_file" ]; then
        local pid
        pid="$(cat "$pid_file")"
        if [ -n "$pid" ] && kill -0 "$pid" > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping existing process: ${process_name} (PID: ${pid})${NC}"
            kill "$pid" || true
        fi
        rm -f "$pid_file"
    fi
}

start_background_process() {
    local process_name="$1"
    local workdir="$2"
    local command="$3"
    local log_file="$PROCESS_DIR/${process_name}.log"

    ensure_process_dir
    stop_process_if_running "$process_name"

    echo -e "${YELLOW}Starting ${process_name}...${NC}"
    (cd "$workdir" && nohup bash -c "$command" > "$log_file" 2>&1 & echo $! > "$(process_pid_file "$process_name")")
}

pause_for_user() {
    read -r -p "Pressione Enter para voltar ao menu..." _
}

tail_process_log() {
    local process_name="$1"
    local log_file="$PROCESS_DIR/${process_name}.log"

    if [ -f "$log_file" ]; then
        echo -e "\n${BLUE}==== Logs: ${process_name} ====${NC}"
        tail -n 200 "$log_file"
    else
        echo -e "${RED}Log não encontrado para ${process_name}.${NC}"
    fi

    pause_for_user
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
    ensure_process_dir

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
            tail_process_log "${app_services[$((log_choice - 1))]}"
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

    # Create docker-compose for infrastructure if it doesn't exist
    if [ ! -f "docker-compose.yml" ]; then
        cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: axonrh-postgres
    environment:
      POSTGRES_USER: axonrh
      POSTGRES_PASSWORD: axonrh123
      POSTGRES_DB: axonrh
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U axonrh"]
      interval: 10s
      timeout: 5s
      retries: 5

  mongodb:
    image: mongo:7
    container_name: axonrh-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: axonrh
      MONGO_INITDB_ROOT_PASSWORD: axonrh123
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  redis:
    image: redis:7-alpine
    container_name: axonrh-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: axonrh-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: axonrh
      RABBITMQ_DEFAULT_PASS: axonrh123
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  mailhog:
    image: mailhog/mailhog
    container_name: axonrh-mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
  rabbitmq_data:
EOF
    fi

    docker-compose up -d

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

    cd "$PROJECT_ROOT/backend"

    # Check if Maven wrapper exists
    if [ ! -f "mvnw" ]; then
        echo -e "${YELLOW}Creating Maven wrapper...${NC}"
        mvn -N wrapper:wrapper
    fi

    chmod +x mvnw

    # Build all services
    echo -e "${YELLOW}Building backend services...${NC}"
    ./mvnw clean package -DskipTests -T 4

    # Start services in the background
    echo -e "${YELLOW}Starting microservices...${NC}"

    # Start config-service first
    start_background_process "axonrh-config-service" "$PROJECT_ROOT/backend/config-service" "../mvnw spring-boot:run"
    sleep 10

    # Start remaining services
    local services=(
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
    )

    for service in "${services[@]}"; do
        start_background_process "axonrh-${service}" "$PROJECT_ROOT/backend/${service}" "../mvnw spring-boot:run"
        sleep 5
    done

    # Start api-gateway last
    start_background_process "axonrh-api-gateway" "$PROJECT_ROOT/backend/api-gateway" "../mvnw spring-boot:run"

    echo -e "${GREEN}✓ Backend services starting...${NC}"
    echo -e "  - Config Service: http://localhost:8888"
    echo -e "  - Auth Service: http://localhost:8081"
    echo -e "  - Core Service: http://localhost:8082"
    echo -e "  - API Gateway: http://localhost:8080"
}

# Start frontend
start_frontend() {
    echo -e "\n${YELLOW}Starting frontend...${NC}"

    cd "$PROJECT_ROOT/frontend/web"

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        npm install
    fi

    # Start Next.js development server
    echo -e "${YELLOW}Starting Next.js development server...${NC}"
    start_background_process "axonrh-frontend" "$PROJECT_ROOT/frontend/web" "npm run dev"

    echo -e "${GREEN}✓ Frontend started at http://localhost:3000${NC}"
}

# Start a single backend service
start_single_backend_service() {
    local service="$1"

    cd "$PROJECT_ROOT/backend"

    if [ ! -f "mvnw" ]; then
        echo -e "${YELLOW}Creating Maven wrapper...${NC}"
        mvn -N wrapper:wrapper
    fi

    chmod +x mvnw

    echo -e "${YELLOW}Building ${service}...${NC}"
    ./mvnw -pl "${service}" -am clean package -DskipTests

    echo -e "${YELLOW}Starting ${service}...${NC}"
    start_background_process "axonrh-${service}" "$PROJECT_ROOT/backend/${service}" "../mvnw spring-boot:run"
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
            start_infrastructure
            wait_for_postgres
            start_backend
            start_frontend
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
