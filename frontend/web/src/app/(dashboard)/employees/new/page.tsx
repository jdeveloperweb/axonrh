'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { EmployeeForm } from '@/components/employees/EmployeeForm';

export default function NewEmployeePage() {
  const router = useRouter();

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
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Novo Colaborador</h1>
          <p className="text-[var(--color-text-secondary)]">
            Preencha os dados para cadastrar um novo colaborador
          </p>
        </div>
      </div>

      <EmployeeForm isEditing={false} />
    </div>
  );
}
