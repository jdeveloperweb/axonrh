-- Adiciona template de e-mail para convite de contratação digital
INSERT INTO email_templates (tenant_id, code, name, description, subject, body_html, body_text, category, variables, is_system, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'DIGITAL_HIRING_INVITATION', 
    'Convite de Admissão Digital',
    'Enviado ao candidato para iniciar o preenchimento de documentos e dados.',
    'Bem-vindo(a) ao time! Finalize sua admissão - {{company_name}}',
    '<!DOCTYPE html><html><head><style>body{font-family:Sans-Serif;color:#334155;line-height:1.6;background-color:#f8fafc;margin:0;padding:20px}.card{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,.1)}.header{background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 20px;text-align:center;color:#fff}h1{margin:0;font-size:24px}.content{padding:40px 30px}.button{display:inline-block;padding:14px 28px;background-color:#4f46e5;color:#fff!important;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0}.footer{padding:20px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #f1f5f9}</style></head><body><div class="card"><div class="header"><h1>AxonRH</h1></div><div class="content"><h2>Olá {{candidate_name}},</h2><p>Parabéns por fazer parte da <strong>{{company_name}}</strong>!</p><p>Para darmos continuidade à sua contratação, precisamos que você complete seus dados e envie os documentos através do nosso portal seguro.</p><center><a href="{{hiring_link}}" class="button">Iniciar Minha Admissão</a></center><p>Este link expira em: <strong>{{expires_at}}</strong></p></div><div class="footer">&copy; 2026 {{company_name}} via AxonRH</div></div></body></html>',
    'Olá {{candidate_name}}, Bem-vindo à {{company_name}}! Acesse o portal para finalizar sua admissão: {{hiring_link}}',
    'SYSTEM', '["candidate_name", "company_name", "hiring_link", "expires_at"]', true, true
) ON CONFLICT (tenant_id, code) DO UPDATE SET body_html = EXCLUDED.body_html, is_system = true, is_active = true;

INSERT INTO email_templates (tenant_id, code, name, description, subject, body_html, body_text, category, variables, is_system, is_active) 
VALUES (
    '00000000-0000-0000-0000-000000000000', 
    'CANDIDATE_WELCOME', 
    'Boas-vindas ao Banco de Talentos',
    'Enviado automaticamente após o cadastro do candidato no portal.',
    'Recebemos seu currículo na {{company_name}}!',
    '<!DOCTYPE html><html><head><style>body{font-family:Sans-Serif;color:#334155;line-height:1.6;background-color:#f1f5f9;margin:0;padding:20px}.card{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0}.header{padding:30px;text-align:center;border-bottom:1px solid #f1f5f9}h1{color:#4f46e5}.content{padding:40px 30px}.footer{padding:20px;text-align:center;color:#94a3b8;font-size:12px}</style></head><body><div class="card"><div class="header"><h1>{{company_name}}</h1></div><div class="content"><h3>Olá {{candidate_name}},</h3><p>Obrigado por demonstrar interesse em trabalhar conosco!</p><p>Seu currículo foi recebido e está agora em nosso banco de talentos. Quando surgirem oportunidades que combinem com o seu perfil, entraremos em contato.</p><p>Boa sorte!</p></div><div class="footer">Enviado com carinho pela equipe de Recrutamento.</div></div></body></html>',
    'Olá {{candidate_name}}, obrigado pelo seu cadastro no banco de talentos da {{company_name}}.',
    'SYSTEM', '["candidate_name", "company_name"]', true, true
) ON CONFLICT (tenant_id, code) DO UPDATE SET body_html = EXCLUDED.body_html, is_system = true, is_active = true;
