#!/bin/bash
# AxonRH - Script de Health Check dos Servicos
# Verifica se todos os servicos estao saudaveis

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local name=$1
    local host=$2
    local port=$3
    local timeout=${4:-5}

    if nc -z -w$timeout $host $port 2>/dev/null; then
        echo -e "${GREEN}[OK]${NC} $name ($host:$port)"
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $name ($host:$port)"
        return 1
    fi
}

check_http() {
    local name=$1
    local url=$2
    local timeout=${3:-5}

    if curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" | grep -q "200\|204\|301\|302"; then
        echo -e "${GREEN}[OK]${NC} $name ($url)"
        return 0
    else
        echo -e "${RED}[FAIL]${NC} $name ($url)"
        return 1
    fi
}

echo ""
echo "AxonRH - Health Check dos Servicos"
echo "==================================="
echo ""

FAILED=0

echo "Infraestrutura:"
check_service "PostgreSQL" "localhost" "5432" || ((FAILED++))
check_service "Redis" "localhost" "6379" || ((FAILED++))
check_service "MongoDB" "localhost" "27017" || ((FAILED++))
check_service "Kafka" "localhost" "29092" || ((FAILED++))
check_service "Zookeeper" "localhost" "2181" || ((FAILED++))
check_service "MinIO" "localhost" "9000" || ((FAILED++))

echo ""
echo "Observabilidade:"
check_http "Prometheus" "http://localhost:9090/-/healthy" || ((FAILED++))
check_http "Grafana" "http://localhost:3000/api/health" || ((FAILED++))
check_http "Jaeger" "http://localhost:16686" || ((FAILED++))
check_http "Kafka UI" "http://localhost:8090" || ((FAILED++))

echo ""
echo "Microservicos (se estiverem rodando):"
check_http "API Gateway" "http://localhost:8180/actuator/health" 2 || echo -e "${YELLOW}[SKIP]${NC} API Gateway nao iniciado"
check_http "Auth Service" "http://localhost:8081/actuator/health" 2 || echo -e "${YELLOW}[SKIP]${NC} Auth Service nao iniciado"
check_http "Config Service" "http://localhost:8082/actuator/health" 2 || echo -e "${YELLOW}[SKIP]${NC} Config Service nao iniciado"

echo ""
echo "==================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}Todos os servicos de infraestrutura estao saudaveis!${NC}"
else
    echo -e "${RED}$FAILED servico(s) com problema${NC}"
    exit 1
fi
