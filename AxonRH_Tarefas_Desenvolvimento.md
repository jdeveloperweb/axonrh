# 🚀 AxonRH - Organizador de Tarefas para Desenvolvimento

> **Sistema Integrado de Gestão de RH e Departamento Pessoal com IA Conversacional**
> 
> Este documento serve como guia de controle para agentes de IA construírem o sistema AxonRH do zero.
> Marque as tarefas concluídas alterando `[ ]` para `[x]`.

---

## 📋 Informações do Projeto

| Campo | Valor |
|-------|-------|
| **Versão** | 1.0 |
| **Data Início** | Janeiro 2026 |
| **Stack Backend** | Spring Boot 4, Java 21 LTS |
| **Stack Frontend** | Next.js 15, TypeScript 5, Tailwind CSS |
| **Banco de Dados** | PostgreSQL 15+, Redis 7+, MongoDB 7 |
| **Mensageria** | Apache Kafka |
| **Infraestrutura** | Kubernetes, Docker |

---

## 📊 Progresso Geral

```
FASE 1 - Fundação:        [▓▓▓▓▓▓▓▓▓▓] 92/92 tarefas ✅ COMPLETA
FASE 2 - Core Features:   [▓▓▓▓▓▓▓▓▓▓] 136/136 tarefas ✅ COMPLETA
FASE 3 - AI & Advanced:   [░░░░░░░░░░] 0/85 tarefas
────────────────────────────────────────────
TOTAL:                    [▓▓▓▓▓▓▓░░░] 228/313 tarefas (73%)
```

---

# 🏗️ FASE 1: FUNDAÇÃO (Semanas 1-4)

## 1.1 Infraestrutura Base

### 1.1.1 Setup do Ambiente de Desenvolvimento
- [x] **T001** - Criar estrutura de diretórios do mono-repo
- [x] **T002** - Configurar Docker Compose com todos os serviços base
  - PostgreSQL 15 com PostGIS
  - Redis 7 (Cache e Sessions)
  - MongoDB 7 (Logs e AI History)
  - Apache Kafka com Zookeeper
  - Kafka UI
  - MinIO (Object Storage)
- [x] **T003** - Configurar Kubernetes local (Minikube ou Kind)
- [x] **T004** - Criar scripts de inicialização e teardown do ambiente

### 1.1.2 Observabilidade
- [x] **T005** - Configurar Prometheus para métricas
- [x] **T006** - Configurar Grafana com dashboards básicos
- [x] **T007** - Configurar Loki para agregação de logs
- [x] **T008** - Configurar Jaeger para distributed tracing

### 1.1.3 Banco de Dados PostgreSQL
- [x] **T009** - Criar schema `shared` para metadados globais
- [x] **T010** - Criar schema `tenant_exemplo` para tenant de demonstração
- [x] **T011** - Criar schema `analytics` para data warehouse (OLAP)
- [x] **T012** - Criar tabela `shared.tenants`
- [x] **T013** - Criar tabela `shared.tenant_configs` (white-label)
- [x] **T014** - Criar migrations iniciais com Flyway

---

## 1.2 API Gateway (Porta 8180)

### 1.2.1 Estrutura do Serviço
- [x] **T015** - Criar projeto Spring Boot para api-gateway
- [x] **T016** - Configurar Spring Cloud Gateway
- [x] **T017** - Implementar roteamento básico para microserviços

### 1.2.2 Funcionalidades Core
- [x] **T018** - Implementar rate limiting por tenant
- [x] **T019** - Configurar CORS policies
- [x] **T020** - Implementar logging de requests/responses
- [x] **T021** - Criar health check endpoint

### 1.2.3 Testes
- [x] **T022** - Escrever testes unitários do gateway
- [x] **T023** - Escrever testes de integração de roteamento

---

## 1.3 Auth Service (Porta 8081)

### 1.3.1 Estrutura do Serviço
- [x] **T024** - Criar projeto Spring Boot para auth-service
- [x] **T025** - Configurar Spring Security + OAuth2
- [x] **T026** - Configurar conexão com PostgreSQL

