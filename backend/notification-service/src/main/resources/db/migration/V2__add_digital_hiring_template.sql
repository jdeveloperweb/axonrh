-- Adiciona template de e-mail para convite de contratação digital
INSERT INTO email_templates (tenant_id, code, name, subject, body_html, body_text, category, variables, is_system) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'DIGITAL_HIRING_INVITATION', 
    'Convite de Contratação Digital',
    'Bem-vindo ao processo de admissão - AxonRH',
    '<h1>Olá {{candidate_name}},</h1>
     <p>Seja bem-vindo ao processo de admissão na <strong>{{company_name}}</strong>!</p>
     <p>Para prosseguir com sua contratação, precisamos que você acesse nosso portal e complete seus dados e envie os documentos necessários.</p>
     <p>Acesse pelo link abaixo:</p>
     <p><a href="{{hiring_link}}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Acessar Portal de Admissão</a></p>
     <p>Este link é válido até: {{expires_at}}</p>
     <p>Se tiver qualquer dúvida, entre em contato com nossa equipe de RH.</p>
     <p>Atenciosamente,<br>Equipe {{company_name}}</p>',
    'Olá {{candidate_name}},\n\nSeja bem-vindo ao processo de admissão na {{company_name}}!\n\nPara prosseguir com sua contratação, precisamos que você acesse nosso portal e complete seus dados e envie os documentos necessários.\n\nAcesse pelo link abaixo:\n{{hiring_link}}\n\nEste link é válido até: {{expires_at}}\n\nSe tiver qualquer dúvida, entre em contato com nossa equipe de RH.\n\nAtenciosamente,\nEquipe {{company_name}}',
    'SYSTEM', 
    '["candidate_name", "company_name", "hiring_link", "expires_at"]', 
    true
) ON CONFLICT (tenant_id, code) DO NOTHING;
