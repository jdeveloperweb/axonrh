'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    Mail,
    Phone,
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
    Trash2,
    Send,
    FileOutput,
    Database
} from 'lucide-react';
import { admissionsApi, AdmissionProcess, AdmissionStatus } from '@/lib/api/admissions';
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

const admissionStatusLabels: Record<AdmissionStatus, string> = {
    'LINK_GENERATED': 'Link Gerado',
    'DATA_FILLING': 'Preenchendo Dados',
    'DOCUMENTS_PENDING': 'Docs Pendentes',
    'DOCUMENTS_VALIDATING': 'Validando Docs',
    'CONTRACT_PENDING': 'Contrato Pendente',
    'SIGNATURE_PENDING': 'Aguar. Assinatura',
    'ESOCIAL_PENDING': 'Aguar. eSocial',
    'COMPLETED': 'Concluído',
    'CANCELLED': 'Cancelado',
    'EXPIRED': 'Expirado',
    'REJECTED': 'Rejeitado'
};

const admissionStatusColors: Record<AdmissionStatus, string> = {
    'LINK_GENERATED': 'bg-blue-100 text-blue-800',
    'DATA_FILLING': 'bg-amber-100 text-amber-800',
    'DOCUMENTS_PENDING': 'bg-orange-100 text-orange-800',
    'DOCUMENTS_VALIDATING': 'bg-purple-100 text-purple-800',
    'CONTRACT_PENDING': 'bg-indigo-100 text-indigo-800',
    'SIGNATURE_PENDING': 'bg-blue-600 text-white',
    'ESOCIAL_PENDING': 'bg-cyan-100 text-cyan-800',
    'COMPLETED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'EXPIRED': 'bg-gray-100 text-gray-800',
    'REJECTED': 'bg-red-200 text-red-900'
};

export default function AdmissionDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [process, setProcess] = useState<AdmissionProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchProcess = useCallback(async () => {
        try {
            setLoading(true);
            const data = await admissionsApi.getById(id as string);
            setProcess(data);
        } catch (error) {
            console.error('Erro ao buscar processo:', error);
            toast.error('Não foi possível carregar os detalhes do processo de admissão.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchProcess();
    }, [id, fetchProcess]);

    const handleResendLink = async () => {
        try {
            setActionLoading(true);
            await admissionsApi.resendLink(id as string);
            toast.success('Link de admissão reenviado!');
        } catch (error) {
            toast.error('Erro ao reenviar link.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleComplete = async () => {
        try {
            setActionLoading(true);
            await admissionsApi.complete(id as string);
            toast.success('Admissão finalizada com sucesso!');
            fetchProcess();
        } catch (error) {
            toast.error('Erro ao finalizar admissão.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Deseja cancelar esta admissão?')) return;
        try {
            setActionLoading(true);
            await admissionsApi.cancel(id as string, 'Cancelado pelo RH');
            toast.success('Admissão cancelada.');
            fetchProcess();
        } catch (error) {
            toast.error('Erro ao cancelar.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-gray-500 font-medium">Carregando processo de admissão...</p>
            </div>
        );
    }

    if (!process) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-xl font-bold">Processo de admissão não encontrado</p>
                <Button onClick={() => router.push('/processes?tab=admissions')}>Voltar para Lista</Button>
            </div>
        );
    }

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/processes?tab=admissions')} className="rounded-full shadow-sm border border-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-extrabold text-gray-900">{process.candidateName}</h1>
                            <Badge className={`shadow-none border-none py-1 px-3 ${admissionStatusColors[process.status]}`}>
                                {admissionStatusLabels[process.status]}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1 font-medium"><Mail className="w-4 h-4" /> {process.candidateEmail}</span>
                            <span className="flex items-center gap-1"><Database className="w-4 h-4" /> CPF: {process.candidateCpf}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleResendLink} disabled={actionLoading}>
                        <Send className="w-4 h-4 mr-2" /> Reenviar Link
                    </Button>
                    {process.status !== 'COMPLETED' && process.status !== 'CANCELLED' && (
                        <Button onClick={handleComplete} disabled={actionLoading} className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Finalizar Admissão
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="border border-gray-200"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleCancel}>
                                <Trash2 className="w-4 h-4 mr-2" /> Cancelar Admissão
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress Card */}
                    <Card className="border-none shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Estágio da Admissão
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 pb-8">
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
                                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${process.progressPercent}%` }} />
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center">
                                {[
                                    { label: 'Link', step: 1 },
                                    { label: 'Dados', step: 2 },
                                    { label: 'Docs', step: 3 },
                                    { label: 'Contrato', step: 4 },
                                    { label: 'eSocial', step: 5 }
                                ].map((s) => (
                                    <div key={s.step} className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 border-2 ${process.currentStep >= s.step ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'
                                            }`}>
                                            {process.currentStep > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase ${process.currentStep >= s.step ? 'text-blue-700' : 'text-gray-400'}`}>{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2 border-b border-gray-50">
                                <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Informações Profissionais</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Departamento</span>
                                    <span className="text-sm font-bold">{process.department?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Cargo</span>
                                    <span className="text-sm font-bold">{process.position?.title || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Data de Início</span>
                                    <span className="text-sm font-bold">{formatDate(process.expectedHireDate || null)}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2 border-b border-gray-50">
                                <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-widest">Acesso e eSocial</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">Expiração do Link</span>
                                    <span className="text-sm font-bold">{formatDate(process.linkExpiresAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">eSocial Evento</span>
                                    <Badge variant="outline" className="font-mono text-[10px]">{process.esocialEventId || 'Pendente'}</Badge>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500">ID Colaborador</span>
                                    <span className="text-sm font-mono text-[10px]">{process.employeeId || 'Aguardando finalização'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Documents Column */}
                <div className="space-y-6">
                    <Card className="shadow-lg border-none">
                        <CardHeader className="border-b border-gray-50">
                            <CardTitle className="text-lg font-bold flex items-center justify-between">
                                Documentos
                                <Badge className="bg-gray-100 text-gray-600">{process.validatedDocuments}/{process.documents.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-gray-50">
                                {process.documents.length === 0 ? (
                                    <div className="p-12 text-center text-gray-400 italic text-sm">Nenhum documento anexado</div>
                                ) : (
                                    process.documents.map((doc) => (
                                        <div key={doc.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="text-[9px] w-fit font-bold uppercase">{doc.documentType}</Badge>
                                                <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">{doc.fileName}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`text-[10px] ${doc.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {doc.status}
                                                </Badge>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 opacity-0 group-hover:opacity-100">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {process.contractSigned && (
                        <Card className="bg-indigo-600 text-white border-none shadow-xl shadow-indigo-200">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <FileOutput className="w-6 h-6" />
                                    <h3 className="font-bold">Contrato Assinado</h3>
                                </div>
                                <p className="text-xs text-indigo-100">O candidato já assinou o contrato digitalmente via portal.</p>
                                <Button className="w-full bg-white text-indigo-600 hover:bg-gray-100 font-bold border-none">
                                    <FileText className="w-4 h-4 mr-2" /> Baixar Contrato PDF
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
