# Documentação Técnica: api-gateway

O `api-gateway` é a porta de entrada única para todo o ecossistema AxonRH, orquestrando o tráfego externo para os microsserviços internos.

## Responsabilidades
- **Roteamento Dinâmico:** Direcionamento de requisições baseadas em padrões de URL (ex: `/api/employee/**` -> `employee-service`).
- **Segurança & Filtros:** Validação preliminar de tokens em conjunto com o `auth-service`.
- **Cross-Origin Resource Sharing (CORS):** Gestão centralizada de políticas de acesso para o Frontend.
- **Resiliência (Circuit Breaker):** Proteção contra falhas em cascata quando um serviço downstream está lento ou indisponível.
- **Load Balancing:** Distribuição de carga entre múltiplas instâncias dos serviços (via Spring Cloud LoadBalancer).

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Cloud Gateway (Project Reactor - Non-blocking).
- **Filtros Globais:** Executam lógica de pré e pós processamento (ex: injeção de Headers, Logs de latência).

## Rotas Principais (Exemplos)
| Endpoint Externo | Serviço Destino |
| :--- | :--- |
| `/api/auth/**` | `auth-service` |
| `/api/employee/**` | `employee-service` |
| `/api/payroll/**` | `payroll-service` |
| `/api/performance/**` | `performance-service` |
| `/api/ai/**` | `ai-assistant-service` |

## Filtros Customizados
- **AuthFilter:** Intercepta requisições, extrai o Bearer Token e valida a validade e permissões antes de encaminhar ao serviço final.

## Manutenção
Configurações de rotas estão centralizadas no `application.yml`, permitindo ajustes rápidos de timeouts e limites de requisição (Rate Limiting).
