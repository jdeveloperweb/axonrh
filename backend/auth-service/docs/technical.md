# Documentação Técnica: auth-service

O `auth-service` é o guardião da segurança e identidade de toda a plataforma AxonRH.

## Responsabilidades
- **Autenticação Centralizada:** Validação de credenciais e emissão de tokens JWT (Access & Refresh Tokens).
- **Gestão de Identidade (IAM):** Cadastro e manutenção de usuários do sistema.
- **RBAC (Role-Based Access Control):** Gestão granular de Perfis (`Roles`) e Permissões (`Permissions`).
- **Segurança de Sessão:** Controle de tentativas de login e bloqueio preventivo.
- **Auditoria:** Registro de logs de acesso e mudanças de privilégios.

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Boot, Spring Security, JWT.
- **Integração:** O `api-gateway` utiliza este serviço para validar todos os tokens nas requisições de entrada.
- **Eventos:** Notifica via Kafka quando um novo usuário é criado ou quando ocorrem anomalias de segurança.

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `User` | Credenciais, status da conta e vínculo com colaborador. |
| `Role` | Agrupador de permissões (ex: Admin, RH, Manager, Employee). |
| `Permission` | Ação atômica permitida no sistema (ex: `EMPLOYEE_WRITE`, `PAYROLL_VIEW`). |
| `RefreshToken` | Token de persistência para renovação de sessão sem re-login. |
| `LoginAttempt` | Histórico para proteção contra ataques de força bruta. |

## Segurança
- Senhas são armazenadas utilizando criptografia forte (BCrypt).
- Implementação de filtros de segurança para proteção contra CSRF e XSS no nível de API.

## Endpoints Principais
- `/api/auth/login`: Autenticação e geração de tokens.
- `/api/auth/refresh`: Renovação do Access Token.
- `/api/auth/users`: Gestão de usuários e vínculos de perfis.
- `/api/auth/permissions`: Listagem de capacidades do sistema.
