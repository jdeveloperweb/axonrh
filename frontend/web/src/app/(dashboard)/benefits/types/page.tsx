'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Power,
    PowerOff,
    CreditCard,
    Target,
    FileText
} from 'lucide-react';
import { BenefitType } from '@/types/benefits';
import { benefitsApi } from '@/lib/api/benefits';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BenefitTypeDialog } from './_components/benefit-type-dialog';

export default function BenefitTypesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [types, setTypes] = useState<BenefitType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<BenefitType | null>(null);

    const loadTypes = async () => {
        try {
            setLoading(true);
            const data = await benefitsApi.getTypes(0, 50);
            setTypes(data.content || []);
        } catch (error) {
            console.error('Error loading benefit types:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os tipos de benefícios.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const roles = user.roles || [];
            const isRH = roles.includes('ADMIN') || roles.includes('RH') || roles.includes('GESTOR_RH') || roles.includes('ANALISTA_DP');

            if (!isRH) {
                router.replace('/benefits/my-benefits');
                return;
            }
        }
        loadTypes();
    }, [user, router]);

    const handleToggleStatus = async (type: BenefitType) => {
        try {
            if (type.isActive) {
                await benefitsApi.deactivateType(type.id);
            } else {
                await benefitsApi.activateType(type.id);
            }
            toast({
                title: 'Sucesso',
                description: `Benefício ${type.isActive ? 'desativado' : 'ativado'} com sucesso.`,
            });
            loadTypes();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível alterar o status do benefício.',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (type: BenefitType) => {
        setSelectedType(type);
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedType(null);
        setIsDialogOpen(true);
    };

    const filteredTypes = types.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <Input
                        placeholder="Buscar benefícios..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="btn-primary gap-2" onClick={handleCreate}>
                    <Plus className="w-4 h-4" />
                    Novo Tipo de Benefício
                </Button>
            </div>

            <Card className="border-[var(--color-border)] shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[var(--color-surface-variant)]/30">
                        <TableRow>
                            <TableHead>Benefício</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Cálculo</TableHead>
                            <TableHead>Regras Folha</TableHead>
                            <TableHead>Integração</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                                        Carregando...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-[var(--color-text-secondary)]">
                                    Nenhum benefício encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTypes.map((type) => (
                                <TableRow key={type.id} className="hover:bg-[var(--color-surface-variant)]/10 transition-colors">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{type.name}</span>
                                            <span className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{type.description}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={type.category === 'EARNING' ? 'text-green-600 border-green-200 bg-green-50' : 'text-orange-600 border-orange-200 bg-orange-50'}>
                                            {type.category === 'EARNING' ? 'Provento' : 'Desconto'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {type.calculationType === 'FIXED_VALUE' ? 'Valor Fixo' : 'Percentual Salário'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {type.payrollCode ? (
                                            <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                                                <FileText className="w-3 h-3" />
                                                {type.payrollCode}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">Não config.</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {type.externalProvider ? (
                                            <Badge variant="secondary" className="gap-1 px-2 py-0 h-6">
                                                <CreditCard className="w-3 h-3" />
                                                {type.externalProvider}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-slate-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={type.isActive ? 'success' : 'secondary'}>
                                            {type.isActive ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEdit(type)}>
                                                    <Edit2 className="w-4 h-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleToggleStatus(type)}>
                                                    {type.isActive ? (
                                                        <><PowerOff className="w-4 h-4 text-orange-600" /> Desativar</>
                                                    ) : (
                                                        <><Power className="w-4 h-4 text-green-600" /> Ativar</>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <BenefitTypeDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                selectedType={selectedType}
                onSuccess={loadTypes}
            />
        </div>
    );
}
