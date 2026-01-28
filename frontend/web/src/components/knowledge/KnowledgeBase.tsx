'use client';

import { useState, useRef } from 'react';

export default function KnowledgeBase() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories = [
        {
            name: 'Políticas de RH',
            icon: '📋',
            count: 12,
            color: 'bg-blue-100 text-blue-800',
        },
        {
            name: 'Legislação Trabalhista',
            icon: '⚖️',
            count: 45,
            color: 'bg-purple-100 text-purple-800',
        },
        {
            name: 'Procedimentos',
            icon: '📝',
            count: 23,
            color: 'bg-green-100 text-green-800',
        },
        {
            name: 'FAQs',
            icon: '❓',
            count: 67,
            color: 'bg-yellow-100 text-yellow-800',
        },
        {
            name: 'Guia de Benefícios',
            icon: '🎁',
            count: 8,
            color: 'bg-pink-100 text-pink-800',
        },
        {
            name: 'Treinamentos',
            icon: '🎓',
            count: 15,
            color: 'bg-indigo-100 text-indigo-800',
        },
    ];

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            // Simulate upload
            setTimeout(() => {
                setIsUploading(false);
                alert(`Arquivo "${file.name}" enviado com sucesso!\n\n(Simulação: Em produção, o arquivo seria processado pela IA)`);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }, 1500);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="max-w-2xl mx-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pesquisar na Base de Conhecimento
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Busque por políticas, leis, procedimentos..."
                            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                {categories.map((category, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="text-2xl">{category.icon}</span>
                                <div>
                                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                                    <p className="text-sm text-gray-500">{category.count} documentos</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                                {category.count}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Adicionar Documento
                </h3>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                />
                <div
                    onClick={handleFileClick}
                    className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer ${isUploading ? 'bg-gray-50' : ''}`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-gray-600">Enviando documento...</p>
                        </div>
                    ) : (
                        <>
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium text-blue-600">Clique para enviar</span> ou arraste e solte
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                PDF, DOC, TXT até 10MB
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
