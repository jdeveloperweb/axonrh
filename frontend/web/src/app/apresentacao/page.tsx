'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Shield, Calendar, Banknote, BrainCircuit, Award,
  Smartphone, CheckCircle2, BarChart3, UserPlus, Fingerprint,
  HeartHandshake, Clock, Sparkles, FileText, Pause, Play as PlayIcon,
  Cpu, Layers, Eye, ChevronRight, ChevronLeft, Users, Zap,
  Lock, Database, Activity, Star, Globe,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Module {
  id: string; icon: React.ElementType;
  accentColor: string; accentBg: string; accentBorder: string; glowColor: string;
  title: string; subtitle: string; desc: string; features: string[];
}
interface Slide { id: string; type: string; label: string; duration: number; data?: Module; }

// ─── Data ────────────────────────────────────────────────────────────────────

const MODULES: Module[] = [
  {
    id: 'admissao', icon: UserPlus,
    accentColor: '#2563EB', accentBg: 'rgba(37,99,235,0.07)',
    accentBorder: 'rgba(37,99,235,0.22)', glowColor: 'rgba(37,99,235,0.06)',
    title: 'Admissão e Contratação', subtitle: 'Digital do início ao fim',
    desc: 'Elimine o papel. Todo o processo admissional — da proposta à assinatura — acontece digitalmente, com validação automática de documentos por IA e OCR.',
    features: ['OCR automático para leitura de RG, CPF, CNH e comprovantes','Assinatura eletrônica com validade jurídica (ICP-Brasil)','Portal do candidato com checklist de pendências interativo','Geração automática de contrato por tipo de vínculo (CLT, PJ, Estágio)','Integração com eSocial S-2200 para admissão automática','Onboarding digital com vídeos, políticas e quizzes de integração'],
  },
  {
    id: 'ponto', icon: Clock,
    accentColor: '#4F46E5', accentBg: 'rgba(79,70,229,0.07)',
    accentBorder: 'rgba(79,70,229,0.22)', glowColor: 'rgba(79,70,229,0.06)',
    title: 'Gestão de Ponto', subtitle: 'Timesheet inteligente e geolocalizado',
    desc: 'Controle de jornada com geolocalização, banco de horas automatizado e aprovação de espelhos em 1 clique — tudo acessível pelo celular.',
    features: ['Registro via GPS com validação de cerca geográfica (Geofencing)','Reconhecimento facial para autenticação biométrica opcional','Banco de horas com saldo em tempo real por colaborador','Horas extras, adicional noturno e interjornada calculados automaticamente','Espelho de ponto digital — colaborador aprova, contesta ou justifica ausência','Dashboard de ausências, atrasos e pontualidade por equipe'],
  },
  {
    id: 'folha', icon: Banknote,
    accentColor: '#059669', accentBg: 'rgba(5,150,105,0.07)',
    accentBorder: 'rgba(5,150,105,0.22)', glowColor: 'rgba(5,150,105,0.06)',
    title: 'Folha de Pagamento', subtitle: 'Cálculo dinâmico e preciso',
    desc: 'Motor de cálculo configurável que processa folha completa, adiantamentos, férias e rescisões com total aderência às normas trabalhistas vigentes.',
    features: ['Cálculo dinâmico de INSS, IRRF, FGTS e descontos de convênios','Adiantamento salarial com controle de parcelas e datas','Férias proporcionais, 1/3 constitucional e abono pecuniário','Rescisão completa com TRCT e homologação digital','Exportação de SEFIP, DIRF, RAIS e arquivos eSocial','Holerite PDF gerado automaticamente e disponível no app do colaborador'],
  },
  {
    id: 'beneficios', icon: HeartHandshake,
    accentColor: '#DC2626', accentBg: 'rgba(220,38,38,0.07)',
    accentBorder: 'rgba(220,38,38,0.22)', glowColor: 'rgba(220,38,38,0.06)',
    title: 'Benefícios Inteligentes', subtitle: 'Regras automáticas por cargo',
    desc: 'Gerencie VA, VR, VT e Plano de Saúde com regras configuráveis por senioridade, categoria e vínculo. Zero planilha, zero erro.',
    features: ['VA/VR/VT configuráveis por faixa salarial e categoria funcional','Inclusão e exclusão de dependentes no plano de saúde com workflow de aprovação','Co-participação médica, franquias e tetos calculados automaticamente','Isenção de VT por faixa salarial conforme legislação vigente','Histórico de utilizações e custo total de benefícios por colaborador','Notificações automáticas de vencimento e renovação de convênios'],
  },
  {
    id: 'desempenho', icon: Award,
    accentColor: '#D97706', accentBg: 'rgba(217,119,6,0.07)',
    accentBorder: 'rgba(217,119,6,0.22)', glowColor: 'rgba(217,119,6,0.06)',
    title: 'Desempenho e Carreira', subtitle: 'Crescimento contínuo das pessoas',
    desc: 'Ciclos de avaliação configuráveis, feedbacks contínuos, matriz 9-box e planos de desenvolvimento individual integrados à jornada.',
    features: ['Avaliações 90°, 180° e 360° com perguntas customizáveis por ciclo','Feedback contínuo peer-to-peer, gestor para liderado e auto-avaliação','Matriz 9-Box interativa com visualização da distribuição da equipe','Plano de Desenvolvimento Individual (PDI) com ações e prazos rastreados','Trilhas de aprendizagem com checkpoints e validação pelo gestor','Metas SMART linkadas a indicadores de performance individuais e de equipe'],
  },
  {
    id: 'eventos', icon: Calendar,
    accentColor: '#7C3AED', accentBg: 'rgba(124,58,237,0.07)',
    accentBorder: 'rgba(124,58,237,0.22)', glowColor: 'rgba(124,58,237,0.06)',
    title: 'Eventos Corporativos', subtitle: 'Engajamento e presença digital',
    desc: 'Plataforma completa para criar, publicar e gerenciar eventos internos com check-in por QR Code e controle de presença em tempo real.',
    features: ['Criação de eventos com limite de vagas, local e RSVP digital','QR Code único e personalizável por participante para check-in','Painel admin com listas de presença em tempo real','Notificações automáticas de confirmação, lembrete e cancelamento','Relatório pós-evento com taxa de comparecimento e feedbacks','Galeria de fotos e histórico completo de eventos arquivados'],
  },
  {
    id: 'ia', icon: BrainCircuit,
    accentColor: '#0891B2', accentBg: 'rgba(8,145,178,0.07)',
    accentBorder: 'rgba(8,145,178,0.22)', glowColor: 'rgba(8,145,178,0.06)',
    title: 'Assistente de IA', subtitle: '24/7 — sem fila, sem espera',
    desc: 'IA integrada que responde dúvidas sobre políticas, holerites e benefícios com precisão contextual, reduzindo chamados ao RH em até 80%.',
    features: ['Chatbot contextualizado com dados reais do colaborador autenticado','Responde sobre holerite, férias, saldo de banco de horas e benefícios ativos','Políticas internas indexadas e pesquisáveis por linguagem natural','Escalada automática para o RH humano em casos de alta complexidade','Histórico completo de conversas auditável pelo administrador','Melhora contínua a partir das interações e feedbacks dos usuários'],
  },
  {
    id: 'dashboards', icon: BarChart3,
    accentColor: '#0D9488', accentBg: 'rgba(13,148,136,0.07)',
    accentBorder: 'rgba(13,148,136,0.22)', glowColor: 'rgba(13,148,136,0.06)',
    title: 'Dashboards Gerenciais', subtitle: 'Visibilidade total ou granular',
    desc: 'Painéis analíticos em tempo real com visões baseadas em RBAC — gestores veem apenas sua equipe, admins têm visão consolidada de toda a empresa.',
    features: ['KPIs de headcount, turnover, absenteísmo e custo total de pessoal','Gráficos interativos de evolução de folha de pagamento mês a mês','Filtros por departamento, cargo, localidade e período','Visão do gestor estritamente restrita à sua própria equipe','Exportação de relatórios gerenciais em CSV e PDF formatado','Alertas configuráveis por indicador crítico com notificação em tempo real'],
  },
  {
    id: 'mobile', icon: Smartphone,
    accentColor: '#DB2777', accentBg: 'rgba(219,39,119,0.07)',
    accentBorder: 'rgba(219,39,119,0.22)', glowColor: 'rgba(219,39,119,0.06)',
    title: 'Mobile First / PWA', subtitle: 'Na palma da mão — sempre',
    desc: 'Progressive Web App instalável em Android e iOS. Todo o poder do AxonRH acessível do celular, com funcionalidades offline e sincronização automática.',
    features: ['Instalação como app nativo em Android e iOS sem app store','Modo offline com sincronização automática ao reconectar','Push notifications para aprovações, alertas e eventos','Interface responsiva e touch-friendly para telas pequenas','Acesso rápido a holerite PDF, espelho de ponto e benefícios','Check-in em eventos via câmera com leitura de QR Code nativa'],
  },
];

