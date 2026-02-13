'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    MoreVertical,
    Puzzle,
    ExternalLink,
    Trash2,
    Edit2,
    Play,
    Check,
    AlertCircle,
    ArrowLeft,
    Save,
    X,
    Settings,
    Globe,
    Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
    dynamicIntegrationsApi,
    IntegrationConfig
} from '@/lib/api/integration';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function IntegrationConfigsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingConfig, setEditingConfig] = useState<Partial<IntegrationConfig> | null>(null);
    const [saving, setSaving] = useState(false);

    const loadConfigs = async () => {
        try {
            setLoading(true);
            const data = await dynamicIntegrationsApi.listConfigs();
            setConfigs(data);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as configurações de integração.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    const handleSave = async () => {
        if (!editingConfig?.name || !editingConfig?.targetUrl) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Nome e URL de destino são obrigatórios.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setSaving(true);
            if (editingConfig.id) {
                await dynamicIntegrationsApi.updateConfig(editingConfig.id, editingConfig);
                toast({ title: 'Sucesso', description: 'Configuração atualizada com sucesso.' });
            } else {
                await dynamicIntegrationsApi.createConfig(editingConfig);
                toast({ title: 'Sucesso', description: 'Nova integração criada com sucesso.' });
            }
            setIsDialogOpen(false);
            loadConfigs();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast({
                title: 'Erro ao salvar',
                description: 'Houve um problema ao salvar a configuração.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta integração?')) return;

        try {
            await dynamicIntegrationsApi.deleteConfig(id);
            toast({ title: 'Excluído', description: 'Integração removida com sucesso.' });
            loadConfigs();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível excluir a integração.',
                variant: 'destructive',
            });
        }
    };

    const handleTest = async (configName: string) => {
        try {
            toast({ title: 'Testando...', description: `Executando integração ${configName}...` });
            const result = await dynamicIntegrationsApi.execute(configName, { test: true, timestamp: new Date().toISOString() });
            if (result.success) {
                toast({ title: 'Sucesso', description: 'Integração executada com sucesso.' });
            } else {
                toast({ title: 'Falha', description: result.errorMessage || 'Erro na execução.', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Erro ao testar:', error);
            toast({ title: 'Erro', description: 'Erro ao conectar com o serviço.', variant: 'destructive' });
        }
    };

    const filteredConfigs = configs.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.targetUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.push('/integrations')}
                        className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para o Hub
                    </button>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Configurações de API</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie endpoints e autenticação para sistemas de terceiros.
                    </p>
                </div>
                <Button
                    className="bg-[var(--color-primary)] hover:opacity-90 transition-opacity gap-2"
                    onClick={() => {
                        setEditingConfig({
                            name: '',
                            targetUrl: '',
                            httpMethod: 'POST',
                            isActive: true,
                            retryCount: 3,
                            timeoutSeconds: 30
                        });
                        setIsDialogOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4" /> Nova Integração
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white pb-4 border-b">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar integração..."
                                className="pl-10 h-10 bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)]/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Carregando...</div>
                    ) : filteredConfigs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            {searchTerm ? 'Nenhuma integração encontrada para sua busca.' : 'Você ainda não possui integrações configuradas.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Integração</th>
                                        <th className="px-6 py-4">URL de Destino</th>
                                        <th className="px-6 py-4">Método</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredConfigs.map((config) => (
                                        <tr key={config.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <Switch
                                                    checked={config.isActive}
                                                    onCheckedChange={async (val) => {
                                                        await dynamicIntegrationsApi.updateConfig(config.id, { isActive: val });
                                                        loadConfigs();
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                                        <Globe className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{config.name}</p>
                                                        <p className="text-[10px] text-gray-500">{config.description || 'Sem descrição'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded max-w-[300px] truncate">
                                                    {config.targetUrl}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="text-[10px] font-bold">
                                                    {config.httpMethod}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => handleTest(config.name)}
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => {
                                                                setEditingConfig(config);
                                                                setIsDialogOpen(true);
                                                            }}>
                                                                <Edit2 className="w-4 h-4 mr-2" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleTest(config.name)}>
                                                                <Play className="w-4 h-4 mr-2" /> Testar Execução
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(config.id)}>
                                                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingConfig?.id ? 'Editar Integração' : 'Nova Integração'}</DialogTitle>
                        <DialogDescription>
                            Configure os detalhes para a nova API de saída.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Nome da Integração</label>
                                <Input
                                    placeholder="Ex: Envio para Folha Externa"
                                    value={editingConfig?.name || ''}
                                    onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Método HTTP</label>
                                <select
                                    className="w-full h-10 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                    value={editingConfig?.httpMethod || 'POST'}
                                    onChange={(e) => setEditingConfig({ ...editingConfig, httpMethod: e.target.value })}
                                >
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="GET">GET</option>
                                    <option value="PATCH">PATCH</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">URL de Destino</label>
                            <Input
                                placeholder="https://api.sistema-externo.com/v1/webhook"
                                value={editingConfig?.targetUrl || ''}
                                onChange={(e) => setEditingConfig({ ...editingConfig, targetUrl: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Cabeçalhos (JSON Template)</label>
                            <textarea
                                className="w-full min-h-[80px] p-3 text-xs font-mono bg-gray-900 text-blue-300 border-none rounded-md focus:ring-2 focus:ring-blue-500/20"
                                placeholder='{ "Authorization": "Bearer {{SECRET_TOKEN}}" }'
                                value={editingConfig?.headersTemplate || ''}
                                onChange={(e) => setEditingConfig({ ...editingConfig, headersTemplate: e.target.value })}
                            />
                            <p className="text-[10px] text-gray-400">Use {'{{VAR_NAME}}'} para variáveis dinâmicas.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Tentativas (Retry)</label>
                                <Input
                                    type="number"
                                    value={editingConfig?.retryCount || 3}
                                    onChange={(e) => setEditingConfig({ ...editingConfig, retryCount: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Timeout (Segundos)</label>
                                <Input
                                    type="number"
                                    value={editingConfig?.timeoutSeconds || 30}
                                    onChange={(e) => setEditingConfig({ ...editingConfig, timeoutSeconds: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-[var(--color-primary)] gap-2"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : editingConfig?.id ? 'Salvar Alterações' : 'Criar Integração'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
