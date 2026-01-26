#!/bin/bash

# ============================================================
# AxonRH - Script de criacao de topics Kafka
# T085-T089: Criar topics com particoes adequadas
# ============================================================

KAFKA_BROKER="${KAFKA_BROKER:-localhost:9092}"
KAFKA_BIN="${KAFKA_BIN:-/opt/kafka/bin}"

echo "========================================"
echo "AxonRH - Criacao de Topics Kafka"
echo "========================================"
echo "Broker: $KAFKA_BROKER"
echo ""

# Funcao para criar topic
create_topic() {
    local topic=$1
    local partitions=$2
    local replication=$3
    local retention_ms=${4:-604800000}  # 7 dias padrao

    echo "Criando topic: $topic (partitions=$partitions, replication=$replication)"

    $KAFKA_BIN/kafka-topics.sh --create \
        --bootstrap-server $KAFKA_BROKER \
        --topic $topic \
        --partitions $partitions \
        --replication-factor $replication \
        --config retention.ms=$retention_ms \
        --config cleanup.policy=delete \
        --if-not-exists

    if [ $? -eq 0 ]; then
        echo "  [OK] Topic $topic criado com sucesso"
    else
        echo "  [ERRO] Falha ao criar topic $topic"
    fi
}

# ============================================================
# T085 - Topic: employee.domain.events (6 particoes)
# Eventos de dominio de colaboradores
# ============================================================
create_topic "employee.domain.events" 6 1

# ============================================================
# T086 - Topic: timesheet.domain.events (12 particoes)
# Eventos de ponto - maior volume, mais particoes
# ============================================================
create_topic "timesheet.domain.events" 12 1

# ============================================================
# T087 - Topic: ai.query.logs (6 particoes)
# Logs de consultas ao assistente IA
# ============================================================
create_topic "ai.query.logs" 6 1 2592000000  # 30 dias retencao

# ============================================================
# T088 - Topic: notification.events (6 particoes)
# Eventos de notificacoes
# ============================================================
create_topic "notification.events" 6 1

# ============================================================
# T089 - Topic: audit.events (6 particoes)
# Eventos de auditoria
# ============================================================
create_topic "audit.events" 6 1 7776000000  # 90 dias retencao

# Topics adicionais para o sistema
echo ""
echo "Criando topics adicionais..."

# Vacation events
create_topic "vacation.domain.events" 6 1

# Performance events
create_topic "performance.domain.events" 6 1

# Learning events
create_topic "learning.domain.events" 6 1

# Dead Letter Queue
create_topic "axonrh.dlq" 3 1 2592000000  # 30 dias

# Topic de comandos
create_topic "axonrh.commands" 6 1

echo ""
echo "========================================"
echo "Listando todos os topics criados:"
echo "========================================"
$KAFKA_BIN/kafka-topics.sh --list --bootstrap-server $KAFKA_BROKER

echo ""
echo "Configuracao de topics concluida!"
