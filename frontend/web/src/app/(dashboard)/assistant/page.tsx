'use client';

import { useState, useEffect } from 'react';
import ChatWidget from '@/components/ai/ChatWidget';
import { useSearchParams } from 'next/navigation';
import { chatApi, Conversation } from '@/lib/api/ai';
import { ChatIcons } from '@/components/ai/ChatIcons';
import { cn } from '@/lib/utils';

export default function AssistantPage() {
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q');
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();

  const handleConversationSelect = (id: string) => {
    setActiveConversationId(id);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] relative overflow-hidden">
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-primary/10 blur-[100px] rounded-full animate-pulse [animation-delay:1s]"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12 py-10 h-screen flex flex-col">
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Inteligência <span className="text-primary">Artificial</span></h1>
              <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">v2.5</span>
            </div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em] mt-2 ml-1">
              AxonRH Advanced Neural Assistant
            </p>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Status do Core</p>
              <div className="flex items-center justify-end gap-2 mt-1">
                <div className="w-2 h-2 bg-success rounded-full animate-ping"></div>
                <span className="text-[10px] font-bold text-success uppercase tracking-widest">Otimizado</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-gray-100"></div>
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 min-h-0">
          <div className="lg:col-span-9 flex flex-col min-h-0">
            <ChatWidget
              className="flex-1 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]"
              initialMessage={initialQuery || undefined}
              conversationId={activeConversationId}
            />
          </div>

          <div className="lg:col-span-3 flex flex-col gap-8">
            <RecentConversations
              onSelectConversation={handleConversationSelect}
              activeConversationId={activeConversationId}
            />

            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 cursor-help shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <ChatIcons.Sparkles className="w-24 h-24" />
              </div>
              <h4 className="text-xl font-black mb-4 tracking-tight relative z-10">Dica Pro</h4>
              <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6 block relative z-10">
                Você pode pedir para a AxonIA calcular rescisões, simular férias ou até listar funcionários por departamento de forma instantânea.
              </p>
              <div className="w-12 h-1 px-4 bg-primary rounded-full mb-2"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">IA Capacitada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecentConversationsProps {
  onSelectConversation: (id: string) => void;
  activeConversationId?: string;
}

function RecentConversations({ onSelectConversation, activeConversationId }: RecentConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatApi.listConversations(0, 10);
      setConversations(response.data.content || []);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError('Não foi possível carregar as conversas');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const getConversationTitle = (conv: Conversation) => {
    if (conv.title) return conv.title;
    // Tenta pegar a primeira mensagem do usuário como título
    const firstUserMessage = conv.messages?.find(m => m.role === 'user');
    if (firstUserMessage) {
      return firstUserMessage.content.length > 40
        ? firstUserMessage.content.substring(0, 40) + '...'
        : firstUserMessage.content;
    }
    return 'Nova conversa';
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 overflow-hidden flex flex-col">
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Histórico</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Sessões Recentes</p>
          </div>
          <button
            onClick={loadConversations}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900"
            title="Atualizar"
          >
            <ChatIcons.History className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-[350px] overflow-y-auto no-scrollbar">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2"></div>
                  <div className="h-2 bg-gray-50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ChatIcons.X className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{error}</p>
            <button
              onClick={loadConversations}
              className="mt-2 text-xs font-black text-primary hover:text-primary-700 uppercase tracking-widest"
            >
              Tentar novamente
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-[1.5rem] flex items-center justify-center border border-gray-100/50">
              <ChatIcons.MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-900">Vazio por aqui</p>
            <p className="text-xs text-gray-400 mt-1 font-medium italic">Inicie uma nova conversa com a AxonIA</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${activeConversationId === conv.id
                  ? 'bg-primary/5 ring-1 ring-primary/20 border-primary-100 shadow-sm'
                  : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                  }`}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xs shadow-sm transition-transform group-hover:scale-110",
                  activeConversationId === conv.id ? "bg-primary text-white" : "bg-white border border-gray-100 text-gray-400"
                )}>
                  <ChatIcons.MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-bold truncate transition-colors",
                    activeConversationId === conv.id ? "text-primary-900" : "text-gray-700 group-hover:text-primary"
                  )}>
                    {getConversationTitle(conv)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {formatDate(conv.updatedAt || conv.createdAt)}
                  </p>
                </div>
                <ChatIcons.ChevronRight className={cn(
                  "w-4 h-4 transition-all",
                  activeConversationId === conv.id ? "text-primary translate-x-0" : "text-gray-200 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary"
                )} />
              </button>
            ))}
          </div>
        )}
      </div>

      {conversations.length > 0 && (
        <div className="p-4 border-t border-gray-100/50 bg-gray-50/50">
          <button
            onClick={async () => {
              if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
                try {
                  await chatApi.deleteAllConversations();
                  setConversations([]);
                } catch (error) {
                  console.error('Failed to delete history', error);
                }
              }
            }}
            className="w-full py-3 text-[10px] font-black text-gray-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
          >
            Limpar Histórico Completo
          </button>
        </div>
      )}
    </div>
  );
}
