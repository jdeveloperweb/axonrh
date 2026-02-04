'use client';

import { useState } from 'react';
import { ChatIcons } from './ChatIcons';
import { Check, AlertCircle, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DataModificationConfirmation, parseDataModificationContent, DataModificationData } from './DataModificationConfirmation';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ActionConfirmationProps {
    content: string;
    onConfirm: (operationId?: string) => void;
    onCancel: (operationId?: string, reason?: string) => void;
}

export function ActionConfirmation({ content, onConfirm, onCancel }: ActionConfirmationProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    let data: any = {};
    try {
        data = JSON.parse(content);
    } catch (e) {
        console.error('Failed to parse action confirmation content', e);
        return <div className="text-red-500">Erro ao carregar confirmação de ação.</div>;
    }

    // Check if this is a data modification confirmation
    const modificationData = parseDataModificationContent(content);
    if (modificationData) {
        return (
            <DataModificationConfirmation
                data={modificationData}
                onConfirm={(opId) => {
                    setIsProcessing(true);
                    onConfirm(opId);
                }}
                onReject={(opId, reason) => {
                    setIsProcessing(true);
                    onCancel(opId, reason);
                }}
                isProcessing={isProcessing}
            />
        );
    }

    const getActionTitle = (action: string) => {
        switch (action) {
            case 'propose_vacation_approval':
                return 'Aprovação de Férias';
            case 'propose_termination':
                return 'Início de Desligamento';
            case 'modify_data':
            case 'data_modification':
                return 'Confirmação de Alteração';
            default:
                return 'Confirmação de Ação';
        }
    };

    const getActionDescription = () => {
        switch (data.action) {
            case 'propose_vacation_approval':
                return `Deseja aprovar as férias de **${data.employeeName || 'colaborador'}**?`;
            case 'propose_termination':
                return `Deseja iniciar o processo de desligamento de **${data.employeeName || 'colaborador'}**?`;
            case 'modify_data':
            case 'data_modification':
                return data.description || 'Deseja confirmar esta modificação?';
            default:
                return 'Deseja executar esta ação?';
        }
    };

    const getIcon = () => {
        switch (data.action) {
            case 'propose_vacation_approval':
                return <Check className="w-5 h-5 text-success" />;
            case 'propose_termination':
                return <AlertCircle className="w-5 h-5 text-destructive" />;
            default:
                return <ChatIcons.Sparkles className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <div className="flex flex-col gap-5 p-6 bg-white border border-gray-100 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.05)] max-w-sm m-2">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    data.action === 'propose_termination'
                        ? 'bg-red-50 text-red-500 border border-red-100'
                        : 'bg-green-50 text-green-600 border border-green-100'
                )}>
                    {getIcon()}
                </div>
                <div>
                    <h4 className="text-base font-black text-gray-900 tracking-tight">{getActionTitle(data.action)}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100">
                        Ação Pendente
                    </span>
                </div>
            </div>

            <p className="text-[15px] text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{
                __html: getActionDescription().replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 font-black">$1</strong>')
            }} />

            <div className="flex gap-3">
                <button
                    onClick={() => onConfirm(data.operationId)}
                    disabled={isProcessing}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white rounded-xl text-sm font-black hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary/20",
                        isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isProcessing ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    Confirmar
                </button>
                <button
                    onClick={() => onCancel(data.operationId)}
                    disabled={isProcessing}
                    className={cn(
                        "px-5 py-3 bg-gray-50 text-gray-600 border border-gray-100 rounded-xl text-sm font-bold hover:bg-gray-100 hover:text-gray-900 transition-all active:scale-95",
                        isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    Ignorar
                </button>
            </div>
        </div>
    );
}
