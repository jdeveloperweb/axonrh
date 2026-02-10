'use client';

import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DiscEvaluation, DiscProfileType } from '@/lib/api/performance';
import { useMemo } from 'react';

interface AxonIATipProps {
    latestDisc?: DiscEvaluation | null;
    className?: string;
}

const profileLabels: Record<DiscProfileType, string> = {
    DOMINANCE: 'Dominante',
    INFLUENCE: 'Influente',
    STEADINESS: 'Estável',
    CONSCIENTIOUSNESS: 'Conforme',
};

const DISC_TIPS: Record<DiscProfileType, string[]> = {
    DOMINANCE: [
        "Sua determinação é um diferencial. Hoje, tente equilibrar sua busca por resultados rápidos com uma escuta ativa para as ideias da equipe.",
        "Como um perfil Dominante, você brilha em tomadas de decisão. Que tal usar essa energia para destravar aquele projeto que está parado?",
        "Foco na eficiência é sua marca. Lembre-se que pequenos momentos de conexão com o time podem acelerar ainda mais os resultados a longo prazo.",
        "Seu perfil impulsiona a equipe. Ao dar feedbacks hoje, tente ser direto, mas busque também destacar um ponto positivo de aprendizado."
    ],
    INFLUENCE: [
        "Seu entusiasmo contagia o ambiente! Aproveite essa energia para facilitar a comunicação entre as áreas naquele projeto compartilhado.",
        "Como um perfil Influente, você se sai muito bem em atividades colaborativas. Tente focar um pouco mais nos detalhes técnicos das suas entregas hoje.",
        "Sua rede de contatos é poderosa. Que tal convidar alguém de outro time para um café virtual e trocar boas práticas de trabalho?",
        "Você facilita muito o engajamento do time. Lembre-se de reservar um tempo no final do dia para organizar as prioridades de amanhã."
    ],
    STEADINESS: [
        "Sua consistência traz segurança para o time. Hoje, tente compartilhar um pouco mais das suas percepções sobre como melhorar um processo interno.",
        "Como um perfil Estável, você é o coração da colaboração. Não hesite em dizer 'não' se sentir que suas prioridades atuais estão sendo comprometidas.",
        "Sua paciência é uma virtude rara. Use esse talento para ajudar um colega que esteja com dificuldades em uma tarefa complexa.",
        "A harmonia do time é importante para você. Lembre-se que feedbacks construtivos, mesmo que desafiadores, são essenciais para o crescimento de todos."
    ],
    CONSCIENTIOUSNESS: [
        "Sua busca pela precisão garante a qualidade do nosso trabalho. Hoje, tente não se cobrar tanto pela perfeição absoluta; foque no progresso consistente.",
        "Como um perfil Conforme, sua análise técnica é fundamental. Experimente compartilhar sua lógica de raciocínio com o time para elevar o nível de todos.",
        "Sua organização é exemplar. Que tal usar esse método para ajudar a simplificar um fluxo de trabalho que parece estar confuso para os outros?",
        "Dados e evidências são seus aliados. Lembre-se que, às vezes, uma decisão rápida baseada no 'suficientemente bom' pode ser o que o projeto precisa."
    ]
};

const GENERIC_TIPS = [
    "A técnica Pomodoro pode ajudar você a manter o foco hoje: 25 minutos de trabalho intenso e 5 de descanso. Experimente!",
    "Já deu uma olhada no catálogo do Axon Learning hoje? Dez minutos de aprendizado por dia fazem uma diferença enorme em um ano.",
    "Beber água e fazer pequenas pausas para alongamento melhora sua produtividade e bem-estar. Cuide-se!",
    "Organize sua lista de tarefas por prioridade logo ao começar o dia. Começar pelo mais difícil costuma reduzir a ansiedade.",
    "Um ambiente de trabalho organizado reflete em uma mente mais clara. Que tal tirar 5 minutos para arrumar sua área de trabalho?",
    "Feedback é um presente. Se tiver oportunidade, peça uma opinião sobre sua última entrega para um colega de confiança."
];

export function AxonIATip({ latestDisc, className }: AxonIATipProps) {
    const tip = useMemo(() => {
        if (latestDisc?.primaryProfile && DISC_TIPS[latestDisc.primaryProfile]) {
            const tips = DISC_TIPS[latestDisc.primaryProfile];
            // Use a simple hash of the date or user ID to keep the tip consistent for the day
            const dayOfYear = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
            return tips[dayOfYear % tips.length];
        }

        const dayOfYear = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24));
        return GENERIC_TIPS[dayOfYear % GENERIC_TIPS.length];
    }, [latestDisc]);

    const profileTitle = latestDisc?.primaryProfile ? profileLabels[latestDisc.primaryProfile] : null;

    return (
        <div className={`relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-blue-400/50 via-indigo-500/50 to-purple-600/50 shadow-lg ${className}`}>
            <div className="relative bg-white dark:bg-[#0f172a] rounded-[23px] p-6 h-full">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                        <Sparkles className="h-5 w-5 text-blue-500 animate-pulse" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dica da AxonIA</h4>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-none text-[10px]">Insight IA</Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                            "{profileTitle ? (
                                <>Baseado no seu perfil <span className="font-bold text-blue-500">{profileTitle}</span>, {tip.charAt(0).toLowerCase() + tip.slice(1)}</>
                            ) : tip}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
