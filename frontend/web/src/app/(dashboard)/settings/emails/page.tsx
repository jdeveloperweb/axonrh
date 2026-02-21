'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Mail,
    Search,
    Edit,
    Eye,
    Plus,
    History,
    Settings,
    Save,
    X,
    CheckCircle2,
    Clock,
    User,
    Users,
    AlertCircle,
    Copy,
    ExternalLink,
    Code,
    Layout,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { emailApi, EmailTemplate, EmailLog } from '@/lib/api/notification';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs as EditorTabs, TabsList as EditorTabsList, TabsTrigger as EditorTabsTrigger, TabsContent as EditorTabsContent } from '@/components/ui/tabs';
import { useThemeStore } from '@/stores/theme-store';

const getBoilerplate = (primaryColor: string, logoUrl?: string) => `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .wrapper { padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
        .header { background-color: ${primaryColor}; padding: 40px 20px; text-align: center; color: #ffffff; }
        .content { padding: 40px 35px; color: #334155; line-height: 1.8; }
        .footer { padding: 25px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; background: #fafafa; }
        .button { display: inline-block; padding: 14px 30px; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; margin-top: 25px; text-transform: uppercase; letter-spacing: 0.5px; }
        h1 { margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; }
        p { margin-bottom: 20px; font-size: 16px; }
        .highlight { color: ${primaryColor}; font-weight: 600; }
        .logo { max-width: 180px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : `<h1>AxonRH</h1>`}
            </div>
            <div class="content">
                <p>Olá <strong>{{candidate_name}}</strong>,</p>
                <p>Recebemos novidades sobre o seu processo na <span class="highlight">{{company_name}}</span>.</p>
                <p>Estamos entusiasmados com sua participação. Clique no botão abaixo para acessar os próximos passos:</p>
                <center>
                    <a href="{{action_link}}" class="button">Acessar Meu Portal</a>
                </center>
                <p style="margin-top: 40px; font-size: 13px; color: #94a3b8; text-align: center;">Se o botão não funcionar, copie este link: <br> <span style="color: ${primaryColor}">${"{{action_link}}"}</span></p>
            </div>
            <div class="footer">
                &copy; 2026 AxonRH - Powered by Mjolnix
            </div>
        </div>
    </div>
</body>
</html>`;

