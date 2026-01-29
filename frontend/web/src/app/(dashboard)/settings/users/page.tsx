'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Search,
    UserPlus,
    Shield,
    Trash2,
    Edit2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { userApi, UserDTO } from '@/lib/api/users';
import { useToast } from '@/hooks/use-toast';
import { UserDialog } from '@/components/users/user-dialog';

export default function UsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await userApi.list();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao carregar usuários',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleCreate = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (user: UserDTO) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                await userApi.delete(id);
                toast({ title: 'Sucesso', description: 'Usuário excluído com sucesso' });
                loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                toast({ title: 'Erro', description: 'Erro ao excluir usuário', variant: 'destructive' });
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Usuários do Sistema</h1>
                    <p className="text-[var(--color-text-secondary)]">Gerencie os administradores e acessos ao painel de RH</p>
                </div>
                <button
                    className="btn-primary flex items-center gap-2"
                    onClick={handleCreate}
                >
                    <UserPlus className="w-4 h-4" />
                    Novo Usuário
                </button>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-[var(--color-border)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface-variant)] border-none rounded-[var(--radius-md)] focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[var(--color-surface-variant)] text-[var(--color-text-secondary)] text-sm font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Papéis</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4" colSpan={4}>
                                                <div className="h-12 bg-[var(--color-surface-variant)] rounded"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                                            Nenhum usuário encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-[var(--color-surface-variant)]/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-text-on-primary)] font-bold text-sm">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[var(--color-text-primary)]">{user.name}</p>
                                                        <p className="text-xs text-[var(--color-text-secondary)]">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map(role => (
                                                        <span key={role} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">
                                                            <Shield className="w-2.5 h-2.5" />
                                                            {role}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'ACTIVE'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {user.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                    {user.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="p-2 hover:bg-[var(--color-surface-variant)] rounded-full transition-colors text-[var(--color-text-secondary)]"
                                                        title="Editar"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
                                                        title="Excluir"
                                                        onClick={() => user.id && handleDelete(user.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                userToEdit={selectedUser}
                onSuccess={loadUsers}
            />
        </div>
    );
}
