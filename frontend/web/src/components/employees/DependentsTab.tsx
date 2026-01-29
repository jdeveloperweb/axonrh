import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Users, Loader2, Edit2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { employeesApi, EmployeeDependent } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';


interface DependentsTabProps {
    employeeId: string;
}

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
            // Format date for input date (YYYY-MM-DD) if necessary
            birthDate: dependent.birthDate?.split('T')[0]
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setIsAdding(false);
        setFormData({
            name: '',
            relationship: '',
            birthDate: '',
            cpf: '',
            isIRDependent: false,
            isHealthPlanDependent: false,
        });
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
            toast({ title: 'Erro', description: error, variant: 'destructive' });
            return;
        }

        try {
            setSaving(true);

            // Clean CPF (remove non-digits)
            const cleanData = {
                ...formData,
                cpf: formData.cpf ? formData.cpf.replace(/\D/g, '') : ''
            };

            if (editingId) {
                // Update
                await employeesApi.updateDependent(employeeId, editingId, cleanData);
                toast({ title: 'Sucesso', description: 'Dependente atualizado' });
            } else {
                // Create
                // Ensure mandatory fields are present for TS
                await employeesApi.addDependent(employeeId, cleanData as Omit<EmployeeDependent, 'id'>);
                toast({ title: 'Sucesso', description: 'Dependente adicionado' });
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
            toast({ title: 'Sucesso', description: 'Dependente removido' });
            setDependents(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error(err);
            toast({ title: 'Erro', description: 'Falha ao remover dependente', variant: 'destructive' });
        }
    };

    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Lista de Dependentes</h3>
                {!isAdding && !editingId && (
                    <button
                        type="button"
                        onClick={() => { setIsAdding(true); cancelEdit(); setIsAdding(true); }} // reset form then set adding
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Dependente
                    </button>
                )}
            </div>

            {/* Form (Add or Edit) */}
            {(isAdding || editingId) && (
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                                <input
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Parentesco *</label>
                                <select
                                    name="relationship"
                                    value={formData.relationship || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">Selecione</option>
                                    <option value="CHILD">Filho(a)</option>
                                    <option value="SPOUSE">Cônjuge</option>
                                    <option value="PARENT">Pai/Mãe</option>
                                    <option value="OTHER">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Data de Nascimento *</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">CPF</label>
                                <input
                                    name="cpf"
                                    value={formData.cpf || ''}
                                    onChange={handleInputChange}
                                    placeholder="000.000.000-00"
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="md:col-span-2 flex gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isIRDependent"
                                        checked={formData.isIRDependent}
                                        onChange={handleInputChange}
                                    />
                                    <span className="text-sm">Dependente IR</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isHealthPlanDependent"
                                        checked={formData.isHealthPlanDependent}
                                        onChange={handleInputChange}
                                    />
                                    <span className="text-sm">Dependente Plano de Saúde</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={cancelEdit} className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                            >
                                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                                Salvar
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* List */}
            <div className="grid gap-4">
                {dependents.map(dep => (
                    <Card key={dep.id}>
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 rounded-full">
                                    <Users className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium">{dep.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {dep.relationship} • {new Date(dep.birthDate).toLocaleDateString()}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        {dep.isIRDependent && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">IR</span>}
                                        {dep.isHealthPlanDependent && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Plano Saúde</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(dep)} className="p-2 text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 rounded-lg">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(dep.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {dependents.length === 0 && !isAdding && (
                    <p className="text-center text-gray-500 py-8">Nenhum dependente cadastrado.</p>
                )}
            </div>
        </div>
    );
}
