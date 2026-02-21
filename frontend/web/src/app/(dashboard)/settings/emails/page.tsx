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
    ExternalLink
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

export default function EmailSettingsPage() {
    const { toast } = useToast();
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

    const handleEdit = (template: EmailTemplate) => {
        setEditingTemplate({ ...template });
        setIsEditDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingTemplate) return;

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
                description: 'Erro ao salvar o template.',
                variant: 'destructive',
            });
        }
    };

    const handlePreview = async (code: string) => {
        try {
            // Mock variables for preview
            const variables: Record<string, string> = {
                candidate_name: 'João Silva',
                employee_name: 'João Silva',
                company_name: 'AxonRH',
                hiring_link: 'http://localhost:3000/contratacao/abc123',
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
                description: 'Erro ao gerar o preview do e-mail.',
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

                {/* --- TEMPLATES TAB --- */}
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
                        <Button className="bg-[var(--color-primary)] hover:opacity-90 transition-all rounded-lg gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Template
                        </Button>
                    </div>

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
                                    <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
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
                </TabsContent>

                {/* --- HISTORY TAB --- */}
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
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
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
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="w-8 h-8">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                {/* --- CONFIG TAB --- */}
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

            {/* --- EDITOR DIALOG --- */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Editar Template: {editingTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            Utilize o código do template para disparar o e-mail via API ou Eventos.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome amigável</Label>
                                    <Input
                                        value={editingTemplate?.name || ''}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Código (identificador)</Label>
                                    <Input
                                        value={editingTemplate?.code || ''}
                                        readOnly={editingTemplate?.isSystem}
                                        disabled={editingTemplate?.isSystem}
                                        className={editingTemplate?.isSystem ? "bg-muted" : ""}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Assunto do E-mail</Label>
                                <Input
                                    value={editingTemplate?.subject || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Corpo HTML</Label>
                                <Textarea
                                    className="min-h-[250px] font-mono text-sm border-indigo-100 focus:border-indigo-300"
                                    value={editingTemplate?.bodyHtml || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, bodyHtml: e.target.value })}
                                />
                                <p className="text-[10px] text-[var(--color-text-tertiary)]">Dica: Utilize {'{{variavel}}'} para placeholders dinâmicos.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição (Interna)</Label>
                                <Input
                                    placeholder="Para que este template é utilizado?"
                                    value={editingTemplate?.description || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                />
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-[var(--color-primary)] hover:opacity-90 transition-all rounded-lg gap-2"
                            onClick={handleSave}
                        >
                            <Save className="w-4 h-4" />
                            Salvar Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- PREVIEW DIALOG --- */}
            <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Visualização do E-mail</DialogTitle>
                        <DialogDescription>
                            Exibição de como o e-mail chegará ao destinatário.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden mt-4">
                        <div className="bg-[var(--color-surface-variant)] p-4 border-b border-[var(--color-border)]">
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">Assunto:</p>
                            <p className="font-bold text-sm">{previewContent?.subject}</p>
                        </div>
                        <div
                            className="p-6 bg-white max-h-[400px] overflow-auto email-preview-container"
                            dangerouslySetInnerHTML={{ __html: previewContent?.bodyHtml || '' }}
                        />
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsPreviewDialogOpen(false)}>Fechar Preview</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <style jsx global>{`
                .email-preview-container h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #1e1b4b; }
                .email-preview-container p { margin-bottom: 12px; line-height: 1.6; color: #374151; }
                .email-preview-container a { color: #4F46E5; text-decoration: underline; }
                .email-preview-container strong { font-weight: 600; }
            `}</style>
        </div>
    );
}