export default function EmailSettingsPage() {
    const { toast } = useToast();
    const { tenantTheme } = useThemeStore();
    const primaryColor = tenantTheme?.colors?.primary || '#4f46e5';
    const logoUrl = tenantTheme?.logoUrl;

    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Editor State
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Preview State
    const [previewContent, setPreviewContent] = useState<{ subject: string; bodyHtml: string } | null>(null);
    const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [templatesRes, logsRes] = await Promise.all([
                emailApi.listTemplates(),
                emailApi.getHistory()
            ]);

            console.log('Templates carregados:', templatesRes.data);
            setTemplates(templatesRes.data || []);
            setLogs(logsRes.data || []);
        } catch (error) {
            console.error('Error loading email data:', error);
            const tenantId = typeof window !== 'undefined' ? localStorage.getItem('setup_tenant_id') : 'unknown';
            console.log('Failing with Tenant ID:', tenantId);
            toast({
                title: 'Erro de Carregamento',
                description: 'Verifique se o serviço de notificações está online.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreate = () => {
        setEditingTemplate({
            name: '',
            code: '',
            subject: 'Novo E-mail',
            bodyHtml: getBoilerplate(primaryColor, logoUrl),
            isActive: true,
            isSystem: false,
            description: '',
            category: 'SYSTEM'
        });
        setIsEditDialogOpen(true);
    };

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate({ ...template });
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingTemplate) return;
        if (!editingTemplate.name || !editingTemplate.code || !editingTemplate.subject) {
            toast({
                title: 'Campos Obrigatórios',
                description: 'Por favor, preencha Nome, Código e Assunto.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await emailApi.createTemplate(editingTemplate);
            toast({
                title: 'Sucesso',
                description: 'Template salvo com sucesso!',
            });
            setIsEditDialogOpen(false);
            loadData();
        } catch (error) {
            console.error('Error saving template:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao salvar o template. Verifique se o código já existe.',
                variant: 'destructive',
            });
        }
    };

    const handlePreview = async (code: string) => {
        try {
            const variables: Record<string, string> = {
                candidate_name: 'João Silva',
                employee_name: 'João Silva',
                company_name: 'AxonRH',
                hiring_link: 'http://localhost:3000/contratacao/abc123',
                action_link: 'http://localhost:3000/portal',
                expires_at: '28/02/2026',
                start_date: '01/03/2026',
                end_date: '30/03/2026',
                approver_name: 'Maria Gestora'
            };

            const res = await emailApi.previewTemplate(code, variables);
            setPreviewContent(res.data);
            setIsPreviewDialogOpen(true);
        } catch (error) {
            console.error('Error generating preview:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao gerar o preview. Salve o template primeiro se for novo.',
                variant: 'destructive',
            });
        }
    };

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <Link
                href="/settings"
                className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-4 group w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar para Configurações
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">E-mails e Mensagens</h1>
                    <p className="text-[var(--color-text-secondary)]">Gerencie templates de comunicação e acompanhe os envios</p>
                </div>
            </div>

            <Tabs defaultValue="templates" className="w-full">
                <TabsList className="bg-[var(--color-surface-variant)]/50 p-1 rounded-xl mb-6">
                    <TabsTrigger value="templates" className="rounded-lg gap-2 px-6">
                        <Mail className="w-4 h-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg gap-2 px-6">
                        <History className="w-4 h-4" />
                        Histórico de Envios
                    </TabsTrigger>
                    <TabsTrigger value="config" className="rounded-lg gap-2 px-6">
                        <Settings className="w-4 h-4" />
                        Configurações Gerais
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-6">
                    <div className="flex items-center gap-4 bg-[var(--color-surface)] p-2 rounded-xl shadow-sm border border-[var(--color-border)]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                            <Input
                                placeholder="Buscar templates por nome, código ou descrição..."
                                className="pl-10 border-none bg-transparent focus-visible:ring-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleCreate}
                            className="bg-[var(--color-primary)] hover:opacity-90 transition-all rounded-lg gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Novo Template
                        </Button>
                    </div>

                    {filteredTemplates.length === 0 ? (
                        <Card className="p-12 text-center border-dashed border-2 flex flex-col items-center justify-center">
                            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">Nenhum template encontrado</h3>
                            <p className="text-muted-foreground mb-6">Comece criando um novo template personalizado.</p>
                            <Button onClick={handleCreate} variant="outline" className="gap-2 mx-auto">
                                <Plus className="w-4 h-4" /> Criar Primeiro Template
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map((template) => (
                                <Card key={template.id} className="group hover:shadow-md transition-all border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge variant={template.isSystem ? "secondary" : "outline"} className="rounded-md uppercase text-[10px] tracking-wider">
                                                {template.isSystem ? "Sistema" : "Personalizado"}
                                            </Badge>
                                            <div className="flex gap-1 h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all">
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-[var(--color-text-secondary)]" onClick={() => handleEdit(template)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-blue-500" onClick={() => handlePreview(template.code)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg font-bold truncate pr-16">{template.name}</CardTitle>
                                        <code className="text-[10px] text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">{template.code}</code>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-[var(--color-text-secondary)] min-h-[40px] line-clamp-2 mb-4">
                                            {template.description || "Sem descrição disponível."}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] pt-4 border-t border-[var(--color-border)]">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>Template para {template.category?.toLowerCase() || 'geral'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Destinatário</TableHead>
                                    <TableHead>Assunto</TableHead>
                                    <TableHead>Template</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            Nenhum log de envio encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[var(--color-text-primary)]">{log.recipientName || 'N/A'}</span>
                                                    <span className="text-xs text-[var(--color-text-secondary)]">{log.recipientEmail}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono text-[10px]">{log.templateCode || 'Custom'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {new Date(log.createdAt).toLocaleString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    log.status === 'SENT' || log.status === 'DELIVERED' ? 'bg-emerald-500' :
                                                        log.status === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500'
                                                }>
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="config">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                            <CardHeader>
                                <CardTitle className="text-lg">Provedor de E-mail</CardTitle>
                                <CardDescription>Configurações de envio (AWS SES / SMTP / MailHog)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Método de Envio Ativo</Label>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-cyan-600">SMTP / LOCAL</Badge>
                                        <span className="text-xs text-[var(--color-text-secondary)]">Ativo via application.yml</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3 mt-4">
                                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        O sistema está configurado para usar o <strong>MailHog</strong> (localhost:1025) para testes locais ou o seu servidor SMTP personalizado (mjolnix.com.br).
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-[var(--color-surface)]">
                            <CardHeader>
                                <CardTitle className="text-lg">Informações do Domínio</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from-name">Nome do Remetente</Label>
                                    <Input id="from-name" defaultValue="AxonRH" readOnly className="bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="from-email">E-mail do Remetente</Label>
                                    <Input id="from-email" defaultValue="noreply@mjolnix.com.br" readOnly className="bg-muted/30" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-[85vw] w-[85vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-6 pb-2 border-b">
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Layout className="w-6 h-6 text-[var(--color-primary)]" />
                            {editingTemplate?.id ? 'Editar Template' : 'Criar Novo Template'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure a identidade visual e o conteúdo do seu e-mail. Utilize o editor à esquerda e veja o resultado em tempo real à direita.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <EditorTabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
                            <div className="px-6 bg-slate-50 border-b">
                                <EditorTabsList className="bg-transparent h-auto p-0 gap-8">
                                    <EditorTabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] rounded-none py-4 px-0 font-semibold transition-all">
                                        Configurações de Envio
                                    </EditorTabsTrigger>
                                    <EditorTabsTrigger value="content" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] rounded-none py-4 px-0 font-semibold transition-all">
                                        Editor de Conteúdo
                                    </EditorTabsTrigger>
                                </EditorTabsList>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <EditorTabsContent value="general" className="h-full p-0 m-0">
                                    <ScrollArea className="h-full">
                                        <div className="p-8 max-w-3xl mx-auto space-y-8">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700">NOME DO TEMPLATE</Label>
                                                    <Input
                                                        placeholder="Ex: Confirmação de Cadastro"
                                                        value={editingTemplate?.name || ''}
                                                        onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                                        className="h-12 text-lg"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-bold text-slate-700">CÓDIGO (API)</Label>
                                                    <Input
                                                        placeholder="EX: WELCOME_EMAIL"
                                                        value={editingTemplate?.code || ''}
                                                        readOnly={editingTemplate?.isSystem}
                                                        className={editingTemplate?.isSystem ? "bg-slate-100 font-mono h-12" : "font-mono uppercase h-12"}
                                                        onChange={e => setEditingTemplate({ ...editingTemplate, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700">ASSUNTO DO E-MAIL</Label>
                                                <Input
                                                    placeholder="Este assunto aparecerá na caixa de entrada do usuário"
                                                    value={editingTemplate?.subject || ''}
                                                    onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                                    className="h-12"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-sm font-bold text-slate-700">DESCRIÇÃO INTERNA</Label>
                                                <Textarea
                                                    placeholder="Descreva brevemente a finalidade deste template..."
                                                    value={editingTemplate?.description || ''}
                                                    onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                                    className="min-h-[120px] text-base"
                                                />
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </EditorTabsContent>

                                <EditorTabsContent value="content" className="h-full p-0 m-0">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
                                        {/* LADO ESQUERDO: EDITOR */}
                                        <div className="flex flex-col border-r bg-slate-50 overflow-hidden">
                                            <div className="p-4 border-b bg-white flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Code className="w-4 h-4 text-[var(--color-primary)]" />
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Editor HTML Avançado</span>
                                                </div>
                                                <Badge variant="outline" className="font-mono text-[10px]">UTF-8</Badge>
                                            </div>
                                            <div className="flex-1 relative">
                                                <textarea
                                                    className="w-full h-full p-6 font-mono text-sm leading-relaxed resize-none bg-white border-none focus:ring-0 outline-none"
                                                    value={editingTemplate?.bodyHtml || ''}
                                                    onChange={e => setEditingTemplate({ ...editingTemplate, bodyHtml: e.target.value })}
                                                    spellCheck={false}
                                                />
                                            </div>
                                            <div className="p-4 bg-indigo-50/50 border-t">
                                                <div className="flex gap-3 text-indigo-700 text-xs items-center">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <p>Use <strong>{"{{candidate_name}}"}</strong>, <strong>{"{{company_name}}"}</strong> e <strong>{"{{action_link}}"}</strong></p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* LADO DIREITO: PREVIEW REAL */}
                                        <div className="flex flex-col bg-slate-200/50 overflow-hidden">
                                            <div className="p-4 border-b bg-white flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Visualização em Tempo Real</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400">Renderizando via Sandbox</span>
                                            </div>
                                            <div className="flex-1 p-8 overflow-hidden flex flex-col items-center">
                                                <div className="w-full max-w-[600px] h-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-300 flex flex-col">
                                                    <div className="bg-slate-100 p-3 border-b flex gap-2">
                                                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                                                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                                                        <div className="w-3 h-3 rounded-full bg-slate-300" />
                                                    </div>
                                                    <iframe
                                                        title="Live Preview"
                                                        srcDoc={editingTemplate?.bodyHtml || ''}
                                                        className="w-full flex-1 border-none bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </EditorTabsContent>
                            </div>
                        </EditorTabs>
                    </div>

                    <DialogFooter className="p-6 border-t bg-white flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            As alterações não afetarão e-mails já enviados.
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="h-11 px-6">Encerrar</Button>
                            <Button
                                className="bg-[var(--color-primary)] hover:opacity-90 h-11 px-8 rounded-lg gap-2 shadow-lg shadow-[var(--color-primary)]/20"
                                onClick={handleSave}
                            >
                                <Save className="w-4 h-4" />
                                {editingTemplate?.id ? 'Atualizar Template' : 'Criar Template'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col overflow-hidden">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="flex items-center gap-3">
                            <Eye className="w-6 h-6 text-primary" />
                            Visualização Final do Destinatário
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 bg-slate-100 p-8 overflow-hidden flex flex-col items-center">
                        <div className="w-full h-full bg-white shadow-xl rounded-xl border border-slate-200 flex flex-col overflow-hidden max-w-[600px]">
                            <div className="p-5 border-b bg-slate-50 space-y-1">
                                <div className="flex gap-2 text-[10px] items-center text-slate-400 font-bold uppercase tracking-widest">
                                    Assunto:
                                </div>
                                <div className="text-sm font-semibold text-slate-800">{previewContent?.subject}</div>
                            </div>
                            <iframe
                                title="Final Preview"
                                srcDoc={previewContent?.bodyHtml || ''}
                                className="w-full flex-1 border-none"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 border-t px-6">
                        <Button onClick={() => setIsPreviewDialogOpen(false)} className="px-8 h-10">Concluído</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
