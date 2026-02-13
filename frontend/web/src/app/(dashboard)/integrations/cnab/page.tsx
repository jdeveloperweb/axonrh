'use client';

import { useState, useEffect } from 'react';
import {
    FileText,
    ArrowLeft,
    Plus,
    Upload,
    Download,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Building2,
    DollarSign,
    FileSpreadsheet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cnabApi, CnabFile } from '@/lib/api/integration';

export default function CnabPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<CnabFile[]>([]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            const data = await cnabApi.listFiles();
            setFiles(data.content);
        } catch (error) {
            console.error('Erro ao carregar arquivos:', error);
            // Mock data
            setFiles([
                {
                    id: '1',
                    fileType: 'REMESSA',
                    cnabLayout: 'CNAB_240',
                    fileName: 'REM_ITAU_20260213_01.txt',
                    bankCode: '341',
                    bankName: 'Itaú Unibanco',
                    referenceDate: '2026-02-13',
                    generationDate: new Date().toISOString(),
                    sequenceNumber: 1,
                    totalRecords: 145,
                    totalAmount: 485200.50,
                    status: 'GENERATED',
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    const getStatusBadge = (status: CnabFile['status']) => {
        const configs = {
            GENERATED: { label: 'Gerado', icon: CheckCircle2, class: 'bg-blue-100 text-blue-700' },
            PROCESSED: { label: 'Processado', icon: CheckCircle2, class: 'bg-emerald-100 text-emerald-700' },
            ERROR: { label: 'Erro', icon: XCircle, class: 'bg-red-100 text-red-700' },
        };
        const config = (configs as any)[status] || { label: status, icon: Clock, class: 'bg-gray-100 text-gray-700' };

        return (
            <Badge className={`${config.class} border-none flex items-center gap-1`}>
                <config.icon className="w-3 h-3" />
                {config.label}
            </Badge>
        );
    };

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
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">CNAB / Banking</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Remessas de pagamento e conciliação bancária automática.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Upload className="w-4 h-4" /> Processar Retorno
                    </Button>
                    <Button className="bg-[var(--color-primary)] gap-2">
                        <Plus className="w-4 h-4" /> Gerar Remessa
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Bancos Ativos</p>
                            <p className="text-2xl font-bold">02</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-white p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Volume Mensal</p>
                            <p className="text-2xl font-bold">R$ 1.2M</p>
                        </div>
                    </div>
                </Card>
                <Card className="border-none shadow-sm bg-white p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase">Arquivos (Mês)</p>
                            <p className="text-2xl font-bold">24</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="border-none shadow-sm pb-10">
                <CardHeader className="bg-white border-b">
                    <CardTitle className="text-lg">Arquivos Gerados / Recebidos</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                                    <th className="px-6 py-4">Arquivo</th>
                                    <th className="px-6 py-4">Tipo / Layout</th>
                                    <th className="px-6 py-4">Banco</th>
                                    <th className="px-6 py-4 text-center">Registros</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {files.map((file) => (
                                    <tr key={file.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium">{file.fileName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">{file.fileType}</span>
                                                <span className="text-[10px] text-gray-500">{file.cnabLayout}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{file.bankName} ({file.bankCode})</td>
                                        <td className="px-6 py-4 text-center text-sm tabular-nums">{file.totalRecords}</td>
                                        <td className="px-6 py-4 text-sm font-bold tabular-nums">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(file.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(file.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--color-primary)]">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
