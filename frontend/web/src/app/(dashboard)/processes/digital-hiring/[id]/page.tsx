'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    Mail,
    Phone,
    User,
    Building2,
    Briefcase,
    Clock,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    FileText,
    ShieldCheck,
    MoreHorizontal,
    Eye,
    Download,
    XCircle,
    Send,
    Sparkles,
    Scale,
    Trash2,
    Database,
    MapPin,
    Smartphone
} from 'lucide-react';
import { digitalHiringApi, DigitalHiringProcess, digitalHiringStatusLabels, digitalHiringStatusColors } from '@/lib/api/digital-hiring';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DigitalHiringDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [process, setProcess] = useState<DigitalHiringProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showContract, setShowContract] = useState(false);

    const fetchProcess = useCallback(async () => {
        try {
            setLoading(true);
            const data = await digitalHiringApi.getById(id as string);
            setProcess(data);
        } catch (error) {
            console.error('Erro ao buscar processo:', error);
            toast.error('Não foi possível carregar os detalhes do processo.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchProcess();
    }, [id, fetchProcess]);

    const handleResendEmail = async () => {
        try {
            setActionLoading(true);
            await digitalHiringApi.resendEmail(id as string);
            toast.success('E-mail reenviado com sucesso!');
        } catch (error) {
            toast.error('Erro ao reenviar e-mail.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleForceAdvance = async () => {
        try {
            setActionLoading(true);
            const updated = await digitalHiringApi.forceAdvance(id as string);
            setProcess(updated);
            toast.success('Processo avançado manualmente!');
        } catch (error) {
            toast.error('Erro ao avançar processo.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Tem certeza que deseja cancelar este processo?')) return;
        try {
            setActionLoading(true);
            await digitalHiringApi.cancel(id as string, 'Cancelado pelo RH via dashboard');
            toast.success('Processo cancelado.');
            fetchProcess();
        } catch (error) {
            toast.error('Erro ao cancelar processo.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Carregando detalhes do processo...</p>
            </div>
        );
    }

    if (!process) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-xl font-bold text-gray-900">Processo não encontrado</p>
                <Button onClick={() => router.push('/processes?tab=digitalHiring')}>Voltar para Lista</Button>
            </div>
        );
    }

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    const StatusBadge = () => (
        <Badge className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${digitalHiringStatusColors[process.status]} shadow-none border-none`}>
            {digitalHiringStatusLabels[process.status]}
        </Badge>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/processes?tab=digitalHiring')} className="rounded-full hover:bg-white shadow-sm border border-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{process.candidateName}</h1>
                            <StatusBadge />
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {process.candidateEmail}</span>
                            {process.candidatePhone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {process.candidatePhone}</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleResendEmail}
                        disabled={actionLoading}
                        className="bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                    >
                        <Send className="w-4 h-4 mr-2" /> Reenviar Link
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="bg-white border-gray-200">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white">
                            <DropdownMenuItem
                                onClick={() => !actionLoading && handleForceAdvance()}
                                className={actionLoading ? 'opacity-50 pointer-events-none' : ''}
                            >
                                <Clock className="w-4 h-4 mr-2" /> Avançar Etapa Forçado
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className={`text-red-600 focus:text-red-600 focus:bg-red-50 ${actionLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={() => !actionLoading && handleCancel()}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Cancelar Processo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats & Progress */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress Card */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-white to-gray-50/50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4">
                            {process.aiConsistencyScore !== undefined && (
                                <div className="flex flex-col items-end">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${process.aiConsistencyScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                                        process.aiConsistencyScore >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Score IA: {process.aiConsistencyScore}%
                                    </div>
                                </div>
                            )}
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Progresso da Contratação
                            </CardTitle>
                            <CardDescription>Visualização em tempo real das etapas do candidato</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="relative">
                                {/* Base bar */}
                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner flex">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out relative"
                                        style={{ width: `${process.progressPercent}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                    </div>
                                </div>

                                {/* Steps markers */}
                                <div className="mt-8 grid grid-cols-4 gap-2">
                                    {[
                                        { s: 1, label: 'Início', current: process.currentStep === 1, done: process.currentStep > 1 },
                                        { s: 2, label: 'Dados', current: process.currentStep === 2, done: process.currentStep > 2 },
                                        { s: 3, label: 'Docs', current: process.currentStep === 3, done: process.currentStep > 3 },
                                        { s: 4, label: 'Contrato', current: process.currentStep >= 4, done: process.status === 'COMPLETED' }
                                    ].map((step) => (
                                        <div key={step.s} className="flex flex-col items-center text-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 mb-2 ${step.done ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200' :
                                                step.current ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-200' :
                                                    'bg-white border-gray-200 text-gray-400'
                                                }`}>
                                                {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.s}
                                            </div>
                                            <span className={`text-[10px] uppercase font-bold tracking-widest ${step.current ? 'text-blue-700' : step.done ? 'text-green-700' : 'text-gray-400'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Position Card */}
                        <Card className="border-gray-100 bg-white">
                            <CardHeader className="pb-2 border-b border-gray-50">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase className="w-4 h-4" />
                                    Informações da Vaga
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Building2 className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400">Departamento</p>
                                        <p className="font-semibold text-gray-900">{process.department?.name || 'Não informado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Scale className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400">Cargo</p>
                                        <p className="font-semibold text-gray-900">{process.position?.title || 'Não informado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Calendar className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-400">Início Previsto</p>
                                        <p className="font-semibold text-gray-900">{process.expectedHireDate ? formatDate(process.expectedHireDate) : 'A definir'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Public Link Card */}
                        <Card className="border-gray-100 bg-white">
                            <CardHeader className="pb-2 border-b border-gray-50">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    Acesso do Candidato
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-400 mb-2">Link Público</p>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                        <code className="text-[10px] text-gray-600 flex-1 truncate">{process.publicLink}</code>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                navigator.clipboard.writeText(process.publicLink);
                                                toast.success('Link copiado!');
                                            }}
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Expira em:</span>
                                    <span className={`font-bold ${process.linkValid ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatDate(process.linkExpiresAt)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Status do Link:</span>
                                    <Badge className={`${process.linkValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} shadow-none border-none py-0`}>
                                        {process.linkValid ? 'ATIVO' : 'EXPIRADO'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* IA Alerts Section */}
                    {process.aiAlerts && process.aiAlerts.length > 0 && (
                        <Card className="border-amber-100 bg-amber-50/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Alertas da IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {process.aiAlerts.map((alert, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border flex gap-3 ${alert.type === 'ERROR' ? 'bg-red-50 border-red-100' :
                                            alert.type === 'WARNING' ? 'bg-white border-amber-200' :
                                                'bg-blue-50 border-blue-100'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-full h-fit mt-0.5 ${alert.type === 'ERROR' ? 'bg-red-100 text-red-600' :
                                            alert.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                            {alert.type === 'ERROR' ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            {alert.field && <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{alert.field}</p>}
                                            <p className="text-sm font-semibold text-gray-800">{alert.message}</p>
                                            {alert.suggestion && <p className="text-xs text-gray-500 mt-1 italic">Sugestão: {alert.suggestion}</p>}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Form Data Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                        {/* Personal Data */}
                        <Card className="border-gray-100 bg-white">
                            <CardHeader className="pb-2 border-b border-gray-50 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Dados Pessoais
                                </CardTitle>
                                {process.personalData && <Badge className="bg-green-100 text-green-700">Preenchido</Badge>}
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                {process.personalData ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-gray-50 rounded text-gray-400"><Database className="w-3.5 h-3.5" /></div>
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-400">CPF</p>
                                                <p className="text-sm font-semibold text-gray-900">{process.candidateCpf || 'Não informado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-gray-50 rounded text-gray-400"><Calendar className="w-3.5 h-3.5" /></div>
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-400">Nascimento</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {process.personalData.birthDate ? formatDate(process.personalData.birthDate) : 'Não informado'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-gray-50 rounded text-gray-400"><Smartphone className="w-3.5 h-3.5" /></div>
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-400">Telefone</p>
                                                <p className="text-sm font-semibold text-gray-900">{process.personalData.phone || process.candidatePhone || 'Não informado'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-gray-50 rounded text-gray-400"><MapPin className="w-3.5 h-3.5" /></div>
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-400">Endereço</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {process.personalData.logradouro ? `${process.personalData.logradouro}, ${process.personalData.numero}` : 'Não informado'}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {process.personalData.bairro ? `${process.personalData.bairro} - ${process.personalData.cidade}/${process.personalData.estado}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed">
                                        <p className="text-xs font-medium">Aguardando preenchimento</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Work Data */}
                        <Card className="border-gray-100 bg-white">
                            <CardHeader className="pb-2 border-b border-gray-50 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Scale className="w-4 h-4" />
                                    Dados Adicionais
                                </CardTitle>
                                {process.workData && <Badge className="bg-green-100 text-green-700">Preenchido</Badge>}
                            </CardHeader>
                            <CardContent className="pt-4">
                                {process.workData ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-400">PIS/PASEP</p>
                                                <p className="text-sm font-semibold text-gray-900">{process.workData.pis || 'Não informado'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-medium text-gray-400">CTPS</p>
                                                <p className="text-sm font-semibold text-gray-900">{process.workData.ctpsNumero || 'Não informado'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-medium text-gray-400">Dependentes</p>
                                            <p className="text-sm font-semibold text-gray-900">{process.workData.hasDependents ? (process.workData.dependents?.length || 'Sim') : 'Não'}</p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-50">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Proposta Aceita</p>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">Salário:</span>
                                                <span className="font-bold text-gray-900">
                                                    {process.baseSalary ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(process.baseSalary) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-400 bg-gray-50/50 rounded-lg border border-dashed">
                                        <p className="text-xs font-medium">Aguardando preenchimento</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Documents */}
                <div className="space-y-6">
                    <Card className="h-full border-none shadow-xl bg-white sticky top-24">
                        <CardHeader className="pb-4 border-b border-gray-50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-500" />
                                    Documentos
                                </CardTitle>
                                <Badge className="bg-gray-100 text-gray-600 shadow-none py-0.5">
                                    {process.validatedDocuments}/{process.documents.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                                {process.documents.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400">
                                        <Download className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">Nenhum documento enviado ainda</p>
                                    </div>
                                ) : (
                                    process.documents.map((doc, idx) => (
                                        <div key={doc.id || idx} className="p-4 hover:bg-gray-50/50 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge variant="outline" className="text-[10px] uppercase font-extrabold tracking-tighter bg-gray-50 text-gray-500 border-gray-200">
                                                    {doc.documentType}
                                                </Badge>
                                                <Badge
                                                    className={`text-[9px] font-bold shadow-none py-0 ${doc.status === 'VALID' ? 'bg-green-100 text-green-700' :
                                                        doc.status === 'INVALID' ? 'bg-red-100 text-red-700' :
                                                            doc.status === 'VALIDATING' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-gray-100 text-gray-500'
                                                        }`}
                                                >
                                                    {doc.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 truncate mr-4">
                                                    <p className="text-xs font-bold text-gray-900 truncate" title={doc.fileName}>{doc.fileName}</p>
                                                    <p className="text-[10px] text-gray-400">{doc.uploadedAt ? formatDate(doc.uploadedAt) : ''}</p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 bg-blue-50"
                                                        onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
                                                        disabled={!doc.fileUrl}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-600 bg-gray-100"
                                                        onClick={() => doc.fileUrl && window.open(doc.fileUrl, '_blank')}
                                                        disabled={!doc.fileUrl}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {doc.validationMessage && (
                                                <p className="mt-2 text-[10px] text-red-500 bg-red-50 p-1.5 rounded border border-red-100 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {doc.validationMessage}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Contract Footer */}
                            {process.status === 'SIGNATURE_PENDING' || process.status === 'COMPLETED' ? (
                                <div className="p-4 bg-indigo-50/50 border-t border-indigo-100">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 text-indigo-700">
                                            <ShieldCheck className="w-5 h-5 font-bold" />
                                            <span className="text-sm font-bold uppercase tracking-tight">Contrato Digital</span>
                                        </div>
                                        <div className="text-[10px] text-indigo-600/80 leading-relaxed">
                                            {process.status === 'COMPLETED' ? (
                                                <p className="flex items-center gap-1 font-bold"><CheckCircle2 className="w-3 h-3 text-green-600" /> Assinado em {formatDate(process.contractSignedAt!)}</p>
                                            ) : (
                                                <p>Gerado e aguardando assinatura do candidato desde {formatDate(process.contractGeneratedAt!)}</p>
                                            )}
                                        </div>
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                                            <Eye className="w-4 h-4 mr-2" /> Visualizar Contrato
                                        </Button>
                                    </div>
                                </div>
                            ) : process.currentStep >= 3 && (
                                <div className="p-4 border-t border-gray-100">
                                    <Button
                                        onClick={handleForceAdvance}
                                        disabled={actionLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                                    >
                                        <RefreshCw className={`w-4 h-4 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
                                        Gerar Contrato para Assinatura
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>

            {/* Contract Modal */}
            <Dialog open={showContract} onOpenChange={setShowContract}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
                    <DialogHeader className="p-6 border-b bg-gray-50">
                        <DialogTitle className="flex items-center gap-2 text-indigo-700">
                            <ShieldCheck className="w-6 h-6" />
                            Contrato de Admissão Digital
                        </DialogTitle>
                        <DialogDescription>
                            Visualização do contrato aceito e assinado digitalmente pelo candidato.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 p-8 bg-white overflow-y-auto">
                        <div
                            className="prose prose-indigo max-w-none text-gray-800"
                            dangerouslySetInnerHTML={{ __html: process.contractHtml || '<p class="text-center text-gray-400 py-12">Contrato ainda não gerado.</p>' }}
                        />

                        {process.contractSigned && (
                            <div className="mt-12 p-6 bg-green-50 rounded-xl border border-green-100 flex items-start gap-4">
                                <div className="p-2 bg-green-100 rounded-full text-green-600">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-green-900 uppercase tracking-tight">Assinatura Eletrônica Válida</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 text-xs text-green-700">
                                        <p><strong>Candidato:</strong> {process.candidateName}</p>
                                        <p><strong>CPF:</strong> {process.candidateCpf}</p>
                                        <p><strong>Data/Hora:</strong> {formatDate(process.contractSignedAt!)}</p>
                                        <p><strong>IP:</strong> {process.signatureIp}</p>
                                    </div>
                                    <div className="mt-2 text-[10px] text-green-600/60 font-medium">
                                        Este documento foi assinado eletronicamente via Portal AxonRH de acordo com a MP 2.200-2/2001.
                                    </div>
                                </div>
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowContract(false)}>Fechar</Button>
                        <Button className="bg-indigo-600" onClick={() => window.print()}>
                            <Download className="w-4 h-4 mr-2" /> Imprimir / PDF
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
