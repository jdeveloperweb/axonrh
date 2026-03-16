'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Shield, Calendar, Banknote, BrainCircuit, Award,
  Smartphone, CheckCircle2, BarChart3, UserPlus, Fingerprint,
  HeartHandshake, Clock, Sparkles, FileText,
  Cpu, Layers, Eye, ChevronRight, Users, Zap,
  Lock, Database, Activity, Star, Play, Globe,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  glowColor: string;
  title: string;
  subtitle: string;
  desc: string;
  features: string[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: 'admissao',
    icon: UserPlus,
    accentColor: '#60A5FA',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.35)',
    glowColor: 'rgba(59,130,246,0.1)',
    title: 'Admissão e Contratação',
    subtitle: 'Digital do início ao fim',
    desc: 'Elimine o papel. Todo o processo admissional — da proposta à assinatura — acontece digitalmente, com validação automática de documentos por IA e OCR.',
    features: [
      'OCR automático para leitura de RG, CPF, CNH e comprovantes',
      'Assinatura eletrônica com validade jurídica (ICP-Brasil)',
      'Portal do candidato com checklist de pendências interativo',
      'Geração automática de contrato por tipo de vínculo (CLT, PJ, Estágio)',
      'Integração com eSocial S-2200 para admissão automática',
      'Onboarding digital com vídeos, políticas e quizzes de integração',
    ],
  },
  {
    id: 'ponto',
    icon: Clock,
    accentColor: '#818CF8',
    accentBg: 'rgba(99,102,241,0.12)',
    accentBorder: 'rgba(99,102,241,0.35)',
    glowColor: 'rgba(99,102,241,0.1)',
    title: 'Gestão de Ponto',
    subtitle: 'Timesheet inteligente e geolocalizado',
    desc: 'Controle de jornada com geolocalização, banco de horas automatizado e aprovação de espelhos em 1 clique — tudo acessível pelo celular.',
    features: [
      'Registro via GPS com validação de cerca geográfica (Geofencing)',
      'Reconhecimento facial para autenticação biométrica opcional',
      'Banco de horas com saldo em tempo real por colaborador',
      'Horas extras, adicional noturno e interjornada calculados automaticamente',
      'Espelho de ponto digital — colaborador aprova, contesta ou justifica ausência',
      'Dashboard de ausências, atrasos e pontualidade por equipe',
    ],
  },
  {
    id: 'folha',
    icon: Banknote,
    accentColor: '#34D399',
    accentBg: 'rgba(16,185,129,0.12)',
    accentBorder: 'rgba(16,185,129,0.35)',
    glowColor: 'rgba(16,185,129,0.1)',
    title: 'Folha de Pagamento',
    subtitle: 'Cálculo dinâmico e preciso',
    desc: 'Motor de cálculo configurável que processa folha completa, adiantamentos, férias e rescisões com total aderência às normas trabalhistas vigentes.',
    features: [
      'Cálculo dinâmico de INSS, IRRF, FGTS e descontos de convênios',
      'Adiantamento salarial com controle de parcelas e datas',
      'Férias proporcionais, 1/3 constitucional e abono pecuniário',
      'Rescisão completa com TRCT e homologação digital',
      'Exportação de SEFIP, DIRF, RAIS e arquivos eSocial',
      'Holerite PDF gerado automaticamente e disponível no app do colaborador',
    ],
  },
  {
    id: 'beneficios',
    icon: HeartHandshake,
    accentColor: '#FB7185',
    accentBg: 'rgba(244,63,94,0.12)',
    accentBorder: 'rgba(244,63,94,0.35)',
    glowColor: 'rgba(244,63,94,0.1)',
    title: 'Benefícios Inteligentes',
    subtitle: 'Regras automáticas por cargo',
    desc: 'Gerencie VA, VR, VT e Plano de Saúde com regras configuráveis por senioridade, categoria e vínculo. Zero planilha, zero erro.',
    features: [
      'VA/VR/VT configuráveis por faixa salarial e categoria funcional',
      'Inclusão e exclusão de dependentes no plano de saúde com workflow de aprovação',
      'Co-participação médica, franquias e tetos calculados automaticamente',
      'Isenção de VT por faixa salarial conforme legislação vigente',
      'Histórico de utilizações e custo total de benefícios por colaborador',
      'Notificações automáticas de vencimento e renovação de convênios',
    ],
  },
  {
    id: 'desempenho',
    icon: Award,
    accentColor: '#FCD34D',
    accentBg: 'rgba(245,158,11,0.12)',
    accentBorder: 'rgba(245,158,11,0.35)',
    glowColor: 'rgba(245,158,11,0.1)',
    title: 'Desempenho e Carreira',
    subtitle: 'Crescimento contínuo das pessoas',
    desc: 'Ciclos de avaliação configuráveis, feedbacks contínuos, matriz 9-box e planos de desenvolvimento individual integrados à jornada.',
    features: [
      'Avaliações 90°, 180° e 360° com perguntas customizáveis por ciclo',
      'Feedback contínuo peer-to-peer, gestor para liderado e auto-avaliação',
      'Matriz 9-Box interativa com visualização da distribuição da equipe',
      'Plano de Desenvolvimento Individual (PDI) com ações e prazos rastreados',
      'Trilhas de aprendizagem com checkpoints e validação pelo gestor',
      'Metas SMART linkadas a indicadores de performance individuais e de equipe',
    ],
  },
  {
    id: 'eventos',
    icon: Calendar,
    accentColor: '#C084FC',
    accentBg: 'rgba(168,85,247,0.12)',
    accentBorder: 'rgba(168,85,247,0.35)',
    glowColor: 'rgba(168,85,247,0.1)',
    title: 'Eventos Corporativos',
    subtitle: 'Engajamento e presença digital',
    desc: 'Plataforma completa para criar, publicar e gerenciar eventos internos com check-in por QR Code e controle de presença em tempo real.',
    features: [
      'Criação de eventos com limite de vagas, local e RSVP digital',
      'QR Code único e personalizável por participante para check-in',
      'Painel admin com listas de presença em tempo real',
      'Notificações automáticas de confirmação, lembrete e cancelamento',
      'Relatório pós-evento com taxa de comparecimento e feedbacks',
      'Galeria de fotos e histórico completo de eventos arquivados',
    ],
  },
  {
    id: 'ia',
    icon: BrainCircuit,
    accentColor: '#22D3EE',
    accentBg: 'rgba(6,182,212,0.12)',
    accentBorder: 'rgba(6,182,212,0.35)',
    glowColor: 'rgba(6,182,212,0.1)',
    title: 'Assistente de IA',
    subtitle: '24/7 — sem fila, sem espera',
    desc: 'IA integrada que responde dúvidas sobre políticas, holerites e benefícios com precisão contextual, reduzindo chamados ao RH em até 80%.',
    features: [
      'Chatbot contextualizado com dados reais do colaborador autenticado',
      'Responde sobre holerite, férias, saldo de banco de horas e benefícios ativos',
      'Políticas internas indexadas e pesquisáveis por linguagem natural',
      'Escalada automática para o RH humano em casos de alta complexidade',
      'Histórico completo de conversas auditável pelo administrador',
      'Melhora contínua a partir das interações e feedbacks dos usuários',
    ],
  },
  {
    id: 'dashboards',
    icon: BarChart3,
    accentColor: '#2DD4BF',
    accentBg: 'rgba(20,184,166,0.12)',
    accentBorder: 'rgba(20,184,166,0.35)',
    glowColor: 'rgba(20,184,166,0.1)',
    title: 'Dashboards Gerenciais',
    subtitle: 'Visibilidade total ou granular',
    desc: 'Painéis analíticos em tempo real com visões baseadas em RBAC — gestores veem apenas sua equipe, admins têm visão consolidada de toda a empresa.',
    features: [
      'KPIs de headcount, turnover, absenteísmo e custo total de pessoal',
      'Gráficos interativos de evolução de folha de pagamento mês a mês',
      'Filtros por departamento, cargo, localidade e período',
      'Visão do gestor estritamente restrita à sua própria equipe',
      'Exportação de relatórios gerenciais em CSV e PDF formatado',
      'Alertas configuráveis por indicador crítico com notificação em tempo real',
    ],
  },
  {
    id: 'mobile',
    icon: Smartphone,
    accentColor: '#F472B6',
    accentBg: 'rgba(236,72,153,0.12)',
    accentBorder: 'rgba(236,72,153,0.35)',
    glowColor: 'rgba(236,72,153,0.1)',
    title: 'Mobile First / PWA',
    subtitle: 'Na palma da mão — sempre',
    desc: 'Progressive Web App instalável em Android e iOS. Todo o poder do AxonRH acessível do celular, com funcionalidades offline e sincronização automática.',
    features: [
      'Instalação como app nativo em Android e iOS sem app store',
      'Modo offline com sincronização automática ao reconectar',
      'Push notifications para aprovações, alertas e eventos',
      'Interface responsiva e touch-friendly para telas pequenas',
      'Acesso rápido a holerite PDF, espelho de ponto e benefícios',
      'Check-in em eventos via câmera com leitura de QR Code nativa',
    ],
  },
];

