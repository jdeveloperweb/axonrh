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

// ─── useIsMobile ─────────────────────────────────────────────────────────────

function useIsMobile() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const upd = () => setW(window.innerWidth);
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  return w > 0 && w < 768;
}

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
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Touch / swipe
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 48) {
      if (dx < 0) goNext(); else goPrev();
    }
  }, [goNext, goPrev]);

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
          animation: axr-slide-reveal 0.9s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @keyframes axr-slide-reveal {
          0% { opacity: 0; transform: translateY(40px) scale(0.95); filter: blur(10px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        /* ── Element stagger reveal ── */
        .axr-reveal { opacity: 0; transform: translateY(20px); transition: all 0.7s cubic-bezier(0.23, 1, 0.32, 1); }
        .axr-reveal.active { opacity: 1; transform: translateY(0); }

        /* ── Exit overlay ── */
        .axr-exit {
          animation: axr-exit-anim 0.9s ease both;
        }
        @keyframes axr-exit-anim {
          from { opacity: 0; } to { opacity: 1; }
        }

        /* ── Advanced Background ── */
        @keyframes axr-mesh-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .axr-bg-mesh {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1), transparent 50%),
                      radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.08), transparent 40%),
                      radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.08), transparent 40%);
          background-size: 200% 200%;
          animation: axr-mesh-flow 20s ease infinite;
          pointer-events: none;
        }

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
          from{opacity:0;transform:scale(0.8) translateY(20px);}
          to{opacity:1;transform:scale(1) translateY(0);}
        }
        .axr-stat-pop { animation: axr-stat-pop 0.8s cubic-bezier(0.23, 1, 0.32, 1) both; }

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
        .axr-btn-shine:hover{transform:translateY(-2px); box-shadow:0 16px 48px rgba(37,99,235,.35);}
        .axr-btn-shine:active{transform:scale(.97);}

        /* ── Glass Effect ── */
        .axr-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }

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
          animation: axr-slide-reveal .8s cubic-bezier(.16,1,.3,1) both;
        }

        @keyframes axr-dot-pulse {
          0%,80%,100%{transform:scale(.7);opacity:.4;}40%{transform:scale(1.3);opacity:1;}
        }

        /* ── Floating Animation ── */
        @keyframes axr-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .axr-float { animation: axr-float 6s ease-in-out infinite; }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .axr-topbar-title { display: none !important; }
          .axr-topbar-btn span { display: none !important; }
          .axr-topbar-btn { padding: 8px 12px !important; }
          .axr-ctrl-hint { display: none !important; }
          .axr-slide-dots { display: none !important; }
          .axr-lift:hover { transform: none !important; box-shadow: none !important; }
          .axr-feat:hover { transform: none !important; }
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
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position:'fixed', inset:0, display:'flex', flexDirection:'column',
          background: isDark ? '#07091A' : '#F7F9FF',
          transition: 'background 0.5s ease',
        }}
      >

        {/* ── TOP BAR ── */}
        <div style={{
          position:'absolute', top:0, left:0, right:0, zIndex:40,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: isMobile ? '12px 16px' : '16px 28px',
          background: isDark ? 'rgba(7,9,26,0.7)' : 'rgba(247,249,255,0.85)',
          backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E2E8F0',
        }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:32, height:32, borderRadius:9, flexShrink:0,
              background:'linear-gradient(135deg,#2563EB,#4F46E5)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:900, fontSize:15, color:'white', fontFamily:'Sora,sans-serif',
              boxShadow:'0 4px 14px rgba(37,99,235,.35)',
            }}>A</div>
            <span className="axr-sora" style={{ fontWeight:800, fontSize:16, color: isDark?'white':'#0F172A', letterSpacing:'-0.02em' }}>AxonRH</span>
          </div>

          {/* Slide title — hidden on mobile via CSS */}
          <div className="axr-topbar-title" key={current} style={{
            fontSize:13, fontWeight:600, color: isDark?'rgba(255,255,255,0.55)':'#94A3B8',
            animation:'axr-slide-enter .4s ease both',
          }}>
            {slide.label}
          </div>

          {/* Exit / start */}
          <button
            onClick={handleStartSystem}
            className="axr-btn-shine axr-topbar-btn"
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'8px 18px', borderRadius:999, cursor:'pointer',
              background:'linear-gradient(135deg,#2563EB,#4F46E5)',
              color:'white', fontSize:12, fontWeight:700,
              fontFamily:'Sora,sans-serif',
              boxShadow:'0 4px 16px rgba(37,99,235,.35)',
            }}
          >
            <span>Iniciar Sistema</span> <ArrowRight style={{width:13,height:13}}/>
          </button>
        </div>

        {/* ── SLIDE CONTENT ── */}
        <div style={{ flex:1, overflow:'hidden', paddingTop: isMobile ? 57 : 67, paddingBottom: isMobile ? 64 : 72 }}>
          <div
            key={current}
            className="axr-slide-in"
            style={{ width:'100%', height:'100%', overflow:'auto' }}
          >
            {slide.type === 'hero'             && <HeroSlide current={current} isMobile={isMobile} />}
            {slide.type === 'modules-overview' && <ModulesOverviewSlide isMobile={isMobile} />}
            {slide.type === 'module'           && slide.data && <ModuleSlide mod={slide.data} isMobile={isMobile} />}
            {slide.type === 'workflow'         && <WorkflowSlide isMobile={isMobile} />}
            {slide.type === 'differentials'    && <DifferentialsSlide isMobile={isMobile} />}
            {slide.type === 'security'         && <SecuritySlide isMobile={isMobile} />}
            {slide.type === 'tech'             && <TechSlide isMobile={isMobile} />}
            {slide.type === 'cta'              && <CTASlide onStart={handleStartSystem} isMobile={isMobile} />}
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

