'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Award, Download, Printer, ArrowLeft, ShieldCheck, Share2 } from 'lucide-react';
import { certificatesApi, Certificate } from '@/lib/api/learning';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function CertificateViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const certificateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadCertificate = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const res = await certificatesApi.get(id as string);
                setCertificate(res as any);
            } catch (error) {
                console.error('Erro ao carregar certificado:', error);
                toast.error('Certificado não encontrado');
            } finally {
                setLoading(false);
            }
        };
        loadCertificate();
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
                        "relative w-full aspect-[1.414/1] bg-white border-[24px] border-slate-900 p-1 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] shadow-2xl overflow-hidden shadow-black/20",
                        "print:shadow-none print:border-[12px] print:m-0 print:w-full print:h-full"
                    )}
                >
                    {/* Inner Decorative Border */}
                    <div className="absolute inset-4 border border-slate-200 pointer-events-none" />
                    <div className="absolute inset-6 border-[2px] border-slate-900/5 pointer-events-none" />

                    <div className="relative h-full border border-slate-100 flex flex-col items-center justify-between py-12 px-12 z-10">
                        {/* Header Branding */}
                        <div className="flex flex-col items-center space-y-6">
                            {certificate.companyLogoUrl ? (
                                <img src={certificate.companyLogoUrl} alt="Logo" className="h-20 w-auto object-contain" />
                            ) : (
                                <div className="h-20 w-20 bg-slate-900 rounded-3xl flex items-center justify-center shadow-lg transform rotate-3">
                                    <Award className="h-12 w-12 text-white" />
                                </div>
                            )}
                            <div className="text-center space-y-2">
                                <h2 className="text-sm font-black tracking-[0.6em] text-slate-400 uppercase">
                                    {certificate.certificateTitle || 'Certificado de Conclusão'}
                                </h2>
                                <div className="flex items-center gap-3 justify-center">
                                    <div className="h-px w-8 bg-slate-200" />
                                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[11px]">
                                        {certificate.companyName || 'Axon Academy • Soluções em Capital Humano'}
                                    </p>
                                    <div className="h-px w-8 bg-slate-200" />
                                </div>
                            </div>
                        </div>

                        {/* Achievement Text */}
                        <div className="flex flex-col items-center space-y-10 w-full">
                            <div className="text-center space-y-6">
                                <p className="text-slate-400 font-medium italic text-lg serif">Certificamos com distinção que</p>
                                <div className="relative inline-block">
                                    <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight px-4">
                                        {certificate.employeeName}
                                    </h1>
                                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-slate-900/10 rounded-full" />
                                </div>
                            </div>

                            <div className="text-center max-w-3xl space-y-6">
                                <p className="text-slate-500 font-medium leading-relaxed text-lg">
                                    concluiu com êxito o treinamento corporativo de excelência em
                                </p>
                                <div className="bg-slate-50 py-4 px-8 rounded-2xl border border-slate-100">
                                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                                        {certificate.courseName}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                            Carga Horária: {certificate.durationHours || 0} horas
                                        </p>
                                    </div>
                                    {certificate.finalScore && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-slate-300" />
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                                                Aproveitamento: {certificate.finalScore}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Validation & Signatures */}
                        <div className="w-full flex justify-between items-end px-4 pt-10">
                            {/* Signature Left */}
                            <div className="flex flex-col items-center space-y-3 w-72">
                                <div className="h-24 w-full flex items-center justify-center relative border-b border-slate-200">
                                    {certificate.instructorSignatureUrl ? (
                                        <img src={certificate.instructorSignatureUrl} alt="Assinatura" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                    ) : (
                                        <span className="text-slate-100 text-[8px] font-bold tracking-[0.5em] absolute top-1/2 -translate-y-1/2 uppercase">Reservado para assinatura</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900 text-[13px] uppercase tracking-tighter">
                                        {certificate.instructorName || 'Instrutor Responsável'}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Instrutor</p>
                                </div>
                            </div>

                            {/* Center Security */}
                            <div className="flex flex-col items-center space-y-3 pb-2">
                                <div className="p-3 bg-white shadow-sm border border-slate-200 rounded-2xl flex items-center gap-4 px-5">
                                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                                        <ShieldCheck className="h-6 w-6 text-slate-900" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Código de Autenticidade</span>
                                        <span className="font-mono text-sm font-black text-slate-900">{certificate.verificationCode}</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                                    {new Date(certificate.issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Signature Right */}
                            <div className="flex flex-col items-center space-y-3 w-72">
                                <div className="h-24 w-full flex items-center justify-center relative border-b border-slate-200">
                                    {certificate.generalSignatureUrl ? (
                                        <img src={certificate.generalSignatureUrl} alt="Assinatura" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                    ) : (
                                        <span className="text-slate-100 text-[8px] font-bold tracking-[0.5em] absolute top-1/2 -translate-y-1/2 uppercase">Reservado para assinatura</span>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900 text-[13px] uppercase tracking-tighter">
                                        {certificate.generalSignerName || 'Diretoria de RH'}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Responsável Legal</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Security Stamp */}
                    <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-[0.08] rotate-12 pointer-events-none group hover:opacity-100 transition-opacity">
                        <div className="h-48 w-48 border-[6px] border-slate-900 rounded-full flex items-center justify-center">
                            <div className="border-[2px] border-slate-900 rounded-full h-[92%] w-[92%] flex items-center justify-center flex-col p-4 text-center">
                                <p className="text-[12px] font-black uppercase tracking-[0.3em] leading-tight mb-2">Original<br />Document</p>
                                <Award className="h-12 w-12 my-2 text-slate-900" />
                                <div className="h-px w-24 bg-slate-900 my-1" />
                                <p className="text-[8px] font-black tracking-widest uppercase">
                                    {certificate.companyName ? certificate.companyName.split(' ')[0] : 'AXON'} ACADEMY CLOUD
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Guilloché Corners */}
                    <div className="absolute top-6 left-6 w-24 h-24 border-t-2 border-l-2 border-slate-900/10 rounded-tl-3xl pointer-events-none" />
                    <div className="absolute top-6 right-6 w-24 h-24 border-t-2 border-r-2 border-slate-900/10 rounded-tr-3xl pointer-events-none" />
                    <div className="absolute bottom-6 left-6 w-24 h-24 border-b-2 border-l-2 border-slate-900/10 rounded-bl-3xl pointer-events-none" />
                    <div className="absolute bottom-6 right-6 w-24 h-24 border-b-2 border-r-2 border-slate-900/10 rounded-br-3xl pointer-events-none" />
                </div>
            </div>

            {/* Print Footer Hint */}
            <div className="max-w-5xl mx-auto mt-8 px-4 text-center print:hidden">
                <p className="text-xs text-muted-foreground font-medium">Este certificado é um documento digital autêntico. A validação pode ser realizada através do código de verificação no portal da Axon.</p>
            </div>
        </div>
    );
}
