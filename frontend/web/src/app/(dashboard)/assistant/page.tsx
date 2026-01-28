'use client';

import ChatWidget from '@/components/ai/ChatWidget';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChatWidget className="h-[calc(100vh-200px)]" initialMessage={initialQuery || undefined} />
          </div>
          <div className="space-y-6">
            <QuickActions />
            <RecentConversations />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Calculadora de Férias', icon: '🏖️', href: '/calculator' },
    { label: 'Simular Rescisão', icon: '📋', href: '/calculator' },
    { label: 'Consultar CLT', icon: '📚', href: '/knowledge' },
    { label: 'Ver Políticas', icon: '📄', href: '/knowledge' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className="flex items-center space-x-2 p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <span>{action.icon}</span>
            <span className="text-gray-700">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RecentConversations() {
  const conversations = [
    { id: '1', title: 'Cálculo de férias', date: 'Hoje, 14:30' },
    { id: '2', title: 'Dúvidas sobre rescisão', date: 'Ontem, 10:15' },
    { id: '3', title: 'Política de home office', date: '23/01/2024' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Conversas Recentes</h3>
      <ul className="space-y-2">
        {conversations.map((conv) => (
          <li key={conv.id}>
            <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors text-left">
              <div>
                <p className="text-sm text-gray-900">{conv.title}</p>
                <p className="text-xs text-gray-500">{conv.date}</p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