### 1.3.2 Autenticação (RF001)
- [x] **T027** - Implementar login com email/senha
- [x] **T028** - Implementar política de senha forte (8+ chars, maiúscula, minúscula, número, especial)
- [x] **T029** - Implementar geração de JWT com claims customizados
- [x] **T030** - Implementar refresh token (7 dias)
- [x] **T031** - Implementar bloqueio após 5 tentativas (desbloqueio em 15min)
- [x] **T032** - Implementar 2FA com TOTP

### 1.3.3 Banco de Dados Auth
- [x] **T033** - Criar tabela `users`
- [x] **T034** - Criar tabela `roles`
- [x] **T035** - Criar tabela `permissions`
- [x] **T036** - Criar tabela `user_roles`
- [x] **T037** - Criar tabela `role_permissions`
- [x] **T038** - Criar tabela `login_attempts`
- [x] **T039** - Criar tabela `refresh_tokens`

### 1.3.4 RBAC (RF002)
- [x] **T040** - Implementar papéis pré-definidos:
  - Admin
  - Gestor RH
  - Analista DP
  - Líder
  - Colaborador
  - Contador
- [x] **T041** - Implementar criação de papéis customizados
- [x] **T042** - Implementar permissões granulares (CRUD por entidade)
- [x] **T043** - Implementar herança hierárquica de permissões

### 1.3.5 Testes TDD
- [x] **T044** - Teste: credenciais válidas → JWT gerado
- [x] **T045** - Teste: 5 tentativas inválidas → bloqueio
- [x] **T046** - Teste: token expirado → 401 Unauthorized
- [x] **T047** - Teste: refresh token válido → novo JWT
- [x] **T048** - Teste: permissão insuficiente → 403 Forbidden

---

## 1.4 Config Service (Porta 8082)

### 1.4.1 Estrutura do Serviço
- [x] **T049** - Criar projeto Spring Boot para config-service
- [x] **T050** - Configurar Spring Cloud Config
- [x] **T051** - Implementar cache com Redis

### 1.4.2 Gestão de Identidade Visual (RF003)
- [x] **T052** - Implementar upload de logotipo com validação (200x50px min, 2000x500px max)
- [x] **T053** - Implementar definição de paleta de cores (primária, secundária, destaque, fundo, texto)
- [x] **T054** - Implementar geração automática de CSS customizado por tenant
- [x] **T055** - Implementar versionamento de configurações de tema
- [x] **T056** - Implementar rollback para versões anteriores
- [x] **T057** - Implementar exportação/importação de configurações de tema

### 1.4.3 Configuração de Tela de Login (RF004)
- [x] **T058** - Implementar upload de imagem de fundo
- [x] **T059** - Implementar configuração de cor de fundo/gradiente
- [x] **T060** - Implementar posicionamento do formulário (centro, esquerda, direita)
- [x] **T061** - Implementar texto de boas-vindas customizável

### 1.4.4 Testes TDD
- [x] **T062** - Teste: cores válidas → tema aplicado
- [x] **T063** - Teste: contraste insuficiente → alerta de acessibilidade
- [x] **T064** - Teste: logo dimensão inválida → rejeição com mensagem
- [x] **T065** - Teste: alteração de tema → cria nova versão no histórico

---

## 1.5 Frontend Base (Next.js 15)

### 1.5.1 Setup do Projeto
- [x] **T066** - Criar projeto Next.js 15 com TypeScript 5
- [x] **T067** - Configurar Tailwind CSS + shadcn/ui
- [x] **T068** - Configurar Zustand para state management
- [x] **T069** - Configurar TanStack Query para data fetching
- [x] **T070** - Configurar sistema de temas com CSS Variables

### 1.5.2 Componentes Base
- [x] **T071** - Criar layout principal com sidebar e header
- [x] **T072** - Criar componente de login com personalização dinâmica
- [x] **T073** - Criar componente de loading/skeleton
- [x] **T074** - Criar sistema de notificações/toast
- [x] **T075** - Criar componentes de formulário reutilizáveis

