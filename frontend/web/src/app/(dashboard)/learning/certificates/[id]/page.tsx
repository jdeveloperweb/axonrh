'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Award, Download, Printer, ArrowLeft, ShieldCheck, Share2 } from 'lucide-react';
import { certificatesApi, Certificate, certificateConfigsApi, CertificateConfig } from '@/lib/api/learning';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function CertificateViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [config, setConfig] = useState<CertificateConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
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

    const handleDownloadPDF = async () => {
        if (!certificateRef.current || !certificate) return;

        try {
            setDownloading(true);
            const element = certificateRef.current;

            // Render the certificate to a canvas
            const canvas = await html2canvas(element, {
                scale: 3, // High quality
                useCORS: true, // For external images (logos/signatures)
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // Create PDF (landscape A4)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`certificado-${certificate.employeeName.toLowerCase().replace(/\s+/g, '-')}.pdf`);

            toast.success('Download iniciado!');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Erro ao gerar o PDF do certificado');
        } finally {
            setDownloading(false);
        }
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
                        <Button
                            variant="outline"
                            className="font-bold gap-2"
                            onClick={handlePrint}
                            disabled={downloading}
                        >
                            <Printer className="h-4 w-4" /> Imprimir
                        </Button>
                        <Button
                            className="font-bold gap-2 bg-slate-900 border-none"
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            {downloading ? 'Gerando...' : 'Baixar PDF'}
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
                    {/* Premium Background Paper Texture */}
                    <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{
                        backgroundColor: '#fff',
                        backgroundImage: `radial-gradient(#e2e8f0 0.5px, transparent 0.5px)`,
                        backgroundSize: '24px 24px'
                    }} />
                    <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-pixels.png')]" />

                    {/* Decorative Frame System */}
                    <div className="absolute inset-4 border-[3px] border-slate-900 pointer-events-none" />
                    <div className="absolute inset-5 border border-amber-600/30 pointer-events-none" />
                    <div className="absolute inset-8 border border-slate-900/10 pointer-events-none" />
                    <div className="absolute inset-[34px] border-[0.5px] border-amber-600/20 pointer-events-none" />

                    <div className="relative h-full flex flex-col items-center justify-between py-4 px-16 z-10">
                        {/* Header Section */}
                        <div className="flex flex-col items-center space-y-2 w-full">
                            {(certificate.companyLogoUrl || config?.companyLogoUrl) ? (
                                <div className="relative group flex items-center justify-center">
                                    <img
                                        src={certificate.companyLogoUrl || config?.companyLogoUrl}
                                        alt="Logo"
                                        className="h-12 w-auto object-contain relative transition-all duration-500 group-hover:drop-shadow-lg"
                                    />
                                </div>
                            ) : (
                                <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <Award className="h-8 w-8 text-amber-500" />
                                </div>
                            )}

                            <div className="text-center space-y-2">
                                <h2 className="text-[10px] font-black tracking-[0.6em] text-amber-700/80 uppercase pl-2">
                                    {certificate.certificateTitle || config?.certificateTitle || 'Certificado de Conclusão'}
                                </h2>
                                <div className="flex items-center gap-4 justify-center">
                                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-300" />
                                    <p className="text-slate-900 font-black uppercase tracking-[0.2em] text-[10px]">
                                        {certificate.companyName || config?.companyName || 'Axon Academy • Soluções em Capital Humano'}
                                    </p>
                                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-300" />
                                </div>
                            </div>
                        </div>

                        {/* Main Achievement Section */}
                        <div className="flex flex-col items-center space-y-2 w-full flex-1 justify-center py-1">
                            <div className="text-center space-y-1">
                                <p className="text-slate-400 font-serif italic text-sm">Certificamos que</p>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
                                    {certificate.employeeName}
                                </h1>
                                <div className="h-[1px] w-12 bg-amber-600/20 mx-auto rounded-full mt-1" />
                            </div>

                            <div className="text-center max-w-3xl space-y-1">
                                <p className="text-slate-500 font-medium text-[12px] leading-relaxed">
                                    concluiu com êxito o treinamento corporativo de
                                </p>
                                <div className="px-10 py-1">
                                    <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tighter decoration-amber-200/50 decoration-2 underline-offset-4">
                                        {certificate.courseName}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center gap-8 pt-2">
                                    <div className="flex items-center gap-2 group">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em]">
                                            Carga Horária: {certificate.durationHours || 0} horas
                                        </p>
                                    </div>
                                    {certificate.finalScore && (
                                        <div className="flex items-center gap-2 group">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                            <p className="text-slate-500 font-black text-[9px] uppercase tracking-[0.2em]">
                                                Aproveitamento: {certificate.finalScore}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Signatures and Validation Section */}
                        <div className="w-full flex justify-between items-end px-4 pb-2">
                            {/* Signature Area Left */}
                            <div className="flex flex-col items-center space-y-1 w-60">
                                <div className="h-14 w-full flex items-center justify-center relative border-b border-slate-900/10">
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
                                    <p className="font-black text-slate-900 text-[11px] uppercase">
                                        {certificate.instructorName || config?.instructorName || 'Instrutor Responsável'}
                                    </p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Instrutor</p>
                                </div>
                            </div>

                            {/* Authentication Center */}
                            <div className="flex flex-col items-center space-y-2 pb-1">
                                <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center gap-0.5">
                                    <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Autenticidade</span>
                                    <span className="font-mono text-[11px] font-black text-slate-900 tracking-wider">
                                        {certificate.verificationCode}
                                    </span>
                                </div>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                    {new Date(certificate.issuedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Signature Area Right */}
                            <div className="flex flex-col items-center space-y-1 w-60">
                                <div className="h-14 w-full flex items-center justify-center relative border-b border-slate-900/10">
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
                                    <p className="font-black text-slate-900 text-[11px] uppercase">
                                        {certificate.generalSignerName || config?.generalSignerName || 'Diretoria de RH'}
                                    </p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Responsável Legal</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Stamp - Scaled and repositioned */}
                    <div className="absolute top-10 right-10 opacity-[0.8] pointer-events-none group transform scale-75 origin-top-right">
                        <div className="h-28 w-28 border-[4px] border-amber-600/20 rounded-full flex items-center justify-center relative">
                            <div className="absolute inset-0 border border-amber-500/30 rounded-full animate-[spin_25s_linear_infinite]" style={{ borderStyle: 'dotted' }} />
                            <div className="bg-gradient-to-br from-amber-500/5 via-transparent to-transparent rounded-full h-[85%] w-[85%] flex items-center justify-center flex-col p-2 text-center border border-amber-600/20 shadow-inner">
                                <Award className="h-6 w-6 text-amber-600 mb-1 opacity-70" />
                                <p className="text-[7px] font-black uppercase tracking-widest leading-none text-amber-800">Original<br />Document</p>
                                <div className="h-px w-6 bg-amber-600/20 my-1" />
                                <p className="text-[5px] font-black tracking-tighter uppercase whitespace-nowrap text-amber-700/50 font-serif italic">
                                    Verified authenticity
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Classic Corner Accents - Gold Style */}
                    <div className="absolute top-4 left-4 w-12 h-12 border-t-[3px] border-l-[3px] border-amber-600/40 rounded-tl-sm pointer-events-none" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-t-[3px] border-r-[3px] border-amber-600/40 rounded-tr-sm pointer-events-none" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-[3px] border-l-[3px] border-amber-600/40 rounded-bl-sm pointer-events-none" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-[3px] border-r-[3px] border-amber-600/40 rounded-br-sm pointer-events-none" />
                </div>
            </div>

            {/* Print Footer Hint */}
            <div className="max-w-5xl mx-auto mt-8 px-4 text-center print:hidden">
                <p className="text-xs text-muted-foreground font-medium">Este certificado é um documento digital autêntico. A validação pode ser realizada através do código de verificação no portal da Axon.</p>
            </div>
        </div>
    );
}
