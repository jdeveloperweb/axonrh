**AxonRH**

Arquitetura SaaS Completa

*Sistema Integrado de Gestão de RH e Departamento Pessoal*

Versão: 1.0

Data: Janeiro 2026

**Stack Tecnológico:**

Spring Boot 4 • Next.js 15 • PostgreSQL • Kafka • Redis

# **1\. Visão Geral da Arquitetura**

O AxonRH é um sistema SaaS multi-tenant inovador que combina gestão tradicional de RH e Departamento Pessoal com um assistente de IA conversacional, oferecendo uma experiência única e diferenciada no mercado.

## **1.1 Princípios Arquiteturais**

* Domain-Driven Design (DDD): Modelagem baseada em domínios de negócio  
* CQRS: Separação de comandos e consultas para melhor performance  
* Event-Driven Architecture: Comunicação assíncrona via eventos Kafka  
* API-First Design: APIs bem documentadas (OpenAPI/Swagger)  
* Cloud-Native: Containerização e orquestração Kubernetes  
* Test-Driven Development (TDD): Desenvolvimento orientado a testes

## **1.2 Stack Tecnológico**

| Camada | Tecnologias |
| :---- | :---- |
| **Backend** | Spring Boot 4, Java 21 LTS, Spring WebFlux, Spring Data JPA \+ R2DBC, Spring Kafka, Redis, Spring Security \+ OAuth2 |
| **Frontend** | Next.js 15, TypeScript 5, Tailwind CSS \+ shadcn/ui, Zustand \+ TanStack Query, Vercel AI SDK |
| **Infrastructure** | Kubernetes (EKS/GKE/AKS), PostgreSQL 15+, Redis 7+, Apache Kafka, MinIO/S3, Prometheus \+ Grafana |

# **2\. Estratégia Multi-Tenant**

## **2.1 Modelo: Schema-per-Tenant**

O modelo escolhido para o AxonRH é o Schema-per-Tenant, que oferece o melhor equilíbrio entre isolamento de dados, performance e custo-benefício para um sistema SaaS de RH e DP.

### **Justificativa da Escolha**

* ✅ Isolamento forte de dados sensíveis (RH/DP)  
* ✅ Backup/restore individual por tenant  
* ✅ Performance otimizada (sem WHERE tenant\_id em todas queries)  
* ✅ Compliance LGPD facilitado  
* ✅ Customização de schema se necessário  
* ✅ Custo-benefício melhor que Database-per-Tenant

### **Estrutura de Schemas PostgreSQL**

\-- Database: axonrh\_prodCREATE SCHEMA shared;          \-- Metadados globaisCREATE SCHEMA tenant\_e7f2a1b3;  \-- UUID curto do tenant 1CREATE SCHEMA tenant\_9d4c8f21;  \-- UUID curto do tenant 2CREATE SCHEMA analytics;        \-- Data warehouse (OLAP)

# **3\. Arquitetura de Microserviços**

O AxonRH é composto por 12 microserviços independentes, cada um responsável por um bounded context específico do domínio.

| Serviço | Porta | Responsabilidade | Complex. |
| :---- | :---- | :---- | :---- |
| api-gateway | 8180 | Roteamento, Rate Limit, Auth | Média |
| auth-service | 8081 | Autenticação, JWT, SSO, 2FA | Alta |
| employee-service | 8083 | CRUD Colaboradores, Documentos | Média |
| timesheet-service | 8084 | Ponto Multimodal, Facial, Banco Horas | Alta |
| **ai-assistant-service** | 8088 | **Chat IA, NLU, Query Builder \- DIFERENCIAL** | **Muito Alta** |

*Nota: O ai-assistant-service é o principal diferencial competitivo do AxonRH, permitindo interação em linguagem natural com todos os dados e funcionalidades do sistema.*

# **4\. Banco de Dados**

A arquitetura de dados do AxonRH utiliza PostgreSQL como banco principal com schemas isolados por tenant, Redis para cache e sessões, e MinIO/S3 para object storage.

## **4.1 PostgreSQL \- Schema Shared**

CREATE SCHEMA shared;-- Tabela de TenantsCREATE TABLE shared.tenants (    id UUID PRIMARY KEY,    name VARCHAR(200) NOT NULL,    subdomain VARCHAR(50) UNIQUE NOT NULL,    status VARCHAR(20) DEFAULT 'ACTIVE',    created\_at TIMESTAMP DEFAULT NOW());-- Configurações de Layout (White-label)CREATE TABLE shared.tenant\_configs (    id UUID PRIMARY KEY,    tenant\_id UUID REFERENCES shared.tenants(id),    logo\_url VARCHAR(500),    cor\_primaria VARCHAR(7),    tema\_claro JSONB,    created\_at TIMESTAMP DEFAULT NOW());

# **5\. Configuração Kafka**

O Apache Kafka é utilizado para comunicação assíncrona entre microserviços através de eventos de domínio, garantindo eventual consistency e desacoplamento.