const DIFFERENTIALS = [
  { icon: Zap,          title: 'Tudo em um único ecossistema', desc: 'Fim às integrações quebradas entre sistemas de ponto, folha, benefícios e DP. Um ecossistema coeso, projetado para trabalhar junto.', color: '#D97706', bg: '#FFFBEB', bd: '#FDE68A' },
  { icon: BrainCircuit, title: 'IA que realmente funciona',     desc: 'Não é um chatbot genérico. A IA conhece os dados reais de cada colaborador e responde com precisão contextual, sem inventar.',       color: '#0891B2', bg: '#ECFEFF', bd: '#A5F3FC' },
  { icon: Shield,       title: 'LGPD by Design',                desc: 'Privacidade integrada na arquitetura desde o dia 1. Controle granular de consentimentos, direitos dos titulares e auditoria completa.',   color: '#059669', bg: '#ECFDF5', bd: '#A7F3D0' },
  { icon: Activity,     title: 'Tudo em tempo real',            desc: 'Saldos de banco de horas, aprovações pendentes, check-ins em eventos. Dados atualizados em tempo real sem refresh, sem atraso.',          color: '#2563EB', bg: '#DBEAFE', bd: '#BFDBFE' },
  { icon: Cpu,          title: 'Escalabilidade cloud-native',   desc: 'Arquitetura que escala de 10 a 100.000 colaboradores sem mudança de configuração. Multi-tenant com isolamento total de dados.',           color: '#4F46E5', bg: '#EEF2FF', bd: '#C7D2FE' },
  { icon: Users,        title: 'Self-service que libera o RH',  desc: 'O colaborador resolve sozinho pelo app. Holerite, espelho, benefícios, dúvidas com a IA. O RH foca em estratégia, não em chamados.',     color: '#DC2626', bg: '#FEF2F2', bd: '#FECACA' },
];

const TECH_STACK = [
  { name: 'Next.js 15',  desc: 'App Router · RSC', icon: Globe,        color: '#1E293B' },
  { name: 'TypeScript',  desc: 'Type-safe',        icon: FileText,     color: '#2563EB' },
  { name: 'PostgreSQL',  desc: 'Banco relacional', icon: Database,     color: '#1D4ED8' },
  { name: 'LGPD Native', desc: 'Compliance',       icon: Shield,       color: '#059669' },
  { name: 'PWA',         desc: 'Mobile-first',     icon: Smartphone,   color: '#7C3AED' },
  { name: 'IA Integrada',desc: 'LLM contextual',   icon: BrainCircuit, color: '#0891B2' },
  { name: 'RBAC',        desc: 'Permissões finas', icon: Lock,         color: '#D97706' },
  { name: 'eSocial',     desc: 'Integração nativa',icon: Layers,       color: '#DC2626' },
];

const WORKFLOW_STEPS = [
  { n:'01', title:'Abertura de Vaga & Admissão Digital',  color:'#2563EB', icon:UserPlus,      desc:'O gestor solicita uma contratação. Após aprovação pelo RH, o candidato acessa o portal, envia seus documentos e o OCR valida os dados automaticamente. O contrato é assinado digitalmente em minutos.' },
  { n:'02', title:'Onboarding e Configuração de Benefícios',color:'#4F46E5', icon:HeartHandshake,desc:'Com base no cargo e vínculo, o sistema provisiona automaticamente VA, VR, VT e plano de saúde. O colaborador recebe onboarding digital com vídeos, políticas internas e questionário de integração.' },
  { n:'03', title:'Rotina de Ponto e Jornada',            color:'#7C3AED', icon:Clock,         desc:'Diariamente, o colaborador registra o ponto pelo PWA com geolocalização. O sistema calcula automaticamente atrasos, horas extras e adicional noturno, atualizando o dashboard do gestor em tempo real.' },
  { n:'04', title:'Fechamento de Folha em 1 Clique',      color:'#0891B2', icon:Banknote,      desc:'No fechamento mensal, todas as conciliações de ponto, descontos de convênio, adiantamentos e premiações são consolidadas automaticamente. A folha é processada e o holerite enviado ao app do colaborador.' },
  { n:'05', title:'Engajamento Contínuo via Mobile e IA', color:'#059669', icon:BrainCircuit,  desc:'O colaborador acessa o holerite PDF pelo celular, tira dúvidas com a IA sobre co-participação médica e VT, e faz check-in em eventos corporativos pelo QR Code — tudo sem precisar contatar o RH.' },
];

// ─── Slides definition ───────────────────────────────────────────────────────

