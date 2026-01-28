'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Save,
    User,
    MapPin,
    Briefcase,
    FileText,
    Users,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { employeesApi, EmployeeCreateRequest, Department, Position, CostCenter, EmployeeAddress } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { isValidCpf, isValidEmail } from '@/lib/utils';
import { DocumentsTab } from './DocumentsTab';
import { DependentsTab } from './DependentsTab';

type TabKey = 'personal' | 'address' | 'professional' | 'documents' | 'dependents';

interface FormErrors {
    [key: string]: string;
}

// Interface interna do formulário (mantém nomes amigáveis)
interface FormData {
    cpf: string;
    fullName: string;
    socialName: string;
    email: string;
    personalEmail: string;
    phone: string;
    personalPhone: string;  // Será mapeado para mobile
    birthDate: string;
    gender: string;
    maritalStatus: string;
    nationality: string;
    admissionDate: string;  // Será mapeado para hireDate
    employmentType: string;
    salary?: number;  // Será mapeado para baseSalary
    workHoursPerWeek?: number;  // Será mapeado para weeklyHours
    departmentId: string;
    positionId: string;
    costCenterId: string;
    managerId: string;
    address: {
        street: string;
        number: string;
        complement: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
}

interface EmployeeFormProps {
    initialData?: Partial<EmployeeCreateRequest>;
    employeeId?: string;
    isEditing?: boolean;
}

export function EmployeeForm({ initialData, employeeId: initialId, isEditing = false }: EmployeeFormProps) {
    const router = useRouter();
    const { toast } = useToast();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabKey>('personal');
    const [employeeId, setEmployeeId] = useState<string | undefined>(initialId);

    // Form state (usando interface interna)
    const [formData, setFormData] = useState<FormData>({
        cpf: '',
        fullName: '',
        socialName: '',
        email: '',
        personalEmail: '',
        phone: '',
        personalPhone: '',
        birthDate: '',
        gender: '',
        maritalStatus: '',
        nationality: 'Brasileira',
        admissionDate: '',
        employmentType: 'CLT',
        salary: undefined,
        workHoursPerWeek: 44,
        departmentId: '',
        positionId: '',
        costCenterId: '',
        managerId: '',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Brasil',
        },
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);

    // Reference data
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);

