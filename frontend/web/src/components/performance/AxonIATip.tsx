'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DiscEvaluation } from '@/lib/api/performance';
import { chatApi } from '@/lib/api/ai';
import { useState, useEffect } from 'react';

interface AxonIATipProps {
    latestDisc?: DiscEvaluation | null;
    className?: string;
}

export function AxonIATip({ latestDisc, className }: AxonIATipProps) {
    const [insight, setInsight] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInsight() {
            try {
                setLoading(true);
                // Use a simple time-based cache key (one tip per day per user, or just fetch once)
                const today = new Date().toISOString().split('T')[0];
                const cacheKey = `axonia_tip_${latestDisc?.employeeId || 'generic'}_${today}`;
                const cached = localStorage.getItem(cacheKey);

                if (cached) {
                    setInsight(cached);
                    setLoading(false);
                    return;
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

                if (response && response.data) {
                    setInsight(response.data);
                    localStorage.setItem(cacheKey, response.data);
                } else if (typeof response === 'string') {
                    setInsight(response);
                    localStorage.setItem(cacheKey, response);
                }
            } catch (error) {
                console.error('Error fetching AxonIA insight:', error);
                setInsight("Foque na organização das suas metas hoje. Pequenas pausas ajudam a manter a clareza mental e a produtividade.");
            } finally {
                setLoading(false);
            }
        }

        fetchInsight();
    }, [latestDisc?.employeeId, latestDisc?.primaryProfile]);

    return (
        <div className={`relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-blue-400/50 via-indigo-500/50 to-purple-600/50 shadow-lg ${className}`}>
            <div className="relative bg-white dark:bg-[#0f172a] rounded-[23px] p-6 h-full min-h-[120px] flex flex-col justify-center">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl flex-shrink-0">
                        <Sparkles className={`h-5 w-5 text-blue-500 ${loading ? 'animate-spin' : 'animate-pulse'}`} />
                    </div>
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Dica da AxonIA</h4>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-none text-[10px]">Insight IA</Badge>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-400 italic text-sm py-2">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Gerando insight personalizado...</span>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                "{insight}"
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
