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
      - "5432:5432"
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
    echo -e "  - PostgreSQL: localhost:5432"
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

    # Start services in background
    echo -e "${YELLOW}Starting microservices...${NC}"

    # Start config-service first
    echo -e "Starting config-service..."
    cd "$PROJECT_ROOT/backend/config-service"
    nohup ../mvnw spring-boot:run > /tmp/config-service.log 2>&1 &
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
        echo -e "Starting ${service}..."
        cd "$PROJECT_ROOT/backend/${service}"
        nohup ../mvnw spring-boot:run > "/tmp/${service}.log" 2>&1 &
        sleep 5
    done

    # Start api-gateway last
    echo -e "Starting api-gateway..."
    cd "$PROJECT_ROOT/backend/api-gateway"
    nohup ../mvnw spring-boot:run > /tmp/api-gateway.log 2>&1 &

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
    npm run dev &

    echo -e "${GREEN}✓ Frontend started at http://localhost:3000${NC}"
}

# Main execution
main() {
    check_docker
    start_infrastructure
    wait_for_postgres

    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${GREEN}Infrastructure is ready!${NC}"
    echo -e "${BLUE}========================================${NC}"

    echo -e "\n${YELLOW}Starting backend and frontend...${NC}"
    start_backend
    start_frontend

    echo -e "\n${YELLOW}Access points:${NC}"
    echo -e "  - Frontend: http://localhost:3000"
    echo -e "  - API Gateway: http://localhost:8080"
    echo -e "  - RabbitMQ Management: http://localhost:15672"
    echo -e "  - MailHog: http://localhost:8025"
}

# Run main function
main "$@"
