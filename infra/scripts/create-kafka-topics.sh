#!/bin/bash
# AxonRH - Script para criar topics do Kafka
# Executar apos o Kafka estar rodando

set -e

KAFKA_CONTAINER="axonrh-kafka"
BOOTSTRAP_SERVER="localhost:9092"

echo "Criando topics do Kafka para AxonRH..."

# Funcao para criar topic
create_topic() {
    local topic=$1
    local partitions=$2
    local replication=${3:-1}

    echo "Criando topic: $topic (partitions: $partitions, replication: $replication)"

    docker exec $KAFKA_CONTAINER kafka-topics --create \
        --bootstrap-server $BOOTSTRAP_SERVER \
        --topic $topic \
        --partitions $partitions \
        --replication-factor $replication \
        --if-not-exists
}

# Topics principais conforme documentacao
create_topic "employee.domain.events" 6
create_topic "timesheet.domain.events" 12
create_topic "ai.query.logs" 6
create_topic "notification.events" 6
create_topic "audit.events" 6

# Topics adicionais
create_topic "vacation.domain.events" 6
create_topic "performance.domain.events" 6
create_topic "learning.domain.events" 6

# Dead Letter Queues
create_topic "employee.domain.events.dlq" 3
create_topic "timesheet.domain.events.dlq" 3
create_topic "notification.events.dlq" 3

echo ""
echo "Listando topics criados:"
docker exec $KAFKA_CONTAINER kafka-topics --list --bootstrap-server $BOOTSTRAP_SERVER

echo ""
echo "Topics do Kafka criados com sucesso!"