## **5.1 Topics Principais**

| Topic | Partições | Descrição |
| :---- | :---- | :---- |
| employee.domain.events | 6 | Eventos de colaboradores (created, updated, terminated) |
| timesheet.domain.events | 12 | Eventos de ponto (clock-in, clock-out, adjusted) |
| ai.query.logs | 6 | Log de consultas do assistente de IA |

# **6\. Setup Docker Compose**

Para facilitar o desenvolvimento local, todo o ambiente pode ser executado via Docker Compose com todos os serviços, bancos de dados e ferramentas de observabilidade.

## **6.1 Serviços Incluídos**

* PostgreSQL 15 com PostGIS  
* Redis 7 (Cache e Sessions)  
* MongoDB 7 (Logs e AI History)  
* Apache Kafka com Zookeeper  
* Kafka UI (Gerenciamento)  
* MinIO (Object Storage)  
* Prometheus \+ Grafana (Monitoring)  
* Loki (Logs Aggregation)  
* Jaeger (Distributed Tracing)  
* Eureka Server (Service Discovery)

# **7\. Roadmap de Desenvolvimento**

O desenvolvimento do AxonRH será realizado em 3 fases principais ao longo de 14 semanas, priorizando a criação de uma base sólida antes de implementar funcionalidades avançadas.

## **7.1 FASE 1: Fundação (Semanas 1-4)**

### **Sprint 1-2**

* Setup Kubernetes local (Minikube/Kind)  
* API Gateway (routing básico)  
* Auth Service (JWT \+ login simples)  
* Config Service (CRUD tenant configs)  
* PostgreSQL schemas (shared \+ 1 tenant exemplo)

### **Sprint 3-4**

* Employee Service (CRUD completo)  
* Frontend básico (Next.js \+ auth)  
* Theme System (load dinâmico CSS)  
* Kafka setup (topics básicos)

## **7.2 FASE 2: Core Features (Semanas 5-10)**

* Timesheet Service (registro web \+ API)  
* Vacation Service (cálculo \+ workflow)  
* Performance Service (avaliações)  
* Learning Service (upload conteúdo)  
* Integration Service (eSocial S-2200)

## **7.3 FASE 3: AI & Advanced (Semanas 11-14)**

* AI Assistant Service (chat \+ NLU)  
* Integração LLM (OpenAI/Claude)  
* Query Builder automático  
* Mobile App (Flutter/Dart)  
* Reconhecimento Facial (AWS Rekognition)

# **8\. Custos e Escalabilidade**

Estimativa de custos mensais para ambiente de produção com capacidade para 100 tenants iniciais.

## **8.1 Infraestrutura AWS (Mensal)**

| Serviço | Custo |
| :---- | :---- |
| EKS Cluster | $73 |
| EC2 (3x t3.medium) | $100 |
| RDS PostgreSQL (db.t3.medium Multi-AZ) | $135 |
| ElastiCache Redis | $50 |
| S3 Storage (100GB) | $3 |
| ALB \+ CloudWatch | $45 |
| **SUBTOTAL Infraestrutura** | **\~$406/mês** |

## **8.2 Serviços Externos**

* LLM API (OpenAI GPT-4 ou Anthropic Claude): $100-500/mês  
* Facial Recognition (AWS Rekognition): $50-200/mês  
* Email Service (AWS SES): $5/mês (50k emails)

**CUSTO TOTAL MENSAL ESTIMADO: $561 \- $1.111**

# **9\. Conclusão e Próximos Passos**

Este documento apresenta uma arquitetura completa e pronta para implementação do sistema AxonRH, contemplando todos os aspectos técnicos necessários desde a infraestrutura até os detalhes de cada microserviço.

## **9.1 Diferenciais Competitivos**

1. **Assistente de IA Conversacional:** Interface natural que elimina curva de aprendizado  
2. **White-label Completo:** Personalização total da identidade visual  
3. **Setup Guiado:** Wizard de implantação que facilita onboarding  
4. **Arquitetura Moderna:** Microserviços escaláveis e cloud-native

## **9.2 Decisões Recomendadas**

**Estrutura de Repositório:**

* Mono-repo para fase inicial (facilita desenvolvimento)  
* Considerar multi-repo quando time crescer (+10 devs)

**Ordem de Implementação:**

5. auth-service (base de segurança)  
6. config-service (setup e temas)  
7. employee-service (core do negócio)  
8. timesheet-service (funcionalidade crítica)  
9. ai-assistant-service (diferencial)

## **9.3 Recursos Adicionais**

Os seguintes artefatos complementam este documento:

* Scripts SQL completos com todas as migrations  
* Docker Compose configurado com todos os serviços  
* Exemplos de código Spring Boot para cada serviço  
* Configurações Kafka com producers e consumers  
* Estrutura completa de diretórios do projeto

**Pronto para começar o desenvolvimento\! 🚀**

*Jaime, espero que este documento seja útil para iniciar o projeto AxonRH\!*
