# Documentação Técnica: learning-service

O `learning-service` é a plataforma de LXP (Learning Experience Platform) do AxonRH, focada em capacitação, treinamento e educação corporativa.

## Responsabilidades
- **Gestão de Catálogo de Cursos:** Organização de conteúdo em Categorias, Cursos, Módulos e Lições.
- **Trilhas de Aprendizagem (Learning Paths):** Agrupamento sequencial de cursos para especializações técnicas ou comportamentais.
- **Controle de Matrículas (Enrollments):** Gestão de quem pode acessar quais conteúdos e acompanhamento de progresso.
- **Rastreamento de Progresso:** Monitoramento granular de lições assistidas e status de conclusão.
- **Certificação Digital:** Geração automática de certificados em PDF com validação de autenticidade.

## Arquitetura e Fluxo
- **Stack:** Java 21, Spring Boot, Spring Data JPA.
- **Media Hub:** Integração para streaming de vídeos (links externos ou storage dedicado).
- **Gamificação:** Emite eventos de conclusão via Kafka para o sistema de recompensa/reconhecimento (se habilitado).

## Principais Entidades
| Entidade | Descrição |
| :--- | :--- |
| `Course` | Registro central do treinamento (Título, Mentor, Carga Horária). |
| `Lesson` | A unidade básica de conteúdo (Vídeo, Texto, Link). |
| `LearningPath` | Estrutura de trilha que conecta múltiplos cursos. |
| `Enrollment` | Vínculo entre Colaborador e Curso, contendo o progresso atual. |
| `Certificate` | Registro da conclusão bem-sucedida, vinculado ao `Course`. |

## Motor de Progresso
O sistema calcula o progresso percentual baseado no número total de lições versus lições marcadas como completadas (`LessonProgress`).

## Endpoints Principais
- `/api/learning/courses`: CRUD e listagem de treinamentos disponíveis.
- `/api/learning/paths`: Gestão de trilhas de conhecimento.
- `/api/learning/enrollments`: Matrículas e acompanhamento individual.
- `/api/learning/certificates`: Download e validação de certificados.