### 1.5.3 Autenticação Frontend
- [x] **T076** - Implementar tela de login
- [x] **T077** - Implementar fluxo de autenticação JWT
- [x] **T078** - Implementar refresh token automático
- [x] **T079** - Implementar proteção de rotas
- [x] **T080** - Implementar logout

### 1.5.4 Theme System
- [x] **T081** - Implementar carregamento dinâmico de tema por tenant
- [x] **T082** - Implementar modo claro/escuro
- [x] **T083** - Implementar modo alto contraste (WCAG 2.1 AAA)
- [x] **T084** - Implementar preview em tempo real para admin

---

## 1.6 Kafka Setup

### 1.6.1 Configuração de Topics
- [x] **T085** - Criar topic `employee.domain.events` (6 partições)
- [x] **T086** - Criar topic `timesheet.domain.events` (12 partições)
- [x] **T087** - Criar topic `ai.query.logs` (6 partições)
- [x] **T088** - Criar topic `notification.events` (6 partições)
- [x] **T089** - Criar topic `audit.events` (6 partições)

### 1.6.2 Configuração de Producers/Consumers
- [x] **T090** - Configurar producer base com serialização JSON
- [x] **T091** - Configurar consumer base com deserialização
- [x] **T092** - Implementar dead letter queue para falhas

---

# 🔧 FASE 2: CORE FEATURES (Semanas 5-10)

## 2.1 Employee Service (Porta 8083)

### 2.1.1 Estrutura do Serviço
- [x] **T093** - Criar projeto Spring Boot para employee-service
- [x] **T094** - Configurar Spring Data JPA + R2DBC
- [x] **T095** - Implementar multi-tenant schema routing

### 2.1.2 Banco de Dados
- [x] **T096** - Criar tabela `employees` com todos os campos
- [x] **T097** - Criar tabela `employee_documents`
- [x] **T098** - Criar tabela `employee_dependents`
- [x] **T099** - Criar tabela `employee_history` (auditoria)
- [x] **T100** - Criar tabela `departments`
- [x] **T101** - Criar tabela `positions` (cargos)
- [x] **T102** - Criar tabela `cost_centers`

### 2.1.3 Cadastro Completo (RF008)
- [x] **T103** - Implementar CRUD de colaboradores
- [x] **T104** - Implementar validação de CPF com algoritmo
- [x] **T105** - Implementar integração com API Correios para endereço
- [x] **T106** - Implementar validação de dados bancários
- [x] **T107** - Implementar gestão de dependentes
- [x] **T108** - Implementar histórico completo de alterações

### 2.1.4 Workflow de Admissão Digital (RF009)
- [x] **T109** - Implementar geração de link para candidato
- [x] **T110** - Implementar upload de documentos com validação via OCR
- [x] **T111** - Implementar extração automática de dados (CNH, RG)
- [x] **T112** - Implementar geração de contrato com variáveis
- [x] **T113** - Integrar assinatura eletrônica ICP-Brasil
- [x] **T114** - Implementar envio automático S-2200 para eSocial

### 2.1.5 Frontend Employee
- [x] **T115** - Criar tela de listagem de colaboradores
- [x] **T116** - Criar tela de cadastro/edição de colaborador
- [x] **T117** - Criar tela de visualização 360° do colaborador
- [x] **T118** - Criar wizard de admissão digital
- [x] **T119** - Criar tela de organograma interativo

### 2.1.6 Testes TDD
- [x] **T120** - Teste: CPF válido → persiste colaborador
- [x] **T121** - Teste: CPF duplicado → erro de validação
- [x] **T122** - Teste: atualização de dados → registro no histórico
- [x] **T123** - Teste: admissão completa → evento S-2200 gerado

---

## 2.2 Timesheet Service (Porta 8084)

