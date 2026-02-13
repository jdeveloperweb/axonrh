'use client';

import {
    Puzzle,
    ShieldCheck,
    FileText,
    Webhook,
    Key,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const INTEGRATION_MODULES = [
    {
        id: 'dynamic',
        name: 'Integrações Dinâmicas',
        description: 'Configure APIs personalizadas para conectar com qualquer sistema externo.',
        icon: Puzzle,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        status: 'Ativo',
        path: '/integrations/configs'
    },
    {
        id: 'esocial',
        name: 'eSocial Sync',
        description: 'Gestão de eventos, transmissões e conformidade com o governo.',
        icon: ShieldCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        status: 'Configurar',
        path: '/integrations/esocial'
    },
    {
        id: 'cnab',
        name: 'CNAB / Banking',
        description: 'Geração de arquivos de remessa e processamento de retornos bancários.',
        icon: FileText,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        status: 'Pendente',
        path: '/integrations/cnab'
    },
    {
        id: 'webhooks',
        name: 'Webhooks',
        description: 'Receba notificações em tempo real sobre eventos do sistema.',
        icon: Webhook,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        status: 'Ativo',
        path: '/integrations/webhooks'
    },
    {
        id: 'certificates',
        name: 'Certificados Digitais',
        description: 'Gerencie seus certificados A1/A3 para assinaturas e eSocial.',
        icon: Key,
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        status: 'Em dia',
        path: '/integrations/certificates'
    }
];

export default function IntegrationsPage() {
    const router = useRouter();

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Hub de Integrações</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Conecte o AxonRH ao seu ecossistema de software de forma simples e segura.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Requisições (24h)</p>
                            <p className="text-2xl font-bold text-gray-900">1.284</p>
                            <div className="flex items-center text-[10px] text-emerald-600 font-bold">
                                <Activity className="w-3 h-3 mr-1" /> +12% vs ontem
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Taxa de Sucesso</p>
                            <p className="text-2xl font-bold text-gray-900">99.8%</p>
                            <div className="flex items-center text-[10px] text-emerald-600 font-bold">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Estável
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Eventos eSocial</p>
                            <p className="text-2xl font-bold text-gray-900">42</p>
                            <div className="flex items-center text-[10px] text-amber-600 font-bold">
                                <AlertCircle className="w-3 h-3 mr-1" /> 3 aguardando
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Webhooks Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">8</p>
                            <div className="flex items-center text-[10px] text-gray-400 font-medium">
                                125 entregas hoje
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                            <Webhook className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {INTEGRATION_MODULES.map((mod) => (
                    <Card key={mod.id} className="group hover:shadow-md transition-all duration-300 border-none shadow-sm overflow-hidden flex flex-col">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-3 rounded-xl ${mod.bg} ${mod.color}`}>
                                    <mod.icon className="w-6 h-6" />
                                </div>
                                <Badge variant={mod.status === 'Ativo' ? 'default' : 'secondary'} className={mod.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                    {mod.status}
                                </Badge>
                            </div>
                            <CardTitle className="text-xl font-bold">{mod.name}</CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                                {mod.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 mt-auto">
                            <Button
                                variant="ghost"
                                className="w-full justify-between group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all rounded-xl"
                                onClick={() => router.push(mod.path)}
                            >
                                Gerenciar
                                <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <Badge className="bg-blue-500 hover:bg-blue-600">Novidade</Badge>
                        <h2 className="text-2xl font-bold">API Pública do AxonRH</h2>
                        <p className="text-slate-400 leading-relaxed">
                            Desenvolva suas próprias aplicações integradas. Nossa API REST permite que você acesse dados de colaboradores,
                            ponto e folha de forma segura e escalável.
                        </p>
                        <div className="flex gap-4">
                            <Button className="bg-white text-slate-900 hover:bg-slate-100">Documentação</Button>
                            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">Gerar Token</Button>
                        </div>
                    </div>
                    <div className="hidden md:block p-6 bg-slate-800 rounded-2xl border border-slate-700 font-mono text-xs text-blue-300">
                        <pre>
                            {`curl -X GET "https://api.axonrh.com/v1/employees" \\
  -H "Authorization: Bearer \${TOKEN}" \\
  -H "X-Tenant-ID: \${TENANT_ID}"`}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
