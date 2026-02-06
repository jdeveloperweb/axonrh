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
                        "relative w-full aspect-[1.414/1] bg-white border-[16px] border-double border-slate-900 p-16 shadow-2xl overflow-hidden",
                        "print:shadow-none print:border-[8px] print:m-0 print:w-full print:h-full"
                    )}
                >
                    {/* Background Ornaments */}
                    <div className="absolute inset-x-0 top-0 h-4 bg-slate-900" />
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-slate-900" />
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-slate-900 -m-2 opacity-20" />
                    <div className="absolute top-0 right-0 w-32 h-32 border-r-4 border-t-4 border-slate-900 -m-2 opacity-20" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 border-l-4 border-b-4 border-slate-900 -m-2 opacity-20" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-slate-900 -m-2 opacity-20" />

                    <div className="relative h-full border border-slate-100 flex flex-col items-center justify-between py-12 px-8">
                        {/* Header */}
                        <div className="flex flex-col items-center space-y-6">
                            {certificate.companyLogoUrl ? (
                                <img src={certificate.companyLogoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                            ) : (
                                <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center">
                                    <Award className="h-10 w-10 text-white" />
                                </div>
                            )}
                            <div className="text-center space-y-1">
                                <h2 className="text-sm font-black tracking-[0.4em] text-slate-400 uppercase">Certificado de Conclusão</h2>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Axon Academy • Soluções em Capital Humano</p>
                            </div>
                        </div>

                        {/* Middle Content */}
                        <div className="flex flex-col items-center space-y-8 w-full">
                            <div className="text-center space-y-4">
                                <p className="text-slate-500 font-medium italic">Certificamos com distinção que</p>
                                <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                                    {certificate.employeeName}
                                </h1>
                            </div>

                            <div className="text-center max-w-2xl space-y-2">
                                <p className="text-slate-600 font-medium leading-relaxed">
                                    concluiu com êxito o treinamento corporativo de
                                </p>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                    {certificate.courseName}
                                </h3>
                                <p className="text-slate-500 font-bold text-sm">
                                    com carga horária total de {certificate.durationHours || 0} horas
                                </p>
                            </div>
                        </div>

                        {/* Footer / Signatures */}
                        <div className="w-full flex justify-between items-end px-12 pt-12">
                            {/* Instructor Signature */}
                            <div className="flex flex-col items-center space-y-3 w-64">
                                <div className="h-20 w-full flex items-center justify-center relative">
                                    {certificate.instructorSignatureUrl ? (
                                        <img src={certificate.instructorSignatureUrl} alt="Assinatura" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <div className="w-full border-b border-slate-300" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900 text-xs uppercase">{certificate.instructorName || 'Instrutor Responsável'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instrutor</p>
                                </div>
                            </div>

                            {/* Verification Code */}
                            <div className="flex flex-col items-center space-y-2">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-slate-400">Autenticidade</span>
                                        <span className="font-mono text-xs font-bold text-slate-700">{certificate.verificationCode}</span>
                                    </div>
                                </div>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Emitido em {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}</p>
                            </div>

                            {/* General/RH Signature */}
                            <div className="flex flex-col items-center space-y-3 w-64">
                                <div className="h-20 w-full flex items-center justify-center relative">
                                    {certificate.generalSignatureUrl ? (
                                        <img src={certificate.generalSignatureUrl} alt="Assinatura" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <div className="w-full border-b border-slate-300" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="font-black text-slate-900 text-xs uppercase">{certificate.generalSignerName || 'Diretoria de RH'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável Legal</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Badge / Stamp */}
                    <div className="absolute bottom-20 right-20 opacity-10">
                        <div className="h-32 w-32 border-4 border-slate-900 rounded-full flex items-center justify-center -rotate-12">
                            <div className="border-2 border-slate-900 rounded-full h-[90%] w-[90%] flex items-center justify-center flex-col p-2 text-center">
                                <p className="text-[8px] font-black uppercase tracking-tighter leading-none">Original<br />Document</p>
                                <Award className="h-6 w-6 my-1" />
                                <p className="text-[6px] font-bold">AXON ACADEMY CLOUD</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Footer Hint */}
            <div className="max-w-5xl mx-auto mt-8 px-4 text-center print:hidden">
                <p className="text-xs text-muted-foreground font-medium">Este certificado é um documento digital autêntico. A validação pode ser realizada através do código de verificação no portal da Axon.</p>
            </div>
        </div>
    );
}
