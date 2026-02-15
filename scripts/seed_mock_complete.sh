#!/bin/bash
# Script para carga de dados mockados (Departamentos, Cargos e Colaboradores)
# Uso: ./scripts/seed_mock_complete.sh [TENANT_ID] [BASE_URL]

TENANT_ID=${1:-c723467f-4458-406a-b283-094038304245}
BASE_URL=${2:-http://localhost:8081}

echo ">>> Iniciando Carga de Dados Mockados para Tenant: $TENANT_ID"
echo ">>> Base URL: $BASE_URL"

echo "1. Criando Departamentos..."
curl -X POST "$BASE_URL/api/v1/mock/departments" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json"
echo ""

echo "2. Criando Cargos..."
curl -X POST "$BASE_URL/api/v1/mock/positions" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json"
echo ""

echo "3. Criando Colaboradores (25)..."
curl -X POST "$BASE_URL/api/v1/mock/employees?count=25" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -H "Content-Type: application/json"
echo ""

echo ">>> Carga finalizada!"