const DIFFERENTIALS = [
  {
    icon: Zap,
    title: 'Tudo em um único ecossistema',
    desc: 'Fim às integrações quebradas entre sistemas de ponto, folha, benefícios e DP. Um ecossistema coeso, projetado para trabalhar junto.',
    accentColor: '#FCD34D',
    accentBg: 'rgba(245,158,11,0.1)',
  },
  {
    icon: BrainCircuit,
    title: 'IA que realmente funciona',
    desc: 'Não é um chatbot genérico. A IA conhece os dados reais de cada colaborador e responde com precisão contextual, sem inventar.',
    accentColor: '#22D3EE',
    accentBg: 'rgba(6,182,212,0.1)',
  },
  {
    icon: Shield,
    title: 'LGPD by Design',
    desc: 'Privacidade integrada na arquitetura desde o dia 1. Controle granular de consentimentos, direitos dos titulares e auditoria completa.',
    accentColor: '#34D399',
    accentBg: 'rgba(16,185,129,0.1)',
  },
  {
    icon: Activity,
    title: 'Tudo em tempo real',
    desc: 'Saldos de banco de horas, aprovações pendentes, check-ins em eventos. Dados atualizados em tempo real sem refresh, sem atraso.',
    accentColor: '#60A5FA',
    accentBg: 'rgba(59,130,246,0.1)',
  },
  {
    icon: Cpu,
    title: 'Escalabilidade cloud-native',
    desc: 'Arquitetura que escala de 10 a 100.000 colaboradores sem mudança de configuração. Multi-tenant com isolamento total de dados.',
    accentColor: '#818CF8',
    accentBg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: Users,
    title: 'Self-service que libera o RH',
    desc: 'O colaborador resolve sozinho pelo app. Holerite, espelho, benefícios, dúvidas com a IA. O RH foca em estratégia, não em chamados.',
    accentColor: '#FB7185',
    accentBg: 'rgba(244,63,94,0.1)',
  },
];