    // Load reference data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [depts, centers] = await Promise.all([
                    employeesApi.getDepartments(),
                    employeesApi.getCostCenters(),
                ]);
                setDepartments(depts);
                setCostCenters(centers);
            } catch (error) {
                console.error('Failed to load reference data:', error);
            }
        };
        loadData();
    }, []);

    // Load initial data when editing
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                cpf: initialData.cpf || prev.cpf,
                fullName: initialData.fullName || prev.fullName,
                socialName: initialData.socialName || prev.socialName,
                email: initialData.email || prev.email,
                personalEmail: initialData.personalEmail || prev.personalEmail,
                phone: initialData.phone || prev.phone,
                personalPhone: initialData.mobile || prev.personalPhone, // mobile -> personalPhone
                birthDate: initialData.birthDate || prev.birthDate,
                gender: initialData.gender || prev.gender,
                maritalStatus: initialData.maritalStatus || prev.maritalStatus,
                nationality: initialData.nationality || prev.nationality,
                admissionDate: initialData.hireDate || prev.admissionDate, // hireDate -> admissionDate
                employmentType: initialData.employmentType || prev.employmentType,
                salary: initialData.baseSalary || prev.salary, // baseSalary -> salary
                workHoursPerWeek: initialData.weeklyHours || prev.workHoursPerWeek, // weeklyHours -> workHoursPerWeek
                departmentId: initialData.departmentId || prev.departmentId,
                positionId: initialData.positionId || prev.positionId,
                costCenterId: initialData.costCenterId || prev.costCenterId,
                managerId: initialData.managerId || prev.managerId,
                address: {
                    street: initialData.addressStreet || prev.address.street,
                    number: initialData.addressNumber || prev.address.number,
                    complement: initialData.addressComplement || prev.address.complement,
                    neighborhood: initialData.addressNeighborhood || prev.address.neighborhood,
                    city: initialData.addressCity || prev.address.city,
                    state: initialData.addressState || prev.address.state,
                    zipCode: initialData.addressZipCode || prev.address.zipCode,
                    country: initialData.addressCountry || prev.address.country,
                }
            }));
        }
    }, [initialData]);

    // Load positions when department changes
    useEffect(() => {
        const loadPositions = async () => {
            if (formData.departmentId) {
                try {
                    const pos = await employeesApi.getPositions(formData.departmentId);
                    setPositions(pos);
                } catch (error) {
                    console.error('Failed to load positions:', error);
                }
            } else {
                setPositions([]);
            }
        };
        loadPositions();
    }, [formData.departmentId]);

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.startsWith('address.')) {
            const addressField = name.replace('address.', '');
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address!,
                    [addressField]: value,
                },
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }

        // Clear error when field is changed
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle CEP lookup
    const handleCepBlur = async () => {
        const cep = formData.address?.zipCode?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) return;

        try {
            setLoadingCep(true);
            const address = await employeesApi.searchCep(cep);
            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address!,
                    street: address.street || prev.address?.street || '',
                    neighborhood: address.neighborhood || prev.address?.neighborhood || '',
                    city: address.city || prev.address?.city || '',
                    state: address.state || prev.address?.state || '',
                },
            }));
        } catch (error) {
            console.error('Failed to lookup CEP:', error);
        } finally {
            setLoadingCep(false);
        }
    };

    // Validate CPF on blur
    const handleCpfBlur = async () => {
        const cpf = formData.cpf?.replace(/\D/g, '');
        if (!cpf || cpf.length !== 11) return;

        if (!isValidCpf(cpf)) {
            setErrors(prev => ({ ...prev, cpf: 'CPF inválido' }));
            return;
        }

        // Check availability only if new or cpf changed significantly (logic could be refined)
        if (!isEditing) {
            try {
                const result = await employeesApi.validateCpf(cpf);
                if (!result.valid) {
                    setErrors(prev => ({ ...prev, cpf: result.message || 'CPF já cadastrado' }));
                }
            } catch (error) {
                console.error('Failed to validate CPF:', error);
            }
        }
    };

    // Validate form based on active tab
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (activeTab === 'personal') {
            if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
            else if (!isValidCpf(formData.cpf.replace(/\D/g, ''))) newErrors.cpf = 'CPF inválido';

            if (!formData.fullName) newErrors.fullName = 'Nome completo é obrigatório';

            // Data de nascimento é obrigatória no backend
            if (!formData.birthDate) newErrors.birthDate = 'Data de nascimento é obrigatória';

            // Data de admissão é obrigatória no backend
            if (!formData.admissionDate) newErrors.admissionDate = 'Data de admissão é obrigatória';

            if (formData.email && !isValidEmail(formData.email)) {
                newErrors.email = 'E-mail corporativo inválido';
            } else if (!formData.email) {
                newErrors.email = 'E-mail corporativo é obrigatório';
            }

            if (formData.personalEmail && !isValidEmail(formData.personalEmail)) {
                newErrors.personalEmail = 'E-mail pessoal inválido';
            }
        }

        if (activeTab === 'professional') {
            // Employment type is passed with default 'CLT'
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Mapeia dados do formulário para o formato do backend
    const mapFormDataToRequest = (data: FormData): EmployeeCreateRequest => {
        return {
            cpf: data.cpf.replace(/\D/g, ''),  // Remove formatação
            fullName: data.fullName,
            socialName: data.socialName || undefined,
            email: data.email,
            personalEmail: data.personalEmail || undefined,
            phone: data.phone ? data.phone.replace(/\D/g, '') : undefined,
            mobile: data.personalPhone ? data.personalPhone.replace(/\D/g, '') : undefined,  // personalPhone → mobile
            birthDate: data.birthDate,
            gender: data.gender || undefined,
            maritalStatus: data.maritalStatus || undefined,
            nationality: data.nationality || undefined,
            hireDate: data.admissionDate,  // admissionDate → hireDate
            employmentType: data.employmentType,
            baseSalary: data.salary ? Number(data.salary) : undefined,  // salary → baseSalary
            weeklyHours: data.workHoursPerWeek ? Number(data.workHoursPerWeek) : undefined,  // workHoursPerWeek → weeklyHours
            departmentId: data.departmentId || undefined,
            positionId: data.positionId || undefined,
            costCenterId: data.costCenterId || undefined,
            managerId: data.managerId || undefined,
            // Mapeia objeto address para campos planos
            addressStreet: data.address?.street || undefined,
            addressNumber: data.address?.number || undefined,
            addressComplement: data.address?.complement || undefined,
            addressNeighborhood: data.address?.neighborhood || undefined,
            addressCity: data.address?.city || undefined,
            addressState: data.address?.state || undefined,
            addressZipCode: data.address?.zipCode?.replace(/\D/g, '') || undefined,
            addressCountry: data.address?.country || undefined,
        };
    };

    // Handle submit
    const handleSubmit = async () => {

        if (!validateForm()) {
            toast({
                title: 'Erro de validação',
                description: 'Por favor, corrija os erros no formulário',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);

            // Mapeia dados do formulário para o formato do backend
            const submitData = mapFormDataToRequest(formData);

            console.log('Enviando dados:', submitData);  // Debug

            if (!employeeId) {
                // CREATE
                const employee = await employeesApi.create(submitData);
                setEmployeeId(employee.id);
                toast({
                    title: 'Sucesso',
                    description: 'Dados pessoais salvos. Agora você pode preencher as outras abas.',
                });
                router.push(`/employees/${employee.id}/edit`);
            } else {
                // UPDATE
                await employeesApi.update(employeeId, submitData);
                toast({
                    title: 'Sucesso',
                    description: 'Dados atualizados com sucesso',
                });
            }

        } catch (error: any) {
            console.error('Erro ao salvar:', error);  // Debug
            const errorMessage = error?.message || error?.response?.data?.message || 'Falha ao salvar dados';
            toast({
                title: 'Erro',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { key: 'personal' as TabKey, label: 'Dados Pessoais', icon: User, disabled: false },
        { key: 'address' as TabKey, label: 'Endereço', icon: MapPin, disabled: !employeeId },
        { key: 'professional' as TabKey, label: 'Dados Profissionais', icon: Briefcase, disabled: !employeeId },
        { key: 'documents' as TabKey, label: 'Documentos', icon: FileText, disabled: !employeeId },
        { key: 'dependents' as TabKey, label: 'Dependentes', icon: Users, disabled: !employeeId },
    ];

    const handleTabClick = (key: TabKey, disabled: boolean) => {
        if (disabled) {
            toast({
                title: 'Ação Bloqueada',
                description: 'Salve os dados pessoais primeiro para habilitar as outras abas.',
                variant: 'default', // or dedicated warning variant
            });
            return;
        }
        setActiveTab(key);
    };

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-4 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabClick(tab.key, tab.disabled)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : tab.disabled
                                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                                        : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Personal Data Tab */}
            {activeTab === 'personal' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dados Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    CPF <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    onBlur={handleCpfBlur}
                                    placeholder="000.000.000-00"
                                    disabled={!!employeeId} // Lock CPF after creation usually? Or allow edit?
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.cpf ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Data de Nascimento <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.birthDate ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Nome Completo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Digite o nome completo"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.fullName ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Data de Admissão <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="admissionDate"
                                    value={formData.admissionDate}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.admissionDate ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.admissionDate && <p className="text-red-500 text-sm mt-1">{errors.admissionDate}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    E-mail Corporativo <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="colaborador@empresa.com"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.email ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Nome Social
                                </label>
                                <input
                                    type="text"
                                    name="socialName"
                                    value={formData.socialName}
                                    onChange={handleChange}
                                    placeholder="Digite o nome social (se houver)"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Sexo
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione</option>
                                    <option value="MALE">Masculino</option>
                                    <option value="FEMALE">Feminino</option>
                                    <option value="OTHER">Outro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Estado Civil
                                </label>
                                <select
                                    name="maritalStatus"
                                    value={formData.maritalStatus}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione</option>
                                    <option value="SINGLE">Solteiro(a)</option>
                                    <option value="MARRIED">Casado(a)</option>
                                    <option value="DIVORCED">Divorciado(a)</option>
                                    <option value="WIDOWED">Viúvo(a)</option>
                                    <option value="SEPARATED">Separado(a)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Nacionalidade
                                </label>
                                <input
                                    type="text"
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    placeholder="Brasileira"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Telefone Pessoal
                                </label>
                                <input
                                    type="text"
                                    name="personalPhone"
                                    value={formData.personalPhone}
                                    onChange={handleChange}
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    E-mail Pessoal
                                </label>
                                <input
                                    type="email"
                                    name="personalEmail"
                                    value={formData.personalEmail}
                                    onChange={handleChange}
                                    placeholder="email@pessoal.com"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.personalEmail ? 'border-red-500' : 'border-gray-200'
                                        }`}
                                />
                                {errors.personalEmail && <p className="text-red-500 text-sm mt-1">{errors.personalEmail}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Endereço</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    CEP
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="address.zipCode"
                                        value={formData.address?.zipCode || ''}
                                        onChange={handleChange}
                                        onBlur={handleCepBlur}
                                        placeholder="00000-000"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                    {loadingCep && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--color-primary)]" />
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Logradouro
                                </label>
                                <input
                                    type="text"
                                    name="address.street"
                                    value={formData.address?.street || ''}
                                    onChange={handleChange}
                                    placeholder="Rua, Avenida, etc."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    name="address.number"
                                    value={formData.address?.number || ''}
                                    onChange={handleChange}
                                    placeholder="123"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Complemento
                                </label>
                                <input
                                    type="text"
                                    name="address.complement"
                                    value={formData.address?.complement || ''}
                                    onChange={handleChange}
                                    placeholder="Apto, Bloco, etc."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Bairro
                                </label>
                                <input
                                    type="text"
                                    name="address.neighborhood"
                                    value={formData.address?.neighborhood || ''}
                                    onChange={handleChange}
                                    placeholder="Bairro"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    name="address.city"
                                    value={formData.address?.city || ''}
                                    onChange={handleChange}
                                    placeholder="Cidade"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Estado
                                </label>
                                <select
                                    name="address.state"
                                    value={formData.address?.state || ''}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione</option>
                                    <option value="AC">Acre</option>
                                    <option value="AL">Alagoas</option>
                                    <option value="AP">Amapá</option>
                                    <option value="AM">Amazonas</option>
                                    <option value="BA">Bahia</option>
                                    <option value="CE">Ceará</option>
                                    <option value="DF">Distrito Federal</option>
                                    <option value="ES">Espírito Santo</option>
                                    <option value="GO">Goiás</option>
                                    <option value="MA">Maranhão</option>
                                    <option value="MT">Mato Grosso</option>
                                    <option value="MS">Mato Grosso do Sul</option>
                                    <option value="MG">Minas Gerais</option>
                                    <option value="PA">Pará</option>
                                    <option value="PB">Paraíba</option>
                                    <option value="PR">Paraná</option>
                                    <option value="PE">Pernambuco</option>
                                    <option value="PI">Piauí</option>
                                    <option value="RJ">Rio de Janeiro</option>
                                    <option value="RN">Rio Grande do Norte</option>
                                    <option value="RS">Rio Grande do Sul</option>
                                    <option value="RO">Rondônia</option>
                                    <option value="RR">Roraima</option>
                                    <option value="SC">Santa Catarina</option>
                                    <option value="SP">São Paulo</option>
                                    <option value="SE">Sergipe</option>
                                    <option value="TO">Tocantins</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Professional Data Tab */}
            {activeTab === 'professional' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dados Profissionais</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Tipo de Contrato
                                </label>
                                <select
                                    name="employmentType"
                                    value={formData.employmentType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="CLT">CLT</option>
                                    <option value="PJ">PJ</option>
                                    <option value="INTERN">Estagiário</option>
                                    <option value="APPRENTICE">Jovem Aprendiz</option>
                                    <option value="TEMPORARY">Temporário</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Departamento
                                </label>
                                <select
                                    name="departmentId"
                                    value={formData.departmentId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Cargo
                                </label>
                                <select
                                    name="positionId"
                                    value={formData.positionId}
                                    onChange={handleChange}
                                    disabled={!formData.departmentId}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">Selecione</option>
                                    {positions.map((pos) => (
                                        <option key={pos.id} value={pos.id}>
                                            {pos.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Centro de Custo
                                </label>
                                <select
                                    name="costCenterId"
                                    value={formData.costCenterId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                >
                                    <option value="">Selecione</option>
                                    {costCenters.map((cc) => (
                                        <option key={cc.id} value={cc.id}>
                                            {cc.code} - {cc.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Carga Horária Semanal
                                </label>
                                <input
                                    type="number"
                                    name="workHoursPerWeek"
                                    value={formData.workHoursPerWeek || ''}
                                    onChange={handleChange}
                                    placeholder="44"
                                    min="1"
                                    max="44"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Salário
                                </label>
                                <input
                                    type="number"
                                    name="salary"
                                    value={formData.salary || ''}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>



                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text)] mb-1">
                                    Telefone Corporativo
                                </label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && employeeId && (
                <DocumentsTab employeeId={employeeId} />
            )}

            {/* Dependents Tab */}
            {activeTab === 'dependents' && employeeId && (
                <DependentsTab employeeId={employeeId} />
            )}

            {/* Action Buttons - Only for main form tabs */}
            {!['documents', 'dependents'].includes(activeTab) && (
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.push('/employees')}
                        className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Salvar
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
