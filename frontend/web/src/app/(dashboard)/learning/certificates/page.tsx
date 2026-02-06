'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { enrollmentsApi, Enrollment } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';

export default function CertificatesPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [certificates, setCertificates] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCertificates = async () => {
            if (!user?.id) return;
            try {
                const res = await enrollmentsApi.getByEmployee(user.id);
                const completed = ((res as any) || []).filter((e: any) => e.status === 'COMPLETED');
                setCertificates(completed);
            } catch (error) {
                console.error('Erro ao carregar certificados:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCertificates();
    }, [user?.id]);

    return (
        <div className="max-w-[1400px] mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-700">
            <header className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="font-bold text-muted-foreground hover:bg-muted">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black tracking-tighter uppercase">Meus Certificados</h1>
                        <p className="text-muted-foreground font-medium italic">Sua coleção de conquistas e conhecimentos validados pela Axon Academy.</p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                    <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sincronizando conquistas...</p>
                </div>
            ) : certificates.length === 0 ? (
                <Card className="border-dashed border-2 bg-muted/20 py-20">
                    <CardContent className="flex flex-col items-center text-center space-y-6">
                        <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                            <Award className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Nenhum certificado ainda</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">Complete seus treinamentos para desbloquear certificados exclusivos e validar seus conhecimentos.</p>
                        </div>
                        <Button onClick={() => router.push('/learning')} className="font-black uppercase tracking-widest text-xs h-12 px-8 rounded-xl ring-offset-2 hover:ring-2 ring-primary/20">Explorar Cursos</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certificates.map((cert) => (
                        <Card key={cert.id} className="group overflow-hidden border-muted-foreground/10 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                            <div className="h-48 bg-slate-950 relative flex items-center justify-center p-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-60" />
                                <div className="relative h-full w-full border-2 border-white/10 rounded-lg flex flex-col items-center justify-center space-y-4">
                                    <Award className="h-12 w-12 text-blue-500 shadow-2xl" />
                                    <div className="text-center">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">Certificado Digital</p>
                                        <p className="text-[10px] font-bold text-white uppercase truncate px-4">{cert.courseName || cert.course?.title}</p>
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-1">
                                    <h3 className="font-black text-lg uppercase tracking-tight line-clamp-1">{cert.courseName || cert.course?.title}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Concluído em: {new Date(cert.completedAt!).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <Button
                                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                                    onClick={() => router.push(`/learning/certificates/${cert.certificateId}`)}
                                >
                                    <Award className="h-4 w-4" /> Visualizar Certificado
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
