'use client';

import { useState } from 'react';
import {
    Database,
    Upload,
    Download,
    Users,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

interface ImportResult {
    successCount: number;
    errorCount: number;
    errors: string[];
}

export default function DataLoadPage() {
    const [loading, setLoading] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, ImportResult>>({});
    const [showModal, setShowModal] = useState(false);
    const [currentImportType, setCurrentImportType] = useState<'employees' | 'payroll' | null>(null);

    const downloadTemplate = async (type: 'employees' | 'payroll') => {
        try {
            const service = type === 'employees' ? 'employees' : 'payroll';
            const endpoint = type === 'employees' ? '/import/template/employees' : '/import/template/payroll';

            // Note: In our architecture, we might need to route through the gateway or specific service URL
            // Assuming typical API structure

            const response = await api.get(endpoint, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `template_${type === 'employees' ? 'colaboradores' : 'folha'}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Modelo baixado com sucesso!');
        } catch (error) {
            console.error('Error downloading template:', error);
            toast.error('Erro ao baixar modelo.');
        }
    };

    const handleFileUpload = async (type: 'employees' | 'payroll', file: File) => {
        if (!file) return;

        setLoading(type);
        setCurrentImportType(type);
        setShowModal(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const endpoint = type === 'employees' ? '/import/employees' : '/import/payroll';
            const response = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResults(prev => ({ ...prev, [type]: response.data }));

            if (response.data.errorCount === 0) {
                toast.success(`${response.data.successCount} registros importados com sucesso!`);
            } else if (response.data.successCount > 0) {
                toast.success(`${response.data.successCount} importados, mas houve ${response.data.errorCount} erros.`);
            } else {
                toast.error(`Falha na importação. ${response.data.errorCount} erros encontrados.`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Erro ao enviar arquivo.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Carga de Dados</h1>
                <p className="text-[var(--color-text-secondary)] mt-2">
                    Alimente o sistema em massa importando planilhas padronizadas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card Colaboradores */}
                <Card className="border-none bg-[var(--color-surface)] shadow-md overflow-hidden group">
                    <div className="h-2 bg-emerald-500 w-full" />
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <CardTitle>Cadastro de Colaboradores</CardTitle>
                        </div>
                        <CardDescription>
                            Importação em massa de novos colaboradores, cargos e departamentos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-[var(--color-surface-variant)]/30 border border-dashed border-[var(--color-border)]">
                            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                                1. Baixe o modelo oficial e preencha as colunas necessárias.<br />
                                2. Envie o arquivo preenchido para processamento.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full flex items-center gap-2"
                                onClick={() => downloadTemplate('employees')}
                            >
                                <Download className="w-4 h-4" /> Baixar Modelo Excel
                            </Button>
                        </div>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload('employees', e.target.files[0])}
                                disabled={loading !== null}
                            />
                            <Button
                                className="w-full flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={loading !== null}
                            >
                                {loading === 'employees' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {loading === 'employees' ? 'Processando...' : 'Selecionar e Importar'}
                            </Button>
                        </div>

                        {results.employees && (
                            <div className={`p-4 rounded-lg ${results.employees.errorCount > 0 ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-emerald-50 dark:bg-emerald-900/10'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    {results.employees.errorCount > 0 ? (
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    )}
                                    Resultado da Importação
                                </div>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    Sucesso: {results.employees.successCount} | Erros: {results.employees.errorCount}
                                </p>
                                {results.employees.errors.length > 0 && (
                                    <ul className="mt-2 text-[10px] text-red-500 max-h-24 overflow-y-auto">
                                        {results.employees.errors.slice(0, 5).map((err, i) => (
                                            <li key={i}>• {err}</li>
                                        ))}
                                        {results.employees.errors.length > 5 && <li>...e mais {results.employees.errors.length - 5} erros</li>}
                                    </ul>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Card Folha de Pagamento */}
                <Card className="border-none bg-[var(--color-surface)] shadow-md overflow-hidden group">
                    <div className="h-2 bg-blue-500 w-full" />
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <CardTitle>Dados da Folha</CardTitle>
                        </div>
                        <CardDescription>
                            Importação de histórico ou saldos processados da folha de pagamento.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-[var(--color-surface-variant)]/30 border border-dashed border-[var(--color-border)]">
                            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                                1. Baixe o modelo oficial informando matrícula e valores.<br />
                                2. O sistema vinculará automaticamente ao colaborador.
                            </p>
                            <Button
                                variant="outline"
                                className="w-full flex items-center gap-2"
                                onClick={() => downloadTemplate('payroll')}
                            >
                                <Download className="w-4 h-4" /> Baixar Modelo Excel
                            </Button>
                        </div>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => e.target.files?.[0] && handleFileUpload('payroll', e.target.files[0])}
                                disabled={loading !== null}
                            />
                            <Button
                                className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={loading !== null}
                            >
                                {loading === 'payroll' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {loading === 'payroll' ? 'Processando...' : 'Selecionar e Importar'}
                            </Button>
                        </div>

                        {results.payroll && (
                            <div className={`p-4 rounded-lg ${results.payroll.errorCount > 0 ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-blue-50 dark:bg-blue-900/10'}`}>
                                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                    {results.payroll.errorCount > 0 ? (
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                    )}
                                    Resultado da Importação
                                </div>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                    Sucesso: {results.payroll.successCount} | Erros: {results.payroll.errorCount}
                                </p>
                                {results.payroll.errors.length > 0 && (
                                    <ul className="mt-2 text-[10px] text-red-500 max-h-24 overflow-y-auto">
                                        {results.payroll.errors.slice(0, 5).map((err, i) => (
                                            <li key={i}>• {err}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-variant)]/50 border border-[var(--color-border)]">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-[var(--color-text-primary)]">Instruções Importantes</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-[var(--color-text-secondary)]">
                    <ul className="list-disc list-inside space-y-2">
                        <li>Certifique-se de que os CPFs estão corretos e sem caracteres especiais.</li>
                        <li>Os campos de data devem seguir o padrão <strong>dia/mês/ano</strong>.</li>
                        <li>Nomes de Departamentos e Cargos serão criados caso não existam.</li>
                    </ul>
                    <ul className="list-disc list-inside space-y-2">
                        <li>Para a folha, a matrícula deve coincidir exatamente com o cadastro.</li>
                        <li>Mês de referência deve ser um número entre 1 e 12.</li>
                        <li>Valores decimais devem usar ponto ou vírgula conforme o exemplo.</li>
                    </ul>
                </div>
            </div>

            {/* Modal de Acompanhamento e Resultado */}
            <Dialog open={showModal} onOpenChange={(open) => !loading && setShowModal(open)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin text-primary" /> Processando Importação</>
                            ) : (
                                <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Importação Concluída</>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {loading
                                ? "Estamos processando sua planilha. Isso pode levar alguns segundos dependendo do volume de dados."
                                : `O processamento do arquivo de ${currentImportType === 'employees' ? 'colaboradores' : 'folha'} foi finalizado.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        {loading ? (
                            <div className="space-y-4">
                                <Progress value={66} className="h-2" />
                                <p className="text-center text-xs text-muted-foreground animate-pulse">
                                    Extraindo informações e validando registros...
                                </p>
                            </div>
                        ) : currentImportType && results[currentImportType] ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 text-center">
                                        <div className="text-2xl font-bold text-emerald-600">{results[currentImportType].successCount}</div>
                                        <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600/70">Sucesso</div>
                                    </div>
                                    <div className={`p-3 rounded-lg ${results[currentImportType].errorCount > 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-100' : 'bg-gray-50 dark:bg-gray-900/10 border-gray-100'} border text-center`}>
                                        <div className={`text-2xl font-bold ${results[currentImportType].errorCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>{results[currentImportType].errorCount}</div>
                                        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Erros</div>
                                    </div>
                                </div>

                                {results[currentImportType].errors.length > 0 && (
                                    <div className="space-y-2">
                                        <h5 className="text-sm font-semibold flex items-center gap-1">
                                            <AlertCircle className="w-4 h-4 text-red-500" /> Detalhes dos Erros
                                        </h5>
                                        <div className="max-h-40 overflow-y-auto rounded-md border border-gray-100 p-2 bg-gray-50/50">
                                            <ul className="text-xs space-y-1">
                                                {results[currentImportType].errors.map((err, i) => (
                                                    <li key={i} className="text-red-600/80">• {err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button
                            disabled={loading !== null}
                            onClick={() => setShowModal(false)}
                            className="w-full"
                        >
                            {loading ? "Aguarde..." : "Fechar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
