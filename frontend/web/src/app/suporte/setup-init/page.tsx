'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { setupApi, validateCNPJ, formatCNPJ } from '@/lib/api/setup';

interface SetupInitFormData {
    cnpj: string;
    corporateName: string;
    email: string;
}

export default function SetupInitPage() {
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<SetupInitFormData>();

    const onSubmit = async (data: SetupInitFormData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await setupApi.initSetup({
                cnpj: data.cnpj.replace(/[^\d]/g, ''),
                corporateName: data.corporateName,
                email: data.email
            });

            const baseUrl = window.location.origin;
            setGeneratedLink(`${baseUrl}${response.setupUrl}`);
        } catch (err) {
            setError('Erro ao gerar link de setup. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            alert('Link copiado!');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-heading">
                        Inicializar Setup do Cliente
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Cadastre os dados iniciais para gerar o link de setup
                    </p>
                </div>

                {generatedLink ? (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                        <h3 className="text-lg font-medium text-green-800 mb-4">Setup Iniciado com Sucesso!</h3>
                        <p className="text-sm text-green-600 mb-4">Envie o link abaixo para o cliente:</p>
                        <div className="bg-white p-3 border border-green-300 rounded mb-4 break-all text-sm font-mono text-gray-700">
                            {generatedLink}
                        </div>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={handleCopyLink}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                            >
                                Copiar Link
                            </button>
                            <button
                                onClick={() => {
                                    setGeneratedLink(null);
                                    setValue('cnpj', '');
                                    setValue('corporateName', '');
                                    setValue('email', '');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition font-medium"
                            >
                                Novo Cadastro
                            </button>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                                {error}
                            </div>
                        )}

                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700"> CNPJ </label>
                                <input
                                    id="cnpj"
                                    type="text"
                                    className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${errors.cnpj ? 'border-red-300' : 'border-gray-300'} placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                                    placeholder="00.000.000/0000-00"
                                    {...register('cnpj', {
                                        required: 'CNPJ é obrigatório',
                                        validate: (value) => validateCNPJ(value) || 'CNPJ inválido',
                                        onChange: (e) => {
                                            e.target.value = formatCNPJ(e.target.value);
                                        }
                                    })}
                                />
                                {errors.cnpj && <span className="text-red-500 text-xs mt-1">{errors.cnpj.message}</span>}
                            </div>

                            <div>
                                <label htmlFor="corporateName" className="block text-sm font-medium text-gray-700"> Razão Social </label>
                                <input
                                    id="corporateName"
                                    type="text"
                                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Nome da Empresa LTDA"
                                    {...register('corporateName', { required: 'Razão Social é obrigatória' })}
                                />
                                {errors.corporateName && <span className="text-red-500 text-xs mt-1">{errors.corporateName.message}</span>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700"> Email de Contato </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="contato@empresa.com"
                                    {...register('email', {
                                        required: 'Email é obrigatório',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Email inválido"
                                        }
                                    })}
                                />
                                {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                            >
                                {loading ? 'Gerando...' : 'Gerar Link'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
