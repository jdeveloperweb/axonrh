'use client';

import { useState } from 'react';
import ChatWidget from '@/components/ai/ChatWidget';
import CalculatorWidget from '@/components/ai/CalculatorWidget';

type Tab = 'chat' | 'calculator' | 'knowledge';

export default function AssistantPage() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Assistente de RH
              </h1>
              <p className="text-sm text-gray-500">
                Converse, calcule e consulte informações de RH
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <TabButton
                  active={activeTab === 'chat'}
                  onClick={() => setActiveTab('chat')}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  }
                >
                  Chat
                </TabButton>
                <TabButton
                  active={activeTab === 'calculator'}
                  onClick={() => setActiveTab('calculator')}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  Calculadora
                </TabButton>
                <TabButton
                  active={activeTab === 'knowledge'}
                  onClick={() => setActiveTab('knowledge')}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  }
                >
                  Base de Conhecimento
                </TabButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ChatWidget className="h-[calc(100vh-200px)]" />
            </div>
            <div className="space-y-6">
              <QuickActions />
              <RecentConversations />
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="max-w-2xl mx-auto">
            <CalculatorWidget />
          </div>
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBase />
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-white text-blue-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </button>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Calcular Férias', icon: '🏖️', href: '#calculator' },
    { label: 'Simular Rescisão', icon: '📋', href: '#calculator' },
    { label: 'Consultar CLT', icon: '📚', href: '#knowledge' },
    { label: 'Ver Políticas', icon: '📄', href: '#knowledge' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <button
            key={index}
            className="flex items-center space-x-2 p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <span>{action.icon}</span>
            <span className="text-gray-700">{action.label}</span>
          </button>
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

function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      name: 'Políticas de RH',
      icon: '📋',
      count: 12,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      name: 'Legislação Trabalhista',
      icon: '⚖️',
      count: 45,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      name: 'Procedimentos',
      icon: '📝',
      count: 23,
      color: 'bg-green-100 text-green-800',
    },
    {
      name: 'FAQs',
      icon: '❓',
      count: 67,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      name: 'Guia de Benefícios',
      icon: '🎁',
      count: 8,
      color: 'bg-pink-100 text-pink-800',
    },
    {
      name: 'Treinamentos',
      icon: '🎓',
      count: 15,
      color: 'bg-indigo-100 text-indigo-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="max-w-2xl mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pesquisar na Base de Conhecimento
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Busque por políticas, leis, procedimentos..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-500">{category.count} documentos</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                {category.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Adicionar Documento
        </h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-blue-600">Clique para enviar</span> ou arraste e solte
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PDF, DOC, TXT até 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
