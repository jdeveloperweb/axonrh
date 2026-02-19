'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { leavesApi } from '@/lib/api/leaves';
import {
    ArrowLeft,
    Loader2,
    FileText,
    Stethoscope,
    Brain,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Eye,
    Search,
    Check,
    XCircle,
    Download,
    User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Separator } from '@/components/ui/separator';

const LEAVE_TYPES = [
    { id: 'MEDICAL', label: 'Licença Médica (Atestado)', icon: Stethoscope },
    { id: 'MATERNITY', label: 'Licença Maternidade', icon: FileText },
    { id: 'PATERNITY', label: 'Licença Paternidade', icon: FileText },
    { id: 'BEREAVEMENT', label: 'Licença Nojo (Óbito)', icon: FileText },
    { id: 'MARRIAGE', label: 'Licença Gala (Casamento)', icon: Calendar },
    { id: 'MILITARY', label: 'Serviço Militar', icon: FileText },
    { id: 'UNPAID', label: 'Licença Não Remunerada', icon: FileText },
    { id: 'OTHER', label: 'Outros', icon: AlertCircle },
];

const formSchema = z.object({
    type: z.string().min(1, 'Selecione o tipo de licença'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de fim é obrigatória'),
    reason: z.string().optional(),
    cid: z.string().optional(),
    certificateText: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function LeaveRequestContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { user } = useAuthStore();

    // Modes
    const reviewId = searchParams.get('id');
    const isReview = !!reviewId;

    const [loading, setLoading] = useState(isReview);
    const [submitting, setSubmitting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedType, setSelectedType] = useState('MEDICAL');
    const [file, setFile] = useState<File | null>(null);
    const [cidResults, setCidResults] = useState<any[]>([]);
    const [searchingCid, setSearchingCid] = useState(false);
    const [existingRequest, setExistingRequest] = useState<any>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'MEDICAL',
            startDate: '',
            endDate: '',
            reason: '',
            cid: '',
            certificateText: '',
        },
    });

    const loadExistingRequest = useCallback(async () => {
        if (!reviewId) return;
        try {
            setLoading(true);
            const data = await leavesApi.getLeaveById(reviewId);
            setExistingRequest(data);
            setSelectedType(data.type);
            form.reset({
                type: data.type,
                startDate: data.startDate,
                endDate: data.endDate,
                reason: data.reason || '',
                cid: data.cid || '',
                certificateText: data.certificateText || '',
            });
        } catch (error) {
            toast({ title: 'Erro ao carregar', description: 'Não foi possível encontrar a solicitação.', variant: 'destructive' });
            router.push('/vacation');
        } finally {
            setLoading(false);
        }
    }, [reviewId, form, router, toast]);

    useEffect(() => {
        if (isReview) {
            loadExistingRequest();
        }
    }, [isReview, loadExistingRequest]);

    const handleCidSearch = async (query: string) => {
        if (query.length < 2) {
            setCidResults([]);
            return;
        }
        setSearchingCid(true);
        try {
            const results = await leavesApi.searchCid(query);
            setCidResults(results);
        } catch (error) {
            console.error('Erro ao buscar CID:', error);
        } finally {
            setSearchingCid(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);

        setAnalyzing(true);

        try {
            // Simulated AI extraction
            const mockText = "Atesto para os devidos fins que o Sr. Colaborador esteve sob cuidados médicos nesta data devido a Dorsalgia (CID M54.5). Recomendo afastamento por 5 dias.";

            await new Promise(resolve => setTimeout(resolve, 2000));

            form.setValue('certificateText', mockText);

            if (mockText.includes('M54.5')) {
                form.setValue('cid', 'M54.5');
                toast({
                    title: 'IA: CID Extraído',
                    description: 'Identificamos o CID M54.5 (Dorsalgia) no documento.',
                });
            }

            toast({
                title: 'Documento Analisado',
                description: 'As informações foram extraídas e preenchidas automaticamente.',
            });
        } catch (error) {
            console.error('Erro ao ler documento:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const onSubmit = async (values: FormValues) => {
        try {
            setSubmitting(true);

            if (isReview) {
                // Manager updating/approving
                await leavesApi.updateStatus(reviewId, 'APPROVED', values.reason, values.cid);
                toast({ title: 'Solicitação Aprovada', description: 'A licença foi validada e aprovada com sucesso.' });
            } else {
                // Employee creating
                const formData = new FormData();
                formData.append('type', values.type);
                formData.append('startDate', values.startDate);
                formData.append('endDate', values.endDate);
                if (values.reason) formData.append('reason', values.reason);
                if (values.cid) formData.append('cid', values.cid);
                if (values.certificateText) formData.append('certificateText', values.certificateText);
                if (file) formData.append('certificate', file);
                formData.append('employeeId', user?.id || '');

                await leavesApi.createLeave(formData);
                toast({ title: 'Solicitação Enviada', description: 'Sua licença foi registrada com sucesso.' });
            }

            router.push('/vacation');
        } catch (error: any) {
            toast({
                title: 'Erro no processamento',
                description: error.message || 'Ocorreu um erro ao salvar os dados.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!reviewId) return;
        try {
            setSubmitting(true);
            await leavesApi.updateStatus(reviewId, 'REJECTED', form.getValues('reason'));
            toast({ title: 'Solicitação Rejeitada', description: 'A licença foi marcada como rejeitada.' });
            router.push('/vacation');
        } catch (error) {
            toast({ title: 'Erro ao rejeitar', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-500">Carregando detalhes da licença...</p>
            </div>
        );
    }

    return (
        <div className="p-6 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {isReview ? 'Analisar Licença / Afastamento' : 'Solicitar Licença / Afastamento'}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            {isReview ? 'Revise os dados extraídos pelo sistema e valide o afastamento.' : 'Preencha os dados e anexe documentos para validação automática.'}
                        </p>
                    </div>
                </div>
                {isReview && existingRequest && (
                    <Badge className={cn(
                        "h-8 px-4 rounded-full text-xs font-black uppercase tracking-widest",
                        existingRequest.status === 'PENDING' ? "bg-amber-100 text-amber-700" :
                            existingRequest.status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                        {existingRequest.status}
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="md:col-span-8 space-y-6">
                    <Card className="border-none shadow-xl shadow-blue-900/5 bg-white overflow-hidden border-t-4 border-blue-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Dados da Solicitação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isReview && existingRequest && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 mb-2">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">
                                        {existingRequest.employeeName?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Colaborador Solicitante</p>
                                        <p className="text-lg font-black text-slate-900">{existingRequest.employeeName}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">Tipo de Licença</Label>
                                    <Select
                                        disabled={isReview}
                                        onValueChange={(val) => { setSelectedType(val); form.setValue('type', val); }}
                                        value={selectedType}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {LEAVE_TYPES.map(t => (
                                                <SelectItem key={t.id} value={t.id} className="py-2">
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Data de Início</Label>
                                        <Input disabled={isReview} type="date" {...form.register('startDate')} className="h-12 rounded-xl border-slate-200 bg-slate-50/50" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-bold">Data de Fim</Label>
                                        <Input disabled={isReview} type="date" {...form.register('endDate')} className="h-12 rounded-xl border-slate-200 bg-slate-50/50" />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="h-5 w-5 text-blue-600" />
                                        <h4 className="font-bold text-blue-900 uppercase text-sm tracking-widest">Validação Médica / CID</h4>
                                    </div>
                                    <Badge className="bg-blue-600 text-white border-none font-black flex gap-1 items-center">
                                        <Brain className="h-3 w-3" /> AI Powered
                                    </Badge>
                                </div>

                                <div className="relative">
                                    <Label className="text-blue-800 text-xs font-black uppercase tracking-widest mb-2 block">
                                        Código CID {reviewId ? '(Corrigir se necessário)' : '(Extraído ou manual)'}
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
                                            <Search className="h-4 w-4" />
                                        </div>
                                        <Input
                                            {...form.register('cid')}
                                            placeholder="Busque pelo código ou descrição (ex: Dorsalgia)"
                                            className="h-14 pl-11 rounded-2xl border-blue-100 bg-blue-50/30 font-bold text-blue-900 focus-visible:ring-blue-500 placeholder:text-blue-300"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                form.setValue('cid', val);
                                                handleCidSearch(val);
                                            }}
                                        />
                                        {searchingCid && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                                            </div>
                                        )}
                                    </div>

                                    {cidResults.length > 0 && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto animate-in zoom-in-95 duration-200">
                                            <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                                                <p className="text-[10px] font-black text-slate-400 uppercase px-2">CIDs Encontrados</p>
                                            </div>
                                            {cidResults.map((cid) => (
                                                <div
                                                    key={cid.code}
                                                    className="p-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between group transition-colors border-b border-slate-50 last:border-none"
                                                    onClick={() => {
                                                        form.setValue('cid', cid.code);
                                                        setCidResults([]);
                                                        toast({ title: 'CID Selecionado', description: `${cid.code}: ${cid.description}` });
                                                    }}
                                                >
                                                    <div>
                                                        <p className="text-sm font-black text-blue-600">{cid.code}</p>
                                                        <p className="text-xs text-slate-600 font-medium group-hover:text-slate-900">{cid.description}</p>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Check className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label className="text-slate-700 font-bold">Observações / {isReview ? 'Notas do Gestor' : 'Descrição do Motivo'}</Label>
                                <Textarea
                                    {...form.register('reason')}
                                    className="min-h-[100px] rounded-2xl border-slate-200 bg-slate-50/50 resize-none focus:bg-white transition-all shadow-inner"
                                    placeholder={isReview ? "Notas adicionais sobre a aprovação ou rejeição..." : "Descreva brevemente o motivo da solicitação..."}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50/80 backdrop-blur-sm p-6 flex justify-between gap-3 border-t border-slate-100">
                            <Button variant="ghost" onClick={() => router.back()} disabled={submitting} className="rounded-xl font-bold">
                                {isReview ? 'Voltar' : 'Cancelar'}
                            </Button>

                            <div className="flex gap-3">
                                {isReview ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            onClick={handleReject}
                                            disabled={submitting}
                                            className="h-12 px-6 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 font-bold transition-all"
                                        >
                                            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Rejeitar Licença'}
                                        </Button>
                                        <Button
                                            onClick={form.handleSubmit(onSubmit)}
                                            disabled={submitting}
                                            className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex gap-2"
                                        >
                                            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                                <>
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    Validar e Aprovar
                                                </>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={submitting || analyzing}
                                        className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                                    >
                                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar Solicitação'}
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar / Document Viewer */}
                <div className="md:col-span-4 space-y-6">
                    {/* Document Preview Card */}
                    <Card className="border-none bg-slate-100 shadow-md rounded-2xl overflow-hidden group">
                        <CardHeader className="bg-white/50 backdrop-blur pb-3 border-b border-white/20">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-black uppercase text-slate-500 tracking-widest">Documento Anexo</CardTitle>
                                {file || (isReview && existingRequest?.certificateUrl) ? (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[8px]">ANEXADO</Badge>
                                ) : (
                                    <Badge className="bg-slate-200 text-slate-400 border-none font-bold text-[8px]">VAZIO</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 relative aspect-[3/4] flex items-center justify-center overflow-hidden">
                            {!file && !existingRequest?.certificateUrl ? (
                                <div className="text-center p-8 space-y-4">
                                    <div className="h-20 w-20 mx-auto bg-slate-200 rounded-full flex items-center justify-center text-slate-300">
                                        <FileText className="h-10 w-10" />
                                    </div>
                                    <p className="text-sm text-slate-400 font-medium">Nenhum documento para exibir.</p>
                                    {!isReview && (
                                        <div className="relative">
                                            <Input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <Button variant="outline" className="rounded-xl border-dashed border-slate-300">Anexar Agora</Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 relative">
                                    {/* Simulated document visualizer */}
                                    <div className="w-full max-w-[200px] aspect-[1/1.4] bg-slate-50 border border-slate-100 rounded shadow-sm p-4 space-y-3 relative">
                                        <div className="h-2 w-1/2 bg-slate-200 rounded" />
                                        <div className="h-8 w-full bg-slate-100 rounded-sm flex items-center px-2">
                                            <div className="h-3 w-1/3 bg-slate-200 rounded" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="h-1.5 w-full bg-slate-100 rounded" />
                                            <div className="h-1.5 w-full bg-slate-100 rounded" />
                                            <div className="h-1.5 w-4/5 bg-slate-100 rounded" />
                                        </div>
                                        <div className="pt-8 flex flex-col items-center">
                                            <div className="h-10 w-10 border-2 border-slate-200 rounded-full flex items-center justify-center text-slate-200 mb-2">
                                                <Stethoscope className="h-6 w-6" />
                                            </div>
                                            <div className="h-2 w-1/2 bg-slate-200 rounded" />
                                        </div>

                                        <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                            <Button size="sm" variant="secondary" className="rounded-full shadow-lg gap-2">
                                                <Eye className="h-3 w-3" /> Ampliar
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                        {file ? file.name : (existingRequest?.certificateUrl || 'atestado_medico.pdf')}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-blue-600">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {analyzing && (
                                <div className="absolute inset-0 bg-blue-600/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white z-10">
                                    <Loader2 className="h-12 w-12 animate-spin mb-6 text-blue-200" />
                                    <Brain className="h-8 w-8 absolute top-8 text-blue-300 animate-pulse" />
                                    <h4 className="font-black text-xl mb-2">IA Assistant</h4>
                                    <p className="text-sm font-medium text-blue-100 leading-relaxed">
                                        Analisando atestado médico...<br />Extraindo CID e validando datas.
                                    </p>
                                    <div className="mt-8 w-full bg-blue-500/30 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-white w-1/2 animate-[progress_2s_ease-in-out_infinite]" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI Insights Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Brain className="h-32 w-32" />
                        </div>
                        <h4 className="font-black text-lg mb-2 relative z-10 flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            AI Insights
                        </h4>
                        <p className="text-xs text-blue-100 font-medium relative z-10 leading-relaxed">
                            {analyzing ? 'Nossa inteligência artificial está lendo o conteúdo para agilizar a conferência.' :
                                form.getValues('cid') ? 'A IA identificou um CID compatível. Verifique se as datas coincidem com o documento.' :
                                    'Anexe um atestado para que a IA possa extrair automaticamente o CID e período.'}
                        </p>
                        {form.getValues('certificateText') && (
                            <div className="mt-4 p-3 bg-white/10 rounded-xl relative z-10">
                                <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1">Texto Extraído (OCR)</p>
                                <p className="text-[10px] text-white/80 line-clamp-3 italic">"{form.getValues('certificateText')}"</p>
                            </div>
                        )}
                    </div>

                    {isReview && (
                        <Card className="border-none shadow-sm bg-slate-900 text-white rounded-2xl p-6">
                            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                                <User className="h-4 w-4 text-blue-400" />
                                Histórico do Processo
                            </h4>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Solicitado</p>
                                        <p className="text-xs font-bold text-slate-300">Por {existingRequest?.employeeName || 'Colaborador'}</p>
                                        <p className="text-[10px] text-slate-500">{existingRequest && format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 animate-pulse" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Em Análise</p>
                                        <p className="text-xs font-bold text-white">Aguardando validação do CID</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LeaveRequestPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col justify-center items-center h-[70vh] gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <LeaveRequestContent />
        </Suspense>
    );
}
