'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Shield, Calendar, Banknote, BrainCircuit, Award,
  Smartphone, CheckCircle2, BarChart3, UserPlus, Fingerprint,
  HeartHandshake, Clock, Sparkles, FileText,
  Cpu, Layers, Eye, ChevronRight, Users, Zap,
  Lock, Database, Activity, Star, Play, Globe,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
    accentColor: '#2563EB',
    accentBg: 'rgba(37,99,235,0.07)',
    accentBorder: 'rgba(37,99,235,0.22)',
    glowColor: 'rgba(37,99,235,0.06)',
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
    accentColor: '#4F46E5',
    accentBg: 'rgba(79,70,229,0.07)',
    accentBorder: 'rgba(79,70,229,0.22)',
    glowColor: 'rgba(79,70,229,0.06)',
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
    accentColor: '#059669',
    accentBg: 'rgba(5,150,105,0.07)',
    accentBorder: 'rgba(5,150,105,0.22)',
    glowColor: 'rgba(5,150,105,0.06)',
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
    accentColor: '#DC2626',
    accentBg: 'rgba(220,38,38,0.07)',
    accentBorder: 'rgba(220,38,38,0.22)',
    glowColor: 'rgba(220,38,38,0.06)',
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
    accentColor: '#D97706',
    accentBg: 'rgba(217,119,6,0.07)',
    accentBorder: 'rgba(217,119,6,0.22)',
    glowColor: 'rgba(217,119,6,0.06)',
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
    accentColor: '#7C3AED',
    accentBg: 'rgba(124,58,237,0.07)',
    accentBorder: 'rgba(124,58,237,0.22)',
    glowColor: 'rgba(124,58,237,0.06)',
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
    accentColor: '#0891B2',
    accentBg: 'rgba(8,145,178,0.07)',
    accentBorder: 'rgba(8,145,178,0.22)',
    glowColor: 'rgba(8,145,178,0.06)',
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
    accentColor: '#0D9488',
    accentBg: 'rgba(13,148,136,0.07)',
    accentBorder: 'rgba(13,148,136,0.22)',
    glowColor: 'rgba(13,148,136,0.06)',
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
    accentColor: '#DB2777',
    accentBg: 'rgba(219,39,119,0.07)',
    accentBorder: 'rgba(219,39,119,0.22)',
    glowColor: 'rgba(219,39,119,0.06)',
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
    accentColor: '#D97706',
    accentBg: 'rgba(217,119,6,0.08)',
  },
  {
    icon: BrainCircuit,
    title: 'IA que realmente funciona',
    desc: 'Não é um chatbot genérico. A IA conhece os dados reais de cada colaborador e responde com precisão contextual, sem inventar.',
    accentColor: '#0891B2',
    accentBg: 'rgba(8,145,178,0.08)',
  },
  {
    icon: Shield,
    title: 'LGPD by Design',
    desc: 'Privacidade integrada na arquitetura desde o dia 1. Controle granular de consentimentos, direitos dos titulares e auditoria completa.',
    accentColor: '#059669',
    accentBg: 'rgba(5,150,105,0.08)',
  },
  {
    icon: Activity,
    title: 'Tudo em tempo real',
    desc: 'Saldos de banco de horas, aprovações pendentes, check-ins em eventos. Dados atualizados em tempo real sem refresh, sem atraso.',
    accentColor: '#2563EB',
    accentBg: 'rgba(37,99,235,0.08)',
  },
  {
    icon: Cpu,
    title: 'Escalabilidade cloud-native',
    desc: 'Arquitetura que escala de 10 a 100.000 colaboradores sem mudança de configuração. Multi-tenant com isolamento total de dados.',
    accentColor: '#4F46E5',
    accentBg: 'rgba(79,70,229,0.08)',
  },
  {
    icon: Users,
    title: 'Self-service que libera o RH',
    desc: 'O colaborador resolve sozinho pelo app. Holerite, espelho, benefícios, dúvidas com a IA. O RH foca em estratégia, não em chamados.',
    accentColor: '#DC2626',
    accentBg: 'rgba(220,38,38,0.08)',
  },
];

