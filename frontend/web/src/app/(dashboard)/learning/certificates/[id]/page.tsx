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
                        "relative w-full aspect-[1.414/1] bg-white border-[24px] border-slate-900 p-0 shadow-2xl overflow-hidden shadow-black/30",
                        "print:shadow-none print:border-[12px] print:m-0 print:w-full print:h-full"
                    )}
                >
                    {/* Ornamental Gold Frame Layers */}
                    <div className="absolute inset-0 border-[6px] border-amber-600/40 pointer-events-none z-20" />
                    <div className="absolute inset-1 border border-amber-500/20 pointer-events-none z-20" />

                    {/* Intricate Corner Ornaments */}
                    <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none z-30 opacity-80">
                        <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600 rounded-tl-sm" />
                        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-amber-500/50 rounded-tl-sm" />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-30 opacity-80 decoration-inherit">
                        <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600 rounded-tr-sm" />
                        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-amber-500/50 rounded-tr-sm" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none z-30 opacity-80">
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600 rounded-bl-sm" />
                        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-amber-500/50 rounded-bl-sm" />
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none z-30 opacity-80">
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600 rounded-br-sm" />
                        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-amber-500/50 rounded-br-sm" />
                    </div>
                    {/* Premium Background Paper Texture */}
                    <div className="absolute inset-0 opacity-[0.2] pointer-events-none" style={{
                        backgroundColor: '#fff',
                        backgroundImage: `radial-gradient(#e2e8f0 0.5px, transparent 0.5px)`,
                        backgroundSize: '24px 24px'
                    }} />
                    <div className="absolute inset-0 opacity-[0.4] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-pixels.png')]" />

                    {/* Decorative Inner Frame System */}
                    <div className="absolute inset-2 border-[2px] border-amber-600/30 pointer-events-none" />
                    <div className="absolute inset-3 border-[0.5px] border-amber-500/10 pointer-events-none" />
                    <div className="absolute inset-[30px] border border-amber-600/10 pointer-events-none" />
                    <div className="absolute inset-[32px] border-[0.5px] border-amber-600/5 pointer-events-none" />

                    <div className="relative h-full flex flex-col items-center justify-around py-14 px-20 z-10">
                        {/* Header Section */}
                        <div className="flex flex-col items-center space-y-1 w-full">
                            {(certificate.companyLogoUrl || config?.companyLogoUrl) ? (
                                <div className="relative group flex items-center justify-center">
                                    <img
                                        src={certificate.companyLogoUrl || config?.companyLogoUrl}
                                        alt="Logo"
                                        className="h-12 w-auto object-contain relative transition-all duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                    <Award className="h-8 w-8 text-amber-500" />
                                </div>
                            )}

                            <div className="text-center space-y-1">
                                <h2 className="text-[10px] font-black tracking-[0.6em] text-amber-700/80 uppercase pl-2">
                                    {certificate.certificateTitle || config?.certificateTitle || 'Certificado de Conclusão'}
                                </h2>
                                <div className="flex items-center gap-4 justify-center">
                                    <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-200" />
                                    <p className="text-slate-900 font-bold uppercase tracking-[0.2em] text-[10px] opacity-80">
                                        {certificate.companyName || config?.companyName || 'Axon Academy'}
                                    </p>
                                    <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-200" />
                                </div>
                            </div>
                        </div>

                        {/* Main Achievement Section */}
                        <div className="flex flex-col items-center space-y-4 w-full flex-1 justify-center py-4 px-12">
                            <div className="text-center space-y-2 w-full">
                                <p className="text-slate-400 font-serif italic text-base">Certificamos que</p>
                                <div className="w-full overflow-hidden px-4">
                                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                        {certificate.employeeName}
                                    </h1>
                                </div>
                                <div className="h-[2px] w-20 bg-amber-600/20 mx-auto rounded-full mt-2" />
                            </div>

                            <div className="text-center max-w-4xl space-y-4 w-full">
                                <p className="text-slate-500 font-medium text-sm leading-relaxed uppercase tracking-[0.1em]">
                                    concluiu com êxito o treinamento corporativo de
                                </p>
                                <div className="px-8 w-full overflow-hidden">
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">
                                        {certificate.courseName}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-center gap-8 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm" />
                                        <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                                            Carga Horária: {certificate.durationHours || 0} horas
                                        </p>
                                    </div>
                                    {certificate.finalScore && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-sm" />
                                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">
                                                Aproveitamento: {certificate.finalScore}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Signatures and Validation Section */}
                        <div className="w-full flex justify-between items-end px-10">
                            {/* Signature Area Left */}
                            <div className="flex flex-col items-center space-y-0.5 w-60">
                                <div className="h-12 w-full flex items-center justify-center relative border-b border-slate-900/10">
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

                    {/* Security Stamp - Fixed at a safe position */}
                    <div className="absolute top-12 right-12 opacity-[0.8] pointer-events-none group transform scale-[0.7] origin-top-right">
                        <div className="h-32 w-32 border-[6px] border-amber-600/20 rounded-full flex items-center justify-center relative">
                            <div className="absolute inset-0 border border-amber-500/30 rounded-full animate-[spin_30s_linear_infinite]" style={{ borderStyle: 'dotted' }} />
                            <div className="bg-gradient-to-br from-amber-500/5 via-transparent to-transparent rounded-full h-[85%] w-[85%] flex items-center justify-center flex-col p-4 text-center border border-amber-600/20 shadow-inner">
                                <Award className="h-10 w-10 text-amber-600 mb-1 opacity-70" />
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none text-amber-800">Original<br />Document</p>
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
