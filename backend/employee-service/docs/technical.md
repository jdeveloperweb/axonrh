# Documentação Técnica: employee-service

O `employee-service` é o núcleo da gestão de capital humano (HCM) do AxonRH. Ele é responsável por todo o ciclo de vida do colaborador na plataforma.

## Responsabilidades
- **Gestão de Cadastro:** Centralização de dados de colaboradores, dependentes e documentos.
- **Contratação Digital (Digital Hiring):** Orquestração do processo de admissão, desde a candidatura até a geração de contratos.
- **Estruturação Organizacional:** Gerenciamento de Departamentos, Centros de Custo e Cargos.
- **Bem-estar e Eventos:** Registro de participações em eventos e campanhas de saúde mental/vitalidade.
- **Vagas e Talentos:** Banco de talentos e gestão de vagas internas/externas.

## Arquitetura e Tecnologias
- **Stack:** Java 21, Spring Boot 3.x, Spring Data JPA.
- **Banco de Dados:** PostgreSQL (armazenamento persistente de registros).
- **Mensageria:** Integração com Kafka para eventos de domínio (notificações de contratação, novos colaboradores).
- **IA:** Integração com `ai-assistant-service` para extração de dados de documentos (OCR + LLM).

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `Employee` | Registro central do colaborador. |
| `DigitalHiringProcess` | Fluxo de admissão digital. |
| `AdmissionDocument` | Documentos necessários para a contratação. |
| `ContractTemplate` | Modelos dinâmicos de contrato de trabalho. |
| `TalentCandidate` | Candidatos no banco de talentos. |
| `JobVacancy` | Definição de oportunidades de trabalho. |

## Fluxos Principais
1. **Contratação Digital:**
   - Criação do processo -> Coleta de documentos -> Validação via IA -> Geração de Contrato -> Finalização da Admissão.
2. **Atualização de Perfil:**
   - Histórico de alterações e sincronização com serviços de folha (`payroll-service`).

## Endpoints Relevantes
- `/api/employees`: CRUD de colaboradores.
- `/api/digital-hiring`: Gestão do funil de admissão.
- `/api/talent-candidates`: Busca e triagem de talentos.
