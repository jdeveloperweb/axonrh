-- =====================================================
-- Seed de Treinamentos Completos para a Axon Academy
-- =====================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_cat_lideranca UUID;
    v_cat_tech UUID;
    v_cat_cultura UUID;
    v_cat_seguranca UUID;
    v_course_id UUID;
    v_module_id UUID;
    v_lesson_id UUID;
BEGIN
    -- Busca o ID do primeiro tenant disponível
    SELECT id INTO v_tenant_id FROM shared.tenants LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Nenhum tenant encontrado. Seed abortado.';
        RETURN;
    END IF;

    -- 1. Inserir Categorias
    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Liderança', 'Desenvolvimento de gestores e líderes', 'User', '#3b82f6')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_lideranca;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Tecnologia', 'Habilidades técnicas e ferramentas', 'LayoutGrid', '#10b981')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_tech;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Cultura', 'Cultura Axon e Soft Skills', 'GraduationCap', '#8b5cf6')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_cultura;

    INSERT INTO shared.training_categories (tenant_id, name, description, icon, color)
    VALUES (v_tenant_id, 'Segurança', 'Segurança da informação e conformidade', 'Shield', '#ef4444')
    ON CONFLICT (tenant_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_cat_seguranca;

    -- 2. CURSO: Onboarding Axon (OBRIGATÓRIO)
    INSERT INTO shared.courses (tenant_id, category_id, title, description, objectives, target_audience, course_type, modality, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnailUrl)
    VALUES (v_tenant_id, v_cat_cultura, 'Bem-vindo à Axon: Integrando-se à nossa cultura', 
            'Conheça nossa história, valores e como operamos no dia a dia.', 
            'Entender a cultura Axon e os processos internos', 'Novos Colaboradores', 
            'ONLINE', 'AUTODIDATA', 'INICIANTE', 'PUBLISHED', true, 120, 'Recursos Humanos',
            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    -- Módulos e Lições do Onboarding
    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Nossa História e DNA', 1, 30) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Quem somos e para onde vamos', 'ARTIGO', 1, 15, 
            '# Bem-vindo à AxonRH\n\nA Axon nasceu com um propósito claro: **transformar a gestão de pessoas através da tecnologia**. Fundada em 2020, nossa missão é fornecer ferramentas que tornem o dia a dia do RH mais estratégico e menos burocrático.\n\n## Nossa Jornada Detalhada\n\nTudo começou em uma pequena sala de coworking, onde três entusiastas de tecnologia e RH perceberam uma lacuna crítica no mercado: os sistemas de gestão de pessoas eram engessados, focados apenas em folha de pagamento e processos burocráticos. Eles queriam criar algo que falasse sobre **pessoas**, sobre talentos, sobre crescimento e não apenas sobre números e cálculos.\n\nEm 2021, recebemos nossa primeira rodada de investimento, o que nos permitiu expandir o time de engenharia e criar o que hoje é o Axon Academy. Em 2023, alcançamos a marca de 500 clientes corporativos ativos.\n\n## Nossos Valores Fundamentais em Profundidade\n\nAqui na Axon, nossos valores são a bússola que guia cada decisão, desde a contratação de um novo talento até o lançamento de uma nova funcionalidade:\n\n1. **Inovação Constante:** O status quo é nosso inimigo natural. Questionamos o "sempre foi feito assim" e buscamos incansavelmente formas melhores.\n2. **Foco Obsessivo no Usuário:** Cada botão é desenhado pensando em como isso facilita a vida de quem usa nossa plataforma.\n3. **Transparência Radical:** Acreditamos que a informação deve fluir livremente. Nossas reuniões de resultados são totalmente abertas.\n4. **Diversidade e Inclusão:** Acreditamos que times diversos são intrinsecamente mais inteligentes e criativos.\n\n## Sua Missão na Axon\n\nIndependentemente do seu cargo, sua missão principal é contribuir para que as organizações tratem seus talentos com a dignidade, o respeito e a visão estratégica que eles merecem.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Benefícios e Qualidade de Vida', 2, 45) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Manual de Benefícios Completo 2026', 'ARTIGO', 1, 30, 
            '# Guia Definitivo de Benefícios Axon\n\nNosso pacote de benefícios foi desenhado para ser um suporte real e flexível para você e sua família.\n\n## 🍽 Alimentação e Refeição Flexível\n\nTrabalhamos com o cartão de benefícios flexíveis da Flash. Você recebe um valor fixo mensal de R$ 1.200,00, que pode ser distribuído como você preferir através do aplicativo móvel.\n\n## 🏥 Saúde e Bem-estar Integral\n\n- **Plano de Saúde Bradesco Saúde (Nacional):** Plano top de linha com acesso aos melhores hospitais do país (Rede Platinum). A Axon cobre 100% da mensalidade do colaborador.\n- **Gympass & ZenApp:** Acesso gratuito a academias de todo o Brasil e assinatura premium do ZenApp para meditação e apoio psicológico online.\n\n## 🏠 Ecossistema de Trabalho (Híbrido e Remoto)\n\n- **Auxílio Home-Office:** R$ 250,00 mensais para ajudar com custos de infraestrutura.\n- **Equipamentos de Ponta:** MacBook Air/Pro, Cadeira Herman Miller, Mouse Logi e Monitor 4K.\n- **Verba Setup Única:** Reembolso de até R$ 2.000,00 para melhorias no seu escritório doméstico.\n\n## 🚀 Educação e Futuro\n\n- **Educação Continuada:** Reembolso de até R$ 8.000,00 por ano para cursos e certificações.\n- **Biblioteca Axon:** Verba livre para compra de livros técnicos na Amazon.\n\nPara gerenciar seus benefícios, acesse o menu lateral **Meu Perfil > Benefícios** aqui no AxonRH.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Nossa Estrutura e Rituais', 3, 45) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Como trabalhamos e nos comunicamos', 'ARTIGO', 1, 30, 
            '# Rituais e Comunicação na Axon\n\nTrabalhar na Axon significa abraçar a eficiência e a clareza. Adotamos o modelo de **comunicação assíncrona** como prioridade.\n\n## Nossas Ferramentas Diárias\n\n- **Slack:** Para comunicação rápida e informal. Canais `#general` para avisos e `#team-x` para o dia a dia.\n- **Notion:** Nosso cérebro coletivo. Toda a documentação de projetos e manuais estão lá.\n- **Linear:** Onde gerimos todas as nossas tarefas e desenvolvimento.\n\n## Rituais do Time\n\n- **All-Hands Quinzenal:** Reunião com toda a empresa para alinhamento de visão e resultados.\n- **Retrospectivas:** Ao final de cada ciclo, olhamos para trás e perguntamos o que podemos melhorar.\n- **Show and Tell:** Espaço mensal para compartilhar projetos pessoais ou ferramentas legais que você descobriu.\n\n**Dica:** Evite reuniões sem pauta. Se o assunto pode ser resolvido por um texto no Slack, prefira o texto.');

    -- 3. CURSO: Segurança da Informação (OBRIGATÓRIO)
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnailUrl)
    VALUES (v_tenant_id, v_cat_seguranca, 'LGPD e Segurança na Prática', 
            'Fundamentos de proteção de dados e cibersegurança para todos os colaboradores.', 
            'ONLINE', 'INICIANTE', 'PUBLISHED', true, 180, 'Time de Segurança',
            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Introdução à LGPD', 1, 60) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'O que são dados sensíveis e como protegê-los?', 'ARTIGO', 1, 40, 
            '# O que é LGPD e sua Importância Estratégica\n\nA Lei Geral de Proteção de Dados (13.709/2018) é um compromisso ético da Axon com a privacidade. Ela regulamenta como as empresas devem tratar informações pessoais.\n\n## Classificação de Dados\n\n1. **Dado Pessoal:** Identifica uma pessoa (Nome, CPF, E-mail, IP).\n2. **Dado Pessoal Sensível:** Dados que merecem proteção especial por poderem causar discriminação (Religião, convicção política, saúde, biometria).\n\n## Manual de Conduta Prática\n\n- **Clean Desk Policy:** Nunca deixe papéis com dados expostos.\n- **Lock Screen:** Use o atalho `Win + L` ou `Cmd + Ctrl + Q` sempre que sair da mesa.\n- **MFA:** Autenticação em dois fatores é obrigatória em TODOS os sistemas.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Defesa Ativa', 2, 60) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Phishing e Engenharia Social no Detalhe', 'ARTIGO', 1, 40, 
            '# Como se proteger de ataques cibernéticos\n\nEngenharia Social é a manipulação psicológica das pessoas. É a forma mais comum de ataque hoje.\n\n## O Perigo do Phishing\n\n- **Sinal de Alerta:** Urgência no tom, erros de ortografia e remetentes estranhos.\n- **Dica:** Coloque o cursor sobre o link antes de clicar para ver a URL real de destino.\n\n## Outros Ataques\n\n- **Vishing:** Ataque via telefone simulando suporte técnico.\n- **Smishing:** Ataques via SMS ou WhatsApp com links maliciosos.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Procedimentos de Incidente', 3, 60) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'O que fazer em caso de brecha?', 'ARTIGO', 1, 40, 
            '# Protocolo de Crise de Segurança\n\nSe você perceber um comportamento estranho no seu PC ou suspeitar que clicou em um link malicioso:\n\n1. **Ação Imediata:** Desconecte o Wi-Fi ou cabo de rede.\n2. **Notificação:** Avise o time de TI imediatamente no canal `#is-security-breach`.\n3. **Transparência:** Conte exatamente o que aconteceu sem omitir nada. O erro humano é esperado, mas a omissão pode ser fatal para a empresa.\n\n**Dica:** Nunca tente "consertar" o problema sozinho baixando antivírus desconhecidos.');

    -- 4. CURSO: Liderança Alpha
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnailUrl)
    VALUES (v_tenant_id, v_cat_lideranca, 'Liderança Alpha: Gestão de Equipes Remotas', 
            'Como manter a produtividade e o engajamento em times distribuídos.', 
            'ONLINE', 'AVANCADO', 'PUBLISHED', false, 300, 'Dr. Rodrigo Porto',
            'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Fundamentos da Gestão Distribuída', 1, 100) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Guia Mestre de Rituais', 'ARTIGO', 1, 60,
            '# Liderança Alpha: Gestão por Confiança\n\nNo modelo remoto, o segredo é substituir a gestão por presença pela **gestão por autonomia e resultados**.\n\n## Rituais Mensuráveis\n\n- **Dailies Eficazes:** Máximo 15 min. Foco em bloqueios.\n- **One-on-Ones (1:1s):** O momento mais importante. Foco no colaborador, não nas tarefas.\n- **SMART Goals:** Objetivos Específicos, Mensuráveis, Atingíveis, Relevantes e com Prazo.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Gestão de Conflitos e Performance', 2, 100) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Como dar feedbacks produtivos à distância', 'ARTIGO', 1, 60, 
            '# Feedback Remoto: Sensibilidade e Clareza\n\nO feedback remoto corre o risco de ser mal interpretado (falta o tom de voz e a expressão facial).\n\n## Melhores Práticas\n\n- **Vídeo Sempre Ligado:** Essencial para captar a linguagem não-verbal.\n- **Foco no Fato:** Use o método SBI (Situation, Behavior, Impact). Descreva a situação, o comportamento observado e o impacto gerado.\n- **Follow-up por escrito:** Após a vídeo chamada, envie um resumo assíncrono para garantir que o entendimento foi mútuo.\n\n**Dica:** Elogie em público (Slack) e dê críticas no privado (1:1).');

    -- 5. CURSO: IA Generativa
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnailUrl)
    VALUES (v_tenant_id, v_cat_tech, 'IA Generativa para Negócios', 
            'Domine o ChatGPT e outras ferramentas de IA para otimizar seus processos.', 
            'ONLINE', 'INTERMEDIARIO', 'PUBLISHED', false, 240, 'Eng. Carlos AI',
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Prompt Engineering Avançado', 1, 120) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'A Arte e a Ciência de Perguntar à IA', 'ARTIGO', 1, 90,
            '# O Método RTCE (Role-Task-Context-Expectation)\n\nPrompt Engineering é a habilidade de traduzir intenções humanas em instruções precisas para LLMs.\n\n1. **Role (Papel):** "Aja como um analista financeiro".\n2. **Task (Tarefa):** "Crie um resumo de custos".\n3. **Context (Contexto):** "Para uma startup de tecnologia".\n4. **Expectation (Expectativa):** "Em formato de tabela Markdown".\n\n## Técnicas Avançadas\n\n- **Chain of Thought:** "Explique seu raciocínio passo a passo".\n- **Few-Shot:** Forneça 1 ou 2 exemplos do resultado esperado.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'IA para Imagem e Produtividade Visual', 2, 120) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Midjourney e Dall-E no Design Corporativo', 'ARTIGO', 1, 90, 
            '# IA Generativa para Mídia\n\nA criação visual não é mais exclusividade de softwares complexos de design.\n\n## Ferramentas recomendadas\n\n- **Midjourney:** Para imagens hiper-realistas e conceituais.\n- **Dall-E 3:** Excelente para criar ícones e ilustrações baseadas em prompts detalhados.\n- **Canva Magic Studio:** Acelera a criação de apresentações corporativas.\n\n**Laboratório:** Tente criar um banner para o LinkedIn da sua área usando apenas 3 prompts iterativos.');

    -- 6. CURSO: Comunicação Eficaz (CNV)
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnailUrl)
    VALUES (v_tenant_id, v_cat_cultura, 'Comunicação Não-Violenta e Feedback', 
            'Ferramentas práticas para diálogos produtivos e resolução de conflitos.', 
            'ONLINE', 'INTERMEDIARIO', 'PUBLISHED', false, 150, 'Ana Clara Reghin',
            'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Mergulho no Método CNV', 1, 75) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Observação x Julgamento', 'ARTIGO', 1, 45,
            '# O Framework de 4 Passos da CNV\n\n1. **Observação:** Descreva o fato como uma câmera (sem julgamento).\n2. **Sentimento:** Nomeie a emoção real (ex: frustração, ansiedade).\n3. **Necessidade:** Identifique o valor não atendido (ex: organização).\n4. **Pedido:** Faça uma ação concreta, positiva e no presente.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Aplicação Prática no RH', 2, 75) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Resolvendo Conflitos com o Método Girafa', 'ARTIGO', 1, 45, 
            '# Escuta Ativa e Empatia no Trabalho\n\nA Girafa (animal com o maior coração) representa a linguagem empática na CNV.\n\n## Estratégias de Escuta\n\n- **Reparação:** "O que eu ouvi você dizer foi... é isso mesmo?".\n- **Identificação da Necessidade do Outro:** Quando alguém te ataca, pergunte-se: "Qual medo ou necessidade essa pessoa está tentando proteger agora?".\n- **Foco na Conexão:** O objetivo não é vencer a discussão, mas encontrar uma solução onde as necessidades de ambos sejam nutridas.');

    -- 7. CURSO: Vendas de Alta Conversão
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnailUrl)
    VALUES (v_tenant_id, v_cat_tech, 'Vendas de Alta Conversão', 
            'Técnicas modernas de vendas e gatilhos mentais.', 
            'ONLINE', 'INTERMEDIARIO', 'PUBLISHED', false, 180, 'Marcos Oliveira',
            'https://images.unsplash.com/photo-1556761175-5973bcad5cca?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Psicologia do Consumidor', 1, 90) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Gatilhos Mentais: Reciprocidade, Escassez e Urgência', 'ARTIGO', 1, 60,
            '# Neurovendas: Decifrando o Cérebro do Prospect\n\n- **Escassez:** Valorizamos o que é raro.\n- **Urgência:** Agimos quando o tempo está acabando.\n- **Autoridade:** Confiamos em especialistas, não em vendedores.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Gestão de Funil e Fechamento', 2, 90) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Spin Selling e Perguntas de Impacto', 'ARTIGO', 1, 60, 
            '# O Método SPIN\n\n1. **S**ituação: Entenda o contexto atual.\n2. **P**roblema: Identifique as dores.\n3. **I**mplicação: Mostre o custo de não resolver o problema.\n4. **N**ecessidade de Solução: Ajude o cliente a visualizar os benefícios.\n\n**Exercício:** Escreva 3 perguntas de Implicação para um prospect que está perdendo talentos por falta de treinamentos.');

    -- 8. CURSO: Excel para Negócios
    INSERT INTO shared.courses (tenant_id, category_id, title, description, course_type, difficulty_level, status, is_mandatory, duration_minutes, instructor_name, thumbnailUrl)
    VALUES (v_tenant_id, v_cat_tech, 'Excel para Negócios', 
            'Desde o básico até tabelas dinâmicas e dashboards.', 
            'ONLINE', 'INICIANTE', 'PUBLISHED', false, 420, 'Beatriz Silva',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop')
    RETURNING id INTO v_course_id;

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Fórmulas e Funções de RH', 1, 180) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'PROCV e Filtros Avançados', 'ARTIGO', 1, 150, 
            '# Dominando o PROCV no RH\n\nAprenda a cruzar bases de CPFs com salários e cargos em segundos.\n\n`=PROCV(valor; matriz; coluna; 0)`\n\n**Dica:** Sempre fixe sua matriz com F4 para evitar erros ao arrastar a fórmula.');

    INSERT INTO shared.course_modules (course_id, title, sequence_order, duration_minutes)
    VALUES (v_course_id, 'Tabelas Dinâmicas e Dashboards', 2, 240) RETURNING id INTO v_module_id;
    
    INSERT INTO shared.lessons (module_id, title, content_type, sequence_order, duration_minutes, content_text)
    VALUES (v_module_id, 'Análise de People Analytics com Pivot Tables', 'ARTIGO', 1, 180, 
            '# Tabelas Dinâmicas: O Poder da Síntese\n\nTransforme 10.000 linhas de dados brutos em um resumo executivo de turnover por departamento em apenas 5 cliques.\n\n## Fluxo de Criação\n\n1. Selecione seus dados.\n2. Inserir > Tabela Dinâmica.\n3. Coloque "Departamento" em Linhas.\n4. Coloque "Status" em Colunas.\n5. Coloque "Nome" em Valores (Contagem).\n\n**Desafio:** Crie um gráfico dinâmico que mostre a evolução salarial média da empresa no último ano.');

    RAISE NOTICE 'Seed de cursos concluído com sucesso.';

END $$;
