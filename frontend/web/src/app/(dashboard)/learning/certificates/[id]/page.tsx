'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Award, Download, Printer, ArrowLeft, ShieldCheck, Share2 } from 'lucide-react';
import { certificatesApi, Certificate, certificateConfigsApi, CertificateConfig } from '@/lib/api/learning';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function CertificateViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [config, setConfig] = useState<CertificateConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const certificateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                // Buscar certificado e configuração em paralelo
                const [certRes, configRes] = await Promise.all([
                    certificatesApi.get(id as string),
                    certificateConfigsApi.get()
                ]);
                setCertificate(certRes as any);
                setConfig(configRes);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                toast.error('Certificado não encontrado');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="font-bold text-muted-foreground animate-pulse">AUTENTICANDO CERTIFICADO...</p>
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h1 className="text-2xl font-bold">Certificado não encontrado</h1>
                <Button onClick={() => router.push('/learning/catalog')}>Voltar</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:pb-0">
            {/* Control Bar - Hidden when printing */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 print:hidden">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.push('/learning/catalog')} className="font-bold gap-2">
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" className="font-bold gap-2" onClick={handlePrint}>
                            <Printer className="h-4 w-4" /> Imprimir
                        </Button>
                        <Button className="font-bold gap-2 bg-slate-900 border-none">
                            <Download className="h-4 w-4" /> Baixar PDF
                        </Button>
                        <Button variant="secondary" className="font-bold gap-2">
                            <Share2 className="h-4 w-4" /> Compartilhar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Certificate Content */}
            <div className="max-w-5xl mx-auto mt-12 px-4 flex justify-center print:mt-0 print:px-0">
                <div
                    ref={certificateRef}
                    className={cn(
                        "relative w-full aspect-[1.414/1] bg-white border-[20px] border-slate-900 p-0 shadow-2xl overflow-hidden shadow-black/30",
                        "print:shadow-none print:border-[10px] print:m-0 print:w-full print:h-full"
                    )}
                >
                    {/* Subtle Classic Background Texture */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-pixels.png')]" />

                    {/* Decorative Frame Lines */}
                    <div className="absolute inset-4 border border-slate-200 pointer-events-none" />
                    <div className="absolute inset-6 border-[0.5px] border-slate-900/10 pointer-events-none" />

                    <div className="relative h-full flex flex-col items-center justify-between py-16 px-16 z-10">
                        {/* Header Section */}
                        <div className="flex flex-col items-center space-y-8 w-full">
                            {(certificate.companyLogoUrl || config?.companyLogoUrl) ? (
                                <img
                                    src={certificate.companyLogoUrl || config?.companyLogoUrl}
                                    alt="Logo"
                                    className="h-20 w-auto object-contain"
                                />
                            ) : (
                                <div className="h-16 w-16 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                                    <Award className="h-10 w-10 text-white" />
                                </div>
                            )}

                            <div className="text-center space-y-3">
                                <h2 className="text-sm font-black tracking-[0.5em] text-slate-400 uppercase">
                                    {certificate.certificateTitle || config?.certificateTitle || 'Certificado de Conclusão'}
                                </h2>
                                <p className="text-slate-900 font-bold uppercase tracking-[0.2em] text-[12px] opacity-70">
                                    {certificate.companyName || config?.companyName || 'Axon Academy • Soluções em Capital Humano'}
                                </p>
                            </div>
                        </div>

                        {/* Main Achievement Section */}
                        <div className="flex flex-col items-center space-y-12 w-full flex-1 justify-center py-8">
                            <div className="text-center space-y-4">
                                <p className="text-slate-400 font-serif italic text-xl">Certificamos que</p>
                                <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
                                    {certificate.employeeName}
                                </h1>
                                <div className="h-1 w-24 bg-slate-900/10 mx-auto rounded-full" />
                            </div>

                            <div className="text-center max-w-3xl space-y-8">
                                <p className="text-slate-500 font-medium text-lg leading-relaxed">
                                    concluiu com êxito o treinamento corporativo de
                                </p>
                                <div className="px-10 py-4">
                                    <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter decoration-slate-200 decoration-4 underline-offset-8">
                                        {certificate.courseName}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center gap-12 pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-slate-900/20" />
                                        <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest">
                                            Carga Horária: {certificate.durationHours || 0} horas
                                        </p>
                                    </div>
                                    {certificate.finalScore && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-slate-900/20" />
                                            <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest">
                                                Aproveitamento: {certificate.finalScore}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Signatures and Validation Section */}
                        <div className="w-full flex justify-between items-end px-4">
                            {/* Signature Area Left */}
                            <div className="flex flex-col items-center space-y-3 w-64">
                                <div className="h-24 w-full flex items-center justify-center relative border-b-2 border-slate-900/5 hover:border-slate-900/10 transition-colors">
                                    {(certificate.instructorSignatureUrl || config?.instructorSignatureUrl) ? (
                                        <img
                                            src={certificate.instructorSignatureUrl || config?.instructorSignatureUrl}
                                            alt="Assinatura"
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="h-px w-full bg-transparent" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900 text-sm uppercase">
                                        {certificate.instructorName || config?.instructorName || 'Instrutor Responsável'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Instrutor</p>
                                </div>
                            </div>

                            {/* Authentication Center */}
                            <div className="flex flex-col items-center space-y-4 pb-2">
                                <div className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-1 shadow-sm">
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Autenticidade</span>
                                    <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
                                        {certificate.verificationCode}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {new Date(certificate.issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Signature Area Right */}
                            <div className="flex flex-col items-center space-y-3 w-64">
                                <div className="h-24 w-full flex items-center justify-center relative border-b-2 border-slate-900/5 hover:border-slate-900/10 transition-colors">
                                    {(certificate.generalSignatureUrl || config?.generalSignatureUrl) ? (
                                        <img
                                            src={certificate.generalSignatureUrl || config?.generalSignatureUrl}
                                            alt="Assinatura"
                                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="h-px w-full bg-transparent" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900 text-sm uppercase">
                                        {certificate.generalSignerName || config?.generalSignerName || 'Diretoria de RH'}
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Responsável Legal</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Stamp - Repositioned to not overlap text */}
                    <div className="absolute top-10 right-10 opacity-[0.05] pointer-events-none group transform rotate-12">
                        <div className="h-40 w-40 border-4 border-slate-900 rounded-full flex items-center justify-center">
                            <div className="border border-slate-900 rounded-full h-[90%] w-[90%] flex items-center justify-center flex-col p-4 text-center">
                                <Award className="h-10 w-10 text-slate-900 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">Original<br />Document</p>
                                <div className="h-px w-12 bg-slate-900 my-2" />
                                <p className="text-[7px] font-black tracking-tighter uppercase whitespace-nowrap">
                                    {(certificate.companyName || config?.companyName || 'AXON').substring(0, 15)} ACADEMY
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Classic Guilloché Corner Accents */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-slate-300 rounded-tl-lg pointer-events-none" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-slate-300 rounded-tr-lg pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l border-slate-300 rounded-bl-lg pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-slate-300 rounded-br-lg pointer-events-none" />
                </div>
            </div>

            {/* Print Footer Hint */}
            <div className="max-w-5xl mx-auto mt-8 px-4 text-center print:hidden">
                <p className="text-xs text-muted-foreground font-medium">Este certificado é um documento digital autêntico. A validação pode ser realizada através do código de verificação no portal da Axon.</p>
            </div>
        </div>
    );
}