const TECH_STACK = [
  { name: 'Next.js 15', desc: 'App Router · RSC · SSR', icon: Globe, color: '#E2E8F0' },
  { name: 'TypeScript', desc: 'Type-safe end-to-end', icon: FileText, color: '#60A5FA' },
  { name: 'PostgreSQL', desc: 'Banco relacional robusto', icon: Database, color: '#60B8FA' },
  { name: 'LGPD Native', desc: 'Compliance by design', icon: Shield, color: '#34D399' },
  { name: 'PWA', desc: 'Progressive Web App', icon: Smartphone, color: '#C084FC' },
  { name: 'IA Integrada', desc: 'LLM contextualizado', icon: BrainCircuit, color: '#22D3EE' },
  { name: 'RBAC', desc: 'Permissões granulares', icon: Lock, color: '#FCD34D' },
  { name: 'eSocial', desc: 'Integração nativa', icon: Layers, color: '#FB7185' },
];

const WORKFLOW_STEPS = [
  {
    n: '01',
    title: 'Abertura de Vaga & Admissão Digital',
    desc: 'O gestor solicita uma contratação. Após aprovação pelo RH, o candidato acessa o portal, envia seus documentos e o OCR valida os dados automaticamente. O contrato é assinado digitalmente em minutos.',
    color: '#3B82F6',
    icon: UserPlus,
  },
  {
    n: '02',
    title: 'Onboarding e Configuração de Benefícios',
    desc: 'Com base no cargo e vínculo, o sistema provisiona automaticamente VA, VR, VT e plano de saúde. O colaborador recebe onboarding digital com vídeos, políticas internas e questionário de integração.',
    color: '#6366F1',
    icon: HeartHandshake,
  },
  {
    n: '03',
    title: 'Rotina de Ponto e Jornada',
    desc: 'Diariamente, o colaborador registra o ponto pelo PWA com geolocalização. O sistema calcula automaticamente atrasos, horas extras e adicional noturno, atualizando o dashboard do gestor em tempo real.',
    color: '#8B5CF6',
    icon: Clock,
  },
  {
    n: '04',
    title: 'Fechamento de Folha em 1 Clique',
    desc: 'No fechamento mensal, todas as conciliações de ponto, descontos de convênio, adiantamentos e premiações são consolidadas automaticamente. A folha é processada e o holerite enviado ao app do colaborador.',
    color: '#06B6D4',
    icon: Banknote,
  },
  {
    n: '05',
    title: 'Engajamento Contínuo via Mobile e IA',
    desc: 'O colaborador acessa o holerite PDF pelo celular, tira dúvidas com a IA sobre co-participação médica e VT, e faz check-in em eventos corporativos pelo QR Code — tudo sem precisar contatar o RH.',
    color: '#10B981',
    icon: BrainCircuit,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApresentacaoPage() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('.axon-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) (e.target as Element).classList.add('axon-revealed'); }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const handleStart = () => {
    setTransitioning(true);
    setTimeout(() => router.push('/login'), 1100);
  };

  const mod = MODULES[activeModule];
  const ModIcon = mod.icon;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        .axon-display { font-family: 'Outfit', system-ui, sans-serif; }

        /* Scroll reveal */
        .axon-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1);
        }
        .axon-reveal.axon-revealed { opacity: 1; transform: translateY(0); }

        /* Keyframes */
        @keyframes axon-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axon-fade-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes axon-scale-in {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes axon-text-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axon-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-18px) rotate(2deg); }
        }
        @keyframes axon-float-r {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(-2deg); }
        }
        @keyframes axon-gradient {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes axon-ping {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes axon-grid-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes axon-slide-detail {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes axon-overlay-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes axon-logo-pop {
          0%   { opacity: 0; transform: scale(0.4) rotate(-8deg); }
          70%  { transform: scale(1.1) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes axon-logo-text {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axon-dot-pulse {
          0%,80%,100% { transform: scale(0.8); opacity: 0.4; }
          40%          { transform: scale(1.2); opacity: 1; }
        }

        /* Utility animations */
        .axon-hero-badge { animation: axon-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        .axon-hero-h1    { animation: axon-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .axon-hero-sub   { animation: axon-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .axon-hero-cta   { animation: axon-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.34s both; }
        .axon-hero-stats { animation: axon-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.46s both; }

        .axon-orb-1 { animation: axon-float   9s ease-in-out infinite; }
        .axon-orb-2 { animation: axon-float-r 13s ease-in-out infinite; animation-delay: -5s; }
        .axon-orb-3 { animation: axon-float   11s ease-in-out infinite; animation-delay: -3s; }

        .axon-gradient-text {
          background-size: 250% 250%;
          animation: axon-gradient 5s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Grid BG */
        .axon-grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 56px 56px;
          animation: axon-grid-in 2s ease forwards;
        }

        /* Module detail animation */
        .axon-mod-detail { animation: axon-slide-detail 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }

        /* Module tabs */
        .axon-tab { transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease; }

        /* Cards */
        .axon-card {
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .axon-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.35);
          border-color: rgba(99,102,241,0.28) !important;
        }

        /* Tech badge */
        .axon-tech { transition: transform 0.2s ease, background 0.2s ease; }
        .axon-tech:hover { transform: translateY(-3px); background: rgba(255,255,255,0.06) !important; }

        /* Start button */
        .axon-start-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        }
        .axon-start-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .axon-start-btn:hover::before { opacity: 1; }
        .axon-start-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 20px 60px rgba(99,102,241,0.45);
        }
        .axon-start-btn:active { transform: scale(0.98); }
        .axon-start-btn > * { position: relative; z-index: 1; }

        /* Arrow in start button */
        .axon-arrow { transition: transform 0.25s ease; }
        .axon-start-btn:hover .axon-arrow { transform: translateX(4px); }

        /* Transition overlay */
        .axon-overlay { animation: axon-overlay-in 0.5s ease forwards; }
        .axon-overlay-logo { animation: axon-logo-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.25s both; }
        .axon-overlay-text { animation: axon-logo-text 0.5s ease 0.65s both; }
        .axon-dot-1 { animation: axon-dot-pulse 1.2s 0s infinite; }
        .axon-dot-2 { animation: axon-dot-pulse 1.2s 0.2s infinite; }
        .axon-dot-3 { animation: axon-dot-pulse 1.2s 0.4s infinite; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #06091A; }
        ::-webkit-scrollbar-thumb { background: #1E2940; border-radius: 2px; }

        /* Dot indicator */
        .axon-dot-ind { transition: width 0.3s ease, background 0.3s ease; }
      `}</style>

      {/* ── Transition Overlay ─────────────────────────────────────────────── */}
      {transitioning && (
        <div
          className="axon-overlay"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #030712 0%, #0D0F1E 50%, #030712 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div className="axon-overlay-logo" style={{ margin: '0 auto 24px' }}>
              <div style={{
                width: 88, height: 88, borderRadius: 24,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, fontWeight: 900, color: 'white',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 0 80px rgba(99,102,241,0.5)',
                margin: '0 auto',
              }}>A</div>
            </div>
            <div className="axon-overlay-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 12 }}>AxonRH</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div className="axon-dot-1" style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                <div className="axon-dot-2" style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1' }} />
                <div className="axon-dot-3" style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#06091A', color: '#E2E8F0', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(6,9,26,0.75)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 24px',
        }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 16, color: 'white',
                fontFamily: 'Outfit, sans-serif',
              }}>A</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>AxonRH</span>
              <span style={{
                marginLeft: 4, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                background: 'rgba(59,130,246,0.12)', color: '#60A5FA',
                border: '1px solid rgba(59,130,246,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>Apresentação</span>
            </div>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              {[['#modulos','Módulos'],['#fluxos','Fluxo'],['#diferenciais','Diferenciais'],['#seguranca','Segurança']].map(([href, label]) => (
                <a key={href} href={href} style={{ fontSize: 13, fontWeight: 500, color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#E2E8F0')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
                >{label}</a>
              ))}
            </nav>
            <button
              onClick={handleStart}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', borderRadius: 99, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                color: 'white', fontSize: 13, fontWeight: 700,
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 0 32px rgba(99,102,241,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.3)'; }}
            >
              <Play style={{ width: 12, height: 12, fill: 'white' }} />
              Iniciar
            </button>
          </div>
        </header>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', overflow: 'hidden' }}>
          {/* Grid */}
          <div className="axon-grid-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

          {/* Orbs */}
          <div className="axon-orb-1" style={{ position: 'absolute', top: '-20%', left: '-8%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div className="axon-orb-2" style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div className="axon-orb-3" style={{ position: 'absolute', top: '35%', right: '15%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 960 }}>
            <div className="axon-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 99, marginBottom: 28, fontSize: 13, fontWeight: 600, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.22)', color: '#93C5FD' }}>
              <Sparkles style={{ width: 14, height: 14 }} />
              Plataforma SaaS de RH e DP com Inteligência Artificial
            </div>

            <h1
              className="axon-hero-h1 axon-display"
              style={{ fontSize: 'clamp(52px, 8vw, 96px)', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.04em', color: 'white', marginBottom: 28 }}
            >
              O Futuro do<br />
              <span
                className="axon-display"
                style={{
                  background: 'linear-gradient(90deg, #3B82F6, #818CF8, #C084FC, #3B82F6)',
                  backgroundSize: '250% 250%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'axon-gradient 5s ease infinite',
                }}
              >
                RH já chegou
              </span>
            </h1>

            <p className="axon-hero-sub" style={{ fontSize: 'clamp(16px, 2.2vw, 22px)', color: '#94A3B8', maxWidth: 720, margin: '0 auto 40px', lineHeight: 1.65 }}>
              Do recrutamento ao offboarding — controle de ponto, folha de pagamento, benefícios, desempenho e IA em um único ecossistema seguro, inteligente e totalmente digital.
            </p>

            <div className="axon-hero-cta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 64, flexWrap: 'wrap' }}>
              <a href="#modulos" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 99,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                color: 'white', fontWeight: 700, fontSize: 16, textDecoration: 'none',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: '0 0 48px rgba(99,102,241,0.35)',
                transition: 'transform 0.2s ease',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Explorar Módulos <ArrowRight style={{ width: 18, height: 18 }} />
              </a>
              <a href="#diferenciais" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 32px', borderRadius: 99,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#CBD5E1', fontWeight: 600, fontSize: 16, textDecoration: 'none',
                transition: 'border-color 0.2s ease',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              >
                Ver Diferenciais
              </a>
            </div>

            {/* Stats */}
            <div className="axon-hero-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { val: '9+',   label: 'Módulos Integrados' },
                { val: '80%',  label: 'Menos Chamados ao RH' },
                { val: '100%', label: 'Digital & Cloud' },
                { val: '24/7', label: 'Assistente de IA' },
              ].map((s, i) => (
                <div key={i} className="axon-card" style={{ padding: '24px 16px', borderRadius: 20, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="axon-display" style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll cue */}
          <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#334155' }}>
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>scroll</span>
            <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, #3B82F6, transparent)', borderRadius: 1 }} />
          </div>
        </section>

        {/* ── Modules ─────────────────────────────────────────────────────── */}
        <section id="modulos" style={{ padding: '120px 24px', position: 'relative' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="axon-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 99, marginBottom: 16, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Layers style={{ width: 13, height: 13 }} /> Módulos do Sistema
              </div>
              <h2 className="axon-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.05 }}>
                Tudo que seu RH precisa.<br />Em um único lugar.
              </h2>
              <p style={{ fontSize: 18, color: '#64748B', maxWidth: 560, margin: '0 auto' }}>
                9 módulos interdependentes, projetados para trabalhar juntos e eliminar as integrações problemáticas.
              </p>
            </div>

            <div className="axon-reveal" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 268, flexShrink: 0 }}>
                {MODULES.map((m, i) => {
                  const Icon = m.icon;
                  const active = activeModule === i;
                  return (
                    <button
                      key={m.id}
                      className="axon-tab"
                      onClick={() => setActiveModule(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        borderRadius: 14, border: `1px solid ${active ? m.accentBorder : 'rgba(255,255,255,0.07)'}`,
                        background: active ? m.accentBg : 'rgba(255,255,255,0.02)',
                        color: active ? '#E2E8F0' : '#64748B',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        fontFamily: 'DM Sans, sans-serif',
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        background: active ? m.accentBg : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${active ? m.accentBorder : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        <Icon style={{ width: 15, height: 15, color: active ? m.accentColor : '#475569' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, lineHeight: 1.3 }}>{m.title}</span>
                      {active && <ChevronRight style={{ width: 14, height: 14, marginLeft: 'auto', flexShrink: 0, color: m.accentColor }} />}
                    </button>
                  );
                })}
              </div>

              {/* Detail panel */}
              <div
                key={activeModule}
                className="axon-mod-detail"
                style={{
                  flex: 1, minWidth: 300, borderRadius: 28, padding: '44px 48px', position: 'relative', overflow: 'hidden',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Glow */}
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${mod.glowColor} 0%, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
                    <div style={{ padding: 16, borderRadius: 20, background: mod.accentBg, border: `1px solid ${mod.accentBorder}`, flexShrink: 0 }}>
                      <ModIcon style={{ width: 32, height: 32, color: mod.accentColor }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: mod.accentColor, marginBottom: 6 }}>
                        {mod.subtitle}
                      </div>
                      <h3 className="axon-display" style={{ fontSize: 30, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {mod.title}
                      </h3>
                    </div>
                  </div>

                  <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.7, marginBottom: 36, maxWidth: 620 }}>
                    {mod.desc}
                  </p>

                  {/* Features grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                    {mod.features.map((feat, fi) => (
                      <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, background: mod.accentBg, border: `1px solid ${mod.accentBorder}` }}>
                          <CheckCircle2 style={{ width: 11, height: 11, color: mod.accentColor }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.55 }}>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pagination dots */}
                  <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {MODULES.map((_, di) => (
                        <button
                          key={di}
                          className="axon-dot-ind"
                          onClick={() => setActiveModule(di)}
                          style={{
                            height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                            width: di === activeModule ? 28 : 6,
                            background: di === activeModule ? mod.accentColor : 'rgba(255,255,255,0.15)',
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{activeModule + 1} / {MODULES.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Workflow ─────────────────────────────────────────────────────── */}
        <section id="fluxos" style={{ padding: '120px 24px', background: 'rgba(255,255,255,0.008)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div className="axon-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
              <h2 className="axon-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.05 }}>
                Fluxo Operacional<br />de Ponta a Ponta
              </h2>
              <p style={{ fontSize: 18, color: '#64748B' }}>Como as operações da empresa fluem naturalmente dentro do sistema.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="axon-reveal" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', transitionDelay: `${i * 90}ms` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 18, color: step.color,
                        background: `${step.color}18`, border: `1px solid ${step.color}35`, position: 'relative',
                      }}>
                        {step.n}
                        <div style={{ position: 'absolute', inset: 0, borderRadius: 16, border: `1px solid ${step.color}25`, animation: 'axon-ping 2s ease infinite' }} />
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div style={{ width: 1, height: 32, marginTop: 8, background: `linear-gradient(to bottom, ${step.color}40, transparent)` }} />
                      )}
                    </div>
                    <div style={{ flex: 1, padding: '20px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', transition: 'transform 0.25s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <StepIcon style={{ width: 16, height: 16, color: step.color, flexShrink: 0 }} />
                        <h3 className="axon-display" style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{step.title}</h3>
                      </div>
                      <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7 }}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Differentials ────────────────────────────────────────────────── */}
        <section id="diferenciais" style={{ padding: '120px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="axon-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 99, marginBottom: 16, fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Star style={{ width: 13, height: 13 }} /> Diferenciais Competitivos
              </div>
              <h2 className="axon-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.05 }}>
                Por que o AxonRH é diferente?
              </h2>
              <p style={{ fontSize: 18, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>
                Não é mais um sistema de RH. É um ecossistema inteligente criado para eliminar fricções.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {DIFFERENTIALS.map((d, i) => {
                const DIcon = d.icon;
                return (
                  <div key={i} className="axon-reveal axon-card" style={{ padding: '36px', borderRadius: 28, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', transitionDelay: `${i * 70}ms` }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, background: d.accentBg, border: `1px solid ${d.accentColor}25` }}>
                      <DIcon style={{ width: 26, height: 26, color: d.accentColor }} />
                    </div>
                    <h3 className="axon-display" style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 12, letterSpacing: '-0.01em' }}>{d.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{d.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Security ─────────────────────────────────────────────────────── */}
        <section id="seguranca" style={{ padding: '120px 24px', background: 'rgba(255,255,255,0.008)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 80, alignItems: 'center' }}>
            {/* Left */}
            <div className="axon-reveal">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 99, marginBottom: 24, fontSize: 12, fontWeight: 600, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Shield style={{ width: 13, height: 13 }} /> Segurança & Compliance
              </div>
              <h2 className="axon-display" style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.05 }}>
                LGPD by Design.<br />RBAC por padrão.
              </h2>
              <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.7, marginBottom: 36 }}>
                Privacidade e compliance não são recursos adicionais — estão integrados na arquitetura desde o primeiro dia.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Lock,     title: 'MFA e Recuperação Inteligente',     desc: 'Autenticação com 2FA por token numérico e recuperação segura de conta via email verificado.' },
                  { icon: Eye,      title: 'RBAC Granular',                     desc: 'Permissões funcionais específicas (ex: DASHBOARD:READ) para cada papel dentro da empresa.' },
                  { icon: FileText, title: 'Política de Privacidade Versionada', desc: 'Editor Markdown interno para atualização contínua de políticas e versionamento de consentimentos.' },
                  { icon: Database, title: 'Auditoria Completa',                 desc: 'Log de todas as ações sensíveis com rastreabilidade total de quem fez o quê e quando.' },
                ].map((item, i) => {
                  const II = item.icon;
                  return (
                    <div key={i} style={{ display: 'flex', gap: 16, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <II style={{ width: 18, height: 18, color: '#34D399' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — RBAC visual */}
            <div className="axon-reveal" style={{ transitionDelay: '150ms' }}>
              <div style={{ padding: 32, borderRadius: 28, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'white', fontSize: 15 }}>
                    <Fingerprint style={{ width: 18, height: 18, color: '#34D399' }} />
                    Cargos e Permissões
                  </div>
                  <div style={{ fontSize: 11, padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>RBAC Ativo</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { role: 'Administrador RH',  access: 'Acesso Total',       color: '#34D399', bg: 'rgba(16,185,129,0.1)',  perms: ['ADMIN:*','PAYROLL:*','EMPLOYEES:*'] },
                    { role: 'Gestor de Equipe',   access: 'Equipe Própria',     color: '#60A5FA', bg: 'rgba(59,130,246,0.1)',  perms: ['TEAM:READ','TIMESHEET:APPROVE'] },
                    { role: 'Gestor Financeiro',  access: 'Folha / Relatórios', color: '#818CF8', bg: 'rgba(99,102,241,0.1)', perms: ['PAYROLL:READ','REPORTS:EXPORT'] },
                    { role: 'Colaborador',        access: 'Próprio Perfil',     color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', perms: ['SELF:READ','TIMESHEET:WRITE'] },
                    { role: 'Contabilidade Ext.', access: 'Exportações',        color: '#FCD34D', bg: 'rgba(252,211,77,0.1)',  perms: ['REPORTS:EXPORT'] },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{item.role}</span>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700, background: item.bg, color: item.color, border: `1px solid ${item.color}30` }}>{item.access}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {item.perms.map((p, j) => (
                          <span key={j} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', color: '#475569', fontFamily: 'monospace' }}>{p}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tech Stack ───────────────────────────────────────────────────── */}
        <section id="tecnologia" style={{ padding: '120px 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="axon-reveal" style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 99, marginBottom: 16, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#818CF8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Cpu style={{ width: 13, height: 13 }} /> Stack Tecnológico
              </div>
              <h2 className="axon-display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.05 }}>
                Construído com as melhores tecnologias
              </h2>
              <p style={{ fontSize: 18, color: '#64748B', maxWidth: 520, margin: '0 auto' }}>
                Arquitetura moderna, cloud-native e type-safe do banco à interface.
              </p>
            </div>

            <div className="axon-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 48 }}>
              {TECH_STACK.map((tech, i) => {
                const TI = tech.icon;
                return (
                  <div key={i} className="axon-tech" style={{ padding: '24px 20px', borderRadius: 20, textAlign: 'center', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <TI style={{ width: 28, height: 28, color: tech.color, margin: '0 auto 12px' }} />
                    <div className="axon-display" style={{ fontWeight: 700, color: 'white', fontSize: 15, marginBottom: 4 }}>{tech.name}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{tech.desc}</div>
                  </div>
                );
              })}
            </div>

            <div className="axon-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, transitionDelay: '120ms' }}>
              {[
                { icon: Globe,    color: '#60A5FA', border: 'rgba(59,130,246,0.3)',   bg: 'rgba(59,130,246,0.08)',   title: 'Cloud-Native & Multi-Tenant',       desc: 'Arquitetura desenhada para escalar de 10 a 100.000 colaboradores com isolamento completo de dados entre empresas.' },
                { icon: Activity, color: '#34D399', border: 'rgba(16,185,129,0.3)',  bg: 'rgba(16,185,129,0.08)',  title: 'Tempo Real por Padrão',              desc: 'WebSockets e Server-Sent Events para que saldos, aprovações e dados críticos sejam sempre atualizados sem refresh.' },
                { icon: Zap,      color: '#FCD34D', border: 'rgba(245,158,11,0.3)',   bg: 'rgba(245,158,11,0.08)',   title: 'Performance de Primeira Classe',     desc: 'Next.js 15 com App Router, React Server Components e edge caching para carregamento em milissegundos.' },
              ].map((item, i) => {
                const II = item.icon;
                return (
                  <div key={i} className="axon-card" style={{ padding: '32px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: `1px solid ${item.border}` }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, background: item.bg, border: `1px solid ${item.border}` }}>
                      <II style={{ width: 22, height: 22, color: item.color }} />
                    </div>
                    <h3 className="axon-display" style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 10, letterSpacing: '-0.01em' }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section id="cta" style={{ padding: '140px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.1) 0%, transparent 65%)' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="axon-reveal">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 99, marginBottom: 28, fontSize: 12, fontWeight: 600, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818CF8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                <Play style={{ width: 12, height: 12, fill: '#818CF8' }} /> Pronto para começar
              </div>

              <h2 className="axon-display" style={{ fontSize: 'clamp(44px, 7vw, 84px)', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 0.92, marginBottom: 28 }}>
                Transforme seu RH<br />
                <span className="axon-display" style={{
                  background: 'linear-gradient(90deg, #3B82F6, #818CF8, #C084FC, #3B82F6)',
                  backgroundSize: '250% 250%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'axon-gradient 5s ease infinite',
                }}>
                  agora mesmo
                </span>
              </h2>

              <p style={{ fontSize: 20, color: '#94A3B8', marginBottom: 56, maxWidth: 560, margin: '0 auto 56px', lineHeight: 1.65 }}>
                O sistema está pronto. Os módulos estão configurados. Clique abaixo para entrar no AxonRH.
              </p>

              <button
                onClick={handleStart}
                className="axon-start-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 20,
                  padding: '22px 44px', borderRadius: 99, border: '1px solid rgba(99,102,241,0.45)',
                  background: 'linear-gradient(135deg, #111827 0%, #1E1B4B 100%)',
                  color: 'white', cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20,
                  letterSpacing: '-0.01em',
                  boxShadow: '0 0 80px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', boxShadow: '0 0 24px rgba(99,102,241,0.6)', flexShrink: 0 }}>
                  <Play style={{ width: 20, height: 20, fill: 'white', marginLeft: 2 }} />
                </div>
                Iniciar Apresentação
                <ArrowRight className="axon-arrow" style={{ width: 22, height: 22 }} />
              </button>

              <p style={{ marginTop: 20, fontSize: 13, color: '#334155' }}>
                Você será redirecionado para a tela de login do sistema
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: 'white', fontFamily: 'Outfit, sans-serif' }}>A</div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'white', fontSize: 16 }}>AxonRH</span>
              <span style={{ fontSize: 12, color: '#334155' }}>— Plataforma de Gestão de Pessoas</span>
            </div>
            <div style={{ fontSize: 12, color: '#334155' }}>
              © {new Date().getFullYear()} AxonRH Cloud Systems. Todos os direitos reservados.
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
