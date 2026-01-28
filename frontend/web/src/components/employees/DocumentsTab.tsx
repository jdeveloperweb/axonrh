import { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeesApi, EmployeeDocument } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';

interface DocumentsTabProps {
    employeeId: string;
}

export function DocumentsTab({ employeeId }: DocumentsTabProps) {
    const { toast } = useToast();
    const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // New document state
    const [newDocType, setNewDocType] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const loadDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const docs = await employeesApi.getDocuments(employeeId);
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to load documents:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao carregar documentos',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [employeeId, toast]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !newDocType) return;

        try {
            setUploading(true);
            await employeesApi.uploadDocument(employeeId, selectedFile, newDocType);

            toast({
                title: 'Sucesso',
                description: 'Documento enviado com sucesso',
            });

            // Reset form
            setSelectedFile(null);
            setNewDocType('');
            // Reload list
            loadDocuments();
        } catch (error) {
            console.error('Failed to upload document:', error);
            toast({
                title: 'Erro',
                description: 'Falha ao enviar documento',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    const docTypes = [
        { value: 'RG', label: 'RG' },
        { value: 'CPF', label: 'CPF' },
        { value: 'CTPS', label: 'Carteira de Trabalho' },
        { value: 'CNH', label: 'CNH' },
        { value: 'VOTER_TITLE', label: 'Título de Eleitor' },
        { value: 'MILITARY_CERTIFICATE', label: 'Certificado Militar' },
        { value: 'MARRIAGE_CERTIFICATE', label: 'Certidão de Casamento' },
        { value: 'BIRTH_CERTIFICATE', label: 'Certidão de Nascimento' },
        { value: 'EDUCATION', label: 'Comprovante de Escolaridade' },
        { value: 'ADDRESS_PROOF', label: 'Comprovante de Residência' },
        { value: 'OTHER', label: 'Outro' },
    ];

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Novo Documento</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                Tipo de Documento
                            </label>
                            <select
                                value={newDocType}
                                onChange={(e) => setNewDocType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                required
                            >
                                <option value="">Selecione</option>
                                {docTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                Arquivo
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-[var(--color-primary)] hover:file:bg-gray-100"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={uploading || !selectedFile || !newDocType}
                            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Enviar
                        </button>
                    </form>
                </CardContent>
            </Card>

            {/* Documents List */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentos Enviados</CardTitle>
                </CardHeader>
                <CardContent>
                    {documents.length === 0 ? (
                        <p className="text-[var(--color-text-secondary)] text-center py-8">
                            Nenhum documento enviado ainda.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-4 border border-gray-200 rounded-lg flex items-center justify-between group hover:border-[var(--color-primary)] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[var(--color-text)]">
                                                {docTypes.find(t => t.value === doc.type)?.label || doc.type}
                                            </p>
                                            <p className="text-xs text-[var(--color-text-secondary)]">
                                                {doc.issueDate ? `Emitido em ${new Date(doc.issueDate).toLocaleDateString()}` : 'Sem data emissão'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {doc.fileUrl && (
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
