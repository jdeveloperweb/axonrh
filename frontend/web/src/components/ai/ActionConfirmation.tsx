'use client';

import { ChatIcons } from './ChatIcons';
import { Check, AlertCircle, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ActionConfirmationProps {
    content: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ActionConfirmation({ content, onConfirm, onCancel }: ActionConfirmationProps) {
    let data: any = {};
    try {
        data = JSON.parse(content);
    } catch (e) {
        console.error('Failed to parse action confirmation content', e);
        return <div className="text-red-500">Erro ao carregar confirmação de ação.</div>;
    }

    const getActionTitle = (action: string) => {
        switch (action) {
            case 'propose_vacation_approval':
                return 'Aprovação de Férias';
            case 'propose_termination':
                return 'Início de Desligamento';
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
        <div className="flex flex-col gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm mt-2 max-w-sm">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100",
                    data.action === 'propose_termination' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                )}>
                    {getIcon()}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900">{getActionTitle(data.action)}</h4>
                    <p className="text-xs text-gray-500">Ação Pendente</p>
                </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{
                __html: getActionDescription().replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }} />

            <div className="flex gap-2">
                <button
                    onClick={onConfirm}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-sm"
                >
                    <Check className="w-4 h-4" />
                    Confirmar
                </button>
                <button
                    onClick={onCancel}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-bold hover:bg-gray-100 transition-all active:scale-95"
                >
                    <XCircle className="w-4 h-4" />
                    Não agora
                </button>
            </div>
        </div>
    );
}
