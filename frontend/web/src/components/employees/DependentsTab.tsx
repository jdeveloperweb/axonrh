import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Users, Loader2, Edit2, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { employeesApi, EmployeeDependent } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';

interface DependentsTabProps {
    employeeId: string;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
    CHILD: 'Filho(a)',
    SPOUSE: 'Cônjuge',
    PARENT: 'Pai/Mãe',
    OTHER: 'Outro',
};

export function DependentsTab({ employeeId }: DependentsTabProps) {
    const { toast } = useToast();
    const [dependents, setDependents] = useState<EmployeeDependent[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit/Add state
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<EmployeeDependent>>({
        name: '',
        relationship: '',
        birthDate: '',
        cpf: '',
        isIRDependent: false,
        isHealthPlanDependent: false,
    });

    const loadDependents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await employeesApi.getDependents(employeeId);
            setDependents(data);
        } catch (error) {
            console.error('Failed to load dependents:', error);
            toast({ title: 'Erro', description: 'Falha ao carregar dependentes', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [employeeId, toast]);

    useEffect(() => {
        loadDependents();
    }, [loadDependents]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Handle CPF mask
        if (name === 'cpf') {
            let v = value.replace(/\D/g, '');
            if (v.length > 11) v = v.slice(0, 11);

            if (v.length > 9) {
                v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
            } else if (v.length > 6) {
                v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
            } else if (v.length > 3) {
                v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
            }

            setFormData(prev => ({ ...prev, [name]: v }));
            return;
        }

        // Handle checkbox
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const startEdit = (dependent: EmployeeDependent) => {
        setEditingId(dependent.id);
        setIsAdding(false);
        setFormData({
            ...dependent,
            birthDate: dependent.birthDate?.split('T')[0],
            isIRDependent: !!dependent.isIRDependent,
            isHealthPlanDependent: !!dependent.isHealthPlanDependent,
        });
    };

    const startAdding = () => {
        setEditingId(null);
        setFormData({
            name: '',
            relationship: '',
            birthDate: '',
            cpf: '',
            isIRDependent: false,
            isHealthPlanDependent: false,
        });
        setIsAdding(true);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
    };

    const validate = () => {
        if (!formData.name) return 'Nome é obrigatório';
        if (!formData.birthDate) return 'Data de nascimento é obrigatória';
        if (!formData.relationship) return 'Parentesco é obrigatório';
        return null;
    };

    const handleSave = async () => {
        const error = validate();
        if (error) {
            toast({ title: 'Erro de Validação', description: error, variant: 'destructive' });
            return;
        }

        try {
            setSaving(true);

            const cleanData = {
                ...formData,
                cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : ''
            };

            if (editingId) {
                await employeesApi.updateDependent(employeeId, editingId, cleanData);
                toast({ title: 'Sucesso', description: 'Dependente atualizado com sucesso' });
            } else {
                await employeesApi.addDependent(employeeId, cleanData as Omit<EmployeeDependent, 'id'>);
                toast({ title: 'Sucesso', description: 'Dependente adicionado com sucesso' });
            }
            await loadDependents();
            cancelEdit();
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro', description: 'Falha ao salvar dependente', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este dependente?')) return;
        try {
            await employeesApi.removeDependent(employeeId, id);
            toast({ title: 'Sucesso', description: 'Dependente removido com sucesso' });
            setDependents(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro', description: 'Falha ao remover dependente', variant: 'destructive' });
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold text-[var(--color-text)]">Dependentes</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">Gerencie os dependentes para IR e Plano de Saúde</p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        type="button"
                        onClick={startAdding}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar
                    </button>
                )}
            </div>

            {/* Form (Add or Edit) */}
            {(isAdding || editingId) && (
                <Card className="border-[var(--color-primary)]/20 shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-medium text-lg">{editingId ? 'Editar Dependente' : 'Novo Dependente'}</h4>
                            <button onClick={cancelEdit} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Nome Completo <span className="text-red-500">*</span></label>
                                <input
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    placeholder="Ex: João Silva"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Parentesco <span className="text-red-500">*</span></label>
                                <select
                                    name="relationship"
                                    value={formData.relationship || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                                >
                                    <option value="">Selecione</option>
                                    <option value="CHILD">Filho(a)</option>
                                    <option value="SPOUSE">Cônjuge</option>
                                    <option value="PARENT">Pai/Mãe</option>
                                    <option value="OTHER">Outro</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Data de Nascimento <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">CPF</label>
                                <input
                                    name="cpf"
                                    value={formData.cpf || ''}
                                    onChange={handleInputChange}
                                    placeholder="000.000.000-00"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-wrap gap-x-8 gap-y-4 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="isIRDependent"
                                        checked={!!formData.isIRDependent}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span className="text-sm font-medium group-hover:text-[var(--color-primary)] transition-colors">Dependente para IR</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        name="isHealthPlanDependent"
                                        checked={!!formData.isHealthPlanDependent}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span className="text-sm font-medium group-hover:text-[var(--color-primary)] transition-colors">Dependente para Plano de Saúde</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                            <button
                                onClick={cancelEdit}
                                className="px-6 py-2 border rounded-lg bg-white hover:bg-gray-50 text-[var(--color-text-secondary)] font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 flex items-center gap-2 font-medium shadow-sm transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {editingId ? 'Salvar Alterações' : 'Salvar Dependente'}
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {dependents.map(dep => (
                    <Card key={dep.id} className="hover:shadow-md transition-shadow border-gray-100">
                        <CardContent className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-gray-50 text-[var(--color-primary)] rounded-xl border border-gray-100">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-semibold text-[var(--color-text)] text-lg">{dep.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
                                        <span className="font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded capitalize">
                                            {RELATIONSHIP_LABELS[dep.relationship] || dep.relationship}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span>{new Date(dep.birthDate).toLocaleDateString('pt-BR')}</span>
                                        {dep.cpf && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className="font-mono">{dep.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-4 mt-3">
                                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${dep.isIRDependent ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-100 grayscale'}`}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 ${!dep.isIRDependent && 'text-gray-300'}`} />
                                            Imposto de Renda
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${dep.isHealthPlanDependent ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-400 border border-gray-100 grayscale'}`}>
                                            <CheckCircle2 className={`w-3.5 h-3.5 ${!dep.isHealthPlanDependent && 'text-gray-300'}`} />
                                            Plano de Saúde
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => startEdit(dep)}
                                    className="p-2.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-xl transition-all"
                                    title="Editar"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(dep.id)}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {dependents.length === 0 && !isAdding && (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Nenhum dependente cadastrado.</p>
                        <p className="text-sm text-gray-400 mt-1">Clique em &quot;Adicionar&quot; para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
