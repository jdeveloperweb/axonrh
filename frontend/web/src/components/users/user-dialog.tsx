'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserDTO, userApi } from '@/lib/api/users';
import { Loader2, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userToEdit?: UserDTO | null;
    onSuccess: () => void;
}

const AVAILABLE_ROLES = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'GESTOR_RH', label: 'Gestor de RH' },
    { value: 'ANALISTA_DP', label: 'Analista de DP' },
    { value: 'LIDER', label: 'Líder' },
    { value: 'COLABORADOR', label: 'Colaborador' },
    { value: 'CONTADOR', label: 'Contador' },
];

export function UserDialog({ open, onOpenChange, userToEdit, onSuccess }: UserDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<UserDTO>({
        name: '',
        email: '',
        status: 'ACTIVE',
        roles: [],
        password: '',
    });

    useEffect(() => {
        if (open) {
            if (userToEdit) {
                setFormData({
                    ...userToEdit,
                    password: '', // Clear password field on edit
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    status: 'ACTIVE',
                    roles: [],
                    password: '',
                });
            }
        }
    }, [userToEdit, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRoleChange = (role: string, checked: boolean) => {
        setFormData(prev => {
            const currentRoles = prev.roles || [];
            if (checked) {
                return { ...prev, roles: [...currentRoles, role] };
            } else {
                return { ...prev, roles: currentRoles.filter(r => r !== role) };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast({ title: "Erro", description: "Nome e E-mail são obrigatórios.", variant: "destructive" });
            return;
        }

        if (formData.roles.length === 0) {
            toast({ title: "Erro", description: "Selecione ao menos um perfil de acesso.", variant: "destructive" });
            return;
        }

        if (!userToEdit && !formData.password) {
            toast({ title: "Erro", description: "Senha é obrigatória para novos usuários.", variant: "destructive" });
            return;
        }

        try {
            setLoading(true);
            if (userToEdit && userToEdit.id) {
                const payload = { ...formData };
                if (!payload.password || payload.password.trim() === '') {
                    delete payload.password;
                }

                await userApi.update(userToEdit.id, payload);
                toast({ title: "Sucesso", description: "Usuário atualizado com sucesso." });
            } else {
                await userApi.create(formData);
                toast({ title: "Sucesso", description: "Usuário criado com sucesso." });
            }
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Erro", description: "Erro ao salvar usuário.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{userToEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-4">
                        <Input
                            label="Nome Completo"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ex: João Silva"
                            required
                        />

                        <Input
                            label="E-mail"
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Ex: joao@empresa.com"
                            required
                        />

                        <div className="space-y-2">
                            <Label>Perfil de Acesso</Label>
                            <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-[var(--color-surface-variant)]/30">
                                {AVAILABLE_ROLES.map(role => (
                                    <label key={role.value} className="flex items-center space-x-2 cursor-pointer hover:bg-black/5 p-1 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            checked={formData.roles.includes(role.value)}
                                            onChange={(e) => handleRoleChange(role.value, e.target.checked)}
                                        />
                                        <span className="text-sm text-[var(--color-text-primary)]">{role.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Input
                                label={userToEdit ? "Nova Senha (opcional)" : "Senha"}
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password || ''}
                                onChange={handleChange}
                                placeholder={userToEdit ? "Deixe em branco para manter" : "******"}
                            />
                        </div>

                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
