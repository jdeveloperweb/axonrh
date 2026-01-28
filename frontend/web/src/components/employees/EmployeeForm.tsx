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

    // Form state
    const [formData, setFormData] = useState<EmployeeCreateRequest>({
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
        ...initialData
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

            // Moved to Personal because backend requires it for creation
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

            // Clean up data
            const submitData: EmployeeCreateRequest = {
                ...formData,
                cpf: formData.cpf.replace(/\D/g, ''),
                salary: formData.salary ? Number(formData.salary) : undefined,
                workHoursPerWeek: formData.workHoursPerWeek ? Number(formData.workHoursPerWeek) : undefined,
                departmentId: formData.departmentId || undefined,
                positionId: formData.positionId || undefined,
                costCenterId: formData.costCenterId || undefined,
                managerId: formData.managerId || undefined,
            };

            if (!employeeId) {
                // CREATE
                const employee = await employeesApi.create(submitData);
                setEmployeeId(employee.id);
                toast({
                    title: 'Sucesso',
                    description: 'Dados pessoais salvos. Agora você pode preencher as outras abas.',
                });
                // Switch to Edit Mode URL without refresh if possible, or just stay here with state updated
                // Updating URL is better for bookmarking/refreshing
                router.push(`/employees/${employee.id}/edit`);
            } else {
                // UPDATE
                await employeesApi.update(employeeId, submitData); // Assuming update takes ID and Partial<Data>
                toast({
                    title: 'Sucesso',
                    description: 'Dados atualizados com sucesso',
                });
            }

        } catch (error: any) {
            toast({
                title: 'Erro',
                description: error.response?.data?.message || 'Falha ao salvar dados',
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
                                    Data de Nascimento
                                </label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                />
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