### 2.2.1 Estrutura do Serviço
- [x] **T124** - Criar projeto Spring Boot para timesheet-service
- [x] **T125** - Configurar integração com Kafka
- [x] **T126** - Configurar cache Redis para consultas frequentes

### 2.2.2 Banco de Dados
- [x] **T127** - Criar tabela `time_records` (registros de ponto)
- [x] **T128** - Criar tabela `work_schedules` (escalas/jornadas)
- [x] **T129** - Criar tabela `time_adjustments` (ajustes)
- [x] **T130** - Criar tabela `overtime_bank` (banco de horas)
- [x] **T131** - Criar tabela `geofences` (locais permitidos)

### 2.2.3 Registro Multimodal (RF010)
- [x] **T132** - Implementar registro via web com captura de foto/localização
- [x] **T133** - Implementar API para app mobile
- [x] **T134** - Implementar validação de geofencing
- [x] **T135** - Implementar integração com REPs (Portaria 671)
- [x] **T136** - Implementar processamento de arquivo AFD

### 2.2.4 Tratamento Automático (RF011)
- [x] **T137** - Implementar cálculo de horas trabalhadas
- [x] **T138** - Implementar cálculo de horas extras
- [x] **T139** - Implementar cálculo de adicional noturno
- [x] **T140** - Implementar tolerância configurável (padrão 5min)
- [x] **T141** - Implementar banco de horas com saldo em tempo real
- [x] **T142** - Implementar regras por sindicato/acordo
- [x] **T143** - Implementar workflow de ajuste (solicitação → aprovação)

### 2.2.5 Frontend Timesheet
- [x] **T144** - Criar tela de registro de ponto web
- [x] **T145** - Criar tela de espelho de ponto
- [x] **T146** - Criar tela de tratamento de exceções
- [x] **T147** - Criar tela de configuração de escalas
- [x] **T148** - Criar dashboard de banco de horas

### 2.2.6 Testes TDD
- [x] **T149** - Teste: registro dentro do geofence → aceito
- [x] **T150** - Teste: registro fora do geofence → pendente de aprovação
- [x] **T151** - Teste: cálculo de horas extras → correto conforme regra
- [x] **T152** - Teste: tolerância de 5min → não conta como atraso

---

## 2.3 Vacation Service (Porta 8085)

### 2.3.1 Estrutura do Serviço
- [x] **T153** - Criar projeto Spring Boot para vacation-service
- [x] **T154** - Configurar integração com employee-service

### 2.3.2 Banco de Dados
- [x] **T155** - Criar tabela `vacation_periods` (períodos aquisitivos)
- [x] **T156** - Criar tabela `vacation_requests` (solicitações)
- [x] **T157** - Criar tabela `vacation_schedules` (programação)

### 2.3.3 Gestão de Férias
- [x] **T158** - Implementar cálculo automático de períodos aquisitivos/concessivos
- [x] **T159** - Implementar alertas de vencimento
- [x] **T160** - Implementar fracionamento em até 3 períodos
- [x] **T161** - Implementar simulador de valores
- [x] **T162** - Implementar workflow de aprovação
- [x] **T163** - Implementar geração de documentos (aviso, recibo)

### 2.3.4 Frontend Vacation
- [x] **T164** - Criar tela de solicitação de férias
- [x] **T165** - Criar calendário de férias da equipe
- [x] **T166** - Criar tela de aprovação para gestores
- [x] **T167** - Criar simulador de valores

### 2.3.5 Testes TDD
- [x] **T168** - Teste: período aquisitivo completo → férias disponíveis
- [x] **T169** - Teste: fracionamento em 4 períodos → erro
- [x] **T170** - Teste: aprovação → documentos gerados

---

## 2.4 Performance Service (Porta 8086)

### 2.4.1 Estrutura do Serviço
- [x] **T171** - Criar projeto Spring Boot para performance-service
- [x] **T172** - Configurar integração com employee-service

