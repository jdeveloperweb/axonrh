# AxonRH - Guia de Desenvolvimento

## Pré-requisitos

### Windows
- **Docker Desktop** instalado e rodando
- **WSL2** configurado
- **Node.js 20+** (para o frontend)
- **Java 21** (para o backend - opcional para dev frontend)

### Verificar instalações
```bash
# No PowerShell ou terminal
docker --version
node --version
java --version
```

---

## Início Rápido (Apenas Frontend)

Se você quer apenas ver o frontend funcionando rapidamente:

### 1. Abra o terminal WSL ou PowerShell

### 2. Navegue até o projeto
```bash
cd /mnt/c/Projetos/AxonRH
# ou no PowerShell
cd C:\Projetos\AxonRH
```

### 3. Suba a infraestrutura com Docker
```bash
docker-compose up -d
```

Isso irá iniciar:
- PostgreSQL (porta 5433)
- MongoDB (porta 27017)
- Redis (porta 6379)
- RabbitMQ (porta 5672,管理: http://localhost:15672)
- MailHog (porta 8025)
- MinIO (porta 9000, console: http://localhost:9001)

### 4. Inicie o Frontend
```bash
cd frontend/web
npm install
npm run dev
```

### 5. Acesse no navegador
```
http://localhost:3000
```

---

## Desenvolvimento Completo (Frontend + Backend)

### 1. Infraestrutura
```bash
cd /mnt/c/Projetos/AxonRH
docker-compose up -d
```

### 2. Backend (requer Java 21)
```bash
# Em um terminal separado
cd backend

# Instalar dependências e compilar
./mvnw clean install -DskipTests

# Iniciar os serviços (em terminais separados ou usando tmux)
cd config-service && ../mvnw spring-boot:run &
sleep 10
cd ../auth-service && ../mvnw spring-boot:run &
cd ../core-service && ../mvnw spring-boot:run &
cd ../api-gateway && ../mvnw spring-boot:run &
```

### 3. Frontend
```bash
cd frontend/web
npm install
npm run dev
```

---

## Portas dos Serviços

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 3000 | http://localhost:3000 |
| API Gateway | 8080 | http://localhost:8080 |
| Auth Service | 8081 | http://localhost:8081 |
| Core Service | 8082 | http://localhost:8082 |
| Config Service | 8888 | http://localhost:8888 |
| PostgreSQL | 5433 | - |
| MongoDB | 27017 | - |
| Redis | 6379 | - |
| RabbitMQ | 5672/15672 | http://localhost:15672 |
| MailHog | 8025 | http://localhost:8025 |
| MinIO | 9000/9001 | http://localhost:9001 |

---

## Credenciais de Desenvolvimento

### PostgreSQL
- **Host:** localhost:5433
- **User:** axonrh
- **Password:** axonrh123
- **Database:** axonrh

### MongoDB
- **Host:** localhost:27017
- **User:** axonrh
- **Password:** axonrh123

### RabbitMQ
- **Host:** localhost:5672
- **User:** axonrh
- **Password:** axonrh123
- **Management:** http://localhost:15672

### MinIO (S3)
- **Host:** localhost:9000
- **Access Key:** axonrh
- **Secret Key:** axonrh123
- **Console:** http://localhost:9001

---

## Comandos Úteis

### Docker
```bash
# Ver status dos containers
docker-compose ps

# Ver logs
docker-compose logs -f postgres
docker-compose logs -f mongodb

# Parar tudo
docker-compose down

# Parar e limpar volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### Frontend
```bash
cd frontend/web

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Lint
npm run lint

# Testes
npm run test
```

### Backend
```bash
cd backend

# Compilar tudo
./mvnw clean package -DskipTests

# Rodar testes
./mvnw test

# Rodar um serviço específico
cd auth-service && ../mvnw spring-boot:run
```

### Mobile (Flutter)
```bash
cd mobile

# Instalar dependências
flutter pub get

# Rodar no emulador
flutter run

# Build Android
flutter build apk

# Build iOS
flutter build ios
```

---

## Solução de Problemas

### Docker não conecta
1. Verifique se Docker Desktop está rodando
2. No WSL, verifique a integração: `docker ps`
3. Reinicie o Docker Desktop se necessário

### Porta já em uso
```bash
# Encontrar processo usando a porta
netstat -ano | findstr :3000
# ou no Linux/WSL
lsof -i :3000

# Matar processo (Windows)
taskkill /PID <PID> /F
```

### Erro de permissão no WSL
```bash
# Dar permissão de execução
chmod +x scripts/start-dev.sh
chmod +x backend/mvnw
```

### Node modules corrompido
```bash
cd frontend/web
rm -rf node_modules package-lock.json
npm install
```

---

## Estrutura do Projeto

```
AxonRH/
├── backend/                 # Microserviços Java/Spring Boot
│   ├── api-gateway/
│   ├── auth-service/
│   ├── core-service/
│   ├── employee-service/
│   ├── timesheet-service/
│   ├── vacation-service/
│   ├── performance-service/
│   ├── learning-service/
│   ├── ai-assistant-service/
│   ├── notification-service/
│   └── integration-service/
├── frontend/
│   └── web/                 # Next.js 14 + React + TypeScript
├── mobile/                  # Flutter/Dart
├── database/                # Migrations e seeds
├── docs/                    # Documentação
├── infra/                   # Kubernetes/Terraform
├── scripts/                 # Scripts de automação
└── docker-compose.yml       # Infraestrutura local
```
