'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, FileEdit, HelpCircle, Mail, ExternalLink, Info } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export default function PrivacyPage() {
    const { user } = useAuthStore();

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                    <Shield className="w-8 h-8 text-[var(--color-primary)]" />
                    Privacidade e Proteção de Dados
                </h1>
                <p className="text-gray-500 max-w-3xl">
                    Entenda como seus dados são coletados, utilizados e protegidos no AxonRH, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-blue-50/50 border-b border-blue-50 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                            <Eye className="w-5 h-5 text-blue-600" />
                            Como usamos seus dados?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Seus dados são utilizados exclusivamente para fins de gestão de recursos humanos e obrigações legais, tais como:
                        </p>
                        <ul className="space-y-3">
                            {[
                                'Gestão de folha de pagamento e benefícios.',
                                'Cumprimento de obrigações trabalhistas e previdenciárias.',
                                'Avaliação de desempenho e planos de desenvolvimento.',
                                'Controle de ponto e jornada de trabalho.',
                                'Comunicação interna e treinamentos.'
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-gray-700">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-50 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                            <Lock className="w-5 h-5 text-emerald-600" />
                            Seus Direitos (LGPD)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Você, como titular dos dados, possui direitos garantidos por lei. Você pode solicitar a qualquer momento:
                        </p>
                        <ul className="space-y-3">
                            {[
                                { icon: Info, label: 'Acesso aos seus dados cadastrados.' },
                                { icon: FileEdit, label: 'Correção de dados incompletos ou inexatos.' },
                                { icon: HelpCircle, label: 'Informações sobre o uso e compartilhamento.' },
                                { icon: ExternalLink, label: 'Portabilidade dos dados, quando aplicável.' }
                            ].map((item, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-gray-700 items-start">
                                    <item.icon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="p-4 bg-orange-50 rounded-3xl shrink-0">
                            <Mail className="w-12 h-12 text-orange-500" />
                        </div>
                        <div className="flex-1 space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900">Precisa de algum ajuste ou acesso?</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Para exercer seus direitos de acesso ou correção de dados, você deve entrar em contato diretamente com o departamento de <strong>Recursos Humanos</strong> da sua empresa ou enviar um e-mail para o nosso canal de privacidade:
                            </p>
                            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                                <a
                                    href="mailto:privacidade@mjolnix.com.br"
                                    className="px-6 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                                >
                                    privacidade@mjolnix.com.br
                                </a>
                                <span className="text-sm text-gray-400">Tempo de resposta estimado: 48h úteis</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-slate-400" />
                    Compromisso AxonRH
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    A AxonRH atua como operadora dos dados sob instrução da sua empresa (controladora). Seguimos rigorosos protocolos de segurança, incluindo criptografia de dados em repouso e em trânsito, auditorias periódicas e controle rigoroso de acesso. Seus dados nunca são vendidos ou compartilhados com terceiros para fins de marketing.
                </p>
            </div>
        </div>
    );
}