const SLIDES: Slide[] = [
  { id: 'hero',     type: 'hero',    label: 'AxonRH',            duration: 9000 },
  { id: 'modules-overview', type: 'modules-overview', label: 'Visão Geral dos Módulos', duration: 6000 },
  ...MODULES.map((m) => ({ id: `mod-${m.id}`, type: 'module', label: m.title, duration: 7000, data: m })),
  { id: 'workflow',     type: 'workflow',     label: 'Fluxo Operacional',    duration: 9000 },
  { id: 'differentials',type: 'differentials',label: 'Diferenciais',         duration: 8000 },
  { id: 'security',    type: 'security',     label: 'Segurança & Compliance',duration: 9000 },
  { id: 'tech',        type: 'tech',         label: 'Tecnologia',            duration: 8000 },
  { id: 'cta',         type: 'cta',          label: 'Pronto para começar',   duration: 99999 },
];

// ─── Stat Counter ─────────────────────────────────────────────────────────────

function StatCounter({ value, started }: { value: string; started: boolean }) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return <>{value}</>;
  const [, numStr, suffix] = match;
  const target = parseInt(numStr, 10);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) { setCount(0); return; }
    const duration = 2000;
    let raf: number;
    let startTs: number | null = null;
    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * target));
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

  // Presentation state
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Refs to avoid stale closures in RAF
  const playingRef = useRef(true);
  const currentRef = useRef(0);
  const progressRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Keep refs in sync
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { currentRef.current = current; }, [current]);

  // Single RAF loop for progress
  useEffect(() => {
    lastTimeRef.current = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      if (playingRef.current) {
        const dur = SLIDES[currentRef.current].duration;
        const inc = (dt / dur) * 100;
        const next = Math.min(progressRef.current + inc, 100);
        progressRef.current = next;
        setProgress(next);
        if (next >= 100 && currentRef.current < SLIDES.length - 1) {
          progressRef.current = 0;
          setProgress(0);
          currentRef.current = currentRef.current + 1;
          setCurrent(currentRef.current);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const goTo = useCallback((idx: number) => {
    progressRef.current = 0;
    setProgress(0);
    currentRef.current = idx;
    setCurrent(idx);
  }, []);

  const goNext = useCallback(() => {
    if (currentRef.current < SLIDES.length - 1) goTo(currentRef.current + 1);
  }, [goTo]);

  const goPrev = useCallback(() => {
    if (currentRef.current > 0) goTo(currentRef.current - 1);
  }, [goTo]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      playingRef.current = !p;
      if (!p) lastTimeRef.current = performance.now(); // reset dt on resume
      return !p;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight' || e.code === 'ArrowDown') { e.preventDefault(); goNext(); }
      if (e.code === 'ArrowLeft'  || e.code === 'ArrowUp')   { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, goNext, goPrev]);

  const handleStartSystem = () => {
    setExiting(true);
    setTimeout(() => router.push('/login'), 900);
  };

  const slide = SLIDES[current];
  const isDark = slide.type === 'hero' || slide.type === 'cta';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800;900&family=Manrope:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; font-family: 'Manrope', system-ui, sans-serif; }
        .axr-sora { font-family: 'Sora', system-ui, sans-serif; }

        /* ── Slide transition ── */
        .axr-slide-in {
          animation: axr-slide-enter 0.55s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes axr-slide-enter {
          from { opacity: 0; transform: scale(0.97) translateY(18px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        /* ── Exit overlay ── */
        .axr-exit {
          animation: axr-exit-anim 0.9s ease both;
        }
        @keyframes axr-exit-anim {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* ── Hero background ── */
        @keyframes axr-blob-a { 0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(60px,-40px) scale(1.1);}66%{transform:translate(-40px,30px) scale(0.95);} }
        @keyframes axr-blob-b { 0%,100%{transform:translate(0,0) scale(1);}33%{transform:translate(-50px,50px) scale(1.08);}66%{transform:translate(40px,-30px) scale(0.93);} }
        @keyframes axr-blob-c { 0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(30px,40px) scale(1.12);} }
        .axr-blob-a { animation: axr-blob-a 14s ease-in-out infinite; }
        .axr-blob-b { animation: axr-blob-b 18s ease-in-out infinite; animation-delay:-6s; }
        .axr-blob-c { animation: axr-blob-c 12s ease-in-out infinite; animation-delay:-3s; }

        @keyframes axr-grid-drift {
          0%{transform:translate(0,0);}100%{transform:translate(48px,48px);}
        }

        /* ── Gradient animated text ── */
        .axr-grad {
          background: linear-gradient(90deg,#60A5FA,#818CF8,#C084FC,#F472B6,#60A5FA);
          background-size: 300% 100%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation: axr-grad-shift 5s ease infinite;
        }
        .axr-grad-blue {
          background: linear-gradient(90deg,#2563EB,#4F46E5,#7C3AED,#2563EB);
          background-size: 300% 100%;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation: axr-grad-shift 5s ease infinite;
        }
        @keyframes axr-grad-shift { 0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;} }

        /* ── Counter in hero ── */
        @keyframes axr-stat-pop {
          from{opacity:0;transform:scale(0.7) translateY(12px);}
          70%{transform:scale(1.08);}
          to{opacity:1;transform:scale(1) translateY(0);}
        }
        .axr-stat-pop { animation: axr-stat-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* ── Button shimmer ── */
        .axr-btn-shine {
          position:relative; overflow:hidden;
          transition: transform .35s cubic-bezier(.34,1.56,.64,1), box-shadow .35s ease;
        }
        .axr-btn-shine::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.25) 50%,transparent 65%);
          background-size:250% 100%; background-position:-200% center;
          transition:background-position .5s ease; pointer-events:none;
        }
        .axr-btn-shine:hover::after{background-position:200% center;}
        .axr-btn-shine:hover{transform:scale(1.05);box-shadow:0 16px 48px rgba(37,99,235,.38);}
        .axr-btn-shine:active{transform:scale(.97);}

        /* ── Control bar buttons ── */
        .axr-ctrl {
          transition: background .18s ease, transform .18s ease, color .18s ease;
          border: none; cursor: pointer;
        }
        .axr-ctrl:hover { background: rgba(255,255,255,.12) !important; transform: scale(1.07); }
        .axr-ctrl:active { transform: scale(.95); }

        .axr-ctrl-light { transition: background .18s ease, transform .18s ease; border: none; cursor: pointer; }
        .axr-ctrl-light:hover { background: #EEF2FF !important; transform: scale(1.07); }
        .axr-ctrl-light:active { transform: scale(.95); }

        /* ── Slide dot ── */
        .axr-slide-dot { transition: all .3s cubic-bezier(.34,1.56,.64,1); cursor: pointer; border: none; }
        .axr-slide-dot:hover { transform: scale(1.3); }

        /* ── Feature item ── */
        .axr-feat { transition: background .18s ease, transform .18s ease; }
        .axr-feat:hover { background: #F8FAFF !important; transform: translateX(3px); }

        /* ── Module tab ── */
        .axr-mtab { transition: all .2s ease; border: none; cursor: pointer; }
        .axr-mtab:hover { background: #F1F5F9 !important; }

        /* ── Card lift ── */
        .axr-lift { transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease; }
        .axr-lift:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(0,0,0,.1) !important; }

        /* ── Ping animation ── */
        @keyframes axr-ping { 0%{transform:scale(1);opacity:.55;}100%{transform:scale(2.1);opacity:0;} }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:2px;}

        /* ── Section stagger ── */
        .axr-stagger > *:nth-child(1){animation-delay:.05s;}
        .axr-stagger > *:nth-child(2){animation-delay:.12s;}
        .axr-stagger > *:nth-child(3){animation-delay:.19s;}
        .axr-stagger > *:nth-child(4){animation-delay:.26s;}
        .axr-stagger > *:nth-child(5){animation-delay:.33s;}
        .axr-stagger > *:nth-child(6){animation-delay:.40s;}
        .axr-stagger-item {
          animation: axr-slide-enter .55s cubic-bezier(.16,1,.3,1) both;
        }

        @keyframes axr-dot-pulse {
          0%,80%,100%{transform:scale(.7);opacity:.4;}40%{transform:scale(1.3);opacity:1;}
        }
      `}</style>

      {/* ── Exit overlay ── */}
      {exiting && (
        <div className="axr-exit" style={{
          position:'fixed', inset:0, zIndex:9999, background:'white',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{ textAlign:'center', fontFamily:'Sora, sans-serif' }}>
            <div style={{
              width:80, height:80, borderRadius:22, margin:'0 auto 20px',
              background:'linear-gradient(135deg,#2563EB,#4F46E5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:38, fontWeight:900, color:'white',
              boxShadow:'0 0 60px rgba(37,99,235,.35)',
            }}>A</div>
            <div style={{ fontSize:28, fontWeight:800, color:'#0F172A', marginBottom:16 }}>AxonRH</div>
            <div style={{ display:'flex', gap:7, justifyContent:'center' }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background: i===0?'#2563EB':i===1?'#4F46E5':'#7C3AED', animation:`axr-dot-pulse 1.2s ${i*.2}s infinite` }}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Main presentation container ── */}
      <div style={{
        position:'fixed', inset:0, display:'flex', flexDirection:'column',
        background: isDark ? '#07091A' : '#F7F9FF',
        transition: 'background 0.5s ease',
      }}>

        {/* ── TOP BAR ── */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:40,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 28px',
          background: isDark ? 'rgba(7,9,26,0.7)' : 'rgba(247,249,255,0.85)',
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
        }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background:'linear-gradient(135deg,#2563EB,#4F46E5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:900, fontSize:16, color:'white', fontFamily:'Sora,sans-serif',
              boxShadow:'0 4px 14px rgba(37,99,235,.35)',
            }}>A</div>
            <span className="axr-sora" style={{ fontWeight:800, fontSize:17, color: isDark?'white':'#0F172A', letterSpacing:'-0.02em' }}>AxonRH</span>
          </div>

          {/* Slide title */}
          <div key={current} style={{
            fontSize:13, fontWeight:600, color: isDark?'rgba(255,255,255,0.55)':'#94A3B8',
            animation:'axr-slide-enter .4s ease both',
          }}>
            {slide.label}
          </div>

          {/* Exit / start */}
          <button
            onClick={handleStartSystem}
            className="axr-btn-shine"
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'8px 18px', borderRadius:999, cursor:'pointer',
              background:'linear-gradient(135deg,#2563EB,#4F46E5)',
              color:'white', fontSize:12, fontWeight:700,
              fontFamily:'Sora,sans-serif',
              boxShadow:'0 4px 16px rgba(37,99,235,.35)',
            }}
          >
            Iniciar Sistema <ArrowRight style={{width:13,height:13}}/>
          </button>
        </div>

        {/* ── SLIDE CONTENT ── */}
        <div style={{ flex:1, overflow:'hidden', paddingTop:67, paddingBottom:72 }}>
          <div
            key={current}
            className="axr-slide-in"
            style={{ width:'100%', height:'100%', overflow:'auto' }}
          >
            {slide.type === 'hero'             && <HeroSlide current={current} />}
            {slide.type === 'modules-overview' && <ModulesOverviewSlide />}
            {slide.type === 'module'           && slide.data && <ModuleSlide mod={slide.data} />}
            {slide.type === 'workflow'         && <WorkflowSlide />}
            {slide.type === 'differentials'    && <DifferentialsSlide />}
            {slide.type === 'security'         && <SecuritySlide />}
            {slide.type === 'tech'             && <TechSlide />}
            {slide.type === 'cta'              && <CTASlide onStart={handleStartSystem} />}
          </div>
        </div>

        {/* ── BOTTOM CONTROL BAR ── */}
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, zIndex:40,
        }}>
          {/* Progress bar */}
          <div style={{ height:3, background: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
            <div style={{
              height:'100%',
              width:`${progress}%`,
              background:'linear-gradient(90deg,#3B82F6,#6366F1)',
              transition:'width .1s linear',
              borderRadius:'0 2px 2px 0',
            }}/>
          </div>

          {/* Controls */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'10px 28px',
            background: isDark ? 'rgba(7,9,26,0.85)' : 'rgba(247,249,255,0.92)',
            backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
          }}>
            {/* Left: slide counter + keyboard hint */}
            <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:120 }}>
              <span className="axr-sora" style={{ fontSize:13, fontWeight:700, color: isDark?'rgba(255,255,255,0.4)':'#94A3B8' }}>
                {String(current+1).padStart(2,'0')} <span style={{ opacity:.4 }}>/</span> {String(SLIDES.length).padStart(2,'0')}
              </span>
              <span style={{ fontSize:10, color: isDark?'rgba(255,255,255,0.2)':'#CBD5E1', letterSpacing:'0.05em' }}>
                ← → espaço
              </span>
            </div>

            {/* Center: nav controls */}
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {/* Prev */}
              <button
                className={isDark ? 'axr-ctrl' : 'axr-ctrl-light'}
                onClick={goPrev}
                disabled={current===0}
                style={{
                  width:36, height:36, borderRadius:999,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  color: current===0 ? (isDark?'rgba(255,255,255,0.15)':'#CBD5E1') : (isDark?'white':'#374151'),
                  opacity: current===0 ? 0.4 : 1,
                }}
              >
                <ChevronLeft style={{width:16,height:16}}/>
              </button>

              {/* Play/Pause */}
              <button
                className="axr-ctrl"
                onClick={togglePlay}
                style={{
                  width:48, height:48, borderRadius:999,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'linear-gradient(135deg,#2563EB,#4F46E5)',
                  color:'white',
                  boxShadow:'0 4px 20px rgba(37,99,235,.4)',
                  transition:'transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s ease',
                }}
              >
                {playing
                  ? <Pause style={{width:18,height:18}}/>
                  : <PlayIcon style={{width:18,height:18,marginLeft:2}}/>
                }
              </button>

              {/* Next */}
              <button
                className={isDark ? 'axr-ctrl' : 'axr-ctrl-light'}
                onClick={goNext}
                disabled={current===SLIDES.length-1}
                style={{
                  width:36, height:36, borderRadius:999,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  color: current===SLIDES.length-1 ? (isDark?'rgba(255,255,255,0.15)':'#CBD5E1') : (isDark?'white':'#374151'),
                  opacity: current===SLIDES.length-1 ? 0.4 : 1,
                }}
              >
                <ChevronRight style={{width:16,height:16}}/>
              </button>
            </div>

            {/* Right: slide dots */}
            <div style={{ display:'flex', alignItems:'center', gap:5, minWidth:120, justifyContent:'flex-end', flexWrap:'wrap' }}>
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  className="axr-slide-dot"
                  onClick={() => goTo(i)}
                  title={s.label}
                  style={{
                    height: 7,
                    width: i === current ? 22 : 7,
                    borderRadius: 4,
                    background: i === current
                      ? 'linear-gradient(90deg,#3B82F6,#6366F1)'
                      : (isDark ? 'rgba(255,255,255,0.18)' : '#CBD5E1'),
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── HERO SLIDE ───────────────────────────────────────────────────────────────

function HeroSlide({ current }: { current: number }) {
  const [statsStarted, setStatsStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStatsStarted(true), 600);
    return () => clearTimeout(t);
  }, [current]);

  return (
    <div style={{
      width:'100%', height:'100%', position:'relative', overflow:'hidden',
      background:'linear-gradient(135deg, #060A18 0%, #0D1232 40%, #0A0616 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'24px',
    }}>
      {/* Animated blobs */}
      <div className="axr-blob-a" style={{ position:'absolute', top:'-15%', left:'-8%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)', filter:'blur(90px)', pointerEvents:'none' }}/>
      <div className="axr-blob-b" style={{ position:'absolute', bottom:'-20%', right:'-6%', width:850, height:850, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', filter:'blur(100px)', pointerEvents:'none' }}/>
      <div className="axr-blob-c" style={{ position:'absolute', top:'35%', right:'15%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter:'blur(80px)', pointerEvents:'none' }}/>

      {/* Dot grid */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize:'32px 32px',
        animation:'axr-grid-drift 8s linear infinite',
      }}/>

      {/* Sparkle dots */}
      {[
        {top:'18%',left:'22%',size:4,delay:'0s'},{top:'72%',left:'18%',size:3,delay:'1.2s'},
        {top:'25%',right:'20%',size:5,delay:'0.6s'},{top:'65%',right:'25%',size:3,delay:'2s'},
        {top:'44%',left:'10%',size:4,delay:'1.8s'},{top:'38%',right:'12%',size:4,delay:'0.3s'},
      ].map((s,i)=>(
        <div key={i} style={{
          position:'absolute', borderRadius:'50%', background:'white', opacity:0,
          width:s.size, height:s.size,
          top:s.top, left:(s as any).left, right:(s as any).right,
          animation:`axr-dot-pulse 2.5s ${s.delay} infinite`,
        }}/>
      ))}

      {/* Content */}
      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:900 }}>
        <div className="axr-stagger-item" style={{
          display:'inline-flex', alignItems:'center', gap:9,
          padding:'9px 20px', borderRadius:999, marginBottom:28,
          background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)',
          color:'#93C5FD', fontSize:13, fontWeight:600,
        }}>
          <Sparkles style={{width:14,height:14}}/> Plataforma SaaS de RH e DP com Inteligência Artificial
        </div>

        <h1 className="axr-sora axr-stagger-item" style={{
          fontSize:'clamp(52px,8.5vw,100px)', fontWeight:900, lineHeight:0.9,
          letterSpacing:'-0.045em', color:'white', marginBottom:28,
        }}>
          O Futuro do<br/>
          <span className="axr-grad axr-sora">RH já chegou</span>
        </h1>

        <p className="axr-stagger-item" style={{
          fontSize:'clamp(15px,2vw,20px)', color:'rgba(148,163,184,0.9)',
          maxWidth:680, margin:'0 auto 52px', lineHeight:1.72,
        }}>
          Do recrutamento ao offboarding — controle de ponto, folha de pagamento, benefícios, desempenho e IA em um único ecossistema seguro, inteligente e totalmente digital.
        </p>

        {/* Stats */}
        <div className="axr-stagger axr-stagger-item" style={{
          display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, maxWidth:760, margin:'0 auto',
        }}>
          {[
            { val:'9+',   isNum:true,  label:'Módulos Integrados',   color:'#60A5FA', border:'rgba(96,165,250,0.25)', bg:'rgba(59,130,246,0.1)' },
            { val:'80%',  isNum:true,  label:'Menos Chamados ao RH', color:'#818CF8', border:'rgba(129,140,248,0.25)', bg:'rgba(99,102,241,0.1)' },
            { val:'100%', isNum:true,  label:'Digital & Cloud',      color:'#34D399', border:'rgba(52,211,153,0.25)',  bg:'rgba(16,185,129,0.1)' },
            { val:'24/7', isNum:false, label:'Assistente de IA',     color:'#F472B6', border:'rgba(244,114,182,0.25)',bg:'rgba(244,63,94,0.1)'  },
          ].map((s,i)=>(
            <div key={i} className="axr-stat-pop" style={{
              padding:'22px 16px', borderRadius:20, textAlign:'center',
              background:s.bg, border:`1px solid ${s.border}`,
              animationDelay:`${0.4 + i*0.1}s`,
            }}>
              <div className="axr-sora" style={{ fontSize:34, fontWeight:900, letterSpacing:'-0.03em', color:s.color, marginBottom:8 }}>
                {s.isNum ? <StatCounter value={s.val} started={statsStarted}/> : s.val}
              </div>
              <div style={{ fontSize:11, color:'rgba(148,163,184,0.7)', fontWeight:600, lineHeight:1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODULES OVERVIEW SLIDE ───────────────────────────────────────────────────

function ModulesOverviewSlide() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'white',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'40px 48px',
    }}>
      <div className="axr-stagger-item axr-sora" style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:999, marginBottom:16,
          background:'#EEF2FF', color:'#4F46E5', border:'1px solid #C7D2FE',
          fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <Layers style={{width:12,height:12}}/> Módulos do Sistema
        </div>
        <h2 className="axr-sora" style={{
          fontSize:'clamp(32px,4vw,50px)', fontWeight:900, color:'#0F172A',
          letterSpacing:'-0.035em', lineHeight:1.05, marginBottom:12,
        }}>
          9 Módulos. 1 Ecossistema.
        </h2>
        <p style={{ fontSize:16, color:'#94A3B8', fontFamily:'Manrope,sans-serif' }}>
          Cada módulo foi projetado para integrar-se perfeitamente com os demais.
        </p>
      </div>

      <div className="axr-stagger" style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, width:'100%', maxWidth:1100,
      }}>
        {MODULES.map((m,i)=>{
          const Icon = m.icon;
          return (
            <div key={m.id} className="axr-stagger-item axr-lift" style={{
              display:'flex', alignItems:'center', gap:14, padding:'18px 20px', borderRadius:18,
              background:'white', border:'1.5px solid #E2E8F0',
              boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width:46, height:46, borderRadius:14, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:m.accentBg, border:`1px solid ${m.accentBorder}`,
              }}>
                <Icon style={{width:22,height:22,color:m.accentColor}}/>
              </div>
              <div>
                <div className="axr-sora" style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:3 }}>{m.title}</div>
                <div style={{ fontSize:11, color:'#94A3B8' }}>{m.subtitle}</div>
              </div>
              <div style={{
                marginLeft:'auto', fontSize:11, fontWeight:700, padding:'3px 9px',
                borderRadius:999, background:m.accentBg, color:m.accentColor,
                border:`1px solid ${m.accentBorder}`, flexShrink:0, fontFamily:'Sora,sans-serif',
              }}>{String(i+1).padStart(2,'0')}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODULE SLIDE ─────────────────────────────────────────────────────────────

function ModuleSlide({ mod }: { mod: Module }) {
  const Icon = mod.icon;
  return (
    <div style={{
      width:'100%', height:'100%', background:'white',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'40px 64px', gap:56, position:'relative', overflow:'hidden',
    }}>
      {/* Accent blob */}
      <div style={{
        position:'absolute', top:'-20%', right:'-10%', width:500, height:500,
        borderRadius:'50%', background:`radial-gradient(circle,${mod.accentBg} 0%,transparent 70%)`,
        pointerEvents:'none',
      }}/>

      {/* Left */}
      <div className="axr-stagger" style={{ flex:'0 0 420px', maxWidth:420 }}>
        <div className="axr-stagger-item" style={{
          width:72, height:72, borderRadius:22, marginBottom:28,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:mod.accentBg, border:`1.5px solid ${mod.accentBorder}`,
          boxShadow:`0 8px 32px ${mod.glowColor}`,
        }}>
          <Icon style={{width:36,height:36,color:mod.accentColor}}/>
        </div>

        <div className="axr-stagger-item" style={{
          fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
          color:mod.accentColor, marginBottom:12,
        }}>
          {mod.subtitle}
        </div>

        <h2 className="axr-sora axr-stagger-item" style={{
          fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color:'#0F172A',
          letterSpacing:'-0.035em', lineHeight:1.05, marginBottom:20,
        }}>
          {mod.title}
        </h2>

        <p className="axr-stagger-item" style={{
          fontSize:16, color:'#64748B', lineHeight:1.78, marginBottom:28,
          fontFamily:'Manrope,sans-serif',
        }}>
          {mod.desc}
        </p>

        <div className="axr-stagger-item" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'10px 20px', borderRadius:14,
          background:mod.accentBg, border:`1.5px solid ${mod.accentBorder}`,
          color:mod.accentColor, fontSize:13, fontWeight:700,
          fontFamily:'Sora,sans-serif',
        }}>
          <CheckCircle2 style={{width:15,height:15}}/> 6 funcionalidades inclusas
        </div>
      </div>

      {/* Right: features */}
      <div className="axr-stagger" style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {mod.features.map((feat, i) => (
          <div key={i} className="axr-stagger-item axr-feat" style={{
            display:'flex', alignItems:'flex-start', gap:12,
            padding:'14px 16px', borderRadius:14,
            background:'#F8FAFC', border:'1.5px solid #E2E8F0',
          }}>
            <div style={{
              width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:1,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:mod.accentBg, border:`1px solid ${mod.accentBorder}`,
            }}>
              <CheckCircle2 style={{width:11,height:11,color:mod.accentColor}}/>
            </div>
            <span style={{ fontSize:12.5, color:'#374151', lineHeight:1.6, fontFamily:'Manrope,sans-serif' }}>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WORKFLOW SLIDE ───────────────────────────────────────────────────────────

function WorkflowSlide() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#F7F9FF',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'36px 64px',
    }}>
      <div className="axr-stagger-item" style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:999, marginBottom:14,
          background:'#DBEAFE', color:'#1D4ED8', border:'1px solid #BFDBFE',
          fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <Activity style={{width:12,height:12}}/> Fluxo Operacional
        </div>
        <h2 className="axr-sora" style={{
          fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color:'#0F172A',
          letterSpacing:'-0.035em', lineHeight:1.05, marginBottom:8,
        }}>
          De ponta a ponta — sem ruptura
        </h2>
        <p style={{ fontSize:15, color:'#94A3B8', fontFamily:'Manrope,sans-serif' }}>
          Cada etapa flui para a próxima de forma natural e automática.
        </p>
      </div>

      <div className="axr-stagger" style={{ display:'flex', gap:12, width:'100%', maxWidth:1200 }}>
        {WORKFLOW_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="axr-stagger-item" style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'flex-start',
              padding:'20px', borderRadius:20, position:'relative',
              background:'white', border:'1.5px solid #E2E8F0',
              boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
              borderTop:`3px solid ${step.color}`,
            }}>
              {/* Step number */}
              <div style={{
                width:44, height:44, borderRadius:14, marginBottom:14,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:`${step.color}12`, border:`1.5px solid ${step.color}30`,
                fontFamily:'Sora,sans-serif', fontWeight:900, fontSize:16, color:step.color,
              }}>
                {step.n}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <Icon style={{width:14,height:14,color:step.color,flexShrink:0}}/>
                <div className="axr-sora" style={{ fontSize:13, fontWeight:700, color:'#0F172A', lineHeight:1.3 }}>{step.title}</div>
              </div>
              <p style={{ fontSize:11.5, color:'#64748B', lineHeight:1.68, fontFamily:'Manrope,sans-serif' }}>{step.desc}</p>

              {/* Arrow connector */}
              {i < WORKFLOW_STEPS.length - 1 && (
                <div style={{
                  position:'absolute', right:-10, top:'50%', transform:'translateY(-50%)',
                  width:18, height:18, background:'white', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:`2px solid ${step.color}40`, zIndex:1,
                }}>
                  <ChevronRight style={{width:10,height:10,color:step.color}}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DIFFERENTIALS SLIDE ──────────────────────────────────────────────────────

function DifferentialsSlide() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'white',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'36px 64px',
    }}>
      <div className="axr-stagger-item" style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:999, marginBottom:14,
          background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0',
          fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <Star style={{width:12,height:12}}/> Diferenciais Competitivos
        </div>
        <h2 className="axr-sora" style={{
          fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color:'#0F172A',
          letterSpacing:'-0.035em', lineHeight:1.05, marginBottom:8,
        }}>
          Por que o AxonRH é diferente?
        </h2>
        <p style={{ fontSize:15, color:'#94A3B8', fontFamily:'Manrope,sans-serif' }}>
          Não é mais um sistema de RH. É um ecossistema inteligente criado para eliminar fricções.
        </p>
      </div>

      <div className="axr-stagger" style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, width:'100%', maxWidth:1100,
      }}>
        {DIFFERENTIALS.map((d, i) => {
          const Icon = d.icon;
          return (
            <div key={i} className="axr-stagger-item axr-lift" style={{
              padding:'28px', borderRadius:22,
              background:'white', border:'1.5px solid #E2E8F0',
              boxShadow:'0 2px 16px rgba(0,0,0,0.05)',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{
                position:'absolute', top:0, right:0, width:140, height:140, borderRadius:'50%',
                background:`radial-gradient(circle,${d.bg} 0%,transparent 70%)`,
                pointerEvents:'none',
              }}/>
              <div style={{
                width:52, height:52, borderRadius:16, marginBottom:20,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:d.bg, border:`1px solid ${d.bd}`,
              }}>
                <Icon style={{width:24,height:24,color:d.color}}/>
              </div>
              <h3 className="axr-sora" style={{ fontSize:16, fontWeight:700, color:'#0F172A', marginBottom:10, letterSpacing:'-0.01em' }}>{d.title}</h3>
              <p style={{ fontSize:13, color:'#64748B', lineHeight:1.75, fontFamily:'Manrope,sans-serif' }}>{d.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECURITY SLIDE ───────────────────────────────────────────────────────────

function SecuritySlide() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#F7F9FF',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'36px 72px', gap:64,
    }}>
      {/* Left */}
      <div className="axr-stagger" style={{ flex:'0 0 400px' }}>
        <div className="axr-stagger-item" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:999, marginBottom:22,
          background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0',
          fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <Shield style={{width:12,height:12}}/> Segurança & Compliance
        </div>
        <h2 className="axr-sora axr-stagger-item" style={{
          fontSize:'clamp(26px,3vw,40px)', fontWeight:900, color:'#0F172A',
          letterSpacing:'-0.035em', lineHeight:1.05, marginBottom:16,
        }}>
          LGPD by Design.<br/>RBAC por padrão.
        </h2>
        <p className="axr-stagger-item" style={{ fontSize:15, color:'#64748B', lineHeight:1.78, marginBottom:28, fontFamily:'Manrope,sans-serif' }}>
          Privacidade e compliance integrados na arquitetura desde o primeiro dia.
        </p>

        <div className="axr-stagger" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { icon:Lock,     title:'MFA e Recuperação',      desc:'2FA por token numérico e recuperação segura via email.' },
            { icon:Eye,      title:'RBAC Granular',          desc:'Permissões específicas (DASHBOARD:READ) por papel.' },
            { icon:FileText, title:'Política Versionada',    desc:'Editor Markdown interno com versionamento de consentimentos.' },
            { icon:Database, title:'Auditoria Completa',     desc:'Log de todas as ações sensíveis com rastreabilidade total.' },
          ].map((item,i)=>{
            const II = item.icon;
            return (
              <div key={i} className="axr-stagger-item" style={{
                display:'flex', gap:14, padding:'14px 16px', borderRadius:14,
                background:'white', border:'1.5px solid #E2E8F0',
                boxShadow:'0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width:38, height:38, borderRadius:11, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'#ECFDF5', border:'1px solid #A7F3D0',
                }}>
                  <II style={{width:17,height:17,color:'#059669'}}/>
                </div>
                <div>
                  <div className="axr-sora" style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:3 }}>{item.title}</div>
                  <div style={{ fontSize:12, color:'#64748B', lineHeight:1.55, fontFamily:'Manrope,sans-serif' }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: RBAC */}
      <div className="axr-stagger" style={{
        flex:1, padding:28, borderRadius:24,
        background:'white', border:'1.5px solid #D1FAE5',
        boxShadow:'0 8px 40px rgba(5,150,105,0.08)',
      }}>
        <div className="axr-stagger-item" style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          paddingBottom:18, marginBottom:18, borderBottom:'1.5px solid #F1F5F9',
        }}>
          <div className="axr-sora" style={{ display:'flex', alignItems:'center', gap:9, fontWeight:700, color:'#0F172A', fontSize:15 }}>
            <Fingerprint style={{width:18,height:18,color:'#059669'}}/> Cargos e Permissões
          </div>
          <div style={{
            fontSize:11, padding:'4px 11px', borderRadius:999,
            background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0',
            fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase',
          }}>RBAC Ativo</div>
        </div>

        <div className="axr-stagger" style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[
            { role:'Administrador RH',  access:'Acesso Total',       color:'#059669', bg:'#ECFDF5', bd:'#A7F3D0', perms:['ADMIN:*','PAYROLL:*','EMPLOYEES:*'] },
            { role:'Gestor de Equipe',   access:'Equipe Própria',     color:'#2563EB', bg:'#DBEAFE', bd:'#BFDBFE', perms:['TEAM:READ','TIMESHEET:APPROVE'] },
            { role:'Gestor Financeiro',  access:'Folha / Relatórios', color:'#4F46E5', bg:'#EEF2FF', bd:'#C7D2FE', perms:['PAYROLL:READ','REPORTS:EXPORT'] },
            { role:'Colaborador',        access:'Próprio Perfil',     color:'#64748B', bg:'#F8FAFC', bd:'#E2E8F0', perms:['SELF:READ','TIMESHEET:WRITE'] },
            { role:'Contabilidade Ext.', access:'Exportações',        color:'#D97706', bg:'#FFFBEB', bd:'#FDE68A', perms:['REPORTS:EXPORT'] },
          ].map((item,i)=>(
            <div key={i} className="axr-stagger-item" style={{
              padding:'12px 14px', borderRadius:12,
              background:'#FAFAFA', border:'1.5px solid #F1F5F9',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <span className="axr-sora" style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{item.role}</span>
                <span style={{
                  fontSize:10, padding:'3px 10px', borderRadius:999, fontWeight:700,
                  background:item.bg, color:item.color, border:`1px solid ${item.bd}`,
                }}>{item.access}</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {item.perms.map((p,j)=>(
                  <span key={j} style={{
                    fontSize:10, padding:'2px 7px', borderRadius:5,
                    background:'#F1F5F9', color:'#64748B', fontFamily:'monospace',
                  }}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TECH SLIDE ───────────────────────────────────────────────────────────────

function TechSlide() {
  return (
    <div style={{
      width:'100%', height:'100%', background:'white',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'36px 64px',
    }}>
      <div className="axr-stagger-item" style={{ textAlign:'center', marginBottom:36 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'6px 16px', borderRadius:999, marginBottom:14,
          background:'#EEF2FF', color:'#4F46E5', border:'1px solid #C7D2FE',
          fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <Cpu style={{width:12,height:12}}/> Stack Tecnológico
        </div>
        <h2 className="axr-sora" style={{
          fontSize:'clamp(28px,3.5vw,44px)', fontWeight:900, color:'#0F172A',
          letterSpacing:'-0.035em', lineHeight:1.05, marginBottom:8,
        }}>
          Construído para durar
        </h2>
        <p style={{ fontSize:15, color:'#94A3B8', fontFamily:'Manrope,sans-serif' }}>
          Arquitetura moderna, cloud-native e type-safe do banco à interface.
        </p>
      </div>

      <div className="axr-stagger" style={{
        display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, width:'100%', maxWidth:900, marginBottom:24,
      }}>
        {TECH_STACK.map((tech,i)=>{
          const TI = tech.icon;
          return (
            <div key={i} className="axr-stagger-item axr-lift" style={{
              padding:'24px 20px', borderRadius:20, textAlign:'center',
              background:'#FAFAFA', border:'1.5px solid #E2E8F0',
              boxShadow:'0 2px 10px rgba(0,0,0,0.04)',
            }}>
              <TI style={{width:26,height:26,color:tech.color,margin:'0 auto 11px'}}/>
              <div className="axr-sora" style={{ fontWeight:700, color:'#0F172A', fontSize:13, marginBottom:3 }}>{tech.name}</div>
              <div style={{ fontSize:11, color:'#94A3B8' }}>{tech.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="axr-stagger" style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, width:'100%', maxWidth:900,
      }}>
        {[
          { icon:Globe,    color:'#2563EB', bg:'#DBEAFE', bd:'#BFDBFE', title:'Cloud-Native & Multi-Tenant',   desc:'Escala de 10 a 100.000 colaboradores com isolamento total de dados entre empresas.' },
          { icon:Activity, color:'#059669', bg:'#ECFDF5', bd:'#A7F3D0', title:'Tempo Real por Padrão',          desc:'WebSockets para saldos, aprovações e dados críticos sempre atualizados.' },
          { icon:Zap,      color:'#D97706', bg:'#FFFBEB', bd:'#FDE68A', title:'Performance de Primeira Classe', desc:'Next.js 15 App Router com React Server Components e edge caching.' },
        ].map((item,i)=>{
          const II = item.icon;
          return (
            <div key={i} className="axr-stagger-item axr-lift" style={{
              padding:'22px', borderRadius:18,
              background:'white', border:`1.5px solid ${item.bd}`,
              boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
            }}>
              <div style={{
                width:44,height:44,borderRadius:14,marginBottom:14,
                display:'flex',alignItems:'center',justifyContent:'center',
                background:item.bg,border:`1px solid ${item.bd}`,
              }}>
                <II style={{width:22,height:22,color:item.color}}/>
              </div>
              <div className="axr-sora" style={{ fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:7 }}>{item.title}</div>
              <p style={{ fontSize:12,color:'#64748B',lineHeight:1.7,fontFamily:'Manrope,sans-serif' }}>{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CTA SLIDE ────────────────────────────────────────────────────────────────

function CTASlide({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      width:'100%', height:'100%', position:'relative', overflow:'hidden',
      background:'linear-gradient(135deg, #060A18 0%, #0D1232 40%, #0A0616 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'40px 24px', textAlign:'center',
    }}>
      {/* Background */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'30px 30px', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'15%', left:'8%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 70%)', filter:'blur(90px)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'10%', right:'8%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)', filter:'blur(80px)', pointerEvents:'none' }}/>

      <div className="axr-stagger" style={{ position:'relative', zIndex:1, maxWidth:780 }}>
        <div className="axr-stagger-item" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 18px', borderRadius:999, marginBottom:28,
          background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.35)',
          color:'#A5B4FC', fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
        }}>
          <PlayIcon style={{width:11,height:11,fill:'#A5B4FC'}}/> Pronto para começar
        </div>

        <h2 className="axr-sora axr-stagger-item" style={{
          fontSize:'clamp(44px,7.5vw,92px)', fontWeight:900,
          color:'white', letterSpacing:'-0.045em', lineHeight:0.9, marginBottom:26,
        }}>
          Transforme seu RH<br/>
          <span className="axr-grad axr-sora">agora mesmo</span>
        </h2>

        <p className="axr-stagger-item" style={{
          fontSize:18, color:'rgba(148,163,184,0.85)',
          maxWidth:520, margin:'0 auto 52px', lineHeight:1.72,
          fontFamily:'Manrope,sans-serif',
        }}>
          O sistema está pronto. Os módulos estão configurados. Clique abaixo para entrar no AxonRH.
        </p>

        <div className="axr-stagger-item">
          <button
            onClick={onStart}
            className="axr-btn-shine"
            style={{
              display:'inline-flex', alignItems:'center', gap:18,
              padding:'22px 48px', borderRadius:999, border:'none',
              background:'linear-gradient(135deg,#2563EB,#4F46E5)',
              color:'white', cursor:'pointer',
              fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:20,
              letterSpacing:'-0.01em',
              boxShadow:'0 16px 64px rgba(37,99,235,.55)',
            }}
          >
            <div style={{ position:'relative', width:46, height:46, flexShrink:0 }}>
              <div style={{ position:'absolute', inset:-3, borderRadius:'50%', border:'2px solid rgba(255,255,255,.3)', animation:'axr-ping 2s ease infinite' }}/>
              <div style={{
                width:46, height:46, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                background:'rgba(255,255,255,0.18)',
              }}>
                <PlayIcon style={{width:18,height:18,fill:'white',marginLeft:2}}/>
              </div>
            </div>
            Iniciar Apresentação
            <ArrowRight className="axr-sora" style={{width:22,height:22}}/>
          </button>

          <p style={{ marginTop:18, fontSize:12, color:'rgba(255,255,255,0.2)', fontFamily:'Manrope,sans-serif' }}>
            Você será redirecionado para a tela de login
          </p>
        </div>
      </div>
    </div>
  );
}