const TECH_STACK = [
  { name: 'Next.js 15',  desc: 'App Router · RSC · SSR', icon: Globe,        color: '#1E293B' },
  { name: 'TypeScript',  desc: 'Type-safe end-to-end',   icon: FileText,     color: '#2563EB' },
  { name: 'PostgreSQL',  desc: 'Banco relacional robusto',icon: Database,     color: '#1D4ED8' },
  { name: 'LGPD Native', desc: 'Compliance by design',   icon: Shield,       color: '#059669' },
  { name: 'PWA',         desc: 'Progressive Web App',    icon: Smartphone,   color: '#7C3AED' },
  { name: 'IA Integrada',desc: 'LLM contextualizado',    icon: BrainCircuit, color: '#0891B2' },
  { name: 'RBAC',        desc: 'Permissões granulares',  icon: Lock,         color: '#D97706' },
  { name: 'eSocial',     desc: 'Integração nativa',      icon: Layers,       color: '#DC2626' },
];

const WORKFLOW_STEPS = [
  {
    n: '01', title: 'Abertura de Vaga & Admissão Digital',
    desc: 'O gestor solicita uma contratação. Após aprovação pelo RH, o candidato acessa o portal, envia seus documentos e o OCR valida os dados automaticamente. O contrato é assinado digitalmente em minutos.',
    color: '#2563EB', icon: UserPlus,
  },
  {
    n: '02', title: 'Onboarding e Configuração de Benefícios',
    desc: 'Com base no cargo e vínculo, o sistema provisiona automaticamente VA, VR, VT e plano de saúde. O colaborador recebe onboarding digital com vídeos, políticas internas e questionário de integração.',
    color: '#4F46E5', icon: HeartHandshake,
  },
  {
    n: '03', title: 'Rotina de Ponto e Jornada',
    desc: 'Diariamente, o colaborador registra o ponto pelo PWA com geolocalização. O sistema calcula automaticamente atrasos, horas extras e adicional noturno, atualizando o dashboard do gestor em tempo real.',
    color: '#7C3AED', icon: Clock,
  },
  {
    n: '04', title: 'Fechamento de Folha em 1 Clique',
    desc: 'No fechamento mensal, todas as conciliações de ponto, descontos de convênio, adiantamentos e premiações são consolidadas automaticamente. A folha é processada e o holerite enviado ao app do colaborador.',
    color: '#0891B2', icon: Banknote,
  },
  {
    n: '05', title: 'Engajamento Contínuo via Mobile e IA',
    desc: 'O colaborador acessa o holerite PDF pelo celular, tira dúvidas com a IA sobre co-participação médica e VT, e faz check-in em eventos corporativos pelo QR Code — tudo sem precisar contatar o RH.',
    color: '#059669', icon: BrainCircuit,
  },
];

// ─── Stat Counter ─────────────────────────────────────────────────────────────

