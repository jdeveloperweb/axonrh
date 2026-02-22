# Documentação Técnica: vacation-service

O `vacation-service` gerencia o descanso e o tempo fora do trabalho dos colaboradores, garantindo conformidade com a CLT e políticas internas.

## Responsabilidades
- **Gestão de Períodos Aquisitivos:** Controle automático de datas de início e fim de aquisição de férias.
- **Solicitações de Férias:** Fluxo de pedidos, aprovações e agendamento de descansos.
- **Controle de Afastamentos (Leave Requests):** Registro de faltas justificadas, licenças médicas (com integração CID) e licenças legais.
- **Cálculo de Saldos:** Monitoramento de dias disponíveis e vencimento de férias (férias dobradas).

## Arquitetura e Integração
- **Stack:** Java 21, Spring Boot, Spring Data JPA.
- **Integração:** Informa o `payroll-service` sobre abonos pecuniários e dias de férias para o cálculo da folha.
- **Calendário:** Sincronização de datas para visualização de disponibilidade de equipe no frontend.

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `VacationPeriod` | Registro do período que dá direito às férias (12 meses de trabalho). |
| `VacationRequest` | A solicitação específica de datas para gozo de férias. |
| `LeaveRequest` | Registro de afastamentos diversos (licenças, atestados). |
| `CidCode` | Tabela de referência de CIDs para atestados médicos. |

## Fluxos Principais
1. **Solicitação de Férias:**
   - Colaborador solicita -> Gestor aprova -> RH valida -> Agendado para Folha.
2. **Gestão de Atestados:**
   - Upload do documento -> Registro do CID -> Cálculo automático de dias de afastamento sugeridos.

## Endpoints Relevantes
- `/api/vacations/requests`: CRUD de pedidos de férias.
- `/api/vacations/periods/{employeeId}`: Consulta de saldos e períodos aquisitivos.
- `/api/leaves`: Gestão de afastamentos e licenças.
