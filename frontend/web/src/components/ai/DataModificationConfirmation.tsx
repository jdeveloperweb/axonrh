'use client';

import { useState } from 'react';
import { ChatIcons } from './ChatIcons';
import {
    Check,
    X,
    AlertTriangle,
    Shield,
    Clock,
    ArrowRight,
    User,
    Building,
    DollarSign,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    Undo2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface DataChange {
    fieldName: string;
    fieldLabel: string;
    oldValue: string | null;
    newValue: string | null;
    changeType: string;
    isSensitive?: boolean;
}

export interface DataModificationData {
    operationId: string;
    operationType: 'INSERT' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE';
    status: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    targetEntity: string;
    targetEntityName: string;
    description: string;
    confirmationMessage?: string;
    warningMessage?: string;
    changes: DataChange[];
    affectedRecordsCount: number;
    expiresAt?: string;
}

interface DataModificationConfirmationProps {
    data: DataModificationData;
    onConfirm: (operationId: string) => void;
    onReject: (operationId: string, reason?: string) => void;
    isProcessing?: boolean;
}

const fieldIcons: Record<string, React.ReactNode> = {
    'full_name': <User className="w-4 h-4" />,
    'social_name': <User className="w-4 h-4" />,
    'department': <Building className="w-4 h-4" />,
    'department_id': <Building className="w-4 h-4" />,
    'position': <Briefcase className="w-4 h-4" />,
    'position_id': <Briefcase className="w-4 h-4" />,
    'base_salary': <DollarSign className="w-4 h-4" />,
    'email': <Mail className="w-4 h-4" />,
    'phone': <Phone className="w-4 h-4" />,
    'mobile': <Phone className="w-4 h-4" />,
    'address': <MapPin className="w-4 h-4" />,
    'address_street': <MapPin className="w-4 h-4" />,
    'hire_date': <Calendar className="w-4 h-4" />,
};

const riskColors: Record<string, { bg: string; text: string; border: string }> = {
    'LOW': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'MEDIUM': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    'HIGH': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'CRITICAL': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const riskLabels: Record<string, string> = {
    'LOW': 'Baixo',
    'MEDIUM': 'Médio',
    'HIGH': 'Alto',
    'CRITICAL': 'Crítico',
};

const operationLabels: Record<string, string> = {
    'INSERT': 'Criar',
    'UPDATE': 'Atualizar',
    'DELETE': 'Excluir',
    'BULK_UPDATE': 'Atualização em massa',
    'BULK_DELETE': 'Exclusão em massa',
};

export function DataModificationConfirmation({
    data,
    onConfirm,
    onReject,
    isProcessing = false
}: DataModificationConfirmationProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const riskStyle = riskColors[data.riskLevel] || riskColors['LOW'];
    const isHighRisk = data.riskLevel === 'HIGH' || data.riskLevel === 'CRITICAL';
    const isDelete = data.operationType === 'DELETE' || data.operationType === 'BULK_DELETE';

    const formatValue = (value: string | null): string => {
        if (value === null || value === undefined || value === '') {
            return '(vazio)';
        }
        // Format dates
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            const date = new Date(value);
            return date.toLocaleDateString('pt-BR');
        }
        // Format currency
        if (!isNaN(Number(value)) && value.includes('.')) {
            const num = parseFloat(value);
            if (num >= 100) {
                return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
        }
        return value;
    };

    const getFieldIcon = (fieldName: string): React.ReactNode => {
        return fieldIcons[fieldName.toLowerCase()] || <ChatIcons.Sparkles className="w-4 h-4" />;
    };

    const handleConfirm = () => {
        onConfirm(data.operationId);
    };

    const handleReject = () => {
        if (showRejectInput && rejectReason.trim()) {
            onReject(data.operationId, rejectReason);
        } else if (!showRejectInput) {
            setShowRejectInput(true);
        } else {
            onReject(data.operationId);
        }
    };

    const expiresIn = data.expiresAt ? Math.max(0, Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 60000)) : null;

    return (
        <div className={cn(
            "w-full max-w-lg rounded-2xl border shadow-lg overflow-hidden transition-all duration-300",
            isDelete ? "border-red-200 bg-red-50/30" : "border-primary/20 bg-white"
        )}>
            {/* Header */}
            <div className={cn(
                "px-5 py-4 flex items-center justify-between",
                isDelete ? "bg-red-50" : "bg-primary/5"
            )}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isDelete
                            ? "bg-red-100 text-red-600"
                            : "bg-primary/10 text-primary"
                    )}>
                        {isDelete ? (
                            <AlertTriangle className="w-5 h-5" />
                        ) : (
                            <ChatIcons.Sparkles className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">
                            {operationLabels[data.operationType]} {data.targetEntity}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {data.targetEntityName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Risk Badge */}
                    <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                        riskStyle.bg, riskStyle.text, riskStyle.border
                    )}>
                        <Shield className="w-3 h-3 inline mr-1" />
                        {riskLabels[data.riskLevel]}
                    </span>
                </div>
            </div>

            {/* Warning Message */}
            {data.warningMessage && data.warningMessage !== 'null' && (
                <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800">{data.warningMessage}</p>
                </div>
            )}

            {/* Changes List */}
            <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">
                        Alterações ({data.changes?.length || 0})
                    </h4>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        {isExpanded ? 'Recolher' : 'Expandir'}
                    </button>
                </div>

                {isExpanded && data.changes && (
                    <div className="space-y-2">
                        {data.changes.map((change, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "p-3 rounded-xl border transition-colors",
                                    change.isSensitive
                                        ? "bg-amber-50/50 border-amber-200"
                                        : "bg-gray-50 border-gray-100"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-gray-400">
                                        {getFieldIcon(change.fieldName)}
                                    </span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {change.fieldLabel}
                                    </span>
                                    {change.isSensitive && (
                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">
                                            Sensível
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className={cn(
                                        "flex-1 px-2 py-1.5 rounded-lg",
                                        isDelete
                                            ? "bg-red-100 text-red-700 line-through"
                                            : "bg-gray-100 text-gray-600"
                                    )}>
                                        {formatValue(change.oldValue)}
                                    </span>
                                    {!isDelete && (
                                        <>
                                            <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            <span className="flex-1 px-2 py-1.5 bg-green-100 text-green-700 rounded-lg font-medium">
                                                {formatValue(change.newValue)}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Affected Records */}
                {data.affectedRecordsCount > 1 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <p className="text-sm text-blue-700">
                            <strong>{data.affectedRecordsCount}</strong> registro(s) serão afetados
                        </p>
                    </div>
                )}
            </div>

            {/* Reject Reason Input */}
            {showRejectInput && (
                <div className="px-5 pb-3">
                    <input
                        type="text"
                        placeholder="Motivo da rejeição (opcional)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        autoFocus
                    />
                </div>
            )}

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-3">
                <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]",
                        isDelete
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
                            : "bg-primary hover:bg-primary-700 text-white shadow-lg shadow-primary/20",
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
                    {isDelete ? 'Confirmar Exclusão' : 'Confirmar Alteração'}
                </button>

                <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className={cn(
                        "px-5 py-3 rounded-xl text-sm font-medium border transition-all active:scale-[0.98]",
                        showRejectInput
                            ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900",
                        isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <X className="w-4 h-4 inline mr-1" />
                    {showRejectInput ? 'Rejeitar' : 'Cancelar'}
                </button>
            </div>

            {/* Rollback Info */}
            {!isDelete && (
                <div className="px-5 pb-4 flex items-center gap-2 text-xs text-gray-400">
                    <Undo2 className="w-3 h-3" />
                    <span>Esta alteração poderá ser revertida em até 1 hora após a execução</span>
                </div>
            )}
        </div>
    );
}

/**
 * Parse action confirmation content and determine if it's a data modification.
 */
export function parseDataModificationContent(content: string): DataModificationData | null {
    try {
        const data = JSON.parse(content);

        // Check if it's a data modification response
        if (data.operacao_id || data.operationId) {
            return {
                operationId: data.operacao_id || data.operationId,
                operationType: data.tipo_operacao || data.operationType || 'UPDATE',
                status: data.status || 'PENDING',
                riskLevel: data.nivel_risco || data.riskLevel || 'LOW',
                targetEntity: data.entidade || data.targetEntity || 'Registro',
                targetEntityName: data.nome_entidade || data.targetEntityName || 'Desconhecido',
                description: data.descricao || data.description || '',
                confirmationMessage: data.mensagem_confirmacao || data.confirmationMessage,
                warningMessage: data.aviso || data.warningMessage,
                changes: (data.alteracoes || data.changes || []).map((c: any) => ({
                    fieldName: c.campo || c.fieldName || c.field,
                    fieldLabel: c.campo || c.fieldLabel || c.field_label,
                    oldValue: c.valor_atual || c.oldValue || c.de,
                    newValue: c.novo_valor || c.newValue || c.para,
                    changeType: c.tipo || c.changeType || 'UPDATE',
                    isSensitive: c.sensivel || c.isSensitive || false,
                })),
                affectedRecordsCount: data.registros_afetados || data.affectedRecordsCount || 1,
                expiresAt: data.expira_em || data.expiresAt,
            };
        }

        return null;
    } catch {
        return null;
    }
}

export default DataModificationConfirmation;
