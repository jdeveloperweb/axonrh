# Documentação Técnica: ai-assistant-service

O `ai-assistant-service` é o cérebro cognitivo do AxonRH, provendo inteligência artificial para automação de processos de RH.

## Responsabilidades
- **Document Processing (OCR Hub):** Extração de dados estruturados de documentos (RG, CPF, Comprovantes) usando modelos de visão e LLM.
- **Knowledge Base:** Gestão de base de conhecimento para o assistente responder dúvidas sobre políticas internas da empresa.
- **Intelligent Chat:** Interface de chat para suporte a colaboradores e gestores.
- **Data Consistency:** Análise de integridade de dados fornecidos por candidatos vs. documentos enviados.

## Arquitetura e IA
- **Stack:** Java 21, Spring Boot, LangChain4j (integração com LLMs).
- **Provedores de IA:** OpenAI (GPT-4o), Google Gemini, Groq.
- **Vector Database:** Utilizado para RAG (Retrieval-Augmented Generation) na base de conhecimento.

## Principais Serviços
| Serviço | Responsabilidade |
| :--- | :--- |
| `ExtractionService` | Realiza o processamento de imagens/PDFs para extrair texto e campos estruturados. |
| `KnowledgeService` | Gerencia fragmentos de documentos e busca semântica. |
| `ChatService` | Orquestra diálogos mantendo o contexto histórico. |

## Fluxo de Extração
1. Recebimento do arquivo via REST.
2. Chamada ao provedor de IA com Prompt de Extração.
3. Mapeamento do JSON retornado para os DTOs do `employee-service`.

## Configuração
As chaves de API e modelos utilizados são configurados via `application.yml` ou variáveis de ambiente, suportando redundância entre provedores.
