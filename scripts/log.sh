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
  echo " 00) Limpar Pastas Target (Cache Maven/BD Flyway)"
  echo "------------------------------"
  read -p "Escolha um serviço: " choice

  if [[ "$choice" == "0" ]]; then
    echo "Saindo..."
    exit 0
  fi

  if [[ "$choice" == "00" ]]; then
    echo ">> Limpando arquivos compilados nos serviços do backend..."
    parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
    
    echo "Qual serviço você deseja limpar?"
    for i in "${!services[@]}"; do
      printf " %2d) %s\n" "$((i+1))" "${services[$i]}"
    done
    echo " 99) TODOS"
    read -p "Opção: " clean_choice

    if [[ "$clean_choice" == "99" ]]; then
      cd "$parent_path/../backend"
      for d in */ ; do
        if [ -d "$d/target" ]; then
          echo "Limpando $d..."
          rm -rf "$d/target"
        fi
      done
      echo ">> Todas as pastas /target limpas."
    elif [[ "$clean_choice" =~ ^[0-9]+$ ]] && [[ "$clean_choice" -ge 1 && "$clean_choice" -le "${#services[@]}" ]]; then
      target_service="${services[$((clean_choice-1))]}"
      # Remove prefix 'axonrh-' to match backend folder name
      backend_folder="${target_service#axonrh-}"
      if [ -d "$parent_path/../backend/$backend_folder/target" ]; then
        rm -rf "$parent_path/../backend/$backend_folder/target"
        echo ">> Pasta compilada de $backend_folder limpa com sucesso!"
      else
        echo ">> Nenhuma pasta target para $backend_folder."
      fi
    else
      echo "Opção inválida."
    fi

    pause
    continue
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
