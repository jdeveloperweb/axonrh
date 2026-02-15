import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Loader2, Sparkles, CheckCircle2, X, AlertCircle, Clock, Save, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeesApi, Employee } from '@/lib/api/employees';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExtractDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    onSuccess?: () => void;
    onDataExtracted?: (data: Record<string, any>) => void;
}

const fieldLabels: Record<string, string> = {
    fullName: 'Nome Completo',
    cpf: 'CPF',
    rgNumber: 'RG',
    rgIssuer: 'Órgão Emissor',
    birthDate: 'Data de Nascimento',
    motherName: 'Nome da Mãe',
    fatherName: 'Nome do Pai',
    addressStreet: 'Logradouro',
    addressNumber: 'Número',
    addressNeighborhood: 'Bairro',
    addressCity: 'Cidade',
    addressState: 'Estado (UF)',
    addressZipCode: 'CEP',
    nationality: 'Nacionalidade',
    gender: 'Gênero',
    pisPasep: 'PIS/PASEP',
};

export function ExtractDataModal({
    isOpen,
    onClose,
    employee,
    onSuccess,
    onDataExtracted,
}: ExtractDataModalProps) {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<Record<string, any>>({});
    const [executionTime, setExecutionTime] = useState<number | null>(null);
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

    // Reset state when opening for a new employee or opening fresh
    useEffect(() => {
        if (isOpen) {
            setFile(null);
            setExtractedData({});
            setExecutionTime(null);
            setSelectedFields(new Set());
        }
    }, [isOpen, employee?.id]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleExtract = async () => {
        if (!file) return;

        try {
            setLoading(true);
            const data = await employeesApi.extractDocumentData(file, employee?.id);

            if (!data || Object.keys(data).length <= 1) { // <= 1 because of _executionTimeMs or _storedPath
                toast({
                    title: 'Atenção',
                    description: 'Não foi possível extrair novos dados deste documento.',
                    variant: 'destructive',
                });
                return;
            }

            const { _executionTimeMs, _storedPath, ...pureData } = data;

            // Merge with existing extracted data
            const newExtracted = { ...extractedData };
            const newSelected = new Set(selectedFields);

            Object.entries(pureData).forEach(([key, value]) => {
                if (value && value !== 'null') {
                    newExtracted[key] = value;
                    newSelected.add(key); // Auto-select new findings
                }
            });

            setExtractedData(newExtracted);
            setSelectedFields(newSelected);
            setExecutionTime(_executionTimeMs || null);
            setFile(null); // Clear file to allow next upload

            toast({
                title: 'Sucesso!',
                description: `Dados extraídos em ${((_executionTimeMs || 0) / 1000).toFixed(1)} segundos.`,
            });

        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao processar documento. Verifique o formato do arquivo.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyChanges = async () => {
        if (selectedFields.size === 0) {
            toast({
                title: 'Atenção',
                description: 'Selecione ao menos um campo para aplicar.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);

            // Prepare data to send
            const dataToApply: any = {};
            selectedFields.forEach(field => {
                let value = extractedData[field];

                // Extra cleaning for specific fields
                if (field === 'addressZipCode' && typeof value === 'string') {
                    value = value.replace(/\D/g, '').substring(0, 8);
                }

                dataToApply[field] = value;
            });

            if (onDataExtracted) {
                onDataExtracted(dataToApply);
                toast({
                    title: 'Dados Aplicados',
                    description: 'Verifique os campos no formulário.',
                });
                onClose();
            } else if (employee) {
                await employeesApi.update(employee.id, dataToApply);
                toast({
                    title: 'Sucesso',
                    description: 'Dados do colaborador atualizados com sucesso.',
                });
                onSuccess?.();
                onClose();
            }
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || 'Falha ao salvar dados. Verifique os formatos.';
            toast({
                title: 'Erro de Validação',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleField = (field: string) => {
        const newSelected = new Set(selectedFields);
        if (newSelected.has(field)) {
            newSelected.delete(field);
        } else {
            newSelected.add(field);
        }
        setSelectedFields(newSelected);
    };

    // Helper to get actual value from employee
    const getCurrentValue = (field: string): string => {
        if (!employee) return '-';

        // Map address fields
        if (field.startsWith('address')) {
            const addrKey = field.replace('address', '').charAt(0).toLowerCase() + field.replace('address', '').slice(1);
            // zipCode -> address.zipCode
            const key = addrKey === 'zipCode' ? 'zipCode' : addrKey;
            return (employee.address as any)?.[key] || '-';
        }

        return (employee as any)?.[field] || '-';
    };

    const hasExtractedData = Object.keys(extractedData).length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn(
                "transition-all duration-300",
                hasExtractedData ? "sm:max-w-4xl" : "sm:max-w-md"
            )}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Sparkles className="w-6 h-6 text-purple-600 animate-pulse" />
                        Extração Inteligente Axon
                    </DialogTitle>
                    <DialogDescription>
                        Envie documentos para preencher ou atualizar dados {employee ? `de ${employee.fullName}` : 'automaticamente'}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Upload Section - Always visible or as a "Add More" button */}
                    <div className={cn(
                        "transition-all",
                        hasExtractedData ? "bg-gray-50 p-4 rounded-lg border border-dashed" : ""
                    )}>
                        {!file ? (
                            <div className="relative group cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={cn(
                                    "border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center gap-2",
                                    hasExtractedData ? "py-4 border-purple-200" : "py-10 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30"
                                )}>
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Upload className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {hasExtractedData ? "Adicionar outro documento para complementar" : "Selecione o documento (RG, CNH, CPF)"}
                                    </span>
                                    <span className="text-xs text-gray-400">PDF, JPG ou PNG</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-purple-900 truncate max-w-[200px]">{file.name}</span>
                                        <span className="text-[10px] text-purple-600 font-bold uppercase">Pronto para processar</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setFile(null)}>
                                        <X className="w-4 h-4 text-gray-400" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 bg-purple-600 hover:bg-purple-700"
                                        onClick={handleExtract}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Extrair"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comparison Section */}
                    {hasExtractedData && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest px-2">
                                <div className="flex items-center gap-4">
                                    <span>Comparação de Dados</span>
                                    {executionTime && (
                                        <span className="flex items-center gap-1 text-purple-500 normal-case tracking-normal">
                                            <Clock className="w-3 h-3" /> {executionTime}ms
                                        </span>
                                    )}
                                </div>
                                <span>{selectedFields.size} selecionados</span>
                            </div>

                            <ScrollArea className="h-[300px] border rounded-xl bg-white shadow-inner overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-gray-50 border-b z-20">
                                        <tr className="text-[10px] text-gray-500 uppercase font-bold">
                                            <th className="px-4 py-3 min-w-[150px]">Campo</th>
                                            <th className="px-4 py-3">Valor Atual</th>
                                            <th className="px-4 py-3 bg-purple-50/50 text-purple-700">Encontrado (IA)</th>
                                            <th className="px-4 py-3 text-center w-[80px]">Usar?</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {Object.entries(extractedData).map(([key, value]) => {
                                            const label = fieldLabels[key] || key;
                                            const currentValue = getCurrentValue(key);
                                            const isSelected = selectedFields.has(key);
                                            const isNew = currentValue === '-' || !currentValue;

                                            return (
                                                <tr key={key} className={cn(
                                                    "hover:bg-gray-50/50 transition-colors",
                                                    isSelected ? "bg-green-50/20" : ""
                                                )}>
                                                    <td className="px-4 py-3 font-medium text-gray-900">{label}</td>
                                                    <td className="px-4 py-3 text-gray-400 truncate max-w-[150px]" title={currentValue}>
                                                        {currentValue}
                                                    </td>
                                                    <td className={cn(
                                                        "px-4 py-3 font-semibold truncate max-w-[200px]",
                                                        isNew ? "text-green-600" : "text-purple-700"
                                                    )} title={String(value)}>
                                                        {String(value)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleField(key)}
                                                            className="border-purple-300 data-[state=checked]:bg-purple-600"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </div>
                    )}

                    {loading && !hasExtractedData && (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                            <div className="text-center">
                                <p className="font-bold text-gray-900">Lendo seu documento...</p>
                                <p className="text-sm text-gray-500">A IA está analisando as informações para você.</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between items-center sm:flex-row border-t pt-4">
                    {hasExtractedData ? (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Os campos selecionados em roxo substituirão os atuais.
                        </p>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        {hasExtractedData && (
                            <Button
                                onClick={handleApplyChanges}
                                disabled={loading || selectedFields.size === 0}
                                className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg shadow-green-100"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Aplicar Selecionados
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