### 2.4.2 Banco de Dados
- [x] **T173** - Criar tabela `evaluation_cycles`
- [x] **T174** - Criar tabela `evaluation_forms`
- [x] **T175** - Criar tabela `evaluations`
- [x] **T176** - Criar tabela `competencies`
- [x] **T177** - Criar tabela `goals`
- [x] **T178** - Criar tabela `pdi` (Plano de Desenvolvimento Individual)

### 2.4.3 Avaliação de Desempenho
- [x] **T179** - Implementar ciclos configuráveis (trimestral/semestral/anual)
- [x] **T180** - Implementar tipos de avaliação (auto, gestor, 180°, 360°)
- [x] **T181** - Implementar formulários customizáveis
- [x] **T182** - Implementar banco de competências
- [x] **T183** - Implementar calibração entre gestores
- [x] **T184** - Implementar geração automática de PDI

### 2.4.4 9Box e Sucessão
- [x] **T185** - Implementar matriz 9Box automática
- [x] **T186** - Implementar identificação de HiPos
- [x] **T187** - Implementar planejamento de sucessão

### 2.4.5 Frontend Performance
- [x] **T188** - Criar tela de avaliação
- [x] **T189** - Criar dashboard de desempenho
- [x] **T190** - Criar visualização 9Box interativa
- [x] **T191** - Criar tela de gestão de PDI

---

## 2.5 Learning Service (Porta 8087)

### 2.5.1 Estrutura do Serviço
- [x] **T192** - Criar projeto Spring Boot para learning-service
- [x] **T193** - Configurar integração com MinIO para storage

### 2.5.2 Banco de Dados
- [x] **T194** - Criar tabela `courses`
- [x] **T195** - Criar tabela `learning_paths` (trilhas)
- [x] **T196** - Criar tabela `lessons`
- [x] **T197** - Criar tabela `enrollments`
- [x] **T198** - Criar tabela `progress`
- [x] **T199** - Criar tabela `certificates`
- [x] **T200** - Criar tabela `gamification` (pontos, badges)

### 2.5.3 LMS Features
- [x] **T201** - Implementar upload de conteúdo (vídeo, SCORM, PDF)
- [x] **T202** - Implementar streaming de vídeo HLS
- [x] **T203** - Implementar trilhas personalizadas
- [x] **T204** - Implementar quizzes com correção automática
- [x] **T205** - Implementar gamificação (pontos, badges, ranking)
- [x] **T206** - Implementar certificação automática com validade

### 2.5.4 Frontend Learning
- [x] **T207** - Criar catálogo de cursos
- [x] **T208** - Criar player de conteúdo
- [x] **T209** - Criar tela de trilhas de aprendizado
- [x] **T210** - Criar ranking e achievements
- [x] **T211** - Criar área de certificados

---

## 2.6 Integration Service (Porta 8089)

### 2.6.1 Estrutura do Serviço
- [x] **T212** - Criar projeto Spring Boot para integration-service
- [x] **T213** - Configurar certificado digital A1/A3

### 2.6.2 eSocial
- [x] **T214** - Implementar envio S-2200 (Admissão)
- [x] **T215** - Implementar envio S-2206 (Alteração Contratual)
- [x] **T216** - Implementar envio S-2299 (Desligamento)
- [x] **T217** - Implementar consulta de eventos

### 2.6.3 Outras Integrações
- [x] **T218** - Implementar integração com sistemas de contabilidade
- [x] **T219** - Implementar webhooks para sistemas externos
- [x] **T220** - Implementar API para importação/exportação

---

## 2.7 Notification Service (Porta 8090)

### 2.7.1 Estrutura do Serviço
- [x] **T221** - Criar projeto Spring Boot para notification-service
- [x] **T222** - Configurar AWS SES para emails
- [x] **T223** - Configurar Firebase para push notifications

### 2.7.2 Features
- [x] **T224** - Implementar envio de emails transacionais
- [x] **T225** - Implementar templates de email personalizáveis
- [x] **T226** - Implementar push notifications
- [x] **T227** - Implementar notificações in-app
- [x] **T228** - Implementar webhooks configuráveis

