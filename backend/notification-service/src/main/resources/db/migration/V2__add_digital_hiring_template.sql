-- Adiciona template de e-mail para convite de contratação digital
INSERT INTO email_templates (tenant_id, code, name, subject, body_html, body_text, category, variables, is_system) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'DIGITAL_HIRING_INVITATION', 
    'Convite de Contratação Digital',
    'Bem-vindo ao processo de admissão - AxonRH',
    '<h1>Olá {{candidate_name}},</h1><p>Seja bem-vindo ao processo de admissão na <strong>{{company_name}}</strong>!</p><p>Para prosseguir com sua contratação, precisamos que você acesse nosso portal e complete seus dados e envie os documentos necessários.</p><p><a href="{{hiring_link}}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Acessar Portal de Admissão</a></p><p>Este link é válido até: {{expires_at}}</p><p>Atenciosamente,<br>Equipe {{company_name}}</p>',
    'Olá {{candidate_name}},\n\nSeja bem-vindo ao processo de admissão na {{company_name}}!\n\nAcesse pelo link abaixo:\n{{hiring_link}}\n\nAtenciosamente,\nEquipe {{company_name}}',
    'SYSTEM', '["candidate_name", "company_name", "hiring_link", "expires_at"]', true
) ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO email_templates (tenant_id, code, name, subject, body_html, body_text, category, variables, is_system) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'CANDIDATE_WELCOME', 
    'Boas-vindas ao Banco de Talentos',
    'Sua jornada com a {{company_name}} começa aqui!',
    '<h1>Olá {{candidate_name}},</h1><p>Obrigado por se cadastrar em nosso banco de talentos na <strong>{{company_name}}</strong>.</p><p>Ficamos felizes com seu interesse. Analisaremos seu perfil e entraremos em contato quando surgir uma oportunidade que se encaixe com você!</p><p>Atenciosamente,<br>Equipe de Recrutamento</p>',
    'Olá {{candidate_name}},\n\nObrigado por se cadastrar em nosso banco de talentos na {{company_name}}.\n\nAtenciosamente,\nEquipe de Recrutamento',
    'SYSTEM', '["candidate_name", "company_name"]', true
) ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO email_templates (tenant_id, code, name, subject, body_html, body_text, category, variables, is_system) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'DIGITAL_HIRING_COMPLETED', 
    'Contratação Concluída',
    'Parabéns! Sua admissão foi concluída na {{company_name}}',
    '<h1>Tudo pronto, {{candidate_name}}!</h1><p>Sua documentação foi validada e seu processo de contratação digital na <strong>{{company_name}}</strong> foi finalizado com sucesso.</p><p>Em breve você receberá as instruções para seu primeiro dia.</p><p>Seja bem-vindo(a) ao time!</p>',
    'Tudo pronto, {{candidate_name}}!\n\nSua documentação foi validada e seu processo de contratação digital na {{company_name}} foi finalizado com sucesso.\n\nSeja bem-vindo(a) ao time!',
    'SYSTEM', '["candidate_name", "company_name"]', true
) ON CONFLICT (tenant_id, code) DO NOTHING;
