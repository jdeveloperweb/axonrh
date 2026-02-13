#!/bin/bash

# Script para corrigir o erro de migração duplicada do Flyway no Integration Service
# Execute este script no servidor SSH

echo "=== Iniciando correção do Flyway no Integration Service ==="

# 1. Definir diretórios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
INTEGRATION_DIR="$PROJECT_ROOT/backend/integration-service"

echo "Diretório do projeto: $PROJECT_ROOT"

# 2. Navegar para o diretório raiz
cd "$PROJECT_ROOT" || exit

# 3. Parar o serviço integration-service
echo "Parando o serviço integration-service..."
docker compose stop integration-service 2>/dev/null || docker-compose stop integration-service

# 4. Remover o diretório target (onde ficam os arquivos compilados antigos)
echo "Limpando diretório target antigo..."
if [ -d "$INTEGRATION_DIR/target" ]; then
    rm -rf "$INTEGRATION_DIR/target"
    echo "Diretório target removido com sucesso."
else
    echo "Diretório target não encontrado (já limpo)."
fi

# 5. Atualizar o código (garantir que a correção dos arquivos .sql chegou)
echo "Atualizando repositório..."
git pull

# 6. Reiniciar o serviço
echo "Reiniciando integration-service..."
docker compose up -d integration-service 2>/dev/null || docker-compose up -d integration-service

echo "=== Correção concluída! Verifique os logs com: docker logs -f axonrh-integration-service ==="
