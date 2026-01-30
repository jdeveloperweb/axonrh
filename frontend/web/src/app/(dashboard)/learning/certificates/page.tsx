'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Trophy,
    Download,
    ExternalLink,
    Search,
    Award,
    Calendar,
    ShieldCheck,
    SearchX
} from 'lucide-react';
import { certificatesApi, Certificate } from '@/lib/api/learning';
import { useAuthStore } from '@/stores/auth-store';

export default function Certificates() {
    const { user } = useAuthStore();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const loadData = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const res = await certificatesApi.getByEmployee(user.id);
                setCertificates(res.data || []);
            } catch (error) {
                console.error('Erro ao buscar certificados:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user?.id]);

    const filteredCertificates = certificates.filter(c =>
        c.courseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 pb-12">
            <div className="relative p-12 rounded-3xl overflow-hidden bg-[#121212] flex flex-col items-center text-center space-y-4">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-3xl bg-amber-500 h-64 w-64 rounded-full" />
                <div className="absolute bottom-0 left-0 p-8 opacity-10 blur-3xl bg-primary h-64 w-64 rounded-full" />

                <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center shadow-2xl shadow-amber-500/20 mb-4 animate-bounce duration-[3000ms]">
                    <Trophy className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Suas Conquistas</h1>
                <p className="max-w-xl text-zinc-400 text-lg">
                    Você já conquistou {certificates.length} certificações oficiais. Continue se desenvolvendo para expandir seus horizontes.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por curso ou número..."
                        className="w-full h-12 pl-10 pr-4 bg-muted/50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="rounded-xl font-bold h-12 px-6">Filtrar</Button>
                    <Button className="rounded-xl font-black h-12 px-8 shadow-xl shadow-primary/20">Baixar Todos (ZIP)</Button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-card border rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredCertificates.length === 0 ? (
                <div className="text-center py-32 bg-card rounded-2xl border border-dashed flex flex-col items-center">
                    <SearchX className="h-16 w-16 text-muted-foreground/20 mb-6" />
                    <h3 className="text-2xl font-black">Nenhum certificado disponível</h3>
                    <p className="text-muted-foreground mt-2">Você ainda não completou nenhum curso para gerar certificados.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredCertificates.map((cert) => (
                        <CertificateCard key={cert.id} certificate={cert} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CertificateCard({ certificate }: { certificate: Certificate }) {
    return (
        <Card className="group overflow-hidden bg-card border hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-500 rounded-3xl flex flex-col">
            <div className="h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200" />

            <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                    <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100 group-hover:scale-110 transition-transform duration-500">
                        <Award className="h-8 w-8" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-zinc-200">
                        Oficial Axon
                    </Badge>
                </div>

                <div className="space-y-2 flex-1">
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary">Certificado de Conclusão</p>
                    <h3 className="text-2xl font-black leading-tight group-hover:text-primary transition-colors">
                        {certificate.courseName}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs pt-2">
                        <Calendar className="h-3 w-3" />
                        <span>Emitido em: {new Date(certificate.issuedAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="pt-6 border-t space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-green-500" />
                                ID de Verificação
                            </p>
                            <p className="text-xs font-mono font-bold text-zinc-500">{certificate.verificationCode}</p>
                        </div>
                        <div className="h-10 w-10 border rounded-xl flex items-center justify-center cursor-pointer hover:bg-muted transition-colors" title="Verificar Autenticidade">
                            <ExternalLink className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button className="flex-1 rounded-xl font-bold h-12 bg-[#121212] hover:bg-[#222222] text-white">
                            <Download className="h-4 w-4 mr-2" /> Baixar PDF
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
