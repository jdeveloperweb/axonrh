# Documentação Técnica: payroll-service

O `payroll-service` é o motor financeiro do AxonRH, responsável pelo processamento preciso de salários, impostos e benefícios.

## Responsabilidades
- **Motor de Cálculo (Payroll Calculation Engine):** Processamento de proventos, descontos e encargos sociais.
- **Gestão de Holerites:** Geração e armazenamento de recibos de pagamento em formato PDF.
- **Processamento em Lote (Payroll Runs):** Execução de folhas mensais, quinzenais ou complementares para toda a organização.
- **Tributação Dinâmica:** Configuração de tabelas de IRRF, INSS e FGTS.

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Boot, Spring Data JPA, iText (para PDFs).
- **Integração:** Consome dados de contratos do `employee-service` e eventos de afastamento do `vacation-service`.
- **Kafka:** Emite eventos de "Folha Fechada" para disparar notificações e lançamentos contábeis.

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `PayrollRun` | Cabeçalho de um processamento de folha (Mês/Ano, Status). |
| `Payroll` | O registro de folha individual de um colaborador em um período. |
| `PayrollItem` | Cada linha da folha (Salário Base, Vale Transporte, INSS, etc). |
| `TaxBracket` | Faixas de tributação configuráveis. |

## Motor de Cálculo
O `PayrollCalculationEngine` é o componente central que recebe as regras de negócio e os dados do contrato para calcular o salário líquido, considerando:
1. Proventos Fixos (Salário, Adicionais).
2. Variáveis (Horas Extras do `timesheet-service`).
3. Descontos Legais (Impostos) e Facultativos (Benefícios).

## Endpoints Principais
- `/api/payroll/runs`: Início e monitoramento de fechamentos de folha.
- `/api/payroll/employees/{id}`: Consulta de histórico de holerites.
- `/api/payroll/pdf/{id}`: Download de recibos de pagamento.
