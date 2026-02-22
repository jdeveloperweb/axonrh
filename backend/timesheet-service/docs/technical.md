# Documentação Técnica: timesheet-service

O `timesheet-service` é o motor de controle de jornada e frequência do AxonRH.

## Responsabilidades
- **Registro de Ponto:** Captura de batidas (`TimeRecord`) com geolocalização e evidências.
- **Gestão de Escalas:** Definição de horários de trabalho (`WorkSchedule`) e trocas de turno.
- **Banco de Horas:** Cálculo automatizado de horas extras (`OvertimeBank`) e compensações.
- **Ajustes e Abonos:** Fluxo de aprovação para esquecimentos ou justificativas de ausência.
- **Geofencing:** Restrição de batida de ponto baseada em perímetros geográficos permitidos.

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Boot, JPA.
- **Integração:** Exporta o consolidado de horas mensais para o `payroll-service` para cálculo de proventos e descontos.
- **Conformidade:** Segue as diretrizes da Portaria 671 do MTP para registros eletrônicos de ponto.

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `TimeRecord` | O evento de batida de ponto (Entrada, Almoço, Saída). |
| `WorkSchedule` | Regra de jornada (ex: 08:00 - 17:00, 5x2). |
| `OvertimeBank` | Saldo acumulado de horas para compensação futura. |
| `Geofence` | Definição de áreas permitidas para marcação de ponto. |
| `DailySummary` | Agregação diária das batidas para facilitar relatórios. |

## Motor de Cálculo
O sistema calcula automaticamente o saldo do dia (Trabalhado vs. Esperado) e classifica as horas em Normais, Extras ou Atrasos.

## Endpoints Principais
- `/api/timesheet/records`: Realizar batida de ponto e consultar extrato.
- `/api/timesheet/schedules`: Gestão de jornadas de trabalho.
- `/api/timesheet/adjustment-requests`: Solicitações de alteração de ponto.
- `/api/timesheet/bank-status`: Consulta de saldo de banco de horas.
