import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { employeesApi, Employee } from '@/lib/api/employees';

interface ExtractDataModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    onSuccess?: () => void;
    onDataExtracted?: (data: Record<string, any>) => void;
}

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
    const [extractedData, setExtractedData] = useState<Record<string, any> | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setExtractedData(null);
        }
    };

    const handleExtract = async () => {
        if (!file) return;

        try {
            setLoading(true);

            // 1. Extract Data
            const data = await employeesApi.extractDocumentData(file, employee?.id);

            if (!data || Object.keys(data).length === 0) {
                toast({
                    title: 'Atenção',
                    description: 'Não foi possível extrair dados do documento.',
                    variant: 'destructive',
                });
                return;
            }

            setExtractedData(data);

            toast({
                title: 'Sucesso!',
                description: 'Dados extraídos com Inteligência Artificial.',
            });

        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao processar documento.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApplyChanges = async () => {
        if (!extractedData) return;

        try {
            setLoading(true);

            // Filter only relevant fields (simple merge for MVP)
            const cleanData: any = {};
            Object.entries(extractedData).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "null") {
                    cleanData[key] = value;
                }
            });

            if (onDataExtracted) {
                onDataExtracted(cleanData);
                toast({
                    title: 'Dados Extraídos',
                    description: 'Verifique e complete as informações no formulário.',
                });
            } else if (employee) {
                await employeesApi.update(employee.id, cleanData);
                toast({
                    title: 'Atualizado',
                    description: 'Dados do colaborador atualizados com sucesso.',
                });
                onSuccess?.();
            }

            onClose();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Erro',
                description: 'Falha ao salvar dados.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Completar Cadastro com IA
                    </DialogTitle>
                    <DialogDescription>
                        Faça upload de um documento (RG, CNH, Comprovante) para preencher automaticamente os dados {employee ? `de ${employee.fullName}` : 'do formulário'}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!extractedData ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                {file ? (
                                    <>
                                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                        <span className="text-xs text-green-600">Pronto para processar</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm font-medium">Arraste ou clique para selecionar</span>
                                        <span className="text-xs">Imagens (JPG, PNG) ou PDF</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 space-y-2">
                            <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Dados Encontrados:
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(extractedData).map(([key, value]) => {
                                    if (key === '_storedPath') return null;
                                    return (
                                        <div key={key} className="flex flex-col">
                                            <span className="text-gray-500 uppercase text-[10px]">{key}</span>
                                            <span className="font-medium text-gray-900 truncate" title={String(value)}>{String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    {!extractedData ? (
                        <Button
                            onClick={handleExtract}
                            disabled={!file || loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Lendo Documento...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Processar com IA
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleApplyChanges}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                            Confirmar e Aplicar
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
