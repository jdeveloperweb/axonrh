'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    MoreHorizontal,
    Edit2,
    Ban,
    History,
    UserPlus,
    ArrowRight,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { EmployeeBenefit, BenefitType } from '@/types/benefits';
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
import { EmployeeBenefitDialog } from './_components/employee-benefit-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BenefitManagementPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [benefits, setBenefits] = useState<EmployeeBenefit[]>([]);
    const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedBenefit, setSelectedBenefit] = useState<EmployeeBenefit | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const [benefitsData, typesData] = await Promise.all([
                benefitsApi.getEmployeeBenefits(0, 50),
                benefitsApi.getAllActiveTypes()
            ]);
            setBenefits(benefitsData.content || []);
            setBenefitTypes(typesData);
        } catch (error) {
            console.error('Error loading management data:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os dados de gestão.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCancel = async (benefit: EmployeeBenefit) => {
        if (!confirm('Tem certeza que deseja cancelar este benefício? Esta ação não pode ser desfeita.')) return;
        try {
            await benefitsApi.cancelEmployeeBenefit(benefit.id);
            toast({
                title: 'Cancelado',
                description: 'Benefício cancelado com sucesso.',
            });
            loadData();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Não foi possível cancelar o benefício.',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (benefit: EmployeeBenefit) => {
        setSelectedBenefit(benefit);
        setIsDialogOpen(true);
    };

    const filteredBenefits = benefits.filter(b =>
        b.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.benefitTypeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                    <Input
                        placeholder="Buscar colaborador ou benefício..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Filter className="w-4 h-4" /> Filtros
                    </Button>
                    <Button className="btn-primary gap-2" onClick={() => { setSelectedBenefit(null); setIsDialogOpen(true); }}>
                        <UserPlus className="w-4 h-4" />
                        Atribuir Benefício
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-green-50/30 border-green-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">Total Proventos</p>
                                <h3 className="text-2xl font-bold mt-1 text-green-900">R$ 14.250,00</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl text-green-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50/30 border-orange-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">Total Descontos</p>
                                <h3 className="text-2xl font-bold mt-1 text-orange-900">R$ 5.120,00</h3>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                <TrendingDown className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/30 border-blue-100">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Colaboradores Beneficiados</p>
                                <h3 className="text-2xl font-bold mt-1 text-blue-900">{benefits.length}</h3>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                <History className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-[var(--color-border)] shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-[var(--color-surface-variant)]/30">
                        <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Benefício</TableHead>
                            <TableHead>Valor / %</TableHead>
                            <TableHead>Vigência</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredBenefits.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-[var(--color-text-secondary)]">No content.</TableCell>
                            </TableRow>
                        ) : (
                            filteredBenefits.map((b) => (
                                <TableRow key={b.id} className="hover:bg-[var(--color-surface-variant)]/10 transition-colors">
                                    <TableCell className="font-medium">{b.employeeName}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={b.benefitCategory === 'EARNING' ? 'text-green-600' : 'text-orange-600'}>
                                                {b.benefitTypeName}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {b.calculationType === 'FIXED_VALUE'
                                            ? `R$ ${b.fixedValue?.toFixed(2)}`
                                            : `${b.percentage}%`}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {b.startDate ? (() => {
                                            const date = new Date(b.startDate);
                                            return isNaN(date.getTime()) ? 'Invalida' : format(date, 'dd/MM/yyyy');
                                        })() : '-'}
                                        {b.endDate && (() => {
                                            const date = new Date(b.endDate);
                                            if (isNaN(date.getTime())) return null;
                                            return <><ArrowRight className="inline w-3 h-3 mx-1" /> {format(date, 'dd/MM/yyyy')}</>;
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            b.status === 'ACTIVE' ? 'success' :
                                                b.status === 'SCHEDULED' ? 'warning' :
                                                    'secondary'
                                        }>
                                            {b.status}
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
                                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleEdit(b)}>
                                                    <Edit2 className="w-4 h-4" /> Detalhes / Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="gap-2 cursor-pointer text-destructive" onClick={() => handleCancel(b)}>
                                                    <Ban className="w-4 h-4" /> Cancelar Benefício
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

            <EmployeeBenefitDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                selectedBenefit={selectedBenefit}
                onSuccess={loadData}
                benefitTypes={benefitTypes}
            />
        </div>
    );
}
