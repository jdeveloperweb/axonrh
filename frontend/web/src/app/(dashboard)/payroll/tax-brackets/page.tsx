'use client';

import { useState, useEffect } from 'react';
import {
    ChevronLeft,
    Plus,
    Pencil,
    Trash2,
    Save,
    X,
    PlusCircle,
    TrendingUp,
    Info,
    Layers,
    Percent
} from 'lucide-react';
import { payrollApi, TaxBracket } from '@/lib/api/payroll';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TaxBracketsPage() {
    const [loading, setLoading] = useState(true);
    const [brackets, setBrackets] = useState<TaxBracket[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState<'INSS' | 'IRRF' | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<TaxBracket>>({});
    const [addFormData, setAddFormData] = useState<Partial<TaxBracket>>({
        minValue: 0,
        rate: 0,
        deductionAmount: 0,
        isActive: true,
        effectiveFrom: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await payrollApi.listTaxBrackets();
            setBrackets(data);
        } catch (error) {
            console.error('Error fetching tax brackets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (bracket: TaxBracket) => {
        setEditingId(bracket.id);
        setEditFormData(bracket);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditFormData({});
    };

    const handleSave = async (id: string) => {
        try {
            await payrollApi.updateTaxBracket(id, editFormData);
            setEditingId(null);
            fetchData();
        } catch (error) {
            alert('Erro ao salvar alteração');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta faixa?')) return;
        try {
            await payrollApi.deleteTaxBracket(id);
            fetchData();
        } catch (error) {
            alert('Erro ao excluir');
        }
    };

    const handleAdd = async () => {
        if (!isAdding) return;
        try {
            const nextOrder = brackets.filter(b => b.taxType === isAdding).length + 1;
            await payrollApi.createTaxBracket({
                ...addFormData,
                taxType: isAdding,
                bracketOrder: nextOrder
            });
            setIsAdding(null);
            setAddFormData({
                minValue: 0,
                rate: 0,
                deductionAmount: 0,
                isActive: true,
                effectiveFrom: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            alert('Erro ao adicionar faixa');
        }
    };

    const brl = (val: number) => formatCurrency(val);

    const renderBracketTable = (type: 'INSS' | 'IRRF', title: string, colorClass: string) => {
        const filtered = brackets.filter(b => b.taxType === type).sort((a, b) => a.minValue - b.minValue);

        return (
            <div className="card overflow-hidden">
                <div className={cn("p-4 border-b flex items-center justify-between", colorClass)}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg text-white">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white uppercase tracking-wider">{title}</h3>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
                        onClick={() => setIsAdding(type)}
                    >
                        <Plus className="w-4 h-4" />
                        Nova Faixa
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] font-medium">
                            <tr>
                                <th className="px-6 py-3 text-left">Limite Inferior</th>
                                <th className="px-6 py-3 text-left">Limite Superior</th>
                                <th className="px-6 py-3 text-right">Alíquota (%)</th>
                                <th className="px-6 py-3 text-right">Parcela a Deduzir</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isAdding === type && (
                                <tr className="bg-blue-50/50">
                                    <td className="px-6 py-2">
                                        <input
                                            type="number"
                                            className="input py-1"
                                            placeholder="Min"
                                            value={addFormData.minValue || ''}
                                            onChange={e => setAddFormData({ ...addFormData, minValue: parseFloat(e.target.value) })}
                                        />
                                    </td>
                                    <td className="px-6 py-2">
                                        <input
                                            type="number"
                                            className="input py-1"
                                            placeholder="Max (opcional)"
                                            value={addFormData.maxValue || ''}
                                            onChange={e => setAddFormData({ ...addFormData, maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </td>
                                    <td className="px-6 py-2 text-right">
                                        <input
                                            type="number"
                                            className="input py-1 w-20 text-right"
                                            placeholder="%"
                                            value={addFormData.rate || ''}
                                            onChange={e => setAddFormData({ ...addFormData, rate: parseFloat(e.target.value) || 0 })}
                                        />
                                    </td>
                                    <td className="px-6 py-2 text-right">
                                        <input
                                            type="number"
                                            className="input py-1 w-32 text-right"
                                            placeholder="Dedução"
                                            value={addFormData.deductionAmount || ''}
                                            onChange={e => setAddFormData({ ...addFormData, deductionAmount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </td>
                                    <td className="px-6 py-2 text-right whitespace-nowrap">
                                        <Button variant="ghost" size="sm" className="text-blue-600" onClick={handleAdd}><Save className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="sm" className="text-[var(--color-text-tertiary)]" onClick={() => setIsAdding(null)}><X className="w-4 h-4" /></Button>
                                    </td>
                                </tr>
                            )}
                            {filtered.map((b) => (
                                <tr key={b.id} className="hover:bg-[var(--color-surface-variant)] transition-colors">
                                    {editingId === b.id ? (
                                        <>
                                            <td className="px-6 py-2"><input type="number" className="input py-1" value={editFormData.minValue} onChange={e => setEditFormData({ ...editFormData, minValue: parseFloat(e.target.value) })} /></td>
                                            <td className="px-6 py-2"><input type="number" className="input py-1" value={editFormData.maxValue || ''} onChange={e => setEditFormData({ ...editFormData, maxValue: e.target.value ? parseFloat(e.target.value) : undefined })} /></td>
                                            <td className="px-6 py-2 text-right"><input type="number" className="input py-1 w-20 text-right" value={editFormData.rate} onChange={e => setEditFormData({ ...editFormData, rate: parseFloat(e.target.value) })} /></td>
                                            <td className="px-6 py-2 text-right"><input type="number" className="input py-1 w-32 text-right" value={editFormData.deductionAmount} onChange={e => setEditFormData({ ...editFormData, deductionAmount: parseFloat(e.target.value) })} /></td>
                                            <td className="px-6 py-2 text-right whitespace-nowrap">
                                                <Button variant="ghost" size="sm" className="text-green-600" onClick={() => handleSave(b.id)}><Save className="w-4 h-4" /></Button>
                                                <Button variant="ghost" size="sm" className="text-[var(--color-text-tertiary)]" onClick={handleCancel}><X className="w-4 h-4" /></Button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 font-medium">{brl(b.minValue)}</td>
                                            <td className="px-6 py-4">{b.maxValue ? brl(b.maxValue) : 'Teto / Acima'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="px-2 py-1 bg-gray-100 rounded-md font-bold text-gray-700">
                                                    {b.rate}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-[var(--color-text-secondary)]">{brl(b.deductionAmount)}</td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap space-x-1">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(b)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => handleDelete(b.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/payroll">
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Configurações de Faixas</h1>
                    <p className="text-[var(--color-text-secondary)]">Tabelas progressivas para INSS e IRRF</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {loading ? (
                    <div className="text-center py-20 animate-pulse">Carregando tabelas...</div>
                ) : (
                    <>
                        {renderBracketTable('INSS', 'Tabela de INSS (Previdência Social)', 'bg-blue-600')}
                        {renderBracketTable('IRRF', 'Tabela de IRRF (Imposto de Renda)', 'bg-orange-600')}
                    </>
                )}
            </div>

            <div className="bg-orange-50 p-4 rounded-lg flex gap-3 items-start border border-orange-200">
                <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                    <p className="font-bold mb-1">Dica de Configuração</p>
                    <p>As alterações feitas nestas tabelas afetarão todos os cálculos futuros. Folhas já encerradas não são reprocessadas automaticamente.</p>
                </div>
            </div>
        </div>
    );
}
