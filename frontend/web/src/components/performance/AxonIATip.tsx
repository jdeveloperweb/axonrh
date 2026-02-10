'use client';

import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DiscEvaluation } from '@/lib/api/performance';
import { chatApi } from '@/lib/api/ai';
import { useState, useEffect, useCallback } from 'react';

interface AxonIATipProps {
    latestDisc?: DiscEvaluation | null;
    className?: string;
}

export function AxonIATip({ latestDisc, className }: AxonIATipProps) {
    const [insight, setInsight] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchInsight = useCallback(async (force: boolean = false) => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];
            const cacheKey = `axonia_tip_${latestDisc?.employeeId || 'generic'}_${today}`;

            if (!force) {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    setInsight(cached);
                    setLoading(false);
                    return;
                }
            }

            const response = await chatApi.getBehavioralInsight({
                employeeId: latestDisc?.employeeId,
                employeeName: latestDisc?.employeeName || 'Colaborador',
                dScore: latestDisc?.dScore,
                iScore: latestDisc?.iScore,
                sScore: latestDisc?.sScore,
                cScore: latestDisc?.cScore,
                primaryProfile: latestDisc?.primaryProfile,
                secondaryProfile: latestDisc?.secondaryProfile
            });

            let newInsight = '';
            if (response && (response as any).data) {
                newInsight = (response as any).data;
            } else if (typeof response === 'string') {
                newInsight = response;
            }

            if (newInsight) {
                setInsight(newInsight);
                localStorage.setItem(cacheKey, newInsight);
            }
        } catch (error) {
            console.error('Error fetching AxonIA insight:', error);
            if (!insight) {
                setInsight("Foque na organização das suas metas hoje. Pequenas pausas ajudam a manter a clareza mental e a produtividade.");
            }
        } finally {
            setLoading(false);
        }
    }, [latestDisc, insight]);

    useEffect(() => {
        fetchInsight();
    }, [latestDisc?.employeeId, latestDisc?.primaryProfile]);

    return (
        <div className={`relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-blue-400/50 via-indigo-500/50 to-purple-600/50 shadow-lg ${className}`}>
            <div className="relative bg-white dark:bg-[#0f172a] rounded-[23px] p-6 h-full min-h-[120px] flex flex-col justify-center translate-z-0">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl flex-shrink-0">
                        <Sparkles className={`h-5 w-5 text-blue-500 ${loading ? 'animate-spin' : 'animate-pulse'}`} />
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dica da AxonIA</h4>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-none text-[10px]">Insight IA</Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-300 active:scale-90"
                                onClick={() => fetchInsight(true)}
                                disabled={loading}
                                title="Gerar novo insight"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
                            </Button>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-400 italic text-sm py-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Refinando insight estratégico...</span>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-500">
                                "{insight}"
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
