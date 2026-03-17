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
    accentColor: '#60A5FA',
    accentBg: 'rgba(59,130,246,0.12)',
    accentBorder: 'rgba(59,130,246,0.35)',
    glowColor: 'rgba(59,130,246,0.12)',
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
    glowColor: 'rgba(99,102,241,0.12)',
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
    glowColor: 'rgba(16,185,129,0.12)',
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
    glowColor: 'rgba(244,63,94,0.12)',
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
    glowColor: 'rgba(245,158,11,0.12)',
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
    glowColor: 'rgba(168,85,247,0.12)',
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
    glowColor: 'rgba(6,182,212,0.12)',
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
    glowColor: 'rgba(20,184,166,0.12)',
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
    glowColor: 'rgba(236,72,153,0.12)',
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function ApresentacaoPage() {
  const router = useRouter();
  const [activeModule, setActiveModule] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [statsStarted, setStatsStarted] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Scroll reveal
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

  // Stats counter trigger
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
        body { font-family: 'Manrope', system-ui, sans-serif; background: #070B18; }
        .axr-display { font-family: 'Sora', system-ui, sans-serif; }

        /* ── Scroll reveal ── */
        .axr-reveal {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1);
        }
        .axr-reveal.axr-visible { opacity: 1; transform: translateY(0); }

        /* ── Keyframes ── */
        @keyframes axr-float-a {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-22px) scale(1.03); }
        }
        @keyframes axr-float-b {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-16px) rotate(4deg); }
        }
        @keyframes axr-float-c {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes axr-grad-shift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes axr-glow-pulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.85; transform: scale(1.12); }
        }
        @keyframes axr-ping {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes axr-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axr-scale-pop {
          0%   { opacity: 0; transform: scale(0.5) rotate(-8deg); }
          70%  { transform: scale(1.1) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes axr-name-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes axr-dot-pulse {
          0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
          40%          { transform: scale(1.3); opacity: 1; }
        }
        @keyframes axr-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes axr-overlay-in {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes axr-panel-in {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes axr-noise {
          0%   { transform: translate(0,0); }
          25%  { transform: translate(-3%,-4%); }
          50%  { transform: translate(4%,3%); }
          75%  { transform: translate(-2%,4%); }
          100% { transform: translate(0,0); }
        }
        @keyframes axr-border-spin {
          to { transform: rotate(360deg); }
        }

        /* ── Ambient orbs ── */
        .axr-orb-a { animation: axr-float-a 10s ease-in-out infinite; }
        .axr-orb-b { animation: axr-float-b 14s ease-in-out infinite; animation-delay: -5s; }
        .axr-orb-c { animation: axr-float-c 12s ease-in-out infinite; animation-delay: -3s; }

        /* ── Gradient text ── */
        .axr-grad {
          background: linear-gradient(90deg, #60A5FA, #818CF8, #C084FC, #F472B6, #60A5FA);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: axr-grad-shift 6s ease infinite;
        }

        /* ── Noise texture ── */
        .axr-noise {
          position: absolute;
          inset: -80px;
          width: calc(100% + 160px);
          height: calc(100% + 160px);
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: 0.022;
          pointer-events: none;
          animation: axr-noise 9s steps(2) infinite;
        }

        /* ── Glass utility ── */
        .axr-glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.09);
        }

        /* ── Lift card ── */
        .axr-lift {
          transition: transform 0.38s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.38s ease, border-color 0.38s ease;
          cursor: default;
        }
        .axr-lift:hover {
          transform: translateY(-7px);
          box-shadow: 0 32px 72px rgba(0,0,0,0.45);
        }

        /* ── Primary button ── */
        .axr-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease;
        }
        .axr-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%);
          background-size: 250% 100%;
          background-position: -200% center;
          transition: background-position 0.5s ease;
          pointer-events: none;
        }
        .axr-btn:hover::after { background-position: 200% center; }
        .axr-btn:hover { transform: scale(1.055); box-shadow: 0 20px 60px rgba(99,102,241,0.5); }
        .axr-btn:active { transform: scale(0.97); }

        /* ── CTA big button ── */
        .axr-cta-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
        }
        .axr-cta-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, #2563EB 0%, #4F46E5 40%, #7C3AED 100%);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .axr-cta-btn:hover::before { opacity: 1; }
        .axr-cta-btn:hover { transform: scale(1.04); box-shadow: 0 28px 90px rgba(99,102,241,0.55); }
        .axr-cta-btn:active { transform: scale(0.97); }
        .axr-cta-btn > * { position: relative; z-index: 1; }
        .axr-cta-arrow { transition: transform 0.25s ease; }
        .axr-cta-btn:hover .axr-cta-arrow { transform: translateX(6px); }

        /* ── Hero entrance ── */
        .axr-h-badge { animation: axr-fade-up 0.85s cubic-bezier(0.16,1,0.3,1) both; }
        .axr-h-title { animation: axr-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .axr-h-sub   { animation: axr-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.22s both; }
        .axr-h-cta   { animation: axr-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.34s both; }
        .axr-h-stats { animation: axr-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) 0.48s both; }

        /* ── Overlay transition ── */
        .axr-ov-wrap { animation: axr-overlay-in 0.5s ease both; }
        .axr-ov-logo { animation: axr-scale-pop 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
        .axr-ov-name { animation: axr-name-in 0.5s ease 0.65s both; }
        .axr-d1 { animation: axr-dot-pulse 1.2s 0s infinite; }
        .axr-d2 { animation: axr-dot-pulse 1.2s 0.2s infinite; }
        .axr-d3 { animation: axr-dot-pulse 1.2s 0.4s infinite; }

        /* ── Module panel ── */
        .axr-panel { animation: axr-panel-in 0.42s cubic-bezier(0.16,1,0.3,1) both; }

        /* ── Module tab ── */
        .axr-tab { transition: all 0.22s ease; }
        .axr-tab:hover { background: rgba(255,255,255,0.045) !important; }

        /* ── Dot indicator ── */
        .axr-dot-ind { transition: width 0.3s ease, background 0.3s ease; }

        /* ── Workflow card ── */
        .axr-wf-card {
          transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease;
        }
        .axr-wf-card:hover {
          transform: translateX(6px);
        }

        /* ── Tech badge ── */
        .axr-tech { transition: transform 0.25s ease, background 0.25s ease; }
        .axr-tech:hover { transform: translateY(-5px); background: rgba(255,255,255,0.055) !important; }

        /* ── Nav link ── */
        .axr-nav { transition: color 0.2s ease; }
        .axr-nav:hover { color: #E2E8F0 !important; }

        /* ── Section divider ── */
        .axr-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent);
        }

        /* ── Feature row hover ── */
        .axr-feat {
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .axr-feat:hover {
          background: rgba(255,255,255,0.055) !important;
          transform: translateX(2px);
        }

        /* ── Security item hover ── */
        .axr-sec-item { transition: transform 0.25s ease, box-shadow 0.25s ease; }
        .axr-sec-item:hover { transform: translateX(5px); }

        /* ── RBAC row hover ── */
        .axr-rbac-row { transition: background 0.2s ease; }
        .axr-rbac-row:hover { background: rgba(255,255,255,0.045) !important; }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #070B18; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.35); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.55); }
      `}</style>

      {/* ── Transition overlay ── */}
      {transitioning && (
        <div className="axr-ov-wrap" style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'linear-gradient(135deg, #070B18 0%, #0E1130 50%, #070B18 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }} />
          <div className="axr-noise" />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div className="axr-ov-logo" style={{ margin: '0 auto 24px' }}>
              <div style={{
                width: 88, height: 88, borderRadius: 26, margin: '0 auto',
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 42, fontWeight: 900, color: 'white',
                fontFamily: 'Sora, sans-serif',
                boxShadow: '0 0 80px rgba(99,102,241,0.7), 0 0 160px rgba(99,102,241,0.3)',
              }}>A</div>
            </div>
            <div className="axr-ov-name" style={{ fontFamily: 'Sora, sans-serif' }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 18 }}>AxonRH</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <div className="axr-d1" style={{ width: 9, height: 9, borderRadius: '50%', background: '#3B82F6' }} />
                <div className="axr-d2" style={{ width: 9, height: 9, borderRadius: '50%', background: '#6366F1' }} />
                <div className="axr-d3" style={{ width: 9, height: 9, borderRadius: '50%', background: '#8B5CF6' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#070B18', color: '#CBD5E1', minHeight: '100vh', overflowX: 'hidden' }}>

        {/* ── Header ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(7,11,24,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '0 32px',
        }}>
          <div style={{ maxWidth: 1300, margin: '0 auto', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 17, color: 'white',
                fontFamily: 'Sora, sans-serif',
                boxShadow: '0 0 22px rgba(99,102,241,0.45)',
              }}>A</div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>AxonRH</span>
              <span style={{
                marginLeft: 4, fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999,
                background: 'rgba(59,130,246,0.1)', color: '#60A5FA',
                border: '1px solid rgba(59,130,246,0.25)', letterSpacing: '0.07em', textTransform: 'uppercase',
              }}>Apresentação</span>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 38 }}>
              {[['#modulos','Módulos'],['#fluxos','Fluxo'],['#diferenciais','Diferenciais'],['#seguranca','Segurança']].map(([href, label]) => (
                <a key={href} href={href} className="axr-nav" style={{ fontSize: 13, fontWeight: 500, color: '#4B5563', textDecoration: 'none' }}>{label}</a>
              ))}
            </nav>

            <button
              onClick={handleStart}
              className="axr-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                color: 'white', fontSize: 13, fontWeight: 700,
                fontFamily: 'Sora, sans-serif',
                boxShadow: '0 0 24px rgba(99,102,241,0.4)',
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
        }}>
          {/* Grid */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
          <div className="axr-noise" />

          {/* Orbs */}
          <div className="axr-orb-a" style={{
            position: 'absolute', top: '-18%', left: '-8%', width: 850, height: 850,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.16) 0%, transparent 70%)',
            filter: 'blur(90px)', pointerEvents: 'none',
            animation: 'axr-glow-pulse 9s ease-in-out infinite',
          }} />
          <div className="axr-orb-b" style={{
            position: 'absolute', bottom: '-22%', right: '-6%', width: 1000, height: 1000,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 70%)',
            filter: 'blur(110px)', pointerEvents: 'none',
          }} />
          <div className="axr-orb-c" style={{
            position: 'absolute', top: '38%', right: '14%', width: 550, height: 550,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(192,132,252,0.09) 0%, transparent 70%)',
            filter: 'blur(70px)', pointerEvents: 'none',
          }} />

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 1020 }}>
            <div className="axr-h-badge" style={{
              display: 'inline-flex', alignItems: 'center', gap: 9,
              padding: '10px 22px', borderRadius: 999, marginBottom: 34,
              fontSize: 13, fontWeight: 600,
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
              color: '#93C5FD',
            }}>
              <Sparkles style={{ width: 15, height: 15 }} />
              Plataforma SaaS de RH e DP com Inteligência Artificial
            </div>

            <h1 className="axr-h-title axr-display" style={{
              fontSize: 'clamp(58px, 9.5vw, 108px)',
              fontWeight: 900, lineHeight: 0.88,
              letterSpacing: '-0.045em',
              color: 'white', marginBottom: 34,
            }}>
              O Futuro do<br />
              <span className="axr-grad axr-display">RH já chegou</span>
            </h1>

            <p className="axr-h-sub" style={{
              fontSize: 'clamp(17px, 2.4vw, 24px)', color: '#94A3B8',
              maxWidth: 760, margin: '0 auto 52px', lineHeight: 1.72,
            }}>
              Do recrutamento ao offboarding — controle de ponto, folha de pagamento, benefícios, desempenho e IA em um único ecossistema seguro, inteligente e totalmente digital.
            </p>

            <div className="axr-h-cta" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 16, marginBottom: 76, flexWrap: 'wrap',
            }}>
              <a href="#modulos" className="axr-btn" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '18px 38px', borderRadius: 999,
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                color: 'white', fontWeight: 700, fontSize: 16,
                textDecoration: 'none', fontFamily: 'Sora, sans-serif',
                boxShadow: '0 0 56px rgba(99,102,241,0.4)',
              }}>
                Explorar Módulos <ArrowRight style={{ width: 18, height: 18 }} />
              </a>
              <a href="#diferenciais" style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '18px 38px', borderRadius: 999,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#CBD5E1', fontWeight: 600, fontSize: 16,
                textDecoration: 'none',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                Ver Diferenciais
              </a>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="axr-h-stats" style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
            }}>
              {[
                { val: '9+',   isNum: true,  label: 'Módulos Integrados',   color: '#60A5FA', glow: 'rgba(59,130,246,0.3)'  },
                { val: '80%',  isNum: true,  label: 'Menos Chamados ao RH', color: '#818CF8', glow: 'rgba(99,102,241,0.3)'  },
                { val: '100%', isNum: true,  label: 'Digital & Cloud',      color: '#34D399', glow: 'rgba(16,185,129,0.3)'  },
                { val: '24/7', isNum: false, label: 'Assistente de IA',     color: '#F472B6', glow: 'rgba(244,114,182,0.3)' },
              ].map((s, i) => (
                <div key={i} className="axr-glass axr-lift" style={{
                  padding: '30px 20px', borderRadius: 26, textAlign: 'center',
                }}>
                  <div className="axr-display" style={{
                    fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em',
                    color: s.color, marginBottom: 10,
                    textShadow: `0 0 32px ${s.glow}`,
                  }}>
                    {s.isNum ? <StatCounter value={s.val} started={statsStarted} /> : s.val}
                  </div>
                  <div style={{ fontSize: 12, color: '#4B5563', fontWeight: 600, lineHeight: 1.45 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll cue */}
          <div style={{
            position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#1E293B',
          }}>
            <span style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 700 }}>scroll</span>
            <div style={{ width: 1, height: 44, background: 'linear-gradient(to bottom, #3B82F6, transparent)' }} />
          </div>
        </section>

        <div className="axr-divider" />

        {/* ── MODULES ── */}
        <section id="modulos" style={{ padding: '140px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '-15%', left: '-8%', width: 700, height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 76 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(99,102,241,0.1)', color: '#818CF8',
                border: '1px solid rgba(99,102,241,0.25)',
              }}>
                <Layers style={{ width: 13, height: 13 }} /> Módulos do Sistema
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(40px, 5.5vw, 62px)', fontWeight: 900,
                color: 'white', letterSpacing: '-0.035em', marginBottom: 18, lineHeight: 1.04,
              }}>
                Tudo que seu RH precisa.<br />Em um único lugar.
              </h2>
              <p style={{ fontSize: 19, color: '#4B5563', maxWidth: 580, margin: '0 auto' }}>
                9 módulos interdependentes, projetados para trabalhar juntos e eliminar as integrações problemáticas.
              </p>
            </div>

            <div className="axr-reveal" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 278, flexShrink: 0 }}>
                {MODULES.map((m, i) => {
                  const Icon = m.icon;
                  const active = activeModule === i;
                  return (
                    <button
                      key={m.id}
                      className="axr-tab"
                      onClick={() => setActiveModule(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 14,
                        border: `1px solid ${active ? m.accentBorder : 'rgba(255,255,255,0.06)'}`,
                        background: active ? m.accentBg : 'rgba(255,255,255,0.02)',
                        color: active ? '#F1F5F9' : '#374151',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                        fontFamily: 'Manrope, sans-serif',
                        transform: active ? 'translateX(5px)' : 'translateX(0)',
                        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                        boxShadow: active ? `0 0 20px ${m.glowColor}` : 'none',
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? m.accentBg : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${active ? m.accentBorder : 'rgba(255,255,255,0.07)'}`,
                      }}>
                        <Icon style={{ width: 15, height: 15, color: active ? m.accentColor : '#374151' }} />
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
                className="axr-panel axr-glass"
                style={{
                  flex: 1, minWidth: 320, borderRadius: 32, padding: '50px 56px',
                  position: 'relative', overflow: 'hidden',
                  border: `1px solid ${mod.accentBorder}`,
                  boxShadow: `0 0 80px ${mod.glowColor}`,
                }}
              >
                <div style={{
                  position: 'absolute', top: '-20%', right: '-8%', width: 520, height: 520,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${mod.glowColor} 0%, transparent 70%)`,
                  filter: 'blur(80px)', pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Panel header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, marginBottom: 28 }}>
                    <div style={{
                      padding: 18, borderRadius: 22, flexShrink: 0,
                      background: mod.accentBg,
                      border: `1.5px solid ${mod.accentBorder}`,
                      boxShadow: `0 0 40px ${mod.glowColor}`,
                    }}>
                      <ModIcon style={{ width: 36, height: 36, color: mod.accentColor }} />
                    </div>
                    <div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: mod.accentColor, marginBottom: 8,
                      }}>
                        {mod.subtitle}
                      </div>
                      <h3 className="axr-display" style={{
                        fontSize: 34, fontWeight: 800, color: 'white',
                        letterSpacing: '-0.025em', lineHeight: 1.08,
                      }}>
                        {mod.title}
                      </h3>
                    </div>
                  </div>

                  <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.78, marginBottom: 38, maxWidth: 640 }}>
                    {mod.desc}
                  </p>

                  {/* Features */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 11 }}>
                    {mod.features.map((feat, fi) => (
                      <div key={fi} className="axr-feat" style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '14px 16px', borderRadius: 14,
                        background: 'rgba(255,255,255,0.028)',
                        border: '1px solid rgba(255,255,255,0.065)',
                      }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: mod.accentBg, border: `1px solid ${mod.accentBorder}`,
                        }}>
                          <CheckCircle2 style={{ width: 11, height: 11, color: mod.accentColor }} />
                        </div>
                        <span style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.62 }}>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div style={{ marginTop: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {MODULES.map((_, di) => (
                        <button
                          key={di}
                          className="axr-dot-ind"
                          onClick={() => setActiveModule(di)}
                          style={{
                            height: 6, borderRadius: 3, border: 'none', cursor: 'pointer',
                            width: di === activeModule ? 30 : 6,
                            background: di === activeModule ? mod.accentColor : 'rgba(255,255,255,0.12)',
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: '#1E293B', fontWeight: 600, fontFamily: 'Sora, sans-serif' }}>
                      {String(activeModule + 1).padStart(2, '0')} / {String(MODULES.length).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="axr-divider" />

        {/* ── WORKFLOW ── */}
        <section id="fluxos" style={{
          padding: '140px 24px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.025) 50%, transparent 100%)',
        }}>
          <div style={{
            position: 'absolute', top: '15%', right: '-4%', width: 650, height: 650,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none',
          }} />
          <div className="axr-noise" />

          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 84 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(59,130,246,0.1)', color: '#60A5FA',
                border: '1px solid rgba(59,130,246,0.25)',
              }}>
                <Activity style={{ width: 13, height: 13 }} /> Fluxo Operacional
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(40px, 5.5vw, 62px)', fontWeight: 900,
                color: 'white', letterSpacing: '-0.035em', marginBottom: 18, lineHeight: 1.04,
              }}>
                Fluxo Operacional<br />de Ponta a Ponta
              </h2>
              <p style={{ fontSize: 19, color: '#4B5563' }}>Como as operações da empresa fluem naturalmente dentro do sistema.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {WORKFLOW_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="axr-reveal" style={{ display: 'flex', gap: 28, alignItems: 'flex-start', transitionDelay: `${i * 95}ms` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 18, position: 'relative',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Sora, sans-serif', fontWeight: 900, fontSize: 17, color: step.color,
                        background: `${step.color}14`,
                        border: `1.5px solid ${step.color}40`,
                        boxShadow: `0 0 24px ${step.color}20`,
                      }}>
                        {step.n}
                        <div style={{
                          position: 'absolute', inset: -2, borderRadius: 20,
                          border: `1px solid ${step.color}28`,
                          animation: 'axr-ping 2.8s ease infinite',
                        }} />
                      </div>
                      {i < WORKFLOW_STEPS.length - 1 && (
                        <div style={{
                          width: 2, height: 36, marginTop: 8,
                          background: `linear-gradient(to bottom, ${step.color}50, transparent)`,
                          borderRadius: 1,
                        }} />
                      )}
                    </div>
                    <div className="axr-glass axr-wf-card" style={{
                      flex: 1, padding: '24px 28px', borderRadius: 22,
                      border: '1px solid rgba(255,255,255,0.075)',
                      borderLeft: `2px solid ${step.color}45`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
                        <StepIcon style={{ width: 16, height: 16, color: step.color, flexShrink: 0 }} />
                        <h3 className="axr-display" style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{step.title}</h3>
                      </div>
                      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.78 }}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="axr-divider" />

        {/* ── DIFFERENTIALS ── */}
        <section id="diferenciais" style={{ padding: '140px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', bottom: '-10%', right: '-6%', width: 750, height: 750,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
            filter: 'blur(90px)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 76 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(16,185,129,0.1)', color: '#34D399',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                <Star style={{ width: 13, height: 13 }} /> Diferenciais Competitivos
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(40px, 5.5vw, 62px)', fontWeight: 900,
                color: 'white', letterSpacing: '-0.035em', marginBottom: 18, lineHeight: 1.04,
              }}>
                Por que o AxonRH<br />é diferente?
              </h2>
              <p style={{ fontSize: 19, color: '#4B5563', maxWidth: 540, margin: '0 auto' }}>
                Não é mais um sistema de RH. É um ecossistema inteligente criado para eliminar fricções.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(348px, 1fr))', gap: 20 }}>
              {DIFFERENTIALS.map((d, i) => {
                const DIcon = d.icon;
                return (
                  <div key={i} className="axr-reveal axr-glass axr-lift" style={{
                    padding: '42px', borderRadius: 30,
                    background: 'rgba(255,255,255,0.028)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transitionDelay: `${i * 65}ms`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: -40, right: -40, width: 220, height: 220,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${d.accentColor}09 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />
                    <div style={{
                      width: 62, height: 62, borderRadius: 20, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 28,
                      background: d.accentBg,
                      border: `1px solid ${d.accentColor}30`,
                      boxShadow: `0 0 28px ${d.accentColor}15`,
                    }}>
                      <DIcon style={{ width: 28, height: 28, color: d.accentColor }} />
                    </div>
                    <h3 className="axr-display" style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 14, letterSpacing: '-0.01em' }}>{d.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.78 }}>{d.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="axr-divider" />

        {/* ── SECURITY ── */}
        <section id="seguranca" style={{
          padding: '140px 24px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.03) 50%, transparent 100%)',
        }}>
          <div style={{
            position: 'absolute', top: '10%', left: '-6%', width: 650, height: 650,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none',
          }} />
          <div className="axr-noise" />

          <div style={{ maxWidth: 1300, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 80, alignItems: 'center' }}>
            {/* Left */}
            <div className="axr-reveal">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 28,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(16,185,129,0.1)', color: '#34D399',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                <Shield style={{ width: 13, height: 13 }} /> Segurança & Compliance
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(36px, 4.5vw, 54px)', fontWeight: 900,
                color: 'white', letterSpacing: '-0.035em', marginBottom: 24, lineHeight: 1.04,
              }}>
                LGPD by Design.<br />RBAC por padrão.
              </h2>
              <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.78, marginBottom: 40 }}>
                Privacidade e compliance não são recursos adicionais — estão integrados na arquitetura desde o primeiro dia.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: Lock,     title: 'MFA e Recuperação Inteligente',      desc: 'Autenticação com 2FA por token numérico e recuperação segura de conta via email verificado.' },
                  { icon: Eye,      title: 'RBAC Granular',                      desc: 'Permissões funcionais específicas (ex: DASHBOARD:READ) para cada papel dentro da empresa.' },
                  { icon: FileText, title: 'Política de Privacidade Versionada', desc: 'Editor Markdown interno para atualização contínua de políticas e versionamento de consentimentos.' },
                  { icon: Database, title: 'Auditoria Completa',                 desc: 'Log de todas as ações sensíveis com rastreabilidade total de quem fez o quê e quando.' },
                ].map((item, i) => {
                  const II = item.icon;
                  return (
                    <div key={i} className="axr-glass axr-sec-item" style={{
                      display: 'flex', gap: 18, padding: '18px 20px', borderRadius: 18,
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        boxShadow: '0 0 20px rgba(16,185,129,0.1)',
                      }}>
                        <II style={{ width: 20, height: 20, color: '#34D399' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 6 }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.62 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — RBAC visual */}
            <div className="axr-reveal axr-glass" style={{
              transitionDelay: '160ms',
              padding: 36, borderRadius: 32,
              border: '1px solid rgba(52,211,153,0.18)',
              boxShadow: '0 0 80px rgba(16,185,129,0.06)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: 24, marginBottom: 24,
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'white', fontSize: 16, fontFamily: 'Sora, sans-serif' }}>
                  <Fingerprint style={{ width: 20, height: 20, color: '#34D399' }} />
                  Cargos e Permissões
                </div>
                <div style={{
                  fontSize: 11, padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(16,185,129,0.1)', color: '#34D399',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>RBAC Ativo</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {[
                  { role: 'Administrador RH',  access: 'Acesso Total',       color: '#34D399', bg: 'rgba(16,185,129,0.1)',   perms: ['ADMIN:*','PAYROLL:*','EMPLOYEES:*'] },
                  { role: 'Gestor de Equipe',   access: 'Equipe Própria',     color: '#60A5FA', bg: 'rgba(59,130,246,0.1)',   perms: ['TEAM:READ','TIMESHEET:APPROVE'] },
                  { role: 'Gestor Financeiro',  access: 'Folha / Relatórios', color: '#818CF8', bg: 'rgba(99,102,241,0.1)',  perms: ['PAYROLL:READ','REPORTS:EXPORT'] },
                  { role: 'Colaborador',        access: 'Próprio Perfil',     color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', perms: ['SELF:READ','TIMESHEET:WRITE'] },
                  { role: 'Contabilidade Ext.', access: 'Exportações',        color: '#FCD34D', bg: 'rgba(252,211,77,0.1)',  perms: ['REPORTS:EXPORT'] },
                ].map((item, i) => (
                  <div key={i} className="axr-rbac-row" style={{
                    padding: '15px 18px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.065)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{item.role}</span>
                      <span style={{
                        fontSize: 11, padding: '4px 11px', borderRadius: 999, fontWeight: 700,
                        background: item.bg, color: item.color, border: `1px solid ${item.color}32`,
                      }}>{item.access}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {item.perms.map((p, j) => (
                        <span key={j} style={{
                          fontSize: 10, padding: '3px 8px', borderRadius: 6,
                          background: 'rgba(255,255,255,0.05)', color: '#374151',
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

        <div className="axr-divider" />

        {/* ── TECH STACK ── */}
        <section id="tecnologia" style={{ padding: '140px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: '25%', right: '-4%', width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
            filter: 'blur(80px)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 1300, margin: '0 auto' }}>
            <div className="axr-reveal" style={{ textAlign: 'center', marginBottom: 76 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 20,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(99,102,241,0.1)', color: '#818CF8',
                border: '1px solid rgba(99,102,241,0.25)',
              }}>
                <Cpu style={{ width: 13, height: 13 }} /> Stack Tecnológico
              </div>
              <h2 className="axr-display" style={{
                fontSize: 'clamp(40px, 5.5vw, 62px)', fontWeight: 900,
                color: 'white', letterSpacing: '-0.035em', marginBottom: 18, lineHeight: 1.04,
              }}>
                Construído com as<br />melhores tecnologias
              </h2>
              <p style={{ fontSize: 19, color: '#4B5563', maxWidth: 520, margin: '0 auto' }}>
                Arquitetura moderna, cloud-native e type-safe do banco à interface.
              </p>
            </div>

            <div className="axr-reveal" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))',
              gap: 14, marginBottom: 52,
            }}>
              {TECH_STACK.map((tech, i) => {
                const TI = tech.icon;
                return (
                  <div key={i} className="axr-glass axr-tech" style={{
                    padding: '30px 24px', borderRadius: 24, textAlign: 'center',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.075)',
                  }}>
                    <TI style={{ width: 30, height: 30, color: tech.color, margin: '0 auto 14px' }} />
                    <div className="axr-display" style={{ fontWeight: 700, color: 'white', fontSize: 15, marginBottom: 5 }}>{tech.name}</div>
                    <div style={{ fontSize: 11, color: '#374151' }}>{tech.desc}</div>
                  </div>
                );
              })}
            </div>

            <div className="axr-reveal" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(328px, 1fr))',
              gap: 20, transitionDelay: '130ms',
            }}>
              {[
                { icon: Globe,    color: '#60A5FA', border: 'rgba(59,130,246,0.22)',  bg: 'rgba(59,130,246,0.08)',  title: 'Cloud-Native & Multi-Tenant',   desc: 'Arquitetura desenhada para escalar de 10 a 100.000 colaboradores com isolamento completo de dados entre empresas.' },
                { icon: Activity, color: '#34D399', border: 'rgba(16,185,129,0.22)', bg: 'rgba(16,185,129,0.08)', title: 'Tempo Real por Padrão',          desc: 'WebSockets e Server-Sent Events para que saldos, aprovações e dados críticos sejam sempre atualizados sem refresh.' },
                { icon: Zap,      color: '#FCD34D', border: 'rgba(245,158,11,0.22)',  bg: 'rgba(245,158,11,0.08)',  title: 'Performance de Primeira Classe', desc: 'Next.js 15 com App Router, React Server Components e edge caching para carregamento em milissegundos.' },
              ].map((item, i) => {
                const II = item.icon;
                return (
                  <div key={i} className="axr-glass axr-lift" style={{
                    padding: '38px', borderRadius: 28,
                    background: 'rgba(255,255,255,0.022)',
                    border: `1px solid ${item.border}`,
                  }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 24, background: item.bg,
                      border: `1px solid ${item.border}`,
                      boxShadow: `0 0 30px ${item.color}15`,
                    }}>
                      <II style={{ width: 24, height: 24, color: item.color }} />
                    </div>
                    <h3 className="axr-display" style={{ fontSize: 19, fontWeight: 700, color: 'white', marginBottom: 12, letterSpacing: '-0.01em' }}>{item.title}</h3>
                    <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.78 }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="axr-divider" />

        {/* ── CTA ── */}
        <section id="cta" style={{ padding: '168px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.13) 0%, transparent 60%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '48px 48px', pointerEvents: 'none',
          }} />
          <div className="axr-noise" />

          <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="axr-reveal">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 18px', borderRadius: 999, marginBottom: 34,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: 'rgba(99,102,241,0.1)', color: '#818CF8',
                border: '1px solid rgba(99,102,241,0.3)',
              }}>
                <Play style={{ width: 12, height: 12, fill: '#818CF8' }} /> Pronto para começar
              </div>

              <h2 className="axr-display" style={{
                fontSize: 'clamp(50px, 8.5vw, 100px)', fontWeight: 900,
                color: 'white', letterSpacing: '-0.045em', lineHeight: 0.88, marginBottom: 34,
              }}>
                Transforme seu RH<br />
                <span className="axr-display axr-grad">agora mesmo</span>
              </h2>

              <p style={{
                fontSize: 20, color: '#94A3B8',
                maxWidth: 560, margin: '0 auto 64px', lineHeight: 1.72,
              }}>
                O sistema está pronto. Os módulos estão configurados. Clique abaixo para entrar no AxonRH.
              </p>

              <button
                onClick={handleStart}
                className="axr-cta-btn"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 22,
                  padding: '26px 52px', borderRadius: 999,
                  border: '1.5px solid rgba(99,102,241,0.5)',
                  background: 'linear-gradient(135deg, #111827, #1E1B4B)',
                  color: 'white', cursor: 'pointer',
                  fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 22,
                  letterSpacing: '-0.01em',
                  boxShadow: '0 0 100px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: '50%', flexShrink: 0, position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                  boxShadow: '0 0 36px rgba(99,102,241,0.7)',
                }}>
                  <div style={{
                    position: 'absolute', inset: -2, borderRadius: '50%',
                    border: '2px solid rgba(99,102,241,0.4)',
                    animation: 'axr-ping 2.2s ease infinite',
                  }} />
                  <Play style={{ width: 22, height: 22, fill: 'white', marginLeft: 2 }} />
                </div>
                Iniciar Apresentação
                <ArrowRight className="axr-cta-arrow" style={{ width: 24, height: 24 }} />
              </button>

              <p style={{ marginTop: 24, fontSize: 13, color: '#1E293B' }}>
                Você será redirecionado para a tela de login do sistema
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ padding: '46px 32px', borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <div style={{
            maxWidth: 1300, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 14, color: 'white', fontFamily: 'Sora, sans-serif',
              }}>A</div>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, color: 'white', fontSize: 17 }}>AxonRH</span>
              <span style={{ fontSize: 13, color: '#1E293B' }}>— Plataforma de Gestão de Pessoas</span>
            </div>
            <div style={{ fontSize: 13, color: '#1E293B' }}>
              © {new Date().getFullYear()} AxonRH Cloud Systems. Todos os direitos reservados.
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
