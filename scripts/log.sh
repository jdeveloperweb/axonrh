#!/bin/bash

services=(
  "axonrh-learning-service"
  "axonrh-timesheet-service"
  "axonrh-performance-service"
  "axonrh-api-gateway"
  "axonrh-core-service"
  "axonrh-employee-service"
  "axonrh-config-service"
  "axonrh-auth-service"
  "axonrh-notification-service"
  "axonrh-vacation-service"
  "axonrh-ai-assistant-service"
  "axonrh-integration-service"
  "axonrh-benefits-service"
  "axonrh-payroll-service"
)

pause() {
  echo
  read -p "Pressione ENTER para voltar ao menu..."
}

container_exists() {
  docker inspect "$1" >/dev/null 2>&1
}

container_running() {
  docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null | grep -q true
}

while true; do
  clear
  echo "=============================="
  echo "  MENU DE LOGS - AXONRH"
  echo "=============================="
  for i in "${!services[@]}"; do
    name="${services[$i]}"
    if container_exists "$name"; then
      if container_running "$name"; then
        status="RUNNING"
      else
        status="STOPPED"
      fi
    else
      status="NOT FOUND"
    fi
    printf " %2d) %-35s [%s]\n" "$((i+1))" "$name" "$status"
  done
  echo
  echo "  0) Sair"
  echo "------------------------------"
  read -p "Escolha um serviço: " choice

  if [[ "$choice" == "0" ]]; then
    echo "Saindo..."
    exit 0
  fi

  if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 && "$choice" -le "${#services[@]}" ]]; then
    service="${services[$((choice-1))]}"

    clear
    echo ">>> Serviço: $service"

    if ! container_exists "$service"; then
      echo "❌ Container não existe."
      pause
      continue
    fi

    if ! container_running "$service"; then
      echo "⚠️ Container existe, mas não está rodando."
      echo ">>> Últimos logs:"
      echo "--------------------------------"
      docker logs --tail 50 "$service" 2>&1
      pause
      continue
    fi

    echo ">>> Mostrando logs ao vivo (Ctrl+C para parar)"
    echo "--------------------------------"
    docker logs -f "$service"
    pause
  else
    echo "Opção inválida!"
    sleep 1
  fi
done
