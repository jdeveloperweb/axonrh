# Documentação Técnica: benefits-service

O `benefits-service` gerencia o pacote de remuneração indireta e bem-estar dos colaboradores do AxonRH.

## Responsabilidades
- **Catálogo de Benefícios (Benefit Types):** Definição de regras para planos de saúde, odontológicos, vales (refeição, alimentação, transporte) e benefícios flexíveis.
- **Elegibilidade e Atribuição:** Vinculação de benefícios aos colaboradores com base em cargo, senioridade ou departamento.
- **Gestão de Dependentes:** Extensão de benefícios de saúde e seguros para dependentes legais.
- **Histórico de Alterações:** Auditoria de inclusões, exclusões e upgrades de planos.
- **Integração Financeira:** Exportação de descontos e subsídios para o `payroll-service`.

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Boot, JPA.
- **Fluxo de Folha:** Ao fechar a folha, o `payroll-service` consulta este serviço para obter os valores de descontos (ex: co-participação) e benefícios custeados.
- **Validação:** Regras de negócio impedem a duplicação de benefícios ou atribuição fora das regras de elegibilidade.

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `BenefitType` | Definição do benefício (Nome, Provedor, Regra de Cálculo). |
| `EmployeeBenefit` | O vínculo específico entre o colaborador e o benefício ativado. |
| `EmployeeBenefitDependent` | Vinculação de dependentes a um benefício ativo do titular. |
| `BenefitHistory` | Log de eventos de ativação, renovação ou cancelamento. |

## Regras de Subsídio
O sistema permite configurar percentuais de subsídio da empresa vs. desconto do colaborador para cada tipo de benefício.

## Endpoints Principais
- `/api/benefits/types`: CRUD de tipos de benefícios disponíveis.
- `/api/benefits/employees/{id}`: Consulta e gestão de benefícios por colaborador.
- `/api/benefits/reports/payroll`: Resumo de descontos para processamento de folha.
