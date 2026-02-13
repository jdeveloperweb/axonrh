'use client';

import { useState, useEffect } from 'react';
import {
    Key,
    ArrowLeft,
    Plus,
    Calendar,
    ShieldCheck,
    AlertTriangle,
    Trash2,
    Power,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { certificatesApi, DigitalCertificate } from '@/lib/api/integration';

export default function CertificatesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState<DigitalCertificate[]>([]);

    const loadCertificates = async () => {
        try {
            setLoading(true);
            const data = await certificatesApi.list();
            setCertificates(data);
        } catch (error) {
            console.error('Erro ao carregar certificados:', error);
            // Mock data
            setCertificates([
                {
                    id: '1',
                    name: 'AXONRH TECNOLOGIA LTDA',
                    type: 'A1',
                    serialNumber: '1234567890123456',
                    validFrom: '2025-06-01',
                    validUntil: '2026-06-01',
                    isActive: true,
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCertificates();
    }, []);

    const daysRemaining = (until: string) => {
        const diff = new Date(until).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Certificados Digitais</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Gerencie assinaturas eletrônicas e autenticação governamental.
                    </p>
                </div>
                <Button className="bg-[var(--color-primary)] gap-2">
                    <Plus className="w-4 h-4" /> Upload de Certificado
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                    <Card key={cert.id} className="border-none shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                        <div className={`h-2 w-full ${cert.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-3 rounded-xl bg-slate-50 text-slate-600`}>
                                    <Key className="w-6 h-6" />
                                </div>
                                <Badge variant={cert.isActive ? 'default' : 'secondary'} className={cert.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                    {cert.isActive ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg font-bold truncate leading-relaxed" title={cert.name}>
                                {cert.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] font-bold">TIPO {cert.type}</Badge>
                                <span className="text-[10px] font-mono text-gray-400">SN: {cert.serialNumber}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 flex-1">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Calendar className="w-3 h-3" />
                                        <span>Validade até {new Date(cert.validUntil).toLocaleDateString()}</span>
                                    </div>
                                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" />
                                        {daysRemaining(cert.validUntil)} dias restantes
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${Math.min(100, Math.max(0, (daysRemaining(cert.validUntil) / 365) * 100))}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t mt-auto">
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Button size="sm" variant="outline" className="text-xs gap-2">
                                    <Power className="w-3 h-3 font-bold" /> {cert.isActive ? 'Desativar' : 'Ativar'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start">
                <AlertTriangle className="w-6 h-6 text-blue-500 shrink-0" />
                <div className="space-y-1">
                    <h4 className="font-bold text-blue-900">Importante sobre Certificados A1</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        O AxonRH armazena certificados A1 de forma criptografada em nosso cofre de chaves (Vault).
                        Assegure-se de realizar o upload do arquivo .pfx ou .p12 e forneça a senha correta para que o sistema possa
                        assinar os eventos do eSocial automaticamente.
                    </p>
                </div>
            </div>
        </div>
    );
}