---

## 2.8 Setup Wizard (RF005, RF006, RF007)

### 2.8.1 Backend
- [ ] **T229** - Criar tabela `setup_progress`
- [ ] **T230** - Implementar salvamento automático de progresso
- [ ] **T231** - Implementar validação de etapas obrigatórias
- [ ] **T232** - Implementar importação de estrutura organizacional
- [ ] **T233** - Implementar rollback de importação
- [ ] **T234** - Implementar checklist de ativação
- [ ] **T235** - Implementar geração de documentação automática

### 2.8.2 Frontend Wizard
- [ ] **T236** - Criar etapa 1: Dados da Empresa
- [ ] **T237** - Criar etapa 2: Estrutura Organizacional
- [ ] **T238** - Criar etapa 3: Regras Trabalhistas
- [ ] **T239** - Criar etapa 4: Identidade Visual
- [ ] **T240** - Criar etapa 5: Módulos e Funcionalidades
- [ ] **T241** - Criar etapa 6: Usuários e Permissões
- [ ] **T242** - Criar etapa 7: Integrações
- [ ] **T243** - Criar etapa 8: Importação de Dados
- [ ] **T244** - Criar etapa 9: Revisão e Ativação

### 2.8.3 Testes TDD
- [ ] **T245** - Teste: etapa incompleta → bloqueia avanço
- [ ] **T246** - Teste: retorno ao wizard → carrega última posição
- [ ] **T247** - Teste: importação com erros → relatório detalhado
- [ ] **T248** - Teste: todas etapas completas → permite ativação

---

# 🤖 FASE 3: AI & ADVANCED (Semanas 11-14)

## 3.1 AI Assistant Service (Porta 8088)

### 3.1.1 Estrutura do Serviço
- [ ] **T249** - Criar projeto Spring Boot para ai-assistant-service
- [ ] **T250** - Configurar integração com LLM (OpenAI/Claude)
- [ ] **T251** - Configurar MongoDB para histórico de conversas
- [ ] **T252** - Configurar Vercel AI SDK no frontend

### 3.1.2 Interface Conversacional (RF012)
- [ ] **T253** - Implementar chat component flutuante
- [ ] **T254** - Implementar streaming de respostas
- [ ] **T255** - Implementar manutenção de contexto (follow-up)
- [ ] **T256** - Implementar histórico de conversas com busca
- [ ] **T257** - Implementar formatação de respostas (texto, tabelas, gráficos)

### 3.1.3 NLU - Natural Language Understanding
- [ ] **T258** - Implementar parser de intenções
- [ ] **T259** - Implementar extração de entidades (nomes, datas, valores)
- [ ] **T260** - Implementar detecção de idioma (português brasileiro)
- [ ] **T261** - Implementar correção de variações regionais

### 3.1.4 Query Builder Automático
- [ ] **T262** - Implementar tradução de linguagem natural para queries SQL
- [ ] **T263** - Implementar validação de permissões antes da execução
- [ ] **T264** - Implementar otimização de queries geradas
- [ ] **T265** - Implementar cache de queries frequentes

### 3.1.5 Consultas em Linguagem Natural (RF013)
- [ ] **T266** - Implementar consultas de dados individuais
  - "Qual o salário do João?"
  - "Quando a Maria foi admitida?"
  - "Dependentes do Pedro?"
- [ ] **T267** - Implementar consultas agregadas
  - "Quantos colaboradores temos?"
  - "Média salarial do TI?"
  - "Total de horas extras do mês?"
- [ ] **T268** - Implementar consultas comparativas
  - "Compare turnover 2024 vs 2023"
  - "Top performers do comercial"
- [ ] **T269** - Implementar consultas de compliance
  - "Quem tem férias vencidas?"
  - "Documentos pendentes?"
  - "Treinamentos a vencer?"

### 3.1.6 Capacidades de Ação
- [ ] **T270** - Implementar criação de registros via chat
  - "Registre feedback positivo para Ana"
