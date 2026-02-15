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

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={extractedData ? "sm:max-w-2xl" : "sm:max-w-md"}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        Completar Cadastro com IA
                    </DialogTitle>
                    <DialogDescription>
                        Faça upload de um documento (RG, CNH, Comprovante) para preencher automaticamente os dados {employee ? `de ${employee.fullName}` : 'do formulário'}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {!extractedData ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-purple-300 hover:bg-purple-50/30 transition-all relative cursor-pointer group">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                {file ? (
                                    <>
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{file.name}</span>
                                            <span className="text-xs text-green-600 font-medium">Documento selecionado</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-500" />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-gray-700">Clique ou arraste o documento</span>
                                            <span className="text-xs">Formatos aceitos: JPG, PNG ou PDF</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-100">
                                <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" /> Dados Identificados
                                </h4>
                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    IA Extraction
                                </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                                {Object.entries(extractedData).map(([key, value]) => {
                                    if (key === '_storedPath' || !value || value === "null") return null;
                                    const label = fieldLabels[key] || key;
                                    return (
                                        <div key={key} className="flex flex-col gap-1">
                                            <span className="text-gray-400 font-bold text-[9px] uppercase tracking-widest">{label}</span>
                                            <span className="text-sm font-medium text-gray-800 break-words" title={String(value)}>
                                                {String(value)}
                                            </span>
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
