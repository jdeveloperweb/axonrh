import { useState, useRef, useEffect } from 'react';
import { knowledgeApi, KnowledgeDocument, KnowledgeStats, DOCUMENT_TYPES } from '@/lib/api/ai';
import { toast } from 'react-hot-toast';

export default function KnowledgeBase() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [stats, setStats] = useState<KnowledgeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const docsRes = await knowledgeApi.listDocuments(0, 50) as any;
            const statsRes = await knowledgeApi.getStats() as any;

            setDocuments(docsRes.content || []);
            setStats(statsRes);
        } catch (error) {
            console.error('Erro ao carregar base de conhecimento:', error);
            toast.error('Não foi possível carregar os documentos.');
        } finally {
            setIsLoading(false);
        }
    };


    const categories = [
        {
            name: 'Políticas de RH',
            type: 'HR_POLICY',
            icon: '📋',
            color: 'bg-blue-100 text-blue-800',
        },
        {
            name: 'Legislação Trabalhista',
            type: 'LABOR_LAW',
            icon: '⚖️',
            color: 'bg-purple-100 text-purple-800',
        },
        {
            name: 'Procedimentos',
            type: 'COMPANY_PROCEDURE',
            icon: '📝',
            color: 'bg-green-100 text-green-800',
        },
        {
            name: 'FAQs',
            type: 'FAQ',
            icon: '❓',
            color: 'bg-yellow-100 text-yellow-800',
        },
        {
            name: 'Guia de Benefícios',
            type: 'BENEFIT_GUIDE',
            icon: '🎁',
            color: 'bg-pink-100 text-pink-800',
        },
        {
            name: 'Treinamentos',
            type: 'TRAINING_MATERIAL',
            icon: '🎓',
            color: 'bg-indigo-100 text-indigo-800',
        },
    ];

    const getDocCount = (type: string) => {
        return documents.filter(d => d.documentType === type).length;
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            // Default to OTHER for now, or could show a modal to choose type
            await knowledgeApi.uploadDocument(file, 'OTHER', file.name);
            toast.success(`Documento "${file.name}" enviado para indexação!`);
            loadData(); // Refresh list
        } catch (error) {
            console.error('Erro no upload:', error);
            toast.error('Erro ao enviar documento.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return;
        try {
            await knowledgeApi.deleteDocument(id);
            toast.success('Documento excluído.');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir documento.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-full">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Documentos Indexados</p>
                        <p className="text-xl font-bold text-gray-900">{stats?.indexedDocuments || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 rounded-full">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Fragmentos de Conhecimento (Chunks)</p>
                        <p className="text-xl font-bold text-gray-900">{stats?.totalChunks || 0}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <div className="max-w-2xl mx-auto text-center">
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                        O que você deseja encontrar hoje?
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Busque por políticas, leis, procedimentos..."
                            className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all text-gray-900"
                        />
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category, index) => {
                    const count = getDocCount(category.type);
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <span className="text-3xl group-hover:scale-110 transition-transform">
                                        {category.icon}
                                    </span>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                                        <p className="text-sm text-gray-500">{count} documentos</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${category.color}`}>
                                    {count}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Documents Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Documentos Recentes</h3>
                    <button onClick={loadData} className="text-sm text-blue-600 hover:underline">Atualizar</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Título</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Data</th>
                                <th className="px-6 py-3">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        Nenhum documento encontrado. Envie o primeiro abaixo!
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{doc.title}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase">
                                                {doc.documentType.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {doc.isIndexed ? (
                                                <span className="flex items-center text-green-600 text-sm">
                                                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                                                    Indexado
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-yellow-600 text-sm animate-pulse">
                                                    <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                                                    Processando
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upload Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Alimentar a Inteligência
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md text-sm">
                        Envie manuais, políticas ou contratos. Nossa IA lerá tudo e se tornará especialista em sua empresa.
                    </p>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt"
                    />

                    <button
                        onClick={handleFileClick}
                        disabled={isUploading}
                        className={`group relative overflow-hidden px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 active:scale-95 ${isUploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isUploading ? (
                            <div className="flex items-center space-x-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Indexando...</span>
                            </div>
                        ) : (
                            <span className="flex items-center">
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload de Base de Conhecimento
                            </span>
                        )}
                    </button>
                    <p className="mt-4 text-xs text-gray-400 uppercase tracking-widest font-bold">
                        Suporte: PDF, DOC, TXT (até 10MB)
                    </p>
                </div>
            </div>
        </div>
    );
}

