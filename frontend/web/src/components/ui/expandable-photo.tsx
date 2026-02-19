'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Loader2, Maximize2 } from 'lucide-react';

interface ExpandablePhotoProps {
    src?: string | null;
    alt?: string;
    fallback?: React.ReactNode;
    className?: string;
    containerClassName?: string;
    onExpand?: () => void;
}

export function ExpandablePhoto({
    src,
    alt = '',
    fallback,
    className,
    containerClassName,
    onExpand
}: ExpandablePhotoProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (src && !hasError && !isLoading) {
            setIsExpanded(true);
            onExpand?.();
        }
    };

    if (!src || hasError) return <>{fallback}</>;

    return (
        <>
            <div
                onClick={handleExpand}
                className={cn(
                    "relative overflow-hidden cursor-zoom-in group/photo-expand bg-slate-50",
                    containerClassName
                )}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
                    </div>
                )}

                <img
                    src={src}
                    alt={alt}
                    onLoad={() => setIsLoading(false)}
                    onError={() => { setHasError(true); setIsLoading(false); }}
                    className={cn(
                        "w-full h-full object-cover transition-all duration-500",
                        isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100 group-hover/photo-expand:scale-110",
                        className
                    )}
                />

                {!isLoading && (
                    <div className="absolute inset-0 bg-black/0 group-hover/photo-expand:bg-blue-600/10 transition-colors flex items-center justify-center">
                        <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover/photo-expand:opacity-100 scale-50 group-hover/photo-expand:scale-100 transition-all duration-300 drop-shadow-lg" />
                    </div>
                )}
            </div>

            <Dialog open={isExpanded && !hasError} onOpenChange={setIsExpanded}>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:text-white [&>button]:bg-black/20 [&>button]:hover:bg-black/40 [&>button]:rounded-full [&>button]:transition-colors [&>button]:z-50">
                    <div className="relative animate-in zoom-in-95 duration-300">
                        <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden">
                            <img
                                src={src}
                                alt={alt}
                                className="w-full h-auto rounded-2xl"
                            />
                        </div>
                        {alt && (
                            <div className="absolute bottom-4 left-4 right-4 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white rounded-2xl">
                                <p className="font-black text-2xl drop-shadow-md tracking-tight uppercase italic opacity-90">{alt}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
