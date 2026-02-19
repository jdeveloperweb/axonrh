'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

    const handleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (src && !hasError) {
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
                    "relative overflow-hidden cursor-zoom-in group/photo-expand",
                    containerClassName
                )}
            >
                <img
                    src={src}
                    alt={alt}
                    onError={() => setHasError(true)}
                    className={cn("w-full h-full object-cover transition-transform group-hover/photo-expand:scale-110", className)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover/photo-expand:bg-black/10 transition-colors" />
            </div>

            <Dialog open={isExpanded && !hasError} onOpenChange={setIsExpanded}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none [&>button]:text-white [&>button]:bg-black/20 [&>button]:hover:bg-black/40 [&>button]:rounded-full [&>button]:transition-colors">
                    <div className="relative">
                        <img
                            src={src}
                            alt={alt}
                            className="w-full h-auto rounded-xl shadow-2xl"
                        />
                        {alt && (
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white rounded-b-xl">
                                <p className="font-bold text-xl drop-shadow-md">{alt}</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
