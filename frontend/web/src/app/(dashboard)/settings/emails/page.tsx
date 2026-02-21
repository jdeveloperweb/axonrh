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
    Layout
} from 'lucide-react';
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
                <DialogContent className="max-w-[70vw] max-h-[95vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center gap-2">
                            <Layout className="w-5 h-5 text-primary" />
                            {editingTemplate?.id ? 'Editar Template' : 'Criar Novo Template'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure a identidade visual e o conteúdo do seu e-mail.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        <EditorTabs defaultValue="general" className="h-full flex flex-col">
                            <div className="px-6 border-b">
                                <EditorTabsList className="bg-transparent h-auto p-0 gap-6">
                                    <EditorTabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-0">Informações Gerais</EditorTabsTrigger>
                                    <EditorTabsTrigger value="content" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-0">Conteúdo HTML</EditorTabsTrigger>
                                </EditorTabsList>
                            </div>

                            <ScrollArea className="flex-1 h-[60vh]">
                                <EditorTabsContent value="general" className="p-6 m-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome do Template</Label>
                                            <Input
                                                placeholder="Ex: Convite de Admissão"
                                                value={editingTemplate?.name || ''}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Código Único (API)</Label>
                                            <Input
                                                placeholder="EX: ADMISSION_INVITE"
                                                value={editingTemplate?.code || ''}
                                                readOnly={editingTemplate?.isSystem}
                                                disabled={editingTemplate?.isSystem}
                                                className={editingTemplate?.isSystem ? "bg-muted font-mono" : "font-mono uppercase"}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assunto (Subject)</Label>
                                        <Input
                                            placeholder="Assunto que aparecerá na caixa de entrada"
                                            value={editingTemplate?.subject || ''}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição Interna</Label>
                                        <Textarea
                                            placeholder="Para que serve este e-mail? (Apenas para organização interna)"
                                            value={editingTemplate?.description || ''}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                            className="h-20"
                                        />
                                    </div>
                                </EditorTabsContent>

                                <EditorTabsContent value="content" className="p-0 m-0 h-full flex flex-col">
                                    <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                                        <div className="p-6 border-r bg-muted/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <Label className="flex items-center gap-2">
                                                    <Code className="w-4 h-4 text-primary" />
                                                    Editor HTML
                                                </Label>
                                                <Badge variant="outline" className="text-[10px]">HTML5 / CSS Linha</Badge>
                                            </div>
                                            <Textarea
                                                className="min-h-[400px] h-[50vh] font-mono text-xs leading-relaxed border-indigo-100 focus:border-indigo-300 resize-none bg-white"
                                                value={editingTemplate?.bodyHtml || ''}
                                                onChange={e => setEditingTemplate({ ...editingTemplate, bodyHtml: e.target.value })}
                                            />
                                            <div className="mt-4 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                                                <div className="flex gap-2 items-start text-indigo-700">
                                                    <AlertCircle className="w-4 h-4 mt-0.5" />
                                                    <div className="text-xs leading-normal">
                                                        <p className="font-semibold mb-1">Dica de Variáveis:</p>
                                                        Use <code>{"{{candidate_name}}"}</code>, <code>{"{{company_name}}"}</code> ou <code>{"{{action_link}}"}</code> para dados dinâmicos.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 flex flex-col">
                                            <div className="p-4 border-b flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Visualização Rápida</span>
                                                <Eye className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="flex-1 p-8 overflow-auto">
                                                <div className="bg-white shadow-lg rounded-xl overflow-hidden min-h-[500px] border">
                                                    <div className="p-3 border-b bg-slate-100 text-[10px] text-slate-500 flex gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                                        <span className="ml-2">Preview Automático</span>
                                                    </div>
                                                    <div
                                                        className="email-preview-mini"
                                                        dangerouslySetInnerHTML={{ __html: (editingTemplate?.bodyHtml || '').replace(/\{\{(\w+)\}\}/g, '<span style="background:rgba(79,70,229,0.1); color:#4f46e5; padding:0 2px; border-radius:2px">[$1]</span>') }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </EditorTabsContent>
                            </ScrollArea>
                        </EditorTabs>
                    </div>

                    <DialogFooter className="p-6 border-t bg-muted/10 gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-[var(--color-primary)] hover:opacity-90 transition-all rounded-lg gap-2"
                            onClick={handleSave}
                        >
                            <Save className="w-4 h-4" />
                            {editingTemplate?.id ? 'Salvar Alterações' : 'Criar Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-2xl bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Visualização Real</DialogTitle>
                        <DialogDescription>
                            Simulação de como o e-mail aparecerá para o destinatário final.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border border-slate-200 rounded-xl overflow-hidden mt-4 shadow-xl bg-white">
                        <div className="bg-slate-50 p-4 border-b flex flex-col gap-1">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Assunto:</p>
                            <p className="font-semibold text-sm text-slate-800">{previewContent?.subject}</p>
                        </div>
                        <div
                            className="max-h-[500px] overflow-auto email-preview-container"
                            dangerouslySetInnerHTML={{ __html: previewContent?.bodyHtml || '' }}
                        />
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsPreviewDialogOpen(false)}>Fechar Preview</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .email-preview-container iframe { width: 100%; border: none; }
                .email-preview-mini { font-size: 0.8rem; transform-origin: top left; }
                .email-preview-mini * { max-width: 100%; }
            `}</style>
        </div>
    );
}
