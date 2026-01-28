'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { chatApi, ChatMessage } from '@/lib/api/ai';
import { ChatIcons } from './ChatIcons';
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
}

export default function ChatWidget({
  conversationId: initialConversationId,
  className = '',
  initialMessage,
  onClose,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(initialConversationId);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

  const loadConversation = useCallback(async () => {
    try {
      if (!conversationId) return;

      const response = await chatApi.getConversation(conversationId);
      // Access messages from the conversation object directly
      if (response && response.data && response.data.messages) {
        setMessages(response.data.messages.filter((m: ChatMessage) => m.role !== 'system'));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [conversationId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const submitMessage = useCallback(async (msgContent: string) => {
    if (!msgContent.trim() || isLoading) return;

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

      for await (const chunk of chatApi.streamChat(userMessage.content, conversationId)) {
        console.debug('[ChatWidget] Received chunk:', chunk);
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
  }, [conversationId, isLoading]);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId, loadConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle initial message
  useEffect(() => {
    if (initialMessage && !initializedRef.current && !isLoading) {
      initializedRef.current = true;
      setInput(initialMessage);
      // We need to wait a bit for state to settle or call submit directly with the string
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
      "flex flex-col h-full bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden",
      className
    )}>
      {/* Header with Glassmorphism */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-md">
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                <ChatIcons.Bot className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
            </div>
            <div>
              <h3 className="text-white font-bold tracking-tight text-lg">AxonIA</h3>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 bg-blue-200 rounded-full"></span>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-widest">Inteligência Artificial RH</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isStreaming && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-in fade-in slide-in-from-right-4 transition-all">
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                </div>
                <span className="text-white text-[10px] font-bold uppercase tracking-wider">Processando</span>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
              >
                <ChatIcons.X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center border border-blue-100 shadow-sm">
              <ChatIcons.Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">
              Bem-vindo ao AxonRH
            </h4>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">
              Sua plataforma de RH potencializada por IA. Como posso facilitar seu dia hoje?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="group flex items-center justify-between p-4 text-sm bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span className="font-medium text-left">{suggestion}</span>
                  <ChatIcons.ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="p-6 bg-gray-50/50 border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte qualquer coisa sobre o RH..."
            disabled={isLoading}
            rows={1}
            className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-5 py-4 pr-16 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:shadow-md disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-200 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <ChatIcons.Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-center space-x-2">
          <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Powered by OpenAI</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isError = message.type === 'ERROR';

  return (
    <div className={cn(
      "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        "flex max-w-[85%] space-x-3",
        isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'
      )}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-sm",
          isUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-600'
        )}>
          {isUser ? <ChatIcons.User className="w-4 h-4" /> : <ChatIcons.Bot className="w-4 h-4" />}
        </div>

        {/* Bubble */}
        <div className="flex flex-col space-y-1">
          <div className={cn(
            "rounded-2xl px-5 py-3 shadow-sm",
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : isError
                ? 'bg-red-50 text-red-800 border border-red-100 rounded-tl-none'
                : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
          )}>
            {message.type === 'CALCULATION' || message.type === 'QUERY_RESULT' || !isUser ? (
              <div className="prose prose-sm max-w-none prose-slate">
                <MarkdownContent content={message.content} />
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}
          </div>

          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider",
            isUser ? 'text-gray-400 text-right' : 'text-gray-400'
          )}>
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
                    <th key={i} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {parseInlineFormatting(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentTable.slice(1).map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/50 transition-colors">
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
      elements.push(<h3 key={index} className="font-bold text-lg text-blue-900 mt-4 mb-2">{parseInlineFormatting(line.slice(3))}</h3>);
    } else if (line.startsWith('### ')) {
      elements.push(<h4 key={index} className="font-semibold text-blue-800 mt-3 mb-1">{parseInlineFormatting(line.slice(4))}</h4>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={index} className="font-bold text-gray-900 my-1">{line.slice(2, -2)}</p>);
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      elements.push(
        <div key={index} className="flex items-start space-x-2 ml-2 my-1">
          <span className="text-blue-500 mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
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
