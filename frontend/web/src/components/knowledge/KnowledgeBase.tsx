import { useState, useRef, useEffect } from 'react';
import {
    knowledgeApi,
    KnowledgeDocument,
    KnowledgeStats,
    KnowledgeChunk,
    DOCUMENT_TYPES,
    DocumentType,
    getDocumentTypeLabel
} from '@/lib/api/ai';
import { toast } from 'react-hot-toast';

export default function KnowledgeBase() {
    const [searchQuery, setSearchQuery] = useState('');
    const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
    const [stats, setStats] = useState<KnowledgeStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<DocumentType | 'ALL'>('ALL');

    // Detailed View State
    const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
    const [chunks, setChunks] = useState<KnowledgeChunk[]>([]);
    const [isLoadingChunks, setIsLoadingChunks] = useState(false);

    // Upload Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState<DocumentType>('OTHER');
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadDescription, setUploadDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [relationCheck, setRelationCheck] = useState<any[]>([]);
    const [isCheckingRelation, setIsCheckingRelation] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const docsRes = await knowledgeApi.listDocuments(0, 100) as any;
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadFile(file);
        setUploadTitle(file.name);
        setShowUploadModal(true);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const checkRelation = async () => {
        if (!uploadTitle) return;
        try {
            setIsCheckingRelation(true);
            const results = await knowledgeApi.search(uploadTitle + " " + uploadDescription, 3);
            setRelationCheck(results);
            if (results.length > 0) {
                toast.success("Encontramos documentos relacionados!");
            } else {
                toast.info("Nenhum documento similar encontrado.");
            }
        } catch (error) {
            toast.error("Erro ao verificar relações.");
        } finally {
            setIsCheckingRelation(false);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) return;

        try {
            setIsUploading(true);
            await knowledgeApi.uploadDocument(uploadFile, uploadType, uploadTitle, uploadDescription);
            toast.success(`Documento "${uploadTitle}" enviado para indexação!`);
            setShowUploadModal(false);
            setUploadFile(null);
            setRelationCheck([]);
            loadData();
        } catch (error) {
            console.error('Erro no upload:', error);
            toast.error('Erro ao enviar documento.');
        } finally {
            setIsUploading(false);
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

    const openDocDetails = async (doc: KnowledgeDocument) => {
        setSelectedDoc(doc);
        setChunks([]);
        setIsLoadingChunks(true);
        try {
            const res = await knowledgeApi.getDocumentChunks(doc.id);
            setChunks(res as any);
        } catch (error) {
            toast.error("Erro ao carregar fragmentos.");
        } finally {
            setIsLoadingChunks(false);
        }
    };

    const categories = [
        { name: 'Políticas de RH', type: 'HR_POLICY', icon: '📋', color: 'bg-blue-100 text-blue-800' },
        { name: 'Legislação Trabalhista', type: 'LABOR_LAW', icon: '⚖️', color: 'bg-purple-100 text-purple-800' },
        { name: 'Procedimentos', type: 'COMPANY_PROCEDURE', icon: '📝', color: 'bg-green-100 text-green-800' },
        { name: 'FAQs', type: 'FAQ', icon: '❓', color: 'bg-yellow-100 text-yellow-800' },
        { name: 'Guia de Benefícios', type: 'BENEFIT_GUIDE', icon: '🎁', color: 'bg-pink-100 text-pink-800' },
        { name: 'Treinamentos', type: 'TRAINING_MATERIAL', icon: '🎓', color: 'bg-indigo-100 text-indigo-800' },
    ];

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = filterType === 'ALL' || doc.documentType === filterType;
        return matchesSearch && matchesType && doc.isActive !== false;
    });

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documentos Indexados</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.indexedDocuments || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fragmentos de Conhecimento</p>
                        <p className="text-2xl font-black text-gray-900">{stats?.totalChunks || 0}</p>
                    </div>
                </div>
            </div>

            {/* Categories Filter */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filterType === 'ALL' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}
                >
                    Todos
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.type}
                        onClick={() => setFilterType(cat.type as DocumentType)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${filterType === cat.type ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Documents List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-black text-gray-900 text-lg">Documentos</h3>
                                <p className="text-xs text-gray-500 font-medium">Gerenciamento de base de conhecimento</p>
                            </div>
                            <div className="flex space-x-2">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Filtrar..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="text-sm px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-40"
                                    />
                                </div>
                                <button onClick={loadData} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="p-6 animate-pulse flex space-x-4">
                                        <div className="h-10 w-10 bg-gray-100 rounded-lg"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                                            <div className="h-3 bg-gray-50 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredDocuments.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-gray-400 font-medium italic">Nenhum documento encontrado.</p>
                                </div>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => openDocDetails(doc)}
                                        className="p-4 hover:bg-blue-50/30 transition-all cursor-pointer group flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white border border-transparent group-hover:border-blue-100 transition-all">
                                                <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{doc.title}</h4>
                                                <div className="flex items-center space-x-3 mt-1">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                                                        {getDocumentTypeLabel(doc.documentType)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                    {doc.isIndexed ? (
                                                        <span className="text-[10px] text-green-600 font-bold flex items-center">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                                            Indexado
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-yellow-600 font-bold animate-pulse flex items-center">
                                                            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></span>
                                                            Processando
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Upload Action */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -m-4 opacity-10 group-hover:scale-110 transition-transform">
                            <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black mb-2">Alimentar a IA</h3>
                        <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                            Adicione novos manuais ou políticas para tornar o seu assistente especialista no seu negócio.
                        </p>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-sm hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                        >
                            Upload de Arquivo
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                            <span className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg mr-2">💡</span>
                            Dica do Agente
                        </h4>
                        <p className="text-sm text-gray-500 leading-relaxed italic">
                            "Mantenha os documentos categorizados corretamente. Isso me ajuda a filtrar informações mais rápido quando um colaborador pergunta."
                        </p>
                    </div>
                </div>
            </div>

            {/* Document Detail Modal */}
            {selectedDoc && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border">
                        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 text-xl">{selectedDoc.title}</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{getDocumentTypeLabel(selectedDoc.documentType)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-gray-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedDoc.description && (
                                <div>
                                    <h5 className="text-xs font-black uppercase text-gray-400 mb-2">Descrição</h5>
                                    <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">{selectedDoc.description}</p>
                                </div>
                            )}

                            <div>
                                <h5 className="text-xs font-black uppercase text-gray-400 mb-4 flex items-center">
                                    Fragmentos de Conhecimento (Chunks)
                                    <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">{chunks.length} total</span>
                                </h5>

                                {isLoadingChunks ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <p className="text-sm text-gray-400 font-bold">Lendo fragmentos...</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {chunks.map((chunk, idx) => (
                                            <div key={chunk.id} className="relative group">
                                                <div className="absolute -left-3 top-4 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-black z-10 shadow-lg">
                                                    {idx + 1}
                                                </div>
                                                <div className="bg-white border rounded-2xl p-5 pl-8 border-gray-100 group-hover:border-blue-200 group-hover:shadow-md transition-all">
                                                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{chunk.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setSelectedDoc(null)} className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black italic">Categorizar Conhecimento</h3>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">Configurações de Indexação</p>
                            </div>
                            <button onClick={() => { setShowUploadModal(false); setRelationCheck([]); }} className="p-2 hover:bg-white/20 rounded-full transition-all">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase">Título do Documento</label>
                                    <input
                                        type="text"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase">Categoria / Tipo</label>
                                    <select
                                        value={uploadType}
                                        onChange={(e) => setUploadType(e.target.value as DocumentType)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 appearance-none cursor-pointer"
                                    >
                                        {DOCUMENT_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase">Descrição (Opcional)</label>
                                <textarea
                                    value={uploadDescription}
                                    onChange={(e) => setUploadDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Explique brevemente do que se trata este documento..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600 resize-none"
                                />
                            </div>

                            {/* Relation Check Section */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-black text-gray-500 uppercase flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Verificação de Relações Prematura
                                    </h4>
                                    <button
                                        onClick={checkRelation}
                                        disabled={isCheckingRelation}
                                        className="text-[10px] font-black bg-white px-3 py-1.5 rounded-lg border shadow-sm hover:shadow transition-all disabled:opacity-50"
                                    >
                                        {isCheckingRelation ? 'ANALISANDO...' : 'VERIFICAR SEMELHANÇA'}
                                    </button>
                                </div>

                                {relationCheck.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 italic">Possível sobreposição com:</p>
                                        {relationCheck.map((res: any) => (
                                            <div key={res.documentId} className="flex items-center justify-between bg-white p-2 rounded-lg border border-indigo-50 shadow-sm animate-in slide-in-from-left duration-300">
                                                <span className="text-xs font-bold text-gray-700 truncate flex-1">{res.documentTitle}</span>
                                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded ml-2">
                                                    {(res.similarity * 100).toFixed(0)}% Similar
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-400 text-center py-2 h-8">
                                        Clique para ver se já existem documentos parecidos indexados.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-100 flex items-center justify-center rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold text-gray-400 truncate max-w-[150px]">{uploadFile?.name}</span>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => { setShowUploadModal(false); setRelationCheck([]); }}
                                    className="px-6 py-2.5 text-gray-500 font-bold text-sm hover:text-gray-900 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processando...
                                        </>
                                    ) : 'Confirmar e Indexar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
