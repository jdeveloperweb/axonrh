'use client';

import { useState, useEffect } from 'react';
import ChatWidget from '@/components/ai/ChatWidget';
import { useSearchParams } from 'next/navigation';
import { chatApi, Conversation } from '@/lib/api/ai';

export default function AssistantPage() {
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q');
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();

  const handleConversationSelect = (id: string) => {
    setActiveConversationId(id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AxonIA
              </h1>
              <p className="text-sm text-gray-500">
                Seu assistente virtual para dúvidas e solicitações
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ChatWidget
              className="h-[calc(100vh-200px)]"
              initialMessage={initialQuery || undefined}
              conversationId={activeConversationId}
            />
          </div>
          <div className="space-y-6">
            <RecentConversations
              onSelectConversation={handleConversationSelect}
              activeConversationId={activeConversationId}
            />
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Conversas Recentes</h3>
          <div className="flex items-center gap-3">
            {conversations.length > 0 && (
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
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Limpar
              </button>
            )}
            <button
              onClick={loadConversations}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={loadConversations}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Tentar novamente
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">Nenhuma conversa ainda</p>
            <p className="text-xs text-gray-400 mt-1">Suas conversas aparecerão aqui</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full flex items-center justify-between p-3 hover:bg-blue-50/50 transition-colors text-left group ${activeConversationId === conv.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {getConversationTitle(conv)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(conv.updatedAt || conv.createdAt)}
                    </p>
                    {conv.metadata?.messageCount && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {conv.metadata.messageCount} mensagens
                      </p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
