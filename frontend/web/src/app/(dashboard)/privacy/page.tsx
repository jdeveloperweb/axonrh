'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Shield, 
    Lock, 
    Eye, 
    FileEdit, 
    Save, 
    X, 
    Video, 
    Image as ImageIcon, 
    Type, 
    HelpCircle, 
    Mail, 
    Info 
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { privacyApi, type PrivacyPolicy } from '@/lib/api/privacy';
import { toast } from 'sonner';

// Função utilitária básica para converter Markdown para HTML simples
// Em um ambiente real, usaríamos react-markdown
const simpleMarkdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    
    let html = markdown
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4 border-b pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-black mt-10 mb-6">$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" class="rounded-xl my-6 shadow-md max-w-full" />')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>')
        .replace(/\n\n/gim, '<br/><br/>')
        .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-2">• $1</li>');

    // Suporte básico para vídeos do Youtube via Markdown estendido ou URL direta
    html = html.replace(/\[video\]\((.*?)\)/gim, (match, url) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = url.split('v=')[1] || url.split('/').pop();
            return `<div class="aspect-video my-6 rounded-xl overflow-hidden shadow-lg">
                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
            </div>`;
        }
        return `<video src="${url}" controls class="w-full rounded-xl my-6 shadow-lg"></video>`;
    });

    return html;
};

const DEFAULT_PRIVACY_CONTENT = `# Política de Privacidade da Empresa

## 1. Introdução
Esta política descreve como tratamos seus dados pessoais no **AxonRH**.

## 2. Coleta de Dados
Coletamos dados necessários para a gestão de recursos humanos, incluindo:
- Informações Cadastrais
- Dados de Contato
- Informações de Desempenho

## 3. Uso de Vídeos e Imagens
Abaixo um exemplo de como você pode incluir recursos visuais:

![Logotipo da Empresa](https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=800)

[video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

## 4. Seus Direitos
Em conformidade com a **LGPD**, você tem direito ao acesso, correção e exclusão de seus dados.`;

export default function PrivacyPage() {
    const { hasPermission } = usePermissions();
    const canEdit = hasPermission('SETTINGS:PRIVACY_WRITE');
    
    const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchPolicy();
    }, []);

    const fetchPolicy = async () => {
        try {
            setIsLoading(true);
            const data = await privacyApi.get();
            if (data && data.content) {
                setPolicy(data);
                setEditContent(data.content);
            } else {
                // Se não houver política, usa o padrão
                setEditContent(DEFAULT_PRIVACY_CONTENT);
            }
        } catch (error) {
            console.error('Erro ao buscar política:', error);
            setEditContent(DEFAULT_PRIVACY_CONTENT);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const updated = await privacyApi.save(editContent);
            setPolicy(updated);
            setIsEditing(false);
            toast.success('Política de privacidade atualizada com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar política de privacidade.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-[var(--color-primary)]" />
                        Privacidade e Proteção de Dados
                    </h1>
                    <p className="text-gray-500 max-w-2xl">
                        Informações sobre como a empresa trata e protege seus dados pessoais.
                    </p>
                </div>
                
                {canEdit && !isEditing && (
                    <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-[var(--color-primary)] hover:opacity-90 flex items-center gap-2"
                    >
                        <FileEdit className="w-4 h-4" />
                        Editar Política
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card className="border-none shadow-xl bg-white overflow-hidden ring-1 ring-black/5">
                    <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between py-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Type className="w-5 h-5 text-slate-500" />
                            Editor de Política (Markdown)
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsEditing(false)}
                                className="text-gray-500"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isSaving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                Salvar Alterações
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 h-[600px]">
                            {/* Editor */}
                            <div className="p-4 border-r bg-slate-50/30">
                                <div className="flex items-center gap-4 mb-3 text-xs text-slate-400 font-medium">
                                    <span className="flex items-center gap-1"><Type className="w-3 h-3" /> # H1</span>
                                    <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> ![alt](url)</span>
                                    <span className="flex items-center gap-1"><Video className="w-3 h-3" /> [video](url)</span>
                                </div>
                                <textarea
                                    className="w-full h-[calc(100%-30px)] p-4 bg-white border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    placeholder="Escreva a política de privacidade em Markdown..."
                                />
                            </div>
                            
                            {/* Preview */}
                            <div className="p-8 overflow-y-auto bg-white">
                                <div className="text-xs text-slate-400 font-medium mb-4 uppercase tracking-wider">Visualização em Tempo Real</div>
                                <div 
                                    className="prose prose-slate max-w-none"
                                    dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(editContent) }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-none shadow-sm bg-white min-h-[500px]">
                    <CardContent className="p-10">
                        <div 
                            className="prose prose-slate max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-800"
                            dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(editContent || policy?.content || DEFAULT_PRIVACY_CONTENT) }}
                        />
                    </CardContent>
                </Card>
            )}

            {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Eye className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-blue-900">Transparência</h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Dados utilizados exclusivamente para fins de gestão de recursos humanos e obrigações legais.
                        </p>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h4 className="font-bold text-emerald-900">Segurança</h4>
                        <p className="text-xs text-emerald-700 leading-relaxed">
                            Criptografia de ponta a ponta e controle rigoroso de acesso aos seus registros.
                        </p>
                    </div>

                    <div className="bg-orange-50 p-6 rounded-2xl flex flex-col items-center text-center space-y-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <Mail className="w-6 h-6 text-orange-600" />
                        </div>
                        <h4 className="font-bold text-orange-900">Contato</h4>
                        <p className="text-xs text-orange-700 leading-relaxed">
                            Dúvidas ou solicitações? Entre em contato com o RH da sua unidade.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
