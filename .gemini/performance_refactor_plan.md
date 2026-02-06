# Plano de Reformulação do Sistema de Desempenho

## Problemas Identificados

1. ✅ **DISC com poucas perguntas** - Expandido de 10 para 28 perguntas
2. ✅ **Botão "Gerenciar" em posição ruim** - Movido para o topo com destaque
3. **PDI não está sendo enviado** para o colaborador
4. **Não aparece colaborador** na lista de envio do DISC
5. **Falta seção de desempenho** no perfil do colaborador
6. **Falta seção após bem-estar** com perfil DISC resumido e métricas
7. **Área de desempenho confusa** - muitos tipos de avaliações sem clareza

## Estrutura Proposta

### 1. Reorganização da Página Principal de Desempenho

#### Seções Claras:
- **Avaliações Comportamentais** (DISC, Perfil, etc.)
- **Avaliações de Desempenho** (360°, Manager, Self, Peer)
- **Metas e Objetivos** (OKRs, Metas Individuais)
- **Desenvolvimento** (PDI, Treinamentos)
- **Feedback Contínuo**

### 2. Perfil do Colaborador - Nova Seção de Desempenho

Adicionar após a seção de Bem-Estar:

```
┌─────────────────────────────────────────────────┐
│ 📊 Desempenho e Desenvolvimento                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Perfil DISC: Dominante (D)                    │
│  ┌─────┬─────┬─────┬─────┐                    │
│  │ D:85│ I:45│ S:30│ C:40│                    │
│  └─────┴─────┴─────┴─────┘                    │
│                                                 │
│  Última Avaliação: 85/100 (Dez/2025)          │
│  Metas Ativas: 5 (80% de progresso médio)     │
│  PDI Ativo: Liderança Estratégica             │
│                                                 │
│  [Ver Detalhes Completos]                      │
└─────────────────────────────────────────────────┘
```

### 3. Sistema de Envio de Avaliações

#### Tipos de Avaliação:
1. **DISC** - Perfil Comportamental
2. **Avaliação 360°** - Feedback completo
3. **Avaliação de Desempenho** - Ciclo formal
4. **PDI** - Plano de Desenvolvimento

#### Fluxo de Envio:
```
Gerenciar → Escolher Tipo → Selecionar Colaboradores → Definir Prazo → Enviar
```

### 4. Dashboard do Colaborador

#### Visão do Colaborador (sem permissão de RH):
- Minhas Avaliações Pendentes
- Meu Perfil DISC
- Minhas Metas
- Meu PDI
- Feedback Recebido

#### Visão do RH/Manager:
- Todas as funcionalidades do colaborador +
- Gerenciar Avaliações
- Enviar PDI
- Acompanhar Time
- Estatísticas

## Implementação

### Fase 1: Correções Urgentes ✅
- [x] Aumentar perguntas DISC para 28
- [x] Melhorar posição do botão "Gerenciar"
- [x] Corrigir lista de colaboradores no envio DISC
- [x] Implementar envio de PDI

### Fase 2: Nova Seção no Perfil ✅
- [x] Criar componente de resumo de desempenho (PerformanceTab)
- [x] Integrar DISC no perfil
- [x] Adicionar métricas de performance
- [x] Implementar visualização de metas
- [x] Adicionar aba de Desempenho no perfil do colaborador

### Fase 3: Reorganização Geral ✅
- [x] Criar página de gerenciamento de PDI
- [x] Reorganizar página principal de desempenho
- [x] Separar tipos de avaliação claramente
- [x] Melhorar acesso às funcionalidades

### Fase 4: Melhorias de UX ✅
- [x] Adicionar tooltips explicativos (Página Principal e Gestão)
- [x] Adicionar filtros avançados (Gerenciamento de PDI)
- [x] Dashboard analítico para RH (Dados Reais Integrados)
- [x] Correções Funcionais: Criação de PDI e Envio de DISC
- [x] Reorganização Visual: Separar DISC e Desempenho no Perfil
- [ ] Criar guia de uso completo
- [ ] Implementar notificações reais
- [ ] Implementar wizard de envio unificado

## Arquivos Afetados

### Frontend
- `/performance/page.tsx` - Dashboard principal
- `/performance/disc/page.tsx` - DISC (✅ Atualizado)
- `/performance/disc/manage/page.tsx` - Gerenciamento DISC
- `/performance/pdi/page.tsx` - PDI
- `/performance/evaluations/page.tsx` - Avaliações
- `/employees/[id]/page.tsx` - Perfil do colaborador

### Backend
- `DiscController.java` - API DISC
- `PDIController.java` - API PDI
- `EvaluationController.java` - API Avaliações

## Próximos Passos Imediatos

1. Verificar por que colaboradores não aparecem na lista
2. Implementar envio de PDI
3. Criar seção de desempenho no perfil do colaborador
4. Reorganizar página principal de desempenho
