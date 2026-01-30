'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { chatApi, ChatMessage, ConversationContext } from '@/lib/api/ai';
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
  onConversationCreated
}: ChatWidgetProps) {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);
  const lastConversationIdRef = useRef<string | undefined>(initialConversationId);

  // Reset internal state when prop changes
  useEffect(() => {
    setConversationId(initialConversationId);
    if (!initialConversationId) {
      setMessages([]);
      setInput('');
      initializedRef.current = false;
    } else {
      // If switching to an existing conversation, we should probably fetch messages if not already done
      // But the useEffect below handles that.
    }
  }, [initialConversationId]);

  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await chatApi.getConversation(id) as any;
      if (response && response.messages) {
        setMessages(response.messages.filter((m: ChatMessage) => m.role?.toLowerCase() !== 'system'));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const submitMessage = useCallback(async (msgContent: string) => {
    if (!msgContent.trim() || isLoading) return;

    let currentConvId = conversationId;

    // Se não houver conversa ativa, criar uma
    if (!currentConvId) {
      try {
        const convResponse = await chatApi.createConversation(context) as any;
        if (convResponse && convResponse.id) {
          currentConvId = convResponse.id;
          lastConversationIdRef.current = currentConvId; // Evita que o useEffect de carregamento sobrescreva o estado atual
          setConversationId(currentConvId);
          // Notify parent about new conversation
          if (onConversationCreated) {
            onConversationCreated(currentConvId as string);
          }
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return; // Don't proceed if creation failed
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

      // Notify parent to refresh list title/preview if needed
      // Use conversationId or currentConvId (which is definitely set now)
      if (onConversationCreated && currentConvId) {
        onConversationCreated(currentConvId);
      }

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
  }, [conversationId, isLoading, context, onConversationCreated]);

  useEffect(() => {
    if (initialConversationId && initialConversationId !== lastConversationIdRef.current) {
      loadConversation(initialConversationId);
      lastConversationIdRef.current = initialConversationId;
    } else if (!initialConversationId) {
      lastConversationIdRef.current = undefined;
    }
  }, [initialConversationId, loadConversation]);

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
      "flex flex-col h-full bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden relative transition-all duration-300",
      className
    )}>

      {/* Header - Minimal & Clean */}
      <div className="relative px-8 py-5 border-b border-gray-100/50 bg-white/40">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 duration-300 text-white">
                <ChatIcons.Bot className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-white rounded-full animate-pulse shadow-sm"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-gray-900 font-bold tracking-tight text-lg">AxonIA</h3>
                <span className="px-2 py-0.5 bg-primary/10 rounded-md text-[10px] text-primary font-black uppercase tracking-widest border border-primary/10">PRO</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-1 h-1 bg-success rounded-full"></div>
                <p className="text-gray-400 text-xs font-medium">Online e pronta para ajudar</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isStreaming && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce"></div>
                </div>
                <span className="text-primary text-[10px] font-bold uppercase tracking-wider">Digitando</span>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-gray-900"
              >
                <ChatIcons.X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth no-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto pb-10">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center border-4 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] mb-4">
                <ChatIcons.Sparkles className="w-12 h-12 text-primary animate-pulse" />
              </div>
            </div>

            <h4 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              Como posso ajudar hoje?
            </h4>
            <p className="text-gray-500 mb-10 font-medium leading-relaxed">
              Utilize o poder da IA para acelerar suas tarefas de RH.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(suggestion);
                    // Optional: auto submit
                    // submitMessage(suggestion); 
                  }}
                  className="group flex items-center p-4 text-left bg-white hover:bg-primary/5 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-colors text-gray-400 mr-3">
                    {index === 0 && <ChatIcons.Calculator className="w-4 h-4" />}
                    {index === 1 && <ChatIcons.BookOpen className="w-4 h-4" />}
                    {index === 2 && <ChatIcons.MessageSquare className="w-4 h-4" />}
                    {index === 3 && <ChatIcons.Sparkles className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-semibold text-gray-600 group-hover:text-primary-900 transition-colors line-clamp-2">
                    {suggestion}
                  </span>
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
          <div className="flex justify-start animate-fade-in pl-2">
            <div className="bg-white border border-gray-100 px-6 py-4 rounded-3xl rounded-tl-none shadow-sm flex space-x-1.5 items-center">
              <span className="text-xs font-bold text-gray-400 mr-2">Pensando</span>
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s]"></div>
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.2s] [animation-duration:0.8s]"></div>
              <div className="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.4s] [animation-duration:0.8s]"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* Input Section */}
      <div className="p-6 bg-white/60 backdrop-blur-md border-t border-white/60">
        <form onSubmit={handleSubmit} className="relative flex items-end gap-3">
          <div className="relative flex-1 bg-white rounded-[1.5rem] border border-gray-200/60 shadow-sm focus-within:shadow-md focus-within:border-primary/30 transition-all duration-300">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              rows={1}
              className="w-full resize-none bg-transparent px-6 py-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed max-h-32 text-sm font-medium"
              style={{ minHeight: '56px' }}
            />
            <button
              type="button"
              className="absolute right-4 bottom-3 p-1.5 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              <ChatIcons.Mic className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-[56px] w-[56px] bg-gray-900 text-white rounded-[1.5rem] hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 transition-all active:scale-95 shadow-lg flex items-center justify-center group"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <ChatIcons.Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
          </button>
        </form>

        <div className="mt-4 flex justify-center">
          <p className="text-[10px] text-gray-400 font-medium">
            A AxonIA pode cometer erros. Verifique informações importantes.
          </p>
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
  const isUser = message.role?.toLowerCase() === 'user';
  const isError = message.type === 'ERROR';
  const isActionConfirmation = message.type === 'ACTION_CONFIRMATION';

  return (
    <div className={cn(
      "flex w-full animate-fade-in group/bubble",
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        "flex max-w-[85%] gap-4",
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs shadow-sm mt-1",
          isUser
            ? 'bg-gray-900 text-white'
            : 'bg-white border border-gray-100 text-primary'
        )}>
          {isUser ? <ChatIcons.User className="w-4 h-4" /> : <ChatIcons.Bot className="w-5 h-5" />}
        </div>

        {/* Content */}
        <div className={cn(
          "flex flex-col space-y-1",
          isUser ? "items-end" : "items-start"
        )}>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
            {isUser ? 'Você' : message.role?.toLowerCase() === 'system' ? 'Sistema' : 'AxonIA'}
          </span>
          <div className={cn(
            "rounded-2xl px-6 py-4 shadow-sm relative text-sm leading-relaxed",
            isUser
              ? 'bg-gray-900 text-white rounded-tr-none'
              : isError
                ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-none'
                : isActionConfirmation
                  ? 'bg-white border border-primary/20 shadow-lg rounded-tl-none p-0 overflow-hidden'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
          )}>
            {isActionConfirmation ? (
              <ActionConfirmation
                content={message.content}
                onConfirm={onActionConfirm}
                onCancel={onActionCancel}
              />
            ) : message.type === 'CALCULATION' || message.type === 'QUERY_RESULT' || !isUser ? (
              <div className="prose prose-sm max-w-none prose-slate prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                <MarkdownContent content={message.content} />
              </div>
            ) : (
              <p className="whitespace-pre-wrap font-medium">{message.content}</p>
            )}
          </div>

          <span className="text-[10px] text-gray-300 px-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
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
      elements.push(<h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">{parseInlineFormatting(line.replace('## ', ''))}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-semibold text-gray-800 mt-4 mb-2">{parseInlineFormatting(line.replace('### ', ''))}</h3>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={index} className="ml-4 list-disc text-gray-700 mb-1">{parseInlineFormatting(line.replace('- ', ''))}</li>);
    } else if (line.trim() === '') {
      elements.push(<div key={index} className="h-2"></div>);
    } else {
      elements.push(<p key={index} className="mb-2 text-gray-700">{parseInlineFormatting(line)}</p>);
    }
  });

  flushTable(lines.length);

  return <>{elements}</>;
}
