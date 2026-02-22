# Documentação Técnica: performance-service

O `performance-service` é o módulo de inteligência de talentos do AxonRH, focado em alta performance, desenvolvimento contínuo e análise comportamental.

## Responsabilidades
- **Gestão de Ciclos de Avaliação:** Orquestração de avaliações 90°, 180° e 360°.
- **Metas e OKRs:** Acompanhamento de objetivos individuais e organizacionais com histórico de evolução.
- **PDI (Plano de Desenvolvimento Individual):** Planejamento e tração de ações para crescimento profissional.
- **DISC Profiling:** Sistema integrado para mapeamento de perfil comportamental (D-Dominância, I-Influência, S-Estabilidade, C-Conformidade).
- **Nine Box:** Matriz de potencial vs. desempenho para sucessão e retenção.

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Boot, JPA, QueryDSL (para filtros complexos de performance).
- **IA Integration:** Consome insights do `ai-assistant-service` para sugerir ações de PDI baseadas nos resultados de avaliação.
- **Integração:** Depende do `employee-service` para prover a hierarquia (Managers/Reports).

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `EvaluationCycle` | Define o período e as regras de uma onda de avaliações. |
| `Evaluation` | O registro de uma avaliação específica de um colaborador. |
| `Goal` | Objetivo mensurável com target e progresso. |
| `PDI` | Container de ações de desenvolvimento vinculadas a um ciclo. |
| `DiscEvaluation` | Resultado do teste psicométrico DISC. |
| `NineBox` | Cálculo de quadrante baseado em scores de avaliação e metas. |

## Motor de Avaliação
O sistema suporta formulários dinâmicos (`EvaluationForm`) com seções e questões configuráveis (múltipla escolha, escala de Likert, texto livre).

## Endpoints Principais
- `/api/performance/evaluations/cycles`: Gestão de janelas de avaliação.
- `/api/performance/goals`: Manutenção de metas individuais.
- `/api/performance/disc`: Questionários e resultados comportamentais.
- `/api/performance/pdi`: Ações de desenvolvimento.