function HeroSlide({ current, isMobile }: { current: number; isMobile: boolean }) {
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
      {/* Dynamic Mesh Background Overlay */}
      <div className="axr-bg-mesh" />

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

      {/* Content */}
      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:900, padding: isMobile ? '0 4px' : '0' }}>
        {!isMobile && (
          <div className="axr-stagger-item axr-float" style={{
            display:'inline-flex', alignItems:'center', gap:9,
            padding:'9px 20px', borderRadius:999, marginBottom:28,
            background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)',
            backdropFilter: 'blur(8px)',
            color:'#93C5FD', fontSize:13, fontWeight:600,
          }}>
            <Sparkles style={{width:14,height:14}}/> Plataforma SaaS de RH e DP com Inteligência Artificial
          </div>
        )}

        <h1 className="axr-sora axr-stagger-item" style={{
          fontSize: isMobile ? 'clamp(36px,11vw,52px)' : 'clamp(52px,8.5vw,100px)',
          fontWeight:900, lineHeight:0.92,
          letterSpacing:'-0.04em', color:'white',
          marginBottom: isMobile ? 16 : 28,
        }}>
          O Futuro do<br/>
          <span className="axr-grad axr-sora" style={{ display:'inline-block', paddingTop:10 }}>RH já chegou</span>
        </h1>

        <p className="axr-stagger-item" style={{
          fontSize: isMobile ? 14 : 'clamp(15px,2vw,20px)',
          color:'rgba(148,163,184,0.9)',
          maxWidth:680, margin: isMobile ? '0 auto 24px' : '0 auto 52px', lineHeight:1.72,
        }}>
          {isMobile
            ? 'Ponto, folha, benefícios, desempenho e IA em um único ecossistema digital.'
            : 'Do recrutamento ao offboarding — controle de ponto, folha de pagamento, benefícios, desempenho e IA em um único ecossistema seguro, inteligente e totalmente digital.'
          }
        </p>

        {/* Stats */}
        <div className="axr-stagger axr-stagger-item" style={{
          display:'grid',
          gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr) 1fr',
          gap: isMobile ? 10 : 14,
          maxWidth:800, margin:'0 auto',
        }}>
          {[
            { val:'9+',   isNum:true,  label:'Módulos Integrados',   color:'#60A5FA', border:'rgba(96,165,250,0.25)', bg:'rgba(59,130,246,0.1)' },
            { val:'80%',  isNum:true,  label:'Menos Chamados ao RH', color:'#818CF8', border:'rgba(129,140,248,0.25)', bg:'rgba(99,102,241,0.1)' },
            { val:'100%', isNum:true,  label:'Digital & Cloud',      color:'#34D399', border:'rgba(52,211,153,0.25)',  bg:'rgba(16,185,129,0.1)' },
            { val:'24/7', isNum:false, label:'Assistente de IA',     color:'#F472B6', border:'rgba(244,114,182,0.25)',bg:'rgba(244,63,94,0.1)'  },
          ].map((s,i)=>(
            <div key={i} className="axr-stat-pop axr-glass" style={{
              padding: isMobile ? '16px 10px' : '22px 16px', borderRadius:20, textAlign:'center',
              border:`1px solid ${s.border}`,
              background: s.bg,
              animationDelay:`${0.4 + i*0.1}s`,
            }}>
              <div className="axr-sora" style={{ fontSize: isMobile ? 26 : 34, fontWeight:900, letterSpacing:'-0.03em', color:s.color, marginBottom:6 }}>
                {s.isNum ? <StatCounter value={s.val} started={statsStarted}/> : s.val}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, color:'rgba(148,163,184,0.7)', fontWeight:600, lineHeight:1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODULES OVERVIEW SLIDE ───────────────────────────────────────────────────

function ModulesOverviewSlide({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#F8FAFF',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding: isMobile ? '20px 16px' : '40px 48px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div className="axr-bg-mesh" style={{ opacity: 0.3 }} />
      
      <div className="axr-stagger-item axr-sora" style={{ textAlign:'center', marginBottom: isMobile ? 24 : 48, position:'relative', zIndex:1 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 20px', borderRadius:999, marginBottom:16,
          background:'rgba(37,99,235,0.08)', color:'#1D4ED8', border:'1px solid rgba(37,99,235,0.2)',
          fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
          backdropFilter: 'blur(8px)'
        }}>
          <Layers style={{width:14,height:14}}/> Ecossistema Integrado
        </div>
        <h2 className="axr-sora" style={{
          fontSize: isMobile ? 'clamp(28px,8vw,38px)' : 'clamp(40px,5vw,60px)',
          fontWeight:900, color:'#0F172A', letterSpacing:'-0.04em', lineHeight:1, marginBottom:12,
        }}>
          9 Módulos. <span className="axr-grad-blue">Um único motor.</span>
        </h2>
        {!isMobile && <p style={{ fontSize:18, color:'#64748B', fontFamily:'Manrope,sans-serif', maxWidth: 600, margin: '0 auto' }}>
          Arquitetura modular projetada para máxima eficiência e integração total de dados.
        </p>}
      </div>

      <div className="axr-stagger" style={{
        display:'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
        gap: isMobile ? 12 : 20, width:'100%', maxWidth:1100, position:'relative', zIndex:1
      }}>
        {MODULES.map((m)=>{
          const Icon = m.icon;
          return (
            <div key={m.id} className="axr-stagger-item axr-lift axr-glass" style={{
              display:'flex', alignItems:'center', gap: isMobile ? 12 : 18,
              padding: isMobile ? '16px' : '24px', borderRadius:24,
              background: 'rgba(255, 255, 255, 0.7)', border:'1px solid #E2E8F0',
            }}>
              <div style={{
                width: isMobile ? 42 : 56, height: isMobile ? 42 : 56, borderRadius:16, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:m.accentBg, border:`1px solid ${m.accentBorder}`,
                boxShadow: `0 8px 24px ${m.glowColor}`
              }}>
                <Icon style={{width: isMobile ? 20 : 28, height: isMobile ? 20 : 28, color:m.accentColor}}/>
              </div>
              <div style={{ minWidth:0 }}>
                <div className="axr-sora" style={{ fontSize: isMobile ? 12 : 15, fontWeight:800, color:'#0F172A', marginBottom:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', letterSpacing:'-0.02em' }}>{m.title}</div>
                {!isMobile && <div style={{ fontSize:12, color:'#94A3B8', fontWeight: 500 }}>{m.subtitle}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODULE SLIDE ─────────────────────────────────────────────────────────────

function ModuleSlide({ mod, isMobile }: { mod: Module; isMobile: boolean }) {
  const Icon = mod.icon;
  return (
    <div style={{
      width:'100%', minHeight:'100%', background:'#F8FAFF',
      display:'flex', flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent:'center',
      padding: isMobile ? '24px 16px' : '40px 64px',
      gap: isMobile ? 24 : 64, position:'relative', overflow:'hidden',
    }}>
      {/* Dynamic Background Element */}
      <div className="axr-bg-mesh" style={{ opacity: 0.15 }} />
      <div style={{
        position:'absolute', top:'-30%', right:'-15%', width:600, height:600,
        borderRadius:'50%', background:`radial-gradient(circle,${mod.accentBg} 0%,transparent 70%)`,
        pointerEvents:'none', opacity: 0.5
      }}/>
      <div style={{
        position:'absolute', bottom:'-20%', left:'-10%', width:400, height:400,
        borderRadius:'50%', background:`radial-gradient(circle,rgba(255,255,255,0.8) 0%,transparent 70%)`,
        pointerEvents:'none', opacity: 0.8
      }}/>

      {/* Header / Left */}
      <div className="axr-stagger" style={{ flex: isMobile ? 'unset' : '0 0 440px', maxWidth: isMobile ? '100%' : 440, width: isMobile ? '100%' : 'auto', position:'relative', zIndex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom: isMobile ? 16 : 32 }}>
          <div className="axr-stagger-item axr-lift" style={{
            width: isMobile ? 60 : 88, height: isMobile ? 60 : 88, borderRadius: isMobile ? 18 : 28, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:mod.accentBg, border:`2px solid ${mod.accentBorder}`,
            boxShadow:`0 12px 40px ${mod.glowColor}`,
          }}>
            <Icon style={{width: isMobile ? 30 : 44, height: isMobile ? 30 : 44, color:mod.accentColor}}/>
          </div>
          {isMobile && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:mod.accentColor, marginBottom:6 }}>{mod.subtitle}</div>
              <h2 className="axr-sora" style={{ fontSize:'clamp(22px,6vw,28px)', fontWeight:900, color:'#0F172A', letterSpacing:'-0.04em', lineHeight:1 }}>{mod.title}</h2>
            </div>
          )}
        </div>

        {!isMobile && <>
          <div className="axr-stagger-item" style={{ fontSize:12, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:mod.accentColor, marginBottom:16 }}>{mod.subtitle}</div>
          <h2 className="axr-sora axr-stagger-item" style={{ fontSize:'clamp(32px,4vw,48px)', fontWeight:900, color:'#0F172A', letterSpacing:'-0.045em', lineHeight:1.02, marginBottom:24 }}>{mod.title}</h2>
        </>}

        <p className="axr-stagger-item" style={{
          fontSize: isMobile ? 14 : 17, color:'#64748B', lineHeight:1.75,
          marginBottom: isMobile ? 24 : 40, fontFamily:'Manrope,sans-serif',
          fontWeight: 400
        }}>
          {mod.desc}
        </p>

        {!isMobile && (
          <div className="axr-stagger-item axr-glass" style={{
            display:'inline-flex', alignItems:'center', gap:10,
            padding:'14px 24px', borderRadius:20,
            background: 'rgba(255,255,255,0.5)',
            border:`1.5px solid ${mod.accentBorder}`,
            color:'#0F172A', fontSize:14, fontWeight:700, fontFamily:'Sora,sans-serif',
          }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:mod.accentColor, animation: 'axr-dot-pulse 1.5s infinite' }} />
            Recursos Premium Inclusos
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="axr-stagger" style={{ flex:1, display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 16, width: isMobile ? '100%' : 'auto', position:'relative', zIndex:1 }}>
        {mod.features.map((feat, i) => (
          <div key={i} className="axr-stagger-item axr-feat axr-glass" style={{
            display:'flex', alignItems:'flex-start', gap:14,
            padding: isMobile ? '14px' : '20px', borderRadius:20,
            background: 'rgba(255, 255, 255, 0.6)', border:'1.5px solid #E2E8F0',
          }}>
            <div style={{
              width:24, height:24, borderRadius:'50%', flexShrink:0, marginTop:2,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:mod.accentBg, border:`1px solid ${mod.accentBorder}`,
            }}>
              <CheckCircle2 style={{width:12,height:12,color:mod.accentColor}}/>
            </div>
            <span style={{ fontSize: isMobile ? 13 : 14, color:'#334155', lineHeight:1.6, fontFamily:'Manrope,sans-serif', fontWeight: 500 }}>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WORKFLOW SLIDE ───────────────────────────────────────────────────────────

function WorkflowSlide({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      width:'100%', minHeight:'100%', background:'#F8FAFF',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding: isMobile ? '24px 16px' : '40px 64px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div className="axr-bg-mesh" style={{ opacity: 0.15 }} />
      
      <div className="axr-stagger-item" style={{ textAlign:'center', marginBottom: isMobile ? 24 : 48, position:'relative', zIndex:1 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 20px', borderRadius:999, marginBottom:16,
          background:'rgba(37,99,235,0.08)', color:'#1D4ED8', border:'1px solid rgba(37,99,235,0.2)',
          fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
          backdropFilter: 'blur(8px)'
        }}>
          <Activity style={{width:14,height:14}}/> Engenharia de Processos
        </div>
        <h2 className="axr-sora" style={{
          fontSize: isMobile ? 'clamp(28px,8vw,36px)' : 'clamp(40px,4.5vw,56px)',
          fontWeight:900, color:'#0F172A', letterSpacing:'-0.04em', lineHeight:1, marginBottom:12,
        }}>
          Fluxo Contínuo e <span className="axr-grad-blue">100% Digital</span>
        </h2>
        <p style={{ fontSize:18, color:'#64748B', fontFamily:'Manrope,sans-serif', maxWidth: 650, margin: '0 auto' }}>
          Eliminamos silos departamentais. Cada etapa do ciclo de vida do colaborador alimenta a próxima.
        </p>
      </div>

      <div className="axr-stagger" style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16, width:'100%', maxWidth:1200, position:'relative', zIndex:1 }}>
        {WORKFLOW_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="axr-stagger-item axr-lift axr-glass" style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'flex-start',
              padding:'24px', borderRadius:24, position:'relative',
              background:'rgba(255, 255, 255, 0.7)', border:'1.5px solid #E2E8F0',
              borderTop:`4px solid ${step.color}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
            }}>
              {/* Step number */}
              <div style={{
                width:48, height:48, borderRadius:16, marginBottom:18,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:`${step.color}15`, border:`1.5px solid ${step.color}30`,
                fontFamily:'Sora,sans-serif', fontWeight:900, fontSize:18, color:step.color,
                boxShadow: `0 8px 16px ${step.color}15`
              }}>
                {step.n}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <Icon style={{width:18,height:18,color:step.color,flexShrink:0}}/>
                <div className="axr-sora" style={{ fontSize:15, fontWeight:800, color:'#0F172A', lineHeight:1.3, letterSpacing:'-0.01em' }}>{step.title}</div>
              </div>
              <p style={{ fontSize:13, color:'#64748B', lineHeight:1.7, fontFamily:'Manrope,sans-serif', fontWeight:500 }}>{step.desc}</p>

              {/* Arrow connector */}
              {!isMobile && i < WORKFLOW_STEPS.length - 1 && (
                <div style={{
                  position:'absolute', right:-12, top:'50%', transform:'translateY(-50%)',
                  width:24, height:24, background:'white', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  border:`2px solid ${step.color}30`, zIndex:1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  <ChevronRight style={{width:14,height:14,color:step.color}}/>
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

function DifferentialsSlide({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      width:'100%', minHeight:'100%', background:'#F8FAFF',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding: isMobile ? '24px 16px' : '40px 64px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div className="axr-bg-mesh" style={{ opacity: 0.25 }} />

      <div className="axr-stagger-item" style={{ textAlign:'center', marginBottom: isMobile ? 24 : 48, position:'relative', zIndex:1 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 20px', borderRadius:999, marginBottom:16,
          background:'rgba(217,119,6,0.08)', color:'#D97706', border:'1px solid rgba(217,119,6,0.2)',
          fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
          backdropFilter: 'blur(8px)'
        }}>
          <Star style={{width:14,height:14}}/> Excelência Técnica
        </div>
        <h2 className="axr-sora" style={{
          fontSize: isMobile ? 'clamp(26px,8vw,34px)' : 'clamp(38px,4.5vw,56px)',
          fontWeight:900, color:'#0F172A', letterSpacing:'-0.04em', lineHeight:1, marginBottom:12,
        }}>
          Por que o <span className="axr-grad-blue">AxonRH superou</span> o mercado?
        </h2>
        {!isMobile && <p style={{ fontSize:18, color:'#64748B', fontFamily:'Manrope,sans-serif', maxWidth: 700, margin: '0 auto' }}>
          Tecnologia proprietária e foco obsessivo na experiência do usuário e na precisão dos dados.
        </p>}
      </div>

      <div className="axr-stagger" style={{
        display:'grid',
        gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
        gap: isMobile ? 12 : 24, width:'100%', maxWidth:1100, position:'relative', zIndex:1
      }}>
        {DIFFERENTIALS.map((d, i) => {
          const Icon = d.icon;
          return (
            <div key={i} className="axr-stagger-item axr-lift axr-glass" style={{
              padding: isMobile ? '20px' : '32px', borderRadius:28,
              background:'rgba(255, 255, 255, 0.7)', border:'1px solid #E2E8F0',
              position:'relative', overflow:'hidden',
            }}>
              <div style={{
                position:'absolute', top:0, right:0, width:140, height:140, borderRadius:'50%',
                background:`radial-gradient(circle,${d.bg} 0%,transparent 70%)`,
                pointerEvents:'none', opacity: 0.6
              }}/>
              <div style={{
                width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, borderRadius:18, marginBottom: isMobile ? 16 : 28,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:d.bg, border:`2.5px solid ${d.bd}`,
                boxShadow: `0 8px 24px ${d.color}20`
              }}>
                <Icon style={{width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, color:d.color}}/>
              </div>
              <h3 className="axr-sora" style={{ fontSize: isMobile ? 14 : 18, fontWeight:800, color:'#0F172A', marginBottom: isMobile ? 8 : 14, letterSpacing:'-0.02em' }}>{d.title}</h3>
              {!isMobile && <p style={{ fontSize:14, color:'#64748B', lineHeight:1.7, fontFamily:'Manrope,sans-serif', fontWeight: 500 }}>{d.desc}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECURITY SLIDE ───────────────────────────────────────────────────────────

function SecuritySlide({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      width:'100%', minHeight:'100%', background:'#F7F9FF',
      display:'flex', flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent:'center',
      padding: isMobile ? '24px 16px' : '40px 72px',
      gap: isMobile ? 32 : 64,
      position: 'relative', overflow: 'hidden'
    }}>
      <div className="axr-bg-mesh" style={{ opacity: 0.1 }} />

      {/* Left */}
      <div className="axr-stagger" style={{ flex: isMobile ? 'unset' : '0 0 420px', width: isMobile ? '100%' : 'auto', position:'relative', zIndex:1 }}>
        <div className="axr-stagger-item" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 20px', borderRadius:999, marginBottom:24,
          background:'rgba(5,150,105,0.08)', color:'#059669', border:'1px solid rgba(5,150,105,0.2)',
          fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em',
          backdropFilter: 'blur(8px)'
        }}>
          <Shield style={{width:14,height:14}}/> Segurança & Compliance
        </div>
        <h2 className="axr-sora axr-stagger-item" style={{
          fontSize: isMobile ? 'clamp(28px,8vw,36px)' : 'clamp(38px,4vw,52px)',
          fontWeight:900, color:'#0F172A', letterSpacing:'-0.04em', lineHeight:1, marginBottom:16,
        }}>
          LGPD por Design.<br/><span className="axr-grad-blue">Auditoria nativa.</span>
        </h2>
        {!isMobile && <p className="axr-stagger-item" style={{ fontSize:17, color:'#64748B', lineHeight:1.75, marginBottom:32, fontFamily:'Manrope,sans-serif', fontWeight: 500 }}>
          Privacidade e segurança não são opcionais. Foram a base da nossa arquitetura desde o dia 1.
        </p>}

        <div className="axr-stagger" style={{ display:'flex', flexDirection:'column', gap: isMobile ? 10 : 12 }}>
          {[
            { icon:Lock,     title:'MFA Avançado',      desc:'Autenticação multifator e recuperação segura.' },
            { icon:Eye,      title:'RBAC Profundo',     desc:'Permissões granulares para cada ação do sistema.' },
            { icon:FileText, title:'Gestão de Cookies', desc:'Controle total de consentimentos do titular.' },
            { icon:Database, title:'Encapsulamento',    desc:'Isolamento total de dados via arquitetura multi-tenant.' },
          ].map((item,i)=>{
            const II = item.icon;
            return (
              <div key={i} className="axr-stagger-item axr-glass" style={{
                display:'flex', gap:16, padding:'16px 20px', borderRadius:20,
                background:'rgba(255, 255, 255, 0.7)', border:'1.5px solid #E2E8F0',
                boxShadow:'0 4px 12px rgba(0,0,0,0.02)',
              }}>
                <div style={{
                  width:44, height:44, borderRadius:14, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:'rgba(5,150,105,0.1)', border:'1.5px solid rgba(5,150,105,0.2)',
                }}>
                  <II style={{width:20,height:20,color:'#059669'}}/>
                </div>
                <div>
                  <div className="axr-sora" style={{ fontSize:14, fontWeight:800, color:'#0F172A', marginBottom:4, letterSpacing: '-0.01em' }}>{item.title}</div>
                  <div style={{ fontSize:13, color:'#64748B', lineHeight:1.55, fontFamily:'Manrope,sans-serif', fontWeight: 500 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: RBAC Visualization */}
      <div className="axr-stagger axr-glass" style={{
        flex:1, padding: isMobile ? '24px' : '36px', borderRadius:32,
        background:'rgba(255, 255, 255, 0.8)', border:'1.5px solid #D1FAE5',
        boxShadow:'0 24px 64px rgba(5,150,105,0.12)',
        position:'relative', zIndex:1
      }}>
        <div className="axr-stagger-item" style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          paddingBottom:24, marginBottom:24, borderBottom:'1.5px solid #F1F5F9',
        }}>
          <div className="axr-sora" style={{ display:'flex', alignItems:'center', gap:12, fontWeight:800, color:'#0F172A', fontSize:17, letterSpacing: '-0.02em' }}>
            <Fingerprint style={{width:22,height:22,color:'#059669'}}/> Hierarquia de Acesso
          </div>
          <div style={{
            fontSize:11, padding:'6px 14px', borderRadius:999,
            background:'#ECFDF5', color:'#059669', border:'1px solid #A7F3D0',
            fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase',
          }}>Shield Active</div>
        </div>

        <div className="axr-stagger" style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { role:'Administrador Geral',  access:'Full Access',       color:'#059669', bg:'#ECFDF5', bd:'#A7F3D0', perms:['SYSTEM:*','AUTH:*','CORE:*'] },
            { role:'Liderança Estratégica', access:'Analytics / Team',   color:'#2563EB', bg:'#DBEAFE', bd:'#BFDBFE', perms:['REPORTS:READ','TEAM:WRITE'] },
            { role:'Operacional DP',       access:'Workflow / Payroll', color:'#4F46E5', bg:'#EEF2FF', bd:'#C7D2FE', perms:['PAYROLL:WRITE','EMP:READ'] },
            { role:'Colaborador',           access:'Self Service',      color:'#64748B', bg:'#F8FAFC', bd:'#E2E8F0', perms:['PROFILE:READ','PWA:ACCESS'] },
          ].map((item,i)=>(
            <div key={i} className="axr-stagger-item" style={{
              padding:'16px', borderRadius:16,
              background:'linear-gradient(90deg, #F9FAFB, #FFFFFF)', border:'1.5px solid #F1F5F9',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <span className="axr-sora" style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>{item.role}</span>
                <span style={{
                  fontSize:11, padding:'4px 12px', borderRadius:999, fontWeight:800,
                  background:item.bg, color:item.color, border:`1px solid ${item.bd}`,
                  letterSpacing: '0.05em'
                }}>{item.access}</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {item.perms.map((p,j)=>(
                  <span key={j} style={{
                    fontSize:11, padding:'4px 10px', borderRadius:8,
                    background:'#F1F5F9', color:'#475569', fontFamily:'monospace',
                    fontWeight: 500, letterSpacing: '-0.02em'
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

function TechSlide({ isMobile }: { isMobile: boolean }) {
  return (
    <div style={{
      width:'100%', height:'100%', background:'#F8FAFF',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'40px 64px',
      position: 'relative', overflow: 'hidden'
    }}>
      <div className="axr-bg-mesh" style={{ opacity: 0.2 }} />

      <div className="axr-stagger-item" style={{ textAlign:'center', marginBottom:48, position:'relative', zIndex:1 }}>
        <div style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding:'8px 20px', borderRadius:999, marginBottom:16,
          background:'rgba(79,70,229,0.08)', color:'#4F46E5', border:'1px solid rgba(79,70,229,0.2)',
          fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em',
          backdropFilter: 'blur(8px)'
        }}>
          <Cpu style={{width:14,height:14}}/> Stack Tecnológico
        </div>
        <h2 className="axr-sora" style={{
          fontSize:'clamp(36px,4.5vw,56px)', fontWeight:900, color:'#0F172A',
          letterSpacing:'-0.045em', lineHeight:1, marginBottom:12,
        }}>
          Construído para <span className="axr-grad-blue">Escalar</span>
        </h2>
        <p style={{ fontSize:18, color:'#64748B', fontFamily:'Manrope,sans-serif', maxWidth: 600, margin: '0 auto' }}>
          Arquitetura moderna do banco à interface, garantindo performance e segurança.
        </p>
      </div>

      <div className="axr-stagger" style={{
        display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, width:'100%', maxWidth:1000, marginBottom:32, position:'relative', zIndex:1
      }}>
        {TECH_STACK.map((tech,i)=>{
          const TI = tech.icon;
          return (
            <div key={i} className="axr-stagger-item axr-lift axr-glass" style={{
              padding:'28px 20px', borderRadius:24, textAlign:'center',
              background:'rgba(255, 255, 255, 0.7)', border:'1.5px solid #E2E8F0',
              boxShadow:'0 4px 12px rgba(0,0,0,0.02)',
            }}>
              <div style={{
                width:52, height:52, borderRadius:16, background: 'white', margin:'0 auto 16px',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow: `0 8px 20px ${tech.color}15`, border: `1px solid ${tech.color}10`
              }}>
                <TI style={{width:28,height:28,color:tech.color}}/>
              </div>
              <div className="axr-sora" style={{ fontWeight:800, color:'#0F172A', fontSize:14, marginBottom:4, letterSpacing: '-0.01em' }}>{tech.name}</div>
              <div style={{ fontSize:12, color:'#94A3B8', fontWeight: 500 }}>{tech.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="axr-stagger" style={{
        display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, width:'100%', maxWidth:1000, position:'relative', zIndex:1
      }}>
        {[
          { icon:Globe,    color:'#2563EB', bg:'#DBEAFE', bd:'#BFDBFE', title:'Cloud-Native & Multi-Tenant',   desc:'Isolamento total de dados entre empresas com alta disponibilidade global.' },
          { icon:Activity, color:'#059669', bg:'#ECFDF5', bd:'#A7F3D0', title:'Tempo Real por Padrão',          desc:'Saldos, aprovações e métricas sempre sincronizadas em todos os dispositivos.' },
          { icon:Zap,      color:'#D97706', bg:'#FFFBEB', bd:'#FDE68A', title:'Performance Enterprise', desc:'Next.js 15 com App Router para carregamento instantâneo e SEO nativo.' },
        ].map((item,i)=>{
          const II = item.icon;
          return (
            <div key={i} className="axr-stagger-item axr-lift axr-glass" style={{
              padding:'28px', borderRadius:28,
              background:'rgba(255, 255, 255, 0.8)', border:`1.5px solid #F1F5F9`,
              boxShadow:'0 8px 30px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width:48,height:48,borderRadius:16,marginBottom:18,
                display:'flex',alignItems:'center',justifyContent:'center',
                background:item.bg,border:`1px solid ${item.bd}`,
                boxShadow: `0 8px 16px ${item.color}15`
              }}>
                <II style={{width:24,height:24,color:item.color}}/>
              </div>
              <div className="axr-sora" style={{ fontSize:16,fontWeight:800,color:'#0F172A',marginBottom:10, letterSpacing: '-0.02em' }}>{item.title}</div>
              <p style={{ fontSize:14,color:'#64748B',lineHeight:1.65,fontFamily:'Manrope,sans-serif', fontWeight: 500 }}>{item.desc}</p>
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
      {/* Background with mesh and blobs */}
      <div className="axr-bg-mesh" />
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.05) 1.5px, transparent 1.5px)', backgroundSize:'40px 40px', pointerEvents:'none', opacity:0.6 }}/>
      
      <div className="axr-blob-a" style={{ position:'absolute', top:'15%', left:'8%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,0.2) 0%,transparent 70%)', filter:'blur(100px)', pointerEvents:'none' }}/>
      <div className="axr-blob-b" style={{ position:'absolute', bottom:'10%', right:'8%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.18) 0%,transparent 70%)', filter:'blur(100px)', pointerEvents:'none' }}/>

      <div className="axr-stagger" style={{ position:'relative', zIndex:1, maxWidth:1000 }}>
        <div className="axr-stagger-item axr-float" style={{
          display:'inline-flex', alignItems:'center', gap:10,
          padding:'10px 22px', borderRadius:999, marginBottom:36,
          background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)',
          backdropFilter: 'blur(10px)',
          color:'#A5B4FC', fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em',
        }}>
          <PlayIcon style={{width:13,height:13,fill:'#A5B4FC'}}/> Experiência Pronta
        </div>

        <h2 className="axr-sora axr-stagger-item" style={{
          fontSize:'clamp(48px,9vw,100px)', fontWeight:900,
          color:'white', letterSpacing:'-0.05em', lineHeight:0.88, marginBottom:32,
        }}>
          Assuma o controle<br/>
          <span className="axr-grad axr-sora" style={{ display:'inline-block', paddingTop:12 }}>estratégico do RH</span>
        </h2>

        <p className="axr-stagger-item" style={{
          fontSize:20, color:'rgba(148,163,184,0.9)',
          maxWidth:600, margin:'0 auto 64px', lineHeight:1.6,
          fontWeight: 400,
        }}>
          Junte-se à revolução digital. Todo o ecossistema AxonRH está pronto para impulsionar seu time.
        </p>

        <div className="axr-stagger-item">
          <button
            onClick={onStart}
            className="axr-btn-shine"
            style={{
              display:'inline-flex', alignItems:'center', gap:22,
              padding:'24px 64px', borderRadius:999, border:'none',
              background:'linear-gradient(135deg,#2563EB,#4F46E5)',
              color:'white', cursor:'pointer',
              fontFamily:'Sora,sans-serif', fontWeight:800, fontSize:22,
              letterSpacing:'-0.02em',
              boxShadow:'0 24px 80px rgba(37,99,235,.45)',
            }}
          >
            <div style={{ position:'relative', width:52, height:52, flexShrink:0 }}>
              <div style={{ position:'absolute', inset:-4, borderRadius:'50%', border:'2px solid rgba(255,255,255,.4)', animation:'axr-ping 2s ease infinite' }}/>
              <div style={{
                width:52, height:52, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                background:'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(4px)'
              }}>
                <PlayIcon style={{width:20,height:20,fill:'white',marginLeft:3}}/>
              </div>
            </div>
            <span>Entrar no Sistema</span>
            <ArrowRight className="axr-sora" style={{width:26,height:26, opacity: 0.8}}/>
          </button>

          <div style={{ marginTop:24, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', animation: 'axr-dot-pulse 1s infinite' }} />
            <p style={{ fontSize:13, color:'rgba(148,163,184,0.4)', fontWeight: 500, letterSpacing: '0.05em' }}>
              AMBIENTE CONFIGURADO E SEGURO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
