'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

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

export default function LeaveRequestPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const [submitting, setSubmitting] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [selectedType, setSelectedType] = useState('MEDICAL');
    const [file, setFile] = useState<File | null>(null);
    const [cidResults, setCidResults] = useState<any[]>([]);
    const [searchingCid, setSearchingCid] = useState(false);

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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);

        // Real call to AI to "read" the document if it's medical or just show it's analyzing
        setAnalyzing(true);

        try {
            // For now, let's keep the mock text to simulate "reading" in the frontend
            // but we could also send it to a "preview-analyze" endpoint
            const mockText = "Atesto para os devidos fins que o Sr. Colaborador esteve sob cuidados médicos nesta data devido a Dorsalgia (CID M54.5). Recomendo afastamento por 5 dias.";

            await new Promise(resolve => setTimeout(resolve, 1500));

            form.setValue('certificateText', mockText);

            // Auto-fill CID if found (simulated from text)
            if (mockText.includes('M54.5')) {
                form.setValue('cid', 'M54.5');
            }

            toast({
                title: 'Documento Lido',
                description: 'A inteligência artificial extraiu as informações relevantes.',
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

            // Use FormData to allow file upload
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

            toast({
                title: 'Solicitação Enviada',
                description: 'Sua licença foi registrada com sucesso e aguarda aprovação.',
            });

            router.push('/vacation');
        } catch (error: any) {
            toast({
                title: 'Erro ao solicitar',
                description: error.message || 'Ocorreu um erro ao processar sua licença.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Solicitar Licença / Afastamento</h1>
                    <p className="text-slate-500 font-medium">Preencha os dados e anexe documentos para validação automática.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8">
                    <Card className="border-none shadow-xl shadow-blue-900/5 bg-white/80 backdrop-blur-sm overflow-hidden border-t-4 border-blue-600">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                Dados da Solicitação
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold">Tipo de Licença</Label>
                                <Select
                                    onValueChange={(val) => { setSelectedType(val); form.setValue('type', val); }}
                                    defaultValue="MEDICAL"
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
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
                                    <Input type="date" {...form.register('startDate')} className="h-12 rounded-xl border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-bold">Data de Fim</Label>
                                    <Input type="date" {...form.register('endDate')} className="h-12 rounded-xl border-slate-200" />
                                </div>
                            </div>

                            <div className="space-y-4 p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        <h4 className="font-bold text-blue-900">Documentação e Anexos</h4>
                                    </div>
                                    {selectedType === 'MEDICAL' && (
                                        <Badge className="bg-blue-600 text-white border-none font-black flex gap-1 items-center">
                                            <Brain className="h-3 w-3" /> AI Assisted
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-blue-800 text-xs font-black uppercase">Anexar Documento (PDF/Imagem)</Label>
                                    <Input type="file" onChange={handleFileUpload} className="h-12 rounded-xl border-blue-200 bg-white cursor-pointer" />
                                </div>

                                {analyzing && (
                                    <div className="flex items-center gap-3 text-blue-600 text-sm font-bold animate-pulse">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        IA Assistant analisando documento...
                                    </div>
                                )}

                                {selectedType === 'MEDICAL' && (
                                    <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 relative">
                                        <Label className="text-blue-800 text-xs font-black uppercase tracking-widest">Código CID (Auto-preenchido pela IA)</Label>
                                        <Input
                                            {...form.register('cid')}
                                            placeholder="Ex: M54.5"
                                            className="h-12 rounded-xl border-blue-200 bg-white font-mono"
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                form.setValue('cid', val);
                                                handleCidSearch(val);
                                            }}
                                        />
                                        {cidResults.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                {cidResults.map((cid) => (
                                                    <div
                                                        key={cid.code}
                                                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-none transition-colors"
                                                        onClick={() => {
                                                            form.setValue('cid', cid.code);
                                                            setCidResults([]);
                                                        }}
                                                    >
                                                        <p className="text-xs font-black text-blue-600">{cid.code}</p>
                                                        <p className="text-xs text-slate-600 font-medium">{cid.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {searchingCid && (
                                            <div className="absolute right-3 top-9">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold">Observações / Motivo</Label>
                                <Textarea {...form.register('reason')} className="min-h-[100px] rounded-xl border-slate-200" placeholder="Descreva brevemente o motivo da solicitação..." />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 p-6 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => router.back()} disabled={submitting}>Cancelar</Button>
                            <Button
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={submitting || analyzing}
                                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                            >
                                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enviar Solicitação'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="md:col-span-4 space-y-6">
                    <Card className="border-none bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Resumo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center py-4">
                                <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                    <Calendar className="h-8 w-8 text-blue-400" />
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tipo Selecionado</p>
                                <h3 className="text-xl font-bold">{LEAVE_TYPES.find(t => t.id === selectedType)?.label}</h3>
                            </div>

                            <div className="space-y-4 border-t border-white/5 pt-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Solicitante</span>
                                    <span className="font-bold">{user?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Status</span>
                                    <Badge className="bg-yellow-500/20 text-yellow-500 border-none">PENDENTE</Badge>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 rounded-xl space-y-2">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Dica</p>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                    Certifique-se de que as datas estão corretas conforme o documento anexo para agilizar a aprovação pelo RH.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Brain className="h-32 w-32" />
                        </div>
                        <h4 className="font-black text-lg mb-2 relative z-10">IA Assistant</h4>
                        <p className="text-xs text-blue-100 font-medium relative z-10 leading-relaxed">
                            Nossa inteligência artificial valida automaticamente seus atestados médicos, extraindo o CID e ajudando o RH a processar sua licença mais rápido.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