- [ ] **T271** - Implementar aprovações via chat
  - "Aprove férias da Maria"
  - "Autorize ajuste de ponto do Pedro"
- [ ] **T272** - Implementar geração de relatórios via chat
  - "Gere relatório de horas extras do mês"
- [ ] **T273** - Implementar confirmação obrigatória antes de alterações
- [ ] **T274** - Implementar log completo de ações para auditoria

### 3.1.7 Insights Proativos
- [ ] **T275** - Implementar detecção de anomalias
  - Aumento atípico de horas extras
  - Padrões de faltas
- [ ] **T276** - Implementar alertas de risco de turnover
- [ ] **T277** - Implementar resumo diário/semanal de itens pendentes

### 3.1.8 Testes TDD
- [ ] **T278** - Teste: pergunta count → retorna número correto
- [ ] **T279** - Teste: usuário sem permissão → recusa educadamente
- [ ] **T280** - Teste: ação solicitada → pede confirmação
- [ ] **T281** - Teste: ação confirmada → executa e registra log
- [ ] **T282** - Teste: contexto mantido → responde follow-up corretamente

---

## 3.2 Reconhecimento Facial

### 3.2.1 Backend
- [ ] **T283** - Configurar AWS Rekognition
- [ ] **T284** - Implementar cadastro de face do colaborador
- [ ] **T285** - Implementar validação de face no registro de ponto
- [ ] **T286** - Implementar anti-spoofing (detecção de foto de foto)
- [ ] **T287** - Implementar threshold de confiança (99,5%)

### 3.2.2 Testes TDD
- [ ] **T288** - Teste: face válida cadastrada → registro aceito
- [ ] **T289** - Teste: foto de foto → rejeitado (anti-spoofing)
- [ ] **T290** - Teste: face não cadastrada → registro pendente

---

## 3.3 Mobile App (Flutter/Dart)

### 3.3.1 Setup
- [ ] **T291** - Criar projeto Flutter/Dart
- [ ] **T292** - Configurar navegação
- [ ] **T293** - Configurar state management

### 3.3.2 Features
- [ ] **T294** - Implementar login biométrico
- [ ] **T295** - Implementar registro de ponto com foto/localização
- [ ] **T296** - Implementar modo offline com sincronização
- [ ] **T297** - Implementar push notifications
- [ ] **T298** - Implementar consulta de holerite
- [ ] **T299** - Implementar solicitação de férias
- [ ] **T300** - Implementar chat com assistente IA

---

## 3.4 Analytics Service (Porta 8091)

### 3.4.1 Estrutura do Serviço
- [ ] **T301** - Criar projeto Spring Boot para analytics-service
- [ ] **T302** - Configurar conexão com schema analytics (OLAP)

### 3.4.2 Dashboards e Relatórios
- [ ] **T303** - Implementar dashboard executivo de RH
- [ ] **T304** - Implementar indicadores de turnover
- [ ] **T305** - Implementar análise de absenteísmo
- [ ] **T306** - Implementar relatórios customizáveis
- [ ] **T307** - Implementar exportação (PDF, Excel)

---

# ✅ TESTES E2E FINAIS

## Fluxos Completos
- [ ] **T308** - E2E: Admin configura tema → Preview → Salva → Verifica aplicação
- [ ] **T309** - E2E: Admin completa wizard → Ativa sistema → Colaborador faz login
- [ ] **T310** - E2E: Login → Dashboard → Registro de ponto → Logout
- [ ] **T311** - E2E: Chat IA → Pergunta sobre equipe → Solicita relatório → Download
- [ ] **T312** - E2E: Colaborador solicita férias → Gestor aprova → Documentos gerados
- [ ] **T313** - E2E: Admissão digital completa → S-2200 enviado ao eSocial

---

# 📝 NOTAS DO AGENTE

> Use esta seção para registrar observações, decisões técnicas e problemas encontrados durante o desenvolvimento.

## Decisões Técnicas
```
[DATA] - [DECISÃO] - [JUSTIFICATIVA]
```

