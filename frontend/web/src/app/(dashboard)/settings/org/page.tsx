'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    setupApi,
    Department,
    Position
} from '@/lib/api/setup';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Network,
    Briefcase,
    Trash2,
    Edit2,
    ArrowLeft,
    Save,
    Search,
    Loader2,
    Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export default function OrgSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);

    // Modals
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isPosModalOpen, setIsPosModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form States
    const [deptForm, setDeptForm] = useState<Partial<Department>>({ name: '', code: '' });
    const [posForm, setPosForm] = useState<Partial<Position>>({ title: '', code: '', departmentId: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [deptsData, posesData] = await Promise.all([
                setupApi.getDepartments(),
                setupApi.getPositions()
            ]);
            setDepartments(deptsData);
            setPositions(posesData);
        } catch (error) {
            console.error('Error loading org data:', error);
            toast.error('Erro ao carregar estrutura organizacional');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDept = async () => {
        if (!deptForm.name || !deptForm.code) {
            toast.error('Nome e Código são obrigatórios');
            return;
        }
        try {
            setSaving(true);
            await setupApi.saveDepartment(deptForm as Department);
            toast.success('Departamento salvo com sucesso');
            setIsDeptModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Erro ao salvar departamento');
        } finally {
            setSaving(false);
        }
    };

    const handleSavePos = async () => {
        if (!posForm.title || !posForm.code || !posForm.departmentId) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }
        try {
            setSaving(true);
            await setupApi.savePosition(posForm as Position);
            toast.success('Cargo salvo com sucesso');
            setIsPosModalOpen(false);
            loadData();
        } catch (error) {
            toast.error('Erro ao salvar cargo');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDept = async (id: string) => {
        if (!confirm('Excluir este departamento?')) return;
        try {
            await setupApi.deleteDepartment(id);
            toast.success('Departamento excluído');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir');
        }
    };

    const handleDeletePos = async (id: string) => {
        if (!confirm('Excluir este cargo?')) return;
        try {
            await setupApi.deletePosition(id);
            toast.success('Cargo excluído');
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir');
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para Configurações
                    </button>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Estrutura Organizacional</h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Gerencie departamentos, cargos e a hierarquia da empresa.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="departments" className="w-full">
                <TabsList className="bg-[var(--color-surface-variant)] p-1 rounded-xl mb-6">
                    <TabsTrigger value="departments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Network className="w-4 h-4 mr-2" /> Departamentos
                    </TabsTrigger>
                    <TabsTrigger value="positions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Briefcase className="w-4 h-4 mr-2" /> Cargos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="departments" className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-[var(--color-border)]">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Buscar departamento..." className="pl-9 bg-slate-50 border-none" />
                        </div>
                        <Button onClick={() => { setDeptForm({ name: '', code: '' }); setIsDeptModalOpen(true); }} className="btn-primary">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Departamento
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {departments.map((dept) => (
                            <Card key={dept.id} className="border-none shadow-md bg-[var(--color-surface)] group hover:shadow-xl transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => { setDeptForm(dept); setIsDeptModalOpen(true); }}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => dept.id && handleDeleteDept(dept.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg mt-3">{dept.name}</CardTitle>
                                    <CardDescription>Código: {dept.code}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-[var(--color-text-secondary)] italic">
                                        {dept.description || 'Sem descrição definida.'}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="positions" className="space-y-4">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-[var(--color-border)]">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Buscar cargo..." className="pl-9 bg-slate-50 border-none" />
                        </div>
                        <Button onClick={() => { setPosForm({ title: '', code: '', departmentId: '' }); setIsPosModalOpen(true); }} className="btn-primary">
                            <Plus className="w-4 h-4 mr-2" /> Adicionar Cargo
                        </Button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Título</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {positions.map((pos) => {
                                    const dept = departments.find(d => d.id === pos.departmentId);
                                    return (
                                        <tr key={pos.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 font-mono">{pos.code}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{pos.title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {dept?.name || 'Geral'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => { setPosForm(pos); setIsPosModalOpen(true); }}>
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => pos.id && handleDeletePos(pos.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Department Modal */}
            <Dialog open={isDeptModalOpen} onOpenChange={setIsDeptModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{deptForm.id ? 'Editar Departamento' : 'Novo Departamento'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome do Departamento *</Label>
                            <Input value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} placeholder="Ex: Financeiro" />
                        </div>
                        <div className="space-y-2">
                            <Label>Código *</Label>
                            <Input value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} placeholder="Ex: FIN" />
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={deptForm.description} onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeptModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveDept} disabled={saving}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Position Modal */}
            <Dialog open={isPosModalOpen} onOpenChange={setIsPosModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{posForm.id ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título do Cargo *</Label>
                            <Input value={posForm.title} onChange={(e) => setPosForm({ ...posForm, title: e.target.value })} placeholder="Ex: Analista Pleno" />
                        </div>
                        <div className="space-y-2">
                            <Label>Código *</Label>
                            <Input value={posForm.code} onChange={(e) => setPosForm({ ...posForm, code: e.target.value })} placeholder="Ex: AP-01" />
                        </div>
                        <div className="space-y-2">
                            <Label>Departamento *</Label>
                            <Select value={posForm.departmentId} onValueChange={(v) => setPosForm({ ...posForm, departmentId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id || ''}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPosModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSavePos} disabled={saving}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
