'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { chatApi, ChatMessage, ConversationContext, Conversation } from '@/lib/api/ai';
import { ChatIcons } from './ChatIcons';
import { ActionConfirmation } from './ActionConfirmation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ChatWidgetProps {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
  className?: string;
  initialMessage?: string;
  onClose?: () => void;
  context?: ConversationContext;
}

export default function ChatWidget({
  conversationId: initialConversationId,
  className = '',
  initialMessage,
  onClose,
  context,
}: ChatWidgetProps) {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

  const loadHistory = useCallback(async () => {
    try {
      const response = await chatApi.listConversations();
      if (response && response.data && response.data.content) {
        setConversations(response.data.content);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await chatApi.getConversation(id);
      if (response && response.data && response.data.messages) {
        setMessages(response.data.messages.filter((m: ChatMessage) => m.role !== 'system'));
        setConversationId(id);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setShowHistory(false);
    setInput('');
  }, []);

  const deleteChat = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;
    try {
      await chatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) {
        createNewChat();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [conversationId, createNewChat]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const submitMessage = useCallback(async (msgContent: string) => {
    if (!msgContent.trim() || isLoading) return;

    let currentConvId = conversationId;

    // Se não houver conversa ativa, criar uma
    if (!currentConvId) {
      try {
        const convResponse = await chatApi.createConversation(context);
        if (convResponse.data && convResponse.data.id) {
          currentConvId = convResponse.data.id;
          setConversationId(currentConvId);
          loadHistory(); // Atualiza a lista de histórico
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
      }
    }


    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msgContent.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      let fullContent = '';

      for await (const chunk of chatApi.streamChat(userMessage.content, currentConvId)) {
        if (chunk.content) {
          fullContent += chunk.content;
        }

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? {
                ...m,
                content: fullContent,
                type: (chunk.type || m.type) as ChatMessage['type']
              }
              : m
          )
        );
      }

      // Refresh history to update titles/summaries
      loadHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `Desculpe, ocorreu um erro. Detalhes: ${(error instanceof Error ? error.message : String(error))}`, type: 'ERROR' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [conversationId, isLoading, loadHistory, context]);

  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
    loadHistory();
  }, [initialConversationId, loadConversation, loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle initial message
  useEffect(() => {
    if (initialMessage && !initializedRef.current && !isLoading) {
      initializedRef.current = true;
      setInput(initialMessage);
      submitMessage(initialMessage);
    }
  }, [initialMessage, submitMessage, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage(input);
    }
  };

  const suggestions = [
    'Calcular minhas férias',
    'Listar funcionários do departamento de TI',
    'Qual a política de home office?',
    'Simular rescisão sem justa causa',
  ];

  return (
    <div className={cn(
      "flex flex-col h-full bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative",
      className
    )}>
      {/* Sidebar de Histórico - Overlay */}
      <div className={cn(
        "absolute inset-0 z-50 transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        showHistory ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
      )}>
        <div className="flex h-full w-full">
          <div className="w-80 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100/50 shadow-2xl flex flex-col">
            <div className="px-8 py-8 border-b border-gray-100/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Histórico</h3>
                <p className="text-xs text-gray-500 font-medium">Suas conversas anteriores</p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2.5 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 border border-transparent hover:border-gray-200"
              >
                <ChatIcons.X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              <button
                onClick={createNewChat}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-primary hover:bg-primary-700 text-white rounded-2xl transition-all font-bold mb-6 shadow-lg shadow-primary-500/25 active:scale-[0.98] group"
              >
                <ChatIcons.Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                Nova Conversa
              </button>

              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                  <ChatIcons.MessageSquare className="w-12 h-12 mb-3" />
                  <p className="text-sm font-bold tracking-tight">Nenhuma conversa encontrada</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "group flex flex-col p-5 rounded-[1.5rem] cursor-pointer transition-all border relative",
                      conversationId === conv.id
                        ? "bg-primary-50/50 border-primary-200 shadow-sm ring-1 ring-primary-100"
                        : "bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">
                        {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <button
                        onClick={(e) => deleteChat(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                      >
                        <ChatIcons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className={cn(
                      "text-sm font-bold truncate pr-4",
                      conversationId === conv.id ? "text-primary-900" : "text-gray-700 font-semibold"
                    )}>
                      {conv.title || 'Nova Conversa'}
                    </h4>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
                    chatApi.deleteAllConversations().then(() => {
                      setConversations([]);
                      createNewChat();
                    });
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
              >
                <ChatIcons.Trash className="w-4 h-4" />
                Limpar todo histórico
              </button>
            </div>
          </div>
          <div
            className="flex-1 bg-black/5 cursor-pointer"
            onClick={() => setShowHistory(false)}
          />
        </div>
      </div>

      {/* Header - Modern & Floating */}
      <div className="relative px-8 py-6 bg-gradient-to-r from-primary via-primary to-primary-dark">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-5">
            <button
              onClick={() => setShowHistory(true)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-[1.25rem] transition-all text-white/90 hover:text-white border border-white/20 backdrop-blur-md active:scale-95 group"
              title="Histórico"
            >
              <ChatIcons.History className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>
            <div className="relative group">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-2xl transition-transform group-hover:scale-105 duration-300">
                <ChatIcons.Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success border-4 border-primary rounded-full animate-pulse shadow-lg ring-2 ring-white/10"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-black tracking-tight text-2xl uppercase">AxonIA</h3>
                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-[10px] text-white font-black uppercase tracking-widest border border-white/20">PRO</span>
              </div>
              <div className="flex items-center space-x-2 mt-1 px-2 py-0.5 bg-black/10 rounded-full w-fit border border-white/10">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                <p className="text-white text-[10px] font-bold uppercase tracking-wider opacity-90">IA Generativa Ativa</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isStreaming && (
              <div className="flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl transition-all">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                </div>
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando</span>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-[1.25rem] transition-all text-white/90 hover:text-white border border-white/20 backdrop-blur-md active:scale-95"
              >
                <ChatIcons.X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-10 space-y-10 scroll-smooth bg-gradient-to-b from-gray-50/50 to-white no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-12">
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse"></div>
              <div className="relative w-32 h-32 bg-gradient-to-br from-primary to-primary-700 rounded-[2.5rem] flex items-center justify-center border-4 border-white shadow-[0_25px_60px_-15px_rgba(var(--color-primary-rgb),0.5)] group transition-all hover:scale-110 duration-700 cursor-default">
                <ChatIcons.Sparkles className="w-16 h-16 text-white animate-pulse group-hover:rotate-12 transition-transform" />
              </div>
            </div>

            <h4 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter leading-tight">
              Olá, eu sou a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-700">AxonIA</span>
            </h4>
            <p className="text-gray-500 max-w-md mx-auto mb-12 text-lg font-medium leading-relaxed opacity-80">
              Sua inteligência artificial integrada para RH. Como posso facilitar seu dia hoje?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="group flex flex-col items-start p-6 text-sm bg-white hover:bg-primary rounded-[2rem] border border-gray-100 hover:border-primary transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(var(--color-primary-rgb),0.15)] hover:-translate-y-1 active:scale-95 text-left"
                >
                  <div className="w-10 h-10 bg-gray-50 group-hover:bg-white/20 rounded-xl mb-4 flex items-center justify-center transition-colors">
                    {index === 0 && <ChatIcons.Calculator className="w-5 h-5 text-primary group-hover:text-white" />}
                    {index === 1 && <ChatIcons.BookOpen className="w-5 h-5 text-primary group-hover:text-white" />}
                    {index === 2 && <ChatIcons.MessageSquare className="w-5 h-5 text-primary group-hover:text-white" />}
                    {index === 3 && <ChatIcons.Sparkles className="w-5 h-5 text-primary group-hover:text-white" />}
                  </div>
                  <span className="font-black text-gray-900 group-hover:text-white transition-colors text-base tracking-tight mb-1">{suggestion}</span>
                  <p className="text-xs text-gray-400 group-hover:text-white/80 transition-colors font-medium">Clique para iniciar esta tarefa</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onActionConfirm={() => submitMessage("Sim, pode confirmar.")}
            onActionCancel={() => setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: 'Entendido. A ação foi cancelada.',
              timestamp: new Date().toISOString()
            }])}
          />
        ))}

        {isLoading && !isStreaming && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white border border-gray-100/50 rounded-[2rem] rounded-tl-none px-8 py-5 shadow-xl">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce [animation-duration:1s]"></div>
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.2s] [animation-duration:1s]"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.4s] [animation-duration:1s]"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Section - Super Clean & Modern */}
      <div className="p-8 bg-white border-t border-gray-100/50">
        {messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => submitMessage(suggestion)}
                className="whitespace-nowrap px-6 py-2.5 text-xs font-black bg-gray-50 text-gray-600 border border-gray-100 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm active:scale-95 uppercase tracking-wider"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative group flex items-center gap-4">
          <div className="relative flex-1 group">
            <div className="absolute inset-0 bg-primary/5 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700"></div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem ou pedido..."
              disabled={isLoading}
              rows={1}
              className="relative w-full resize-none rounded-[2rem] border-2 border-gray-100 bg-white px-8 py-5 pr-16 text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-bold focus:outline-none focus:ring-0 focus:border-primary transition-all shadow-sm group-hover:shadow-xl group-hover:border-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-lg"
            />
            <button
              type="button"
              className="absolute right-6 top-1/2 -translate-y-1/2 p-2.5 text-gray-400 hover:text-primary transition-all hover:scale-110"
              title="Voz"
            >
              <ChatIcons.Mic className="w-6 h-6" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-6 bg-primary text-white rounded-[2rem] hover:bg-primary-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all active:scale-90 shadow-2xl shadow-primary/20 flex-shrink-0 group"
          >
            {isLoading ? (
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <ChatIcons.Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-4">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-success/5 rounded-full border border-success/10">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-[10px] text-success font-black uppercase tracking-[0.2em]">Neural Network Online</span>
          </div>
          <p className="text-[10px] text-gray-300 font-bold tracking-[0.15em] uppercase">AxonRH Intelligence <span className="text-primary/40">Enterprise v2.0</span></p>
        </div>
      </div>

    </div>
  );
}

function MessageBubble({
  message,
  onActionConfirm,
  onActionCancel
}: {
  message: ChatMessage;
  onActionConfirm: () => void;
  onActionCancel: () => void;
}) {
  const isUser = message.role === 'user';
  const isError = message.type === 'ERROR';
  const isActionConfirmation = message.type === 'ACTION_CONFIRMATION';

  return (
    <div className={cn(
      "flex w-full animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out",
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        "flex max-w-[85%] space-x-5 px-2",
        isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
      )}>
        {/* Avatar - More Stylized */}
        <div className={cn(
          "flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-sm shadow-xl transition-transform hover:scale-110 cursor-default",
          isUser
            ? 'bg-gradient-to-br from-primary to-primary-700 text-white border-2 border-white'
            : 'bg-white border-2 border-gray-100 text-primary'
        )}>
          {isUser ? <ChatIcons.User className="w-5 h-5" /> : <ChatIcons.Bot className="w-6 h-6" />}
        </div>

        {/* Bubble - More Modern Shapes */}
        <div className={cn(
          "flex flex-col space-y-2",
          isUser ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "rounded-[2rem] px-8 py-5 shadow-2xl relative transition-all hover:shadow-primary/5 group",
            isUser
              ? 'bg-gradient-to-br from-primary to-primary-700 text-white rounded-tr-none'
              : isError
                ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-none'
                : isActionConfirmation
                  ? 'bg-primary-50/30 border border-primary-200/50 rounded-tl-none !p-0 overflow-hidden backdrop-blur-sm'
                  : 'bg-white border-b-4 border-gray-100/50 text-gray-800 rounded-tl-none ring-1 ring-black/5'
          )}>
            {isActionConfirmation ? (
              <ActionConfirmation
                content={message.content}
                onConfirm={onActionConfirm}
                onCancel={onActionCancel}
              />
            ) : message.type === 'CALCULATION' || message.type === 'QUERY_RESULT' || !isUser ? (
              <div className="prose prose-sm max-w-none prose-slate prose-p:font-medium prose-headings:font-black prose-headings:text-primary-900 prose-strong:text-primary-800">
                <MarkdownContent content={message.content} />
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-bold tracking-tight">{message.content}</p>
            )}

            {/* Timestamp hover indicator */}
            <div className={cn(
              "absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-max",
              isUser ? "right-0" : "left-0"
            )}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Processa texto inline com negrito **texto**
function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Texto antes do negrito
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Texto em negrito
    parts.push(
      <strong key={match.index} className="font-semibold text-gray-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // Texto restante após o último match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Formata valores de célula: detecta datas ISO e converte para dd/MM/yyyy
function formatCellValue(value: string): string {
  const trimmed = value.trim();

  // Detecta formato de data ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})(T.*)?$/;
  const match = trimmed.match(isoDateRegex);

  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}

// Exporta tabela para XLSX
function exportTableToXLSX(tableData: string[][]) {
  if (tableData.length === 0) return;

  // Usa tab-separated format que pode ser aberto no Excel
  const csvContent = tableData.map(row =>
    row.map(cell => {
      const formatted = formatCellValue(cell);
      // Escape quotes and wrap in quotes if contains comma/tab/newline
      if (formatted.includes('\t') || formatted.includes('\n') || formatted.includes('"')) {
        return '"' + formatted.replace(/"/g, '""') + '"';
      }
      return formatted;
    }).join('\t')
  ).join('\n');

  // Create Blob with BOM for Excel to recognize UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dados_${new Date().toISOString().split('T')[0]}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Exporta tabela para CSV
function exportTableToCSV(tableData: string[][]) {
  if (tableData.length === 0) return;

  const csvContent = tableData.map(row =>
    row.map(cell => {
      const formatted = formatCellValue(cell);
      // Escape double quotes by doubling them
      if (formatted.includes('"') || formatted.includes(',') || formatted.includes('\n')) {
        return '"' + formatted.replace(/"/g, '""') + '"';
      }
      return formatted;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dados_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Exporta tabela para JSON
function exportTableToJSON(tableData: string[][]) {
  if (tableData.length < 2) return;

  const headers = tableData[0].map(h => h.trim());
  const data = tableData.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = formatCellValue(row[i] || '');
    });
    return obj;
  });

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dados_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function MarkdownContent({ content }: { content: string }) {
  if (!content) return <div className="flex space-x-1 py-1">
    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
  </div>;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTable: string[][] = [];

  const flushTable = (index: number) => {
    if (currentTable.length > 0) {
      const tableDataForExport = [...currentTable];
      elements.push(
        <div key={`table-${index}`} className="my-4">
          <div className="flex justify-end mb-2 gap-2">
            <span className="text-xs font-medium text-gray-500 self-center mr-2">Exportar:</span>
            <button
              onClick={() => exportTableToXLSX(tableDataForExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              title="Exportar para Excel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              XLSX
            </button>
            <button
              onClick={() => exportTableToCSV(tableDataForExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              title="Exportar para CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={() => exportTableToJSON(tableDataForExport)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
              title="Exportar para JSON"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              JSON
            </button>
          </div>
          <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  {currentTable[0].map((cell, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {parseInlineFormatting(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentTable.slice(1).map((row, i) => (
                  <tr key={i} className="hover:bg-primary-50/50 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-sm text-gray-700">
                        {parseInlineFormatting(formatCellValue(cell))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      currentTable = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith('|')) {
      const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
      // Skip separator line (---|---|---)
      if (cells.some(c => c.includes('---'))) {
        return;
      }
      currentTable.push(cells);
      return;
    } else {
      flushTable(index);
    }

    if (line.startsWith('## ')) {
      elements.push(<h3 key={index} className="font-bold text-lg text-primary-900 mt-4 mb-2">{parseInlineFormatting(line.slice(3))}</h3>);
    } else if (line.startsWith('### ')) {
      elements.push(<h4 key={index} className="font-semibold text-primary-800 mt-3 mb-1">{parseInlineFormatting(line.slice(4))}</h4>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={index} className="font-semibold text-gray-900 my-1">{line.slice(2, -2)}</p>);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <div key={index} className="flex items-start space-x-2 ml-2 my-1">
          <span className="text-primary-500 mt-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0"></span>
          <span className="text-sm text-gray-700">{parseInlineFormatting(line.slice(2).trim())}</span>
        </div>
      );
    } else if (trimmed === '') {
      elements.push(<div key={index} className="h-2"></div>);
    } else {
      // Processa negrito inline em linhas normais
      elements.push(<p key={index} className="text-sm text-gray-700 leading-relaxed my-1">{parseInlineFormatting(line)}</p>);
    }
  });

  flushTable(lines.length);

  return <div className="space-y-1">{elements}</div>;
}
