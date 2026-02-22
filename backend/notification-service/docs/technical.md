# Documentação Técnica: notification-service

O `notification-service` é o centro de comunicação do AxonRH, garantindo que a informação certa chegue à pessoa certa no momento ideal.

## Responsabilidades
- **Orquestração Multi-canal:** Envio de notificações via E-mail, Push e In-app.
- **Gestão de Templates:** Criação e manutenção de modelos dinâmicos com suporte a variáveis.
- **Preferências de Usuário:** Respeito às configurações de cada colaborador sobre quais avisos deseja receber.
- **Fila de Processamento:** Uso de mensageria para garantir a entrega mesmo sob alta carga.
- **Rastreabilidade:** Log detalhado de tentativas, sucessos e falhas de entrega.

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Boot, Kafka, SendGrid/SMTP (E-mail), Firebase (Push).
- **Consumo de Eventos:** Ouve diversos tópicos Kafka (ex: `employee.events`, `payroll.events`) para disparar alertas automáticos.
- **Assincronia:** Todo o processo de envio é não-bloqueante para os serviços de origem.

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `Notification` | O registro da mensagem (Título, Conteúdo, Canal, Destinatário). |
| `EmailTemplate` | Estrutura HTML/Texto para e-mails padronizados. |
| `NotificationPreferences` | Canais habilitados por categoria para cada usuário. |
| `EmailLog` / `PushLog` | Trilha de auditoria técnica da entrega. |

## Motor de Templates
Utiliza placeholders dinâmicos (ex: `${employeeName}`) que são substituídos em tempo de execução pelos dados reais do evento.

## Endpoints Principais
- `/api/notifications/templates`: CRUD de modelos de comunicação.
- `/api/notifications/preferences`: Gestão de opt-in/opt-out por canal.
- `/api/notifications/history`: Consulta de notificações enviadas ao usuário.