function StatCounter({ value, started }: { value: string; started: boolean }) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return <>{value}</>;
  const [, numStr, suffix] = match;
  const target = parseInt(numStr, 10);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    const duration = 2200;
    let raf: number;
    let startTs: number | null = null;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  return <>{count}{suffix}</>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ApresentacaoPage() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = document.querySelectorAll('.axr-reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) (e.target as Element).classList.add('axr-visible');
      }),
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setStatsStarted(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
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
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'Manrope', system-ui, sans-serif; background: #F7F9FF; }
        .axr-display { font-family: 'Sora', system-ui, sans-serif; }

        /* ── Reveal ── */
        .axr-reveal {
          opacity: 0; transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .axr-reveal.axr-visible { opacity: 1; transform: translateY(0); }

        /* ── Keyframes ── */
        @keyframes axr-float-a { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        @keyframes axr-float-b { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(3deg); } }
        @keyframes axr-grad {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes axr-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axr-scale-pop {
          0%   { opacity: 0; transform: scale(0.55) rotate(-6deg); }
          70%  { transform: scale(1.09) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes axr-name-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axr-dot {
          0%,80%,100% { transform: scale(0.7); opacity: 0.35; }
          40%          { transform: scale(1.3); opacity: 1; }
        }
        @keyframes axr-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes axr-ping {
          0%   { transform: scale(1); opacity: 0.55; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes axr-panel-in {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes axr-overlay-in { from { opacity: 0; } to { opacity: 1; } }

        /* ── Orbs ── */
        .axr-orb-a { animation: axr-float-a 10s ease-in-out infinite; }
        .axr-orb-b { animation: axr-float-b 14s ease-in-out infinite; animation-delay: -5s; }

        /* ── Gradient text ── */
        .axr-grad-text {
          background: linear-gradient(90deg, #2563EB, #4F46E5, #7C3AED, #2563EB);
          background-size: 300% 100%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: axr-grad 5s ease infinite;
        }

        /* ── Hero entrance ── */
        .axr-h-badge { animation: axr-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both; }
        .axr-h-title { animation: axr-fade-up 0.85s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .axr-h-sub   { animation: axr-fade-up 0.85s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .axr-h-cta   { animation: axr-fade-up 0.85s cubic-bezier(0.16,1,0.3,1) 0.34s both; }
        .axr-h-stats { animation: axr-fade-up 0.85s cubic-bezier(0.16,1,0.3,1) 0.46s both; }

        /* ── Overlay ── */
        .axr-ov   { animation: axr-overlay-in 0.45s ease both; }
        .axr-logo { animation: axr-scale-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
        .axr-nm   { animation: axr-name-in 0.5s ease 0.65s both; }
        .d1 { animation: axr-dot 1.2s 0s infinite; }
        .d2 { animation: axr-dot 1.2s 0.2s infinite; }
        .d3 { animation: axr-dot 1.2s 0.4s infinite; }

        /* ── Module panel ── */
        .axr-panel { animation: axr-panel-in 0.38s cubic-bezier(0.16,1,0.3,1) both; }

        /* ── Button ── */
        .axr-btn {
          position: relative; overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        }
        .axr-btn::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.28) 50%, transparent 65%);
          background-size: 250% 100%; background-position: -200% center;
          transition: background-position 0.5s ease; pointer-events: none;
        }
        .axr-btn:hover::after { background-position: 200% center; }
        .axr-btn:hover { transform: scale(1.05); box-shadow: 0 16px 48px rgba(37,99,235,0.35); }
        .axr-btn:active { transform: scale(0.97); }

        /* ── Ghost button ── */
        .axr-ghost {
          transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }
        .axr-ghost:hover { background: #EEF2FF !important; border-color: #A5B4FC !important; transform: scale(1.03); }

        /* ── Lift card ── */
        .axr-lift {
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        }
        .axr-lift:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.1) !important;
        }

        /* ── Module tab ── */
        .axr-tab {
          transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
        }
        .axr-tab:not(.axr-tab-active):hover {
          background: #F1F5F9 !important;
          border-color: #CBD5E1 !important;
          color: #1E293B !important;
        }

        /* ── Feature row ── */
        .axr-feat { transition: background 0.18s ease, transform 0.18s ease; }
        .axr-feat:hover { background: #F8FAFF !important; transform: translateX(3px); }

        /* ── Nav link ── */
        .axr-nav { transition: color 0.2s ease; }
        .axr-nav:hover { color: #2563EB !important; }

        /* ── Workflow card ── */
        .axr-wf { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .axr-wf:hover { transform: translateX(5px); box-shadow: 0 8px 32px rgba(0,0,0,0.08) !important; }

        /* ── Security item ── */
        .axr-sec { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .axr-sec:hover { transform: translateX(5px); box-shadow: 0 4px 20px rgba(0,0,0,0.07) !important; }

        /* ── RBAC row ── */
        .axr-rbac { transition: background 0.18s ease; }
        .axr-rbac:hover { background: #F8FAFF !important; }

        /* ── Tech badge ── */
        .axr-tech { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .axr-tech:hover { transform: translateY(-5px); box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important; }

        /* ── CTA big button ── */
        .axr-cta-btn {
          position: relative; overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
        }
        .axr-cta-btn > * { position: relative; z-index: 1; }
        .axr-cta-btn:hover { transform: scale(1.04); box-shadow: 0 32px 96px rgba(37,99,235,0.45) !important; }
        .axr-cta-btn:active { transform: scale(0.97); }
        .axr-arrow { transition: transform 0.25s ease; }
        .axr-cta-btn:hover .axr-arrow { transform: translateX(6px); }

        /* ── Dot indicator ── */
        .axr-dot { transition: width 0.3s ease, background 0.3s ease; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #C7D2FE; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #818CF8; }
      `}</style>

      {/* ── Overlay de transição ── */}
      {transitioning && (
        <div className="axr-ov" style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div className="axr-logo" style={{ margin: '0 auto 24px' }}>
              <div style={{
                width: 88, height: 88, borderRadius: 26, margin: '0 auto',
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 42, fontWeight: 900, color: 'white',
                fontFamily: 'Sora, sans-serif',
                boxShadow: '0 0 80px rgba(37,99,235,0.35), 0 0 160px rgba(37,99,235,0.15)',
              }}>A</div>
            </div>
            <div className="axr-nm" style={{ fontFamily: 'Sora, sans-serif' }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 18 }}>AxonRH</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <div className="d1" style={{ width: 9, height: 9, borderRadius: '50%', background: '#2563EB' }} />
                <div className="d2" style={{ width: 9, height: 9, borderRadius: '50%', background: '#4F46E5' }} />
                <div className="d3" style={{ width: 9, height: 9, borderRadius: '50%', background: '#7C3AED' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#F7F9FF', color: '#374151', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(247,249,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 32px',
        }}>
          <div style={{ maxWidth: 1300, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 17, color: 'white',
                fontFamily: 'Sora, sans-serif',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              }}>A</div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20, color: '#0F172A', letterSpacing: '-0.02em' }}>AxonRH</span>
              <span style={{
                marginLeft: 4, fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999,
                background: '#EEF2FF', color: '#4F46E5',
                border: '1px solid #C7D2FE', letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>Apresentação</span>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
              {[['#modulos','Módulos'],['#fluxos','Fluxo'],['#diferenciais','Diferenciais'],['#seguranca','Segurança']].map(([href, label]) => (
                <a key={href} href={href} className="axr-nav" style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', textDecoration: 'none' }}>{label}</a>
              ))}
            </nav>

            <button
              onClick={handleStart}
              className="axr-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                color: 'white', fontSize: 13, fontWeight: 700,
                fontFamily: 'Sora, sans-serif',
                boxShadow: '0 4px 18px rgba(37,99,235,0.35)',
              }}
            >
              <Play style={{ width: 12, height: 12, fill: 'white' }} />
              Iniciar
            </button>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{
          position: 'relative', minHeight: '100vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 24px', textAlign: 'center', overflow: 'hidden',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F0F4FF 60%, #F7F9FF 100%)',
        }}>
          {/* Subtle dot grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.5,
          }} />

          {/* Soft orbs */}
          <div className="axr-orb-a" style={{
            position: 'absolute', top: '-10%', left: '-5%',
            width: 700, height: 700, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none',
          }} />
          <div className="axr-orb-b" style={{
            position: 'absolute', bottom: '-15%', right: '-4%',
            width: 800, height: 800, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,70,229,0.09) 0%, transparent 70%)',
            filter: 'blur(90px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: '35%', right: '10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
            filter: 'blur(70px)', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1020 }}>
            <div className="axr-h-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              padding: '9px 20px', borderRadius: 999, marginBottom: 32,
              fontSize: 13, fontWeight: 600,
              background: '#EEF2FF', color: '#4F46E5',
              border: '1px solid #C7D2FE',
            }}>
              <Sparkles style={{ width: 15, height: 15 }} />
              Plataforma SaaS de RH e DP com Inteligência Artificial
            </div>

            <h1 className="axr-h-title axr-display" style={{
              fontSize: 'clamp(56px, 9vw, 104px)',
              fontWeight: 900, lineHeight: 0.9,
              letterSpacing: '-0.045em',
              color: '#0F172A', marginBottom: 32,
            }}>
              O Futuro do<br />
              <span className="axr-grad-text axr-display">RH já chegou</span>
            </h1>

            <p className="axr-h-sub" style={{
              fontSize: 'clamp(17px, 2.3vw, 22px)', color: '#64748B',
              maxWidth: 740, margin: '0 auto 52px', lineHeight: 1.72,
            }}>
              Do recrutamento ao offboarding — controle de ponto, folha de pagamento, benefícios, desempenho e IA em um único ecossistema seguro, inteligente e totalmente digital.
            </p>

            <div className="axr-h-cta" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 14, marginBottom: 72, flexWrap: 'wrap',
            }}>
              <a href="#modulos" className="axr-btn" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '17px 36px', borderRadius: 999,
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                color: 'white', fontWeight: 700, fontSize: 15,
                textDecoration: 'none', fontFamily: 'Sora, sans-serif',
                boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
              }}>
                Explorar Módulos <ArrowRight style={{ width: 17, height: 17 }} />
              </a>
              <a href="#diferenciais" className="axr-ghost" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '17px 36px', borderRadius: 999,
                background: 'white', border: '1.5px solid #E2E8F0',
                color: '#374151', fontWeight: 600, fontSize: 15,
                textDecoration: 'none',
              }}>
                Ver Diferenciais
              </a>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="axr-h-stats" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            }}>
              {[
                { val: '9+',   isNum: true,  label: 'Módulos Integrados',   color: '#2563EB', bg: '#EEF2FF', border: '#BFDBFE' },
                { val: '80%',  isNum: true,  label: 'Menos Chamados ao RH', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
                { val: '100%', isNum: true,  label: 'Digital & Cloud',      color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
                { val: '24/7', isNum: false, label: 'Assistente de IA',     color: '#0891B2', bg: '#ECFEFF', border: '#A5F3FC' },
              ].map((s, i) => (
                <div key={i} className="axr-lift" style={{
                  padding: '28px 20px', borderRadius: 24, textAlign: 'center',
                  background: 'white',
                  border: `1.5px solid ${s.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}>
                  <div className="axr-display" style={{
                    fontSize: 40, fontWeight: 900, letterSpacing: '-0.03em',
                    color: s.color, marginBottom: 10,
                  }}>
                    {s.isNum ? <StatCounter value={s.val} started={statsStarted} /> : s.val}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, lineHeight: 1.45 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll cue */}
          <div style={{
            position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#CBD5E1',
          }}>
            <span style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700 }}>scroll</span>
            <div style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, #3B82F6, transparent)' }} />
          </div>
        </section>

        {/* ── MODULES ── */}
        <section id="modulos" style={{ padding: '128px 24px', background: 'white', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE',
              }}>
                <Layers style={{ width: 13, height: 13 }} /> Módulos do Sistema
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 900,
                color: '#0F172A', letterSpacing: '-0.035em', marginBottom: 16, lineHeight: 1.06,
              }}>
                Tudo que seu RH precisa.<br />Em um único lugar.
              </h2>
              <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 560, margin: '0 auto' }}>
                9 módulos interdependentes, projetados para trabalhar juntos.
              </p>
            </div>

            <div className="axr-reveal" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 272, flexShrink: 0 }}>
                {MODULES.map((m, i) => {
                  const Icon = m.icon;
                  const active = activeModule === i;
                  return (
                    <button
                      key={m.id}
                      className={`axr-tab${active ? ' axr-tab-active' : ''}`}
                      onClick={() => setActiveModule(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 14,
                        border: `1.5px solid ${active ? m.accentBorder : '#E2E8F0'}`,
                        background: active ? m.accentBg : 'white',
                        color: active ? '#0F172A' : '#64748B',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        fontFamily: 'Manrope, sans-serif',
                        transform: active ? 'translateX(4px)' : 'translateX(0)',
                        boxShadow: active ? `0 4px 16px ${m.glowColor}` : 'none',
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? m.accentBg : '#F8FAFC',
                        border: `1px solid ${active ? m.accentBorder : '#E2E8F0'}`,
                      }}>
                        <Icon style={{ width: 15, height: 15, color: active ? m.accentColor : '#94A3B8' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, lineHeight: 1.3, flex: 1 }}>{m.title}</span>
                      {active && <ChevronRight style={{ width: 14, height: 14, flexShrink: 0, color: m.accentColor }} />}
                    </button>
                  );
                })}
              </div>

              {/* Detail panel */}
              <div
                key={activeModule}
                className="axr-panel"
                style={{
                  flex: 1, minWidth: 320, borderRadius: 28, padding: '48px 52px',
                  position: 'relative', overflow: 'hidden',
                  background: 'white',
                  border: `1.5px solid ${mod.accentBorder}`,
                  boxShadow: `0 8px 48px ${mod.glowColor}, 0 2px 12px rgba(0,0,0,0.06)`,
                }}
              >
                <div style={{
                  position: 'absolute', top: '-20%', right: '-8%', width: 440, height: 440,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${mod.accentBg} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 26 }}>
                    <div style={{
                      padding: 16, borderRadius: 20, flexShrink: 0,
                      background: mod.accentBg,
                      border: `1.5px solid ${mod.accentBorder}`,
                    }}>
                      <ModIcon style={{ width: 34, height: 34, color: mod.accentColor }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: mod.accentColor, marginBottom: 8,
                      }}>
                        {mod.subtitle}
                      </div>
                      <h3 className="axr-display" style={{
                        fontSize: 30, fontWeight: 800, color: '#0F172A',
                        letterSpacing: '-0.025em', lineHeight: 1.1,
                      }}>
                        {mod.title}
                      </h3>
                    </div>
                  </div>

                  <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.78, marginBottom: 36, maxWidth: 620 }}>
                    {mod.desc}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                    {mod.features.map((feat, fi) => (
                      <div key={fi} className="axr-feat" style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '13px 15px', borderRadius: 12,
                        background: '#F8FAFC',
                        border: '1px solid #F1F5F9',
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: mod.accentBg, border: `1px solid ${mod.accentBorder}`,
                        }}>
                          <CheckCircle2 style={{ width: 11, height: 11, color: mod.accentColor }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.62 }}>{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {MODULES.map((_, di) => (
                        <button
                          key={di}
                          className="axr-dot"
                          onClick={() => setActiveModule(di)}
                          style={{
                            height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                            width: di === activeModule ? 28 : 6,
                            background: di === activeModule ? mod.accentColor : '#E2E8F0',
                          }}
                        />
                      ))}
                    </div>
                    <span className="axr-display" style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                      {String(activeModule + 1).padStart(2, '0')} / {String(MODULES.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WORKFLOW ── */}
        <section id="fluxos" style={{ padding: '128px 24px', background: '#F7F9FF' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 80 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE',
              }}>
                <Activity style={{ width: 13, height: 13 }} /> Fluxo Operacional
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 900,
                color: '#0F172A', letterSpacing: '-0.035em', marginBottom: 16, lineHeight: 1.06,
              }}>
                Fluxo Operacional<br />de Ponta a Ponta
              </h2>
              <p style={{ fontSize: 18, color: '#94A3B8' }}>Como as operações da empresa fluem naturalmente dentro do sistema.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="axr-reveal" style={{ display: 'flex', gap: 24, alignItems: 'flex-start', transitionDelay: `${i * 90}ms` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 58, height: 58, borderRadius: 18, position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 17,
                        color: step.color,
                        background: 'white',
                        border: `2px solid ${step.color}30`,
                        boxShadow: `0 4px 16px ${step.color}18`,
                      }}>
                        {step.n}
                        <div style={{
                          position: 'absolute', inset: -3, borderRadius: 21,
                          border: `1.5px solid ${step.color}18`,
                          animation: 'axr-ping 3s ease infinite',
                        }} />
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div style={{
                          width: 2, height: 32, marginTop: 6,
                          background: `linear-gradient(to bottom, ${step.color}40, transparent)`,
                          borderRadius: 1,
                        }} />
                      )}
                    </div>
                    <div className="axr-wf" style={{
                      flex: 1, padding: '22px 26px', borderRadius: 20,
                      background: 'white',
                      border: '1.5px solid #E2E8F0',
                      borderLeft: `3px solid ${step.color}50`,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <StepIcon style={{ width: 15, height: 15, color: step.color, flexShrink: 0 }} />
                        <h3 className="axr-display" style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{step.title}</h3>
                      </div>
                      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.78 }}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DIFFERENTIALS ── */}
        <section id="diferenciais" style={{ padding: '128px 24px', background: 'white', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
              }}>
                <Star style={{ width: 13, height: 13 }} /> Diferenciais Competitivos
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 900,
                color: '#0F172A', letterSpacing: '-0.035em', marginBottom: 16, lineHeight: 1.06,
              }}>
                Por que o AxonRH<br />é diferente?
              </h2>
              <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 520, margin: '0 auto' }}>
                Não é mais um sistema de RH. É um ecossistema inteligente criado para eliminar fricções.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {DIFFERENTIALS.map((d, i) => {
                const DIcon = d.icon;
                return (
                  <div key={i} className="axr-reveal axr-lift" style={{
                    padding: '38px', borderRadius: 28,
                    background: 'white',
                    border: '1.5px solid #E2E8F0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    transitionDelay: `${i * 60}ms`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, right: 0, width: 180, height: 180,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${d.accentBg} 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      width: 58, height: 58, borderRadius: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 26, background: d.accentBg,
                      border: `1px solid ${d.accentColor}22`,
                    }}>
                      <DIcon style={{ width: 26, height: 26, color: d.accentColor }} />
                    </div>
                    <h3 className="axr-display" style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.01em' }}>{d.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.78 }}>{d.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SECURITY ── */}
        <section id="seguranca" style={{ padding: '128px 24px', background: '#F7F9FF' }}>
          <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 80, alignItems: 'center' }}>
            <div className="axr-reveal">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 28,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
              }}>
                <Shield style={{ width: 13, height: 13 }} /> Segurança & Compliance
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(34px, 4.5vw, 50px)', fontWeight: 900,
                color: '#0F172A', letterSpacing: '-0.035em', marginBottom: 22, lineHeight: 1.06,
              }}>
                LGPD by Design.<br />RBAC por padrão.
              </h2>
              <p style={{ fontSize: 16, color: '#64748B', lineHeight: 1.78, marginBottom: 36 }}>
                Privacidade e compliance não são recursos adicionais — estão integrados na arquitetura desde o primeiro dia.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: Lock,     title: 'MFA e Recuperação Inteligente',      desc: 'Autenticação com 2FA por token numérico e recuperação segura via email verificado.' },
                  { icon: Eye,      title: 'RBAC Granular',                      desc: 'Permissões funcionais específicas (ex: DASHBOARD:READ) para cada papel dentro da empresa.' },
                  { icon: FileText, title: 'Política de Privacidade Versionada', desc: 'Editor Markdown interno para atualização contínua e versionamento de consentimentos.' },
                  { icon: Database, title: 'Auditoria Completa',                 desc: 'Log de todas as ações sensíveis com rastreabilidade total de quem fez o quê e quando.' },
                ].map((item, i) => {
                  const II = item.icon;
                  return (
                    <div key={i} className="axr-sec" style={{
                      display: 'flex', gap: 16, padding: '16px 18px', borderRadius: 16,
                      background: 'white', border: '1.5px solid #E2E8F0',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#ECFDF5', border: '1px solid #A7F3D0',
                      }}>
                        <II style={{ width: 19, height: 19, color: '#059669' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.62 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RBAC visual */}
            <div className="axr-reveal" style={{
              transitionDelay: '150ms', padding: 32, borderRadius: 28,
              background: 'white', border: '1.5px solid #D1FAE5',
              boxShadow: '0 8px 40px rgba(5,150,105,0.08)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: 22, marginBottom: 22,
                borderBottom: '1.5px solid #F1F5F9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: '#0F172A', fontSize: 15, fontFamily: 'Sora, sans-serif' }}>
                  <Fingerprint style={{ width: 19, height: 19, color: '#059669' }} />
                  Cargos e Permissões
                </div>
                <div style={{
                  fontSize: 11, padding: '5px 12px', borderRadius: 999,
                  background: '#ECFDF5', color: '#059669',
                  border: '1px solid #A7F3D0',
                  fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>RBAC Ativo</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { role: 'Administrador RH',  access: 'Acesso Total',       color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0', perms: ['ADMIN:*','PAYROLL:*','EMPLOYEES:*'] },
                  { role: 'Gestor de Equipe',   access: 'Equipe Própria',     color: '#2563EB', bg: '#DBEAFE', bd: '#BFDBFE', perms: ['TEAM:READ','TIMESHEET:APPROVE'] },
                  { role: 'Gestor Financeiro',  access: 'Folha / Relatórios', color: '#4F46E5', bg: '#EEF2FF', bd: '#C7D2FE', perms: ['PAYROLL:READ','REPORTS:EXPORT'] },
                  { role: 'Colaborador',        access: 'Próprio Perfil',     color: '#64748B', bg: '#F8FAFC', bd: '#E2E8F0', perms: ['SELF:READ','TIMESHEET:WRITE'] },
                  { role: 'Contabilidade Ext.', access: 'Exportações',        color: '#D97706', bg: '#FFFBEB', bd: '#FDE68A', perms: ['REPORTS:EXPORT'] },
                ].map((item, i) => (
                  <div key={i} className="axr-rbac" style={{
                    padding: '14px 16px', borderRadius: 14,
                    background: '#FAFAFA', border: '1.5px solid #F1F5F9',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{item.role}</span>
                      <span style={{
                        fontSize: 11, padding: '4px 11px', borderRadius: 999, fontWeight: 700,
                        background: item.bg, color: item.color, border: `1px solid ${item.bd}`,
                      }}>{item.access}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {item.perms.map((p, j) => (
                        <span key={j} style={{
                          fontSize: 10, padding: '3px 8px', borderRadius: 6,
                          background: '#F1F5F9', color: '#64748B',
                          fontFamily: 'monospace',
                        }}>{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── TECH STACK ── */}
        <section id="tecnologia" style={{ padding: '128px 24px', background: 'white', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 72 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE',
              }}>
                <Cpu style={{ width: 13, height: 13 }} /> Stack Tecnológico
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 900,
                color: '#0F172A', letterSpacing: '-0.035em', marginBottom: 16, lineHeight: 1.06,
              }}>
                Construído com as<br />melhores tecnologias
              </h2>
              <p style={{ fontSize: 18, color: '#94A3B8', maxWidth: 500, margin: '0 auto' }}>
                Arquitetura moderna, cloud-native e type-safe do banco à interface.
              </p>
            </div>

            <div className="axr-reveal" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(192px, 1fr))',
              gap: 14, marginBottom: 48,
            }}>
              {TECH_STACK.map((tech, i) => {
                const TI = tech.icon;
                return (
                  <div key={i} className="axr-tech" style={{
                    padding: '28px 22px', borderRadius: 22, textAlign: 'center',
                    background: '#FAFAFA', border: '1.5px solid #E2E8F0',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  }}>
                    <TI style={{ width: 28, height: 28, color: tech.color, margin: '0 auto 13px' }} />
                    <div className="axr-display" style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 4 }}>{tech.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{tech.desc}</div>
                  </div>
                );
              })}
            </div>

            <div className="axr-reveal" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 18, transitionDelay: '120ms',
            }}>
              {[
                { icon: Globe,    color: '#2563EB', bg: '#DBEAFE', bd: '#BFDBFE', title: 'Cloud-Native & Multi-Tenant',   desc: 'Arquitetura desenhada para escalar de 10 a 100.000 colaboradores com isolamento completo de dados entre empresas.' },
                { icon: Activity, color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0', title: 'Tempo Real por Padrão',          desc: 'WebSockets e Server-Sent Events para que saldos, aprovações e dados críticos sejam sempre atualizados sem refresh.' },
                { icon: Zap,      color: '#D97706', bg: '#FFFBEB', bd: '#FDE68A', title: 'Performance de Primeira Classe', desc: 'Next.js 15 com App Router, React Server Components e edge caching para carregamento em milissegundos.' },
              ].map((item, i) => {
                const II = item.icon;
                return (
                  <div key={i} className="axr-lift" style={{
                    padding: '36px', borderRadius: 26,
                    background: 'white',
                    border: `1.5px solid ${item.bd}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 16,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 22, background: item.bg,
                      border: `1px solid ${item.bd}`,
                    }}>
                      <II style={{ width: 24, height: 24, color: item.color }} />
                    </div>
                    <h3 className="axr-display" style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 11, letterSpacing: '-0.01em' }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.78 }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CTA — dark section for contrast ── */}
        <section id="cta" style={{
          padding: '160px 24px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />
          <div style={{
            position: 'absolute', top: '20%', left: '10%', width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
            filter: 'blur(90px)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', right: '8%', width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="axr-reveal">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 34,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(99,102,241,0.15)', color: '#A5B4FC',
                border: '1px solid rgba(99,102,241,0.35)',
              }}>
                <Play style={{ width: 12, height: 12, fill: '#A5B4FC' }} /> Pronto para começar
              </div>

              <h2 className="axr-display" style={{
                fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 900,
                color: 'white', letterSpacing: '-0.045em', lineHeight: 0.9, marginBottom: 32,
              }}>
                Transforme seu RH<br />
                <span className="axr-grad-text axr-display">agora mesmo</span>
              </h2>

              <p style={{
                fontSize: 19, color: '#94A3B8',
                maxWidth: 540, margin: '0 auto 60px', lineHeight: 1.72,
              }}>
                O sistema está pronto. Os módulos estão configurados. Clique abaixo para entrar no AxonRH.
              </p>

              <button
                onClick={handleStart}
                className="axr-cta-btn axr-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 20,
                  padding: '24px 50px', borderRadius: 999,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                  color: 'white', cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20,
                  letterSpacing: '-0.01em',
                  boxShadow: '0 16px 72px rgba(37,99,235,0.5)',
                }}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: '50%', flexShrink: 0, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.18)',
                }}>
                  <div style={{
                    position: 'absolute', inset: -2, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    animation: 'axr-ping 2.2s ease infinite',
                  }} />
                  <Play style={{ width: 20, height: 20, fill: 'white', marginLeft: 2 }} />
                </div>
                Iniciar Apresentação
                <ArrowRight className="axr-arrow" style={{ width: 22, height: 22 }} />
              </button>

              <p style={{ marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
                Você será redirecionado para a tela de login do sistema
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ padding: '44px 32px', background: '#F7F9FF', borderTop: '1px solid #E2E8F0' }}>
          <div style={{
            maxWidth: 1300, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 14, color: 'white', fontFamily: 'Sora, sans-serif',
              }}>A</div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, color: '#0F172A', fontSize: 17 }}>AxonRH</span>
              <span style={{ fontSize: 13, color: '#CBD5E1' }}>— Plataforma de Gestão de Pessoas</span>
            </div>
            <div style={{ fontSize: 13, color: '#CBD5E1' }}>
              © {new Date().getFullYear()} AxonRH Cloud Systems. Todos os direitos reservados.
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