## Problemas Encontrados
```
[DATA] - [PROBLEMA] - [SOLUÇÃO]
```

## Dependências Entre Tarefas
- T024-T048 (Auth Service) deve ser concluído antes de T076-T080 (Frontend Auth)
- T049-T065 (Config Service) deve ser concluído antes de T081-T084 (Theme System Frontend)
- T093-T123 (Employee Service) deve ser concluído antes de T109-T114 (Admissão Digital)
- T249-T282 (AI Assistant) depende de todos os outros serviços estarem funcionais

---

# 🔄 HISTÓRICO DE ATUALIZAÇÕES

| Data | Tarefa | Status | Observações |
|------|--------|--------|-------------|
| 2026-01-23 | T001 | Concluido | Estrutura mono-repo criada com 12 microservicos backend, frontend web/mobile, infra, database e docs |
| 2026-01-23 | T002 | Concluido | Docker Compose com PostgreSQL, Redis, MongoDB, Kafka, Zookeeper, Kafka UI, MinIO, Prometheus, Grafana, Loki, Jaeger |
| 2026-01-23 | T003 | Concluido | Kubernetes local com Kind, Kustomize base/overlays, deployments PostgreSQL e Redis |
| 2026-01-23 | T004 | Concluido | Scripts start-dev, stop-dev (sh/bat), create-kafka-topics, health-check |
| 2026-01-23 | T005-T008 | Concluido | Observabilidade: Prometheus config, Grafana dashboards, Loki config, Jaeger tracing |
| 2026-01-23 | T009-T014 | Concluido | PostgreSQL: schemas shared/tenant/analytics, tabelas tenants/tenant_configs/setup_progress, migrations Flyway |
| 2026-01-23 | T015-T022 | Concluido | API Gateway: Spring Cloud Gateway, roteamento, rate limiting, CORS, JWT filter, logging, testes |
| 2026-01-23 | T023 | Concluido | Testes de integracao do Gateway: JwtAuthFilterTest, LoggingFilterTest |
| 2026-01-23 | T024-T048 | Concluido | Auth Service completo: login, JWT, refresh token, 2FA/TOTP, bloqueio, RBAC, roles, permissions, testes TDD |
| 2026-01-24 | T049-T065 | Concluido | Config Service: tema, logo, cache Redis, versionamento, testes |
| 2026-01-24 | T066-T084 | Concluido | Frontend Base: Next.js 15, componentes, login, temas, dark mode |
| 2026-01-24 | T085-T092 | Concluido | Kafka Setup: topics, producers, consumers, DLQ |
| 2026-01-24 | T093-T108 | Concluido | Employee Service: CRUD, validacoes, multi-tenant, historico |
| 2026-01-24 | T109-T114 | Concluido | Admissao Digital: link geracao, OCR, contrato, assinatura, eSocial S-2200 |
| 2026-01-24 | T120-T123 | Concluido | Testes TDD Employee e Admissao |
| 2026-01-24 | T115-T119 | Concluido | Frontend Employee: listagem, cadastro, 360°, wizard admissao, organograma |
| 2026-01-24 | T124-T143 | Concluido | Timesheet Service: ponto, geofencing, REP/AFD, banco de horas, ajustes |
| 2026-01-24 | T149-T152 | Concluido | Testes TDD Timesheet: geofence, horas extras, tolerancia |
| 2026-01-24 | T144-T148 | Concluido | Frontend Timesheet: registro, espelho, ajustes, escalas, banco de horas |
| 2026-01-24 | T153-T163 | Concluido | Vacation Service: periodos, solicitacoes, fracionamento, simulador, documentos |
| 2026-01-24 | T164-T167 | Concluido | Frontend Vacation: dashboard, simulador, calendario |
| 2026-01-24 | T168-T170 | Concluido | Testes TDD Vacation |

---

**Ultima atualizacao:** 2026-01-24

**Progresso atual:** 166/313 tarefas (53%)
