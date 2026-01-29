'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { employeesApi, EmployeeCreateRequest, Employee } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const employeeId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<Partial<EmployeeCreateRequest> | undefined>(undefined);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                const response = await employeesApi.getById(employeeId);
                const employeeData = response as unknown as (Employee & { data?: Employee });
                const employee = (employeeData.data || employeeData) as Employee & Partial<EmployeeCreateRequest>;

                if (!employee) {
                    throw new Error('Colaborador não encontrado');
                }

                const formattedData: Partial<EmployeeCreateRequest> = {
                    ...employee,
                    birthDate: employee.birthDate?.split('T')?.[0] || '',
                    hireDate: (employee.admissionDate || employee.hireDate)?.split('T')?.[0] || '',
                    baseSalary: employee.salary || employee.baseSalary,
                    weeklyHours: employee.workHoursPerWeek || employee.weeklyHours,
                    departmentId: employee.department?.id || employee.departmentId,
                    positionId: employee.position?.id || employee.positionId,
                    costCenterId: employee.costCenter?.id || employee.costCenterId,
                    managerId: employee.manager?.id || employee.managerId,
                    // Mapeia endereço para campos planos
                    addressStreet: employee.address?.street || employee.addressStreet,
                    addressNumber: employee.address?.number || employee.addressNumber,
                    addressComplement: employee.address?.complement || employee.addressComplement,
                    addressNeighborhood: employee.address?.neighborhood || employee.addressNeighborhood,
                    addressCity: employee.address?.city || employee.addressCity,
                    addressState: employee.address?.state || employee.addressState,
                    addressZipCode: employee.address?.zipCode || employee.addressZipCode,
                    mobile: employee.personalPhone || employee.mobile,
                    addressCountry: employee.address?.country || employee.addressCountry,
                    workRegime: employee.workRegime,
                    hybridWorkDays: employee.hybridWorkDays,
                    hybridFrequency: employee.hybridFrequency,
                };

                setInitialData(formattedData);
            } catch (error) {
                console.error('Error loading employee:', error);
                toast({
                    title: 'Erro',
                    description: 'Falha ao carregar dados do colaborador. Verifique se o ID é válido.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        if (employeeId) {
            fetchEmployee();
        }
    }, [employeeId, router, toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Editar Colaborador</h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Atualize os dados do colaborador
                    </p>
                </div>
            </div>

            <EmployeeForm
                initialData={initialData}
                employeeId={employeeId}
                isEditing={true}
            />
        </div>
    );
}
