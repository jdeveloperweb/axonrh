'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { employeesApi, EmployeeCreateRequest } from '@/lib/api/employees';
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
                const data = await employeesApi.getById(employeeId);

                // Map API response to Form Data structure if necessary
                // EmployeeCreateRequest matches Employee interface mostly, but nested objects might need care?
                // Actually Employee has address object, etc. It should map fine.
                // One issue: Dates might be string in ISO format. Inputs expect YYYY-MM-DD.
                // We might need to slice the date strings.

                const formattedData: Partial<EmployeeCreateRequest> = {
                    ...data,
                    birthDate: data.birthDate?.split('T')[0],
                    hireDate: data.admissionDate?.split('T')[0],
                    baseSalary: data.salary,
                    weeklyHours: data.workHoursPerWeek,
                    departmentId: data.department?.id,
                    positionId: data.position?.id,
                    costCenterId: data.costCenter?.id,
                    managerId: data.manager?.id,
                    // Mapeia endereço para campos planos
                    addressStreet: data.address?.street,
                    addressNumber: data.address?.number,
                    addressComplement: data.address?.complement,
                    addressNeighborhood: data.address?.neighborhood,
                    addressCity: data.address?.city,
                    addressState: data.address?.state,
                    addressZipCode: data.address?.zipCode,
                    mobile: data.personalPhone,
                    addressCountry: data.address?.country,
                };

                setInitialData(formattedData);
            } catch (error) {
                console.error('Error loading employee:', error);
                toast({
                    title: 'Erro',
                    description: 'Falha ao carregar dados do colaborador',
                    variant: 'destructive',
                });
                router.push('/employees');
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
