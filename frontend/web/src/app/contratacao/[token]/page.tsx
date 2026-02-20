'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    User,
    FileText,
    Briefcase,
    PenTool,
    CheckCircle,
    AlertCircle,
    Upload,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Check,
    MessageSquare,
    Send,
    X,
    Shield,
    CreditCard,
    Phone,
    Heart,
    Sparkles,
    Info,
    AlertTriangle,
    ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    digitalHiringApi,
    DigitalHiringProcess,
    DigitalHiringPersonalData,
    DigitalHiringWorkData,
    DigitalHiringDependent,
    DigitalHiringDocument,
    DigitalHiringAiAlert,
    AiChatMessage,
    documentRequirements,
} from '@/lib/api/digital-hiring';
import { employeesApi } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { useThemeStore } from '@/stores/theme-store';
import { cn, getPhotoUrl } from '@/lib/utils';
import { configApi } from '@/lib/api/config';

// ==================== Steps ====================

interface Step {
    id: number;
    title: string;
    icon: React.ReactNode;
    status: 'pending' | 'current' | 'completed';
}

// ==================== Main Component ====================

export default function DigitalHiringPortalPage() {
    const params = useParams();
    const { toast } = useToast();
    const token = params.token as string;

    // Core state
    const [process, setProcess] = useState<DigitalHiringProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const { tenantTheme, setTenantTheme } = useThemeStore();

    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isFirstAccess, setIsFirstAccess] = useState(true);
    const [authForm, setAuthForm] = useState({ cpf: '', password: '', confirmPassword: '' });

    // Personal data form
    const [personalData, setPersonalData] = useState<DigitalHiringPersonalData>({
        fullName: '',
        cpf: '',
        rg: '',
        rgOrgaoEmissor: '',
        birthDate: '',
        gender: '',
        maritalStatus: '',
        nationality: 'Brasileira',
        phone: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        bankCode: '',
        bankName: '',
        bankAgency: '',
        bankAccount: '',
        bankAccountType: '',
        bankPix: '',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRelationship: '',
    });

    // Documents
    const [documents, setDocuments] = useState<Record<string, { file?: File; status: string; message?: string }>>({});

    // Work data
    const [workData, setWorkData] = useState<DigitalHiringWorkData>({
        pis: '',
        ctpsNumero: '',
        ctpsSerie: '',
        ctpsUf: '',
        dependents: [],
        selectedBenefits: [],
        transportVoucher: false,
        mealVoucher: false,
        healthInsurance: false,
        dentalInsurance: false,
    });

    // Contract
    const [contractHtml, setContractHtml] = useState('');
    const [confidentialityHtml, setConfidentialityHtml] = useState('');
    const [policyHtml, setPolicyHtml] = useState('');
    const [contractAccepted, setContractAccepted] = useState(false);
    const [confidentialityAccepted, setConfidentialityAccepted] = useState(false);
    const [policyAccepted, setPolicyAccepted] = useState(false);

    // AI Chat
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // AI Alerts
    const [aiAlerts, setAiAlerts] = useState<DigitalHiringAiAlert[]>([]);

    // Fetch process
    const fetchProcess = useCallback(async () => {
        try {
            setLoading(true);
            const data = await digitalHiringApi.public.access(token);
            setProcess(data);

            // Pre-fill candidate data
            if (data.candidateCpf) setPersonalData(prev => ({ ...prev, cpf: data.candidateCpf || '' }));
            if (data.candidateName) setPersonalData(prev => ({ ...prev, fullName: data.candidateName }));
            if (data.candidateEmail) setPersonalData(prev => ({ ...prev, email: data.candidateEmail }));
            if (data.candidatePhone) setPersonalData(prev => ({ ...prev, phone: data.candidatePhone || '' }));

            // Restore saved data
            if (data.personalData) setPersonalData(prev => ({ ...prev, ...data.personalData }));
            if (data.workData) setWorkData(prev => ({ ...prev, ...data.workData }));
            if (data.aiAlerts) setAiAlerts(data.aiAlerts);

            setCurrentStep(data.currentStep || 1);

            // Load existing documents
            try {
                const docs = await digitalHiringApi.public.getDocuments(token);
                const docsMap: Record<string, { status: string; message?: string }> = {};
                docs.forEach((doc: DigitalHiringDocument) => {
                    docsMap[doc.documentType] = {
                        status: doc.status,
                        message: doc.validationMessage,
                    };
                });
                setDocuments(docsMap);
            } catch {
                // Documents may not be loaded yet
            }

            // Fetch branding if not already loaded or different tenant
            if (data.tenantId && (!tenantTheme || tenantTheme.tenantId !== data.tenantId)) {
                try {
                    const config = await configApi.getThemeConfig(data.tenantId);
                    setTenantTheme({
                        tenantId: config.tenantId,
                        logoUrl: config.logoUrl,
                        logoWidth: (config.extraSettings?.logoWidth as number) || 150,
                        colors: {
                            primary: config.primaryColor || '#1976D2',
                            secondary: config.secondaryColor || '#424242',
                            accent: config.accentColor || '#FF4081',
                            background: config.backgroundColor || '#FFFFFF',
                            surface: config.surfaceColor || '#FAFAFA',
                            textPrimary: config.textPrimaryColor || '#212121',
                            textSecondary: config.textSecondaryColor || '#757575',
                        },
                        baseFontSize: (config.extraSettings?.baseFontSize as number) || 16,
                        customCss: config.customCss,
                        faviconUrl: config.faviconUrl
                    });
                } catch (e) {
                    console.error('Error fetching branding:', e);
                }
            }
        } catch (error: unknown) {
            const err = error as { response?: { status: number }; message?: string };
            if (err.response?.status === 410 || err.message?.includes('expirado')) {
                toast({
                    title: 'Link Expirado',
                    description: 'Este link de contratação expirou. Entre em contato com o RH.',
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar o processo de contratação.',
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
        }
    }, [token, toast]);

    useEffect(() => {
        fetchProcess();
    }, [fetchProcess]);

    // Auth handlers
    const handleAuth = async () => {
        if (!authForm.cpf) {
            toast({ title: 'Atenção', description: 'Informe seu CPF', variant: 'destructive' });
            return;
        }
        if (!authForm.password) {
            toast({ title: 'Atenção', description: 'Informe sua senha', variant: 'destructive' });
            return;
        }

        try {
            setSubmitting(true);
            if (isFirstAccess) {
                if (authForm.password !== authForm.confirmPassword) {
                    toast({ title: 'Atenção', description: 'As senhas não conferem', variant: 'destructive' });
                    return;
                }
                await digitalHiringApi.public.createPassword(token, { cpf: authForm.cpf, password: authForm.password });
            } else {
                await digitalHiringApi.public.login(token, { cpf: authForm.cpf, password: authForm.password });
            }
            setIsAuthenticated(true);
            toast({ title: 'Acesso autorizado', description: 'Bem-vindo ao portal de contratação!' });
        } catch {
            toast({ title: 'Erro', description: 'CPF ou senha inválidos', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // CEP handler
    const handleCepBlur = async () => {
        const cep = personalData.cep?.replace(/\D/g, '') || '';
        if (cep.length === 8) {
            try {
                setLoadingCep(true);
                const address = await employeesApi.searchCep(cep);
                setPersonalData(prev => ({
                    ...prev,
                    logradouro: address.street || prev.logradouro,
                    bairro: address.neighborhood || prev.bairro,
                    cidade: address.city || prev.cidade,
                    estado: address.state || prev.estado,
                }));
            } catch {
                // CEP lookup failed silently
            } finally {
                setLoadingCep(false);
            }
        }
    };

    // Save personal data
    const handleSavePersonalData = async () => {
        if (!personalData.fullName || !personalData.cpf) {
            toast({ title: 'Atenção', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
            return;
        }
        try {
            setSubmitting(true);
            await digitalHiringApi.public.savePersonalData(token, personalData);

            // AI Validation
            try {
                const validation = await digitalHiringApi.public.validateData(token);
                if (validation.alerts?.length > 0) {
                    setAiAlerts(validation.alerts);
                    toast({
                        title: 'IA detectou observações',
                        description: `${validation.alerts.length} ponto(s) de atenção encontrado(s)`,
                    });
                }
            } catch {
                // AI validation is optional
            }

            setCurrentStep(2);
            toast({ title: 'Dados salvos', description: 'Seus dados pessoais foram salvos com sucesso!' });
        } catch {
            toast({ title: 'Erro', description: 'Falha ao salvar dados pessoais', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // Document upload
    const handleDocumentUpload = async (type: string, file: File) => {
        try {
            setDocuments(prev => ({ ...prev, [type]: { file, status: 'UPLOADING' } }));
            const result = await digitalHiringApi.public.uploadDocument(token, file, type);
            setDocuments(prev => ({
                ...prev,
                [type]: { file, status: result.validationStatus, message: result.ocrData?.message as string | undefined },
            }));
            if (result.aiAlerts) {
                setAiAlerts(prev => [...prev, ...result.aiAlerts!]);
            }
            toast({ title: 'Documento enviado', description: `${type} enviado com sucesso` });
        } catch {
            setDocuments(prev => ({ ...prev, [type]: { status: 'ERROR', message: 'Falha no upload' } }));
            toast({ title: 'Erro', description: 'Falha ao enviar documento', variant: 'destructive' });
        }
    };

    // Validate documents & advance
    const handleValidateDocuments = async () => {
        try {
            setSubmitting(true);
            const result = await digitalHiringApi.public.validateDocuments(token);
            if (result.allValid) {
                setCurrentStep(3);
            } else {
                if (result.alerts) setAiAlerts(prev => [...prev, ...result.alerts]);
                toast({ title: 'Documentos pendentes', description: 'Alguns documentos precisam ser revisados', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Erro', description: 'Falha ao validar documentos', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // Save work data
    const handleSaveWorkData = async () => {
        try {
            setSubmitting(true);
            await digitalHiringApi.public.saveWorkData(token, workData);

            // Load contract
            try {
                const contract = await digitalHiringApi.public.getContract(token);
                setContractHtml(contract.contractHtml);
                setConfidentialityHtml(contract.confidentialityHtml);
                setPolicyHtml(contract.policyHtml);
            } catch {
                // Contract might not be generated yet
            }

            setCurrentStep(4);
            toast({ title: 'Dados salvos', description: 'Dados trabalhistas salvos com sucesso!' });
        } catch {
            toast({ title: 'Erro', description: 'Falha ao salvar dados trabalhistas', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // Sign contract
    const handleSignContract = async () => {
        if (!contractAccepted || !confidentialityAccepted || !policyAccepted) {
            toast({ title: 'Atenção', description: 'Você precisa aceitar todos os termos', variant: 'destructive' });
            return;
        }
        try {
            setSubmitting(true);
            await digitalHiringApi.public.signContract(token, {
                acceptedTerms: true,
                signatureText: personalData.fullName,
                acceptedConfidentiality: true,
                acceptedInternalPolicy: true,
                userAgent: navigator.userAgent,
            });
            setCurrentStep(5);
            toast({ title: 'Parabéns!', description: 'Contrato assinado com sucesso!' });
        } catch {
            toast({ title: 'Erro', description: 'Falha ao assinar contrato', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // AI Chat
    const handleSendChat = async () => {
        if (!chatInput.trim()) return;
        const userMessage: AiChatMessage = { role: 'user', content: chatInput, timestamp: new Date().toISOString() };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setChatLoading(true);
        try {
            const response = await digitalHiringApi.public.aiChat(token, chatInput);
            setChatMessages(prev => [...prev, response]);
        } catch {
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, não consegui processar sua mensagem. Tente novamente.', timestamp: new Date().toISOString() }]);
        } finally {
            setChatLoading(false);
        }
    };

    // Dependents management
    const addDependent = () => {
        setWorkData(prev => ({
            ...prev,
            dependents: [...(prev.dependents || []), { fullName: '', cpf: '', birthDate: '', relationship: '' }],
        }));
    };

    const removeDependent = (index: number) => {
        setWorkData(prev => ({
            ...prev,
            dependents: (prev.dependents || []).filter((_, i) => i !== index),
        }));
    };

    const updateDependent = (index: number, field: keyof DigitalHiringDependent, value: string) => {
        setWorkData(prev => ({
            ...prev,
            dependents: (prev.dependents || []).map((dep, i) => i === index ? { ...dep, [field]: value } : dep),
        }));
    };

    // Build steps
    const steps: Step[] = [
        { id: 1, title: 'Dados Pessoais', icon: <User className="w-5 h-5" />, status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'pending' },
        { id: 2, title: 'Documentos', icon: <FileText className="w-5 h-5" />, status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'pending' },
        { id: 3, title: 'Dados Trabalhistas', icon: <Briefcase className="w-5 h-5" />, status: currentStep === 3 ? 'current' : currentStep > 3 ? 'completed' : 'pending' },
        { id: 4, title: 'Assinatura', icon: <PenTool className="w-5 h-5" />, status: currentStep === 4 ? 'current' : currentStep > 4 ? 'completed' : 'pending' },
        { id: 5, title: 'Conclusão', icon: <CheckCircle className="w-5 h-5" />, status: currentStep === 5 ? 'current' : 'pending' },
    ];

    // UF options
    const ufOptions = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

    // ==================== RENDER ====================

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary,#1976D2)] mx-auto mb-4" />
                    <p className="text-gray-600">Carregando processo de contratação...</p>
                </div>
            </div>
        );
    }

    if (!process) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Link Inválido</h2>
                        <p className="text-gray-600">
                            Este link de contratação não é válido ou já expirou. Entre em contato com o departamento de RH.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const primaryColor = tenantTheme?.colors?.primary || '#1976D2';

    // Auth screen
    if (!isAuthenticated) {

        return (
            <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
                {/* Left Side: Premium Branding */}
                <div
                    className="hidden md:flex md:w-[45%] lg:w-[55%] relative items-center justify-center p-12 text-white overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, #4f46e5 100%)`
                    }}
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />

                    <div className="relative z-10 max-w-xl">
                        <div className="mb-12">
                            {tenantTheme?.logoUrl ? (
                                <img
                                    src={getPhotoUrl(tenantTheme.logoUrl, undefined, 'logo') || ''}
                                    alt="Logo"
                                    className="h-14 w-auto object-contain brightness-0 invert"
                                    style={{ maxWidth: `${tenantTheme.logoWidth || 150}px` }}
                                />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                        <Briefcase className="w-7 h-7 text-white" />
                                    </div>
                                    <span className="text-3xl font-bold tracking-tight">
                                        Axon<span className="text-white/70">RH</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6 border border-white/10">
                            <Sparkles className="w-5 h-5 text-yellow-300" />
                            <span>Portal de Admissão Digital</span>
                        </div>

                        <h2 className="text-4xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight">
                            Boas-vindas ao seu <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-white">novo começo</span>
                        </h2>

                        <p className="text-lg lg:text-xl text-blue-50/80 mb-10 leading-relaxed font-medium">
                            Estamos felizes em ter você conosco. Este é o seu portal para completar sua admissão de forma rápida, segura e totalmente digital.
                        </p>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <Shield className="w-7 h-7 text-yellow-300" />
                                </div>
                                <h4 className="font-bold text-sm">100% Seguro</h4>
                                <p className="text-xs text-blue-100/70 mt-1">Seus dados protegidos por criptografia de ponta.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                                    <Sparkles className="w-7 h-7 text-yellow-300" />
                                </div>
                                <h4 className="font-bold text-sm">IA Integrada</h4>
                                <p className="text-xs text-blue-100/70 mt-1">Validação inteligente para agilizar seu processo.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50/50">
                    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
                        {/* Mobile Logo */}
                        <div className="md:hidden flex justify-center mb-8">
                            {tenantTheme?.logoUrl ? (
                                <img
                                    src={getPhotoUrl(tenantTheme.logoUrl, undefined, 'logo') || ''}
                                    alt="Logo"
                                    className="h-10 w-auto object-contain"
                                    style={{ maxWidth: `${tenantTheme.logoWidth || 150}px` }}
                                />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shadow-lg">
                                        <Briefcase className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-xl font-bold tracking-tight text-gray-900">
                                        Axon<span className="text-blue-600">RH</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="text-center md:text-left">
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                {isFirstAccess ? 'Criar sua conta' : 'Acesse seu portal'}
                            </h2>
                            <p className="mt-2 text-gray-500 font-medium">
                                {isFirstAccess
                                    ? 'Defina uma senha segura para iniciar sua jornada.'
                                    : 'Digite seu CPF e senha cadastrada para continuar.'}
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/5 border border-gray-100 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">CPF</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            value={authForm.cpf}
                                            onChange={(e) => setAuthForm(prev => ({ ...prev, cpf: e.target.value }))}
                                            placeholder="000.000.000-00"
                                            className="pl-12 py-6 bg-gray-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Senha</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            type="password"
                                            value={authForm.password}
                                            onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder="••••••••"
                                            className="pl-12 py-6 bg-gray-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20"
                                        />
                                    </div>
                                </div>

                                {isFirstAccess && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Confirmar Senha</label>
                                        <div className="relative group">
                                            <CheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input
                                                type="password"
                                                value={authForm.confirmPassword}
                                                onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                                placeholder="••••••••"
                                                className="pl-12 py-6 bg-gray-50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleAuth}
                                disabled={submitting}
                                className="w-full py-7 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                                {isFirstAccess ? 'Criar meu Acesso' : 'Entrar no Portal'}
                            </Button>

                            <button
                                onClick={() => setIsFirstAccess(!isFirstAccess)}
                                className="w-full text-center py-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
                            >
                                {isFirstAccess ? 'Já possuo uma senha' : 'É seu primeiro acesso?'}
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-400 font-medium">
                                © {new Date().getFullYear()} {process.tenantId || 'AxonRH'}. Todos os direitos reservados.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm transition-all duration-300">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {tenantTheme?.logoUrl ? (
                            <img
                                src={getPhotoUrl(tenantTheme.logoUrl, undefined, 'logo') || ''}
                                alt="Logo"
                                className="h-8 w-auto object-contain"
                                style={{ maxWidth: `120px` }}
                            />
                        ) : (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                                    style={{ background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)` }}
                                >
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-lg font-bold tracking-tight text-gray-900">
                                    Axon<span style={{ color: primaryColor }}>RH</span>
                                </span>
                            </div>
                        )}
                        <div className="h-4 w-px bg-gray-200 mx-2" />
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 leading-tight">Contratação Digital</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                                {process.department?.name} &bull; {process.position?.title}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowChat(!showChat)}
                            className="flex items-center gap-2 rounded-xl border-gray-200 hover:bg-gray-50 transition-all font-semibold text-xs"
                        >
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            Assistente IA
                        </Button>
                        <Badge variant="secondary" className="hidden sm:flex bg-blue-50 text-blue-700 border-blue-100 rounded-lg py-1">
                            {process.candidateName}
                        </Badge>
                    </div>
                </div>
            </header>

            {/* Stepper */}
            <div className="bg-white border-b border-gray-200 py-6">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${step.status === 'completed' ? 'bg-green-500 text-white shadow-green-200' : step.status === 'current' ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                                        style={step.status === 'current' ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}40` } : {}}>
                                        {step.status === 'completed' ? <Check className="w-5 h-5" /> : step.icon}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] sm:text-xs mt-2 text-center uppercase tracking-wider font-bold transition-colors duration-300",
                                        step.status === 'current' ? "text-gray-900" : "text-gray-400"
                                    )} style={step.status === 'current' ? { color: primaryColor } : {}}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-3 ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Alerts Bar */}
            {aiAlerts.filter(a => !a.resolved).length > 0 && (
                <div className="max-w-5xl mx-auto px-4 mt-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-800">Observações da IA</span>
                        </div>
                        <div className="space-y-1">
                            {aiAlerts.filter(a => !a.resolved).map((alert, idx) => (
                                <div key={alert.id || idx} className="flex items-start gap-2 text-sm">
                                    {alert.type === 'ERROR' ? <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> :
                                        alert.type === 'WARNING' ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" /> :
                                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                                    <span className="text-gray-700">{alert.message}</span>
                                    {alert.suggestion && <span className="text-gray-500 italic"> — {alert.suggestion}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* ==================== STEP 1: Personal Data ==================== */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="w-5 h-5" /> Dados Pessoais
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                        <Input value={personalData.fullName} onChange={(e) => setPersonalData(prev => ({ ...prev, fullName: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                                        <Input value={personalData.cpf} onChange={(e) => setPersonalData(prev => ({ ...prev, cpf: e.target.value }))} placeholder="000.000.000-00" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                                        <Input value={personalData.rg || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, rg: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Órgão Emissor</label>
                                        <Input value={personalData.rgOrgaoEmissor || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, rgOrgaoEmissor: e.target.value }))} placeholder="SSP/SP" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento *</label>
                                        <Input type="date" value={personalData.birthDate || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, birthDate: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                                        <select value={personalData.gender || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, gender: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">Selecione</option>
                                            <option value="MALE">Masculino</option>
                                            <option value="FEMALE">Feminino</option>
                                            <option value="OTHER">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                                        <select value={personalData.maritalStatus || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, maritalStatus: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">Selecione</option>
                                            <option value="SINGLE">Solteiro(a)</option>
                                            <option value="MARRIED">Casado(a)</option>
                                            <option value="DIVORCED">Divorciado(a)</option>
                                            <option value="WIDOWED">Viúvo(a)</option>
                                            <option value="SEPARATED">Separado(a)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                                        <Input value={personalData.phone || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, phone: e.target.value }))} placeholder="(00) 00000-0000" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                                        <Input value={personalData.email || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, email: e.target.value }))} />
                                    </div>
                                </div>

                                {/* Address */}
                                <hr />
                                <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                                        <div className="relative">
                                            <Input value={personalData.cep || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, cep: e.target.value }))} onBlur={handleCepBlur} placeholder="00000-000" />
                                            {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-600" />}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro *</label>
                                        <Input value={personalData.logradouro || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, logradouro: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                                        <Input value={personalData.numero || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, numero: e.target.value }))} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                                        <Input value={personalData.complemento || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, complemento: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                                        <Input value={personalData.bairro || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, bairro: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                                        <Input value={personalData.cidade || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, cidade: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                                        <select value={personalData.estado || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, estado: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">Selecione</option>
                                            {ufOptions.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Bank Info */}
                                <hr />
                                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Dados Bancários</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                                        <Input value={personalData.bankName || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, bankName: e.target.value }))} placeholder="Nome do banco" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                                        <Input value={personalData.bankAgency || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, bankAgency: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
                                        <Input value={personalData.bankAccount || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, bankAccount: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                                        <select value={personalData.bankAccountType || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, bankAccountType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">Selecione</option>
                                            <option value="CORRENTE">Corrente</option>
                                            <option value="POUPANCA">Poupança</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
                                        <Input value={personalData.bankPix || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, bankPix: e.target.value }))} placeholder="CPF, e-mail, celular ou chave aleatória" />
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <hr />
                                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2"><Phone className="w-5 h-5" /> Contato de Emergência</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                        <Input value={personalData.emergencyName || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, emergencyName: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                        <Input value={personalData.emergencyPhone || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, emergencyPhone: e.target.value }))} placeholder="(00) 00000-0000" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                                        <Input value={personalData.emergencyRelationship || ''} onChange={(e) => setPersonalData(prev => ({ ...prev, emergencyRelationship: e.target.value }))} placeholder="Ex: Mãe, Pai, Cônjuge" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ==================== STEP 2: Documents ==================== */}
                {currentStep === 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" /> Envio de Documentos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 mb-6">Envie os documentos solicitados. Os campos marcados com * são obrigatórios. A IA fará validação automática via OCR.</p>
                            <div className="space-y-3">
                                {documentRequirements.map((doc) => {
                                    const docState = documents[doc.type];
                                    const isUploaded = docState && docState.status !== 'ERROR';
                                    const isValid = docState?.status === 'VALID';
                                    const isPending = docState?.status === 'PENDING' || docState?.status === 'UPLOADING';

                                    return (
                                        <div key={doc.type} className={`border rounded-lg p-4 ${isValid ? 'border-green-300 bg-green-50' : isUploaded ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${isValid ? 'bg-green-100' : isUploaded ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                                                        {isValid ? <Check className="w-5 h-5 text-green-600" /> : isPending ? <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" /> : <FileText className="w-5 h-5 text-gray-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{doc.label} {doc.required && <span className="text-red-500">*</span>}</p>
                                                        <p className="text-xs text-gray-500">{doc.description}</p>
                                                        {docState?.message && <p className="text-xs text-amber-600 mt-1">{docState.message}</p>}
                                                    </div>
                                                </div>
                                                <label className="cursor-pointer">
                                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocumentUpload(doc.type, file); }} />
                                                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isUploaded ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-[var(--color-primary,#1976D2)] text-white hover:opacity-90'}`}>
                                                        <Upload className="w-4 h-4" />
                                                        {isUploaded ? 'Substituir' : 'Enviar'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ==================== STEP 3: Work Data ==================== */}
                {currentStep === 3 && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="w-5 h-5" /> Dados Trabalhistas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">PIS/PASEP</label>
                                        <Input value={workData.pis || ''} onChange={(e) => setWorkData(prev => ({ ...prev, pis: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº Carteira de Trabalho</label>
                                        <Input value={workData.ctpsNumero || ''} onChange={(e) => setWorkData(prev => ({ ...prev, ctpsNumero: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Série CTPS</label>
                                        <Input value={workData.ctpsSerie || ''} onChange={(e) => setWorkData(prev => ({ ...prev, ctpsSerie: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">UF CTPS</label>
                                        <select value={workData.ctpsUf || ''} onChange={(e) => setWorkData(prev => ({ ...prev, ctpsUf: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option value="">Selecione</option>
                                            {ufOptions.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Dependents */}
                                <hr />
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2"><Heart className="w-5 h-5" /> Dependentes</h3>
                                    <Button variant="outline" size="sm" onClick={addDependent}>+ Adicionar</Button>
                                </div>
                                {(workData.dependents || []).length === 0 ? (
                                    <p className="text-sm text-gray-500">Nenhum dependente cadastrado.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {(workData.dependents || []).map((dep, idx) => (
                                            <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                                                <button onClick={() => removeDependent(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                                                        <Input value={dep.fullName} onChange={(e) => updateDependent(idx, 'fullName', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Nascimento</label>
                                                        <Input type="date" value={dep.birthDate || ''} onChange={(e) => updateDependent(idx, 'birthDate', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Parentesco</label>
                                                        <select value={dep.relationship} onChange={(e) => updateDependent(idx, 'relationship', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                                            <option value="">Selecione</option>
                                                            <option value="FILHO">Filho(a)</option>
                                                            <option value="CONJUGE">Cônjuge</option>
                                                            <option value="COMPANHEIRO">Companheiro(a)</option>
                                                            <option value="PAI">Pai</option>
                                                            <option value="MAE">Mãe</option>
                                                            <option value="OUTRO">Outro</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Benefits */}
                                <hr />
                                <h3 className="text-lg font-medium text-gray-900">Opção de Benefícios</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { key: 'transportVoucher', label: 'Vale Transporte' },
                                        { key: 'mealVoucher', label: 'Vale Refeição/Alimentação' },
                                        { key: 'healthInsurance', label: 'Plano de Saúde' },
                                        { key: 'dentalInsurance', label: 'Plano Odontológico' },
                                    ].map(benefit => (
                                        <label key={benefit.key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={workData[benefit.key as keyof DigitalHiringWorkData] as boolean || false}
                                                onChange={(e) => setWorkData(prev => ({ ...prev, [benefit.key]: e.target.checked }))}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-gray-700">{benefit.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ==================== STEP 4: Contract & Signature ==================== */}
                {currentStep === 4 && (
                    <div className="space-y-6">
                        {/* Contract */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PenTool className="w-5 h-5" /> Contrato de Trabalho</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-80 overflow-y-auto mb-4 text-sm">
                                    {contractHtml ? <div dangerouslySetInnerHTML={{ __html: contractHtml }} /> : <p className="text-gray-500 text-center py-8">Carregando contrato...</p>}
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg">
                                    <input type="checkbox" checked={contractAccepted} onChange={(e) => setContractAccepted(e.target.checked)} className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Li e aceito os termos do contrato de trabalho.</span>
                                </label>
                            </CardContent>
                        </Card>

                        {/* Confidentiality */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Termo de Confidencialidade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-60 overflow-y-auto mb-4 text-sm">
                                    {confidentialityHtml ? <div dangerouslySetInnerHTML={{ __html: confidentialityHtml }} /> : <p className="text-gray-500 text-center py-4">Termo de confidencialidade padrão da empresa.</p>}
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg">
                                    <input type="checkbox" checked={confidentialityAccepted} onChange={(e) => setConfidentialityAccepted(e.target.checked)} className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Li e aceito o termo de confidencialidade.</span>
                                </label>
                            </CardContent>
                        </Card>

                        {/* Internal Policy */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Política Interna</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-white border border-gray-200 rounded-lg p-6 max-h-60 overflow-y-auto mb-4 text-sm">
                                    {policyHtml ? <div dangerouslySetInnerHTML={{ __html: policyHtml }} /> : <p className="text-gray-500 text-center py-4">Política interna da empresa.</p>}
                                </div>
                                <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg">
                                    <input type="checkbox" checked={policyAccepted} onChange={(e) => setPolicyAccepted(e.target.checked)} className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700">Li e aceito a política interna da empresa.</span>
                                </label>
                            </CardContent>
                        </Card>

                        {/* Digital Signature Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Assinatura Eletrônica:</strong> Ao clicar em &ldquo;Assinar Documentos&rdquo;, sua assinatura será registrada com log de IP, data, hora e user agent do seu navegador, conforme legislação vigente.
                            </p>
                        </div>
                    </div>
                )}

                {/* ==================== STEP 5: Completion ==================== */}
                {currentStep === 5 && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Parabéns, {personalData.fullName}!</h2>
                            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                                Seu processo de contratação foi concluído com sucesso. Todos os seus dados e documentos foram recebidos e seu contrato foi assinado digitalmente.
                            </p>
                            <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
                                <p className="text-sm text-green-800">
                                    <strong>Próximos passos:</strong><br />
                                    &bull; O RH finalizará a validação dos seus documentos<br />
                                    &bull; Seu cadastro será criado no sistema da empresa<br />
                                    &bull; Você receberá um e-mail com as instruções para o primeiro dia<br />
                                    &bull; Traga seus documentos originais no primeiro dia
                                </p>
                            </div>
                            {process.aiConsistencyScore !== undefined && (
                                <div className="mt-4">
                                    <Badge className="bg-blue-100 text-blue-800 shadow-none">
                                        <Sparkles className="w-3 h-3 mr-1" /> Score de consistência: {process.aiConsistencyScore}%
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Navigation Buttons */}
                {currentStep >= 1 && currentStep < 5 && (
                    <div className="flex justify-between mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
                            disabled={submitting || currentStep === 1}
                            className="flex items-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" /> Voltar
                        </Button>
                        <Button
                            onClick={
                                currentStep === 1 ? handleSavePersonalData :
                                    currentStep === 2 ? handleValidateDocuments :
                                        currentStep === 3 ? handleSaveWorkData :
                                            currentStep === 4 ? handleSignContract : undefined
                            }
                            disabled={submitting}
                            className="flex items-center gap-2"
                        >
                            {submitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                            ) : currentStep === 4 ? (
                                <><PenTool className="w-5 h-5" /> Assinar Documentos</>
                            ) : (
                                <>Próximo <ChevronRight className="w-5 h-5" /></>
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* AI Chat Floating Panel */}
            {showChat && (
                <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50" style={{ height: '480px' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[var(--color-primary,#1976D2)] text-white rounded-t-xl">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-medium">Assistente IA</span>
                        </div>
                        <button onClick={() => setShowChat(false)} className="hover:opacity-80"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 && (
                            <div className="text-center text-gray-400 mt-8">
                                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Pergunte qualquer dúvida sobre o processo!</p>
                                <div className="mt-4 space-y-2">
                                    {['Como preencher o PIS?', 'Preciso enviar frente e verso?', 'O que é certificado de reservista?'].map(q => (
                                        <button key={q} onClick={() => { setChatInput(q); }} className="block w-full text-left text-xs bg-gray-50 hover:bg-gray-100 p-2 rounded-lg text-gray-600 transition-colors">
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-[var(--color-primary,#1976D2)] text-white' : 'bg-gray-100 text-gray-800'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                        <div className="flex gap-2">
                            <Input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                placeholder="Digite sua dúvida..."
                                className="flex-1"
                            />
                            <Button size="icon" onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
