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
    Loader2,
    Key,
    Wand2,
    Eye,
    EyeOff,
    ShieldCheck,
    ShieldAlert,
    Sparkles,
    Upload
} from 'lucide-react';
import { ExtractDataModal } from './ExtractDataModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { employeesApi, EmployeeCreateRequest, Department, Position, CostCenter } from '@/lib/api/employees';
import { managersApi, ManagerDTO } from '@/lib/api/managers';
import { userApi } from '@/lib/api/users';
import { timesheetApi } from '@/lib/api/timesheet';
import { useToast } from '@/hooks/use-toast';
import { cn, isValidCpf, isValidEmail } from '@/lib/utils';
import { DocumentsTab } from './DocumentsTab';
import { DependentsTab } from './DependentsTab';

type TabKey = 'personal' | 'address' | 'professional' | 'document_info' | 'bank' | 'documents' | 'dependents';

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
    personalPhone: string;
    birthDate: string;
    gender: string;
    ethnicity: string;
    race: string;
    maritalStatus: string;
    nationality: string;
    admissionDate: string;
    employmentType: string;
    salary?: number;
    workHoursPerWeek?: number;
    departmentId: string;
    positionId: string;
    costCenterId: string;
    managerId: string;
    workRegime: string;
    hybridWorkDays: string[];
    hybridFrequency?: number;
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
    allowPlatformAccess: boolean;
    platformPassword?: string;
    platformRoles: string[];
    workScheduleId: string;

    // Novos campos
    birthCity: string;
    birthState: string;
    motherName: string;
    fatherName: string;
    rgNumber: string;
    rgIssuer: string;
    rgState: string;
    rgIssueDate: string;
    pisPasep: string;
    ctpsNumber: string;
    ctpsSeries: string;
    ctpsState: string;
    ctpsIssueDate: string;
    voterTitle: string;
    voterZone: string;
    voterSection: string;
    militaryCertificate: string;
    driverLicense: string;
    driverLicenseCategory: string;
    driverLicenseExpiry: string;
    bankCode: string;
    bankName: string;
    bankAgency: string;
    bankAgencyDigit: string;
    bankAccount: string;
    bankAccountDigit: string;
    bankAccountType: string;
    pixKey: string;
    pixKeyType: string;
    salaryType: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
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
        ethnicity: '',
        race: '',
        maritalStatus: '',
        nationality: '',
        admissionDate: '',
        employmentType: 'CLT',
        salary: 0,
        workHoursPerWeek: 44,
        departmentId: '',
        positionId: '',
        costCenterId: '',
        managerId: '',
        workRegime: 'PRESENCIAL',
        hybridWorkDays: [],
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
        allowPlatformAccess: false,
        platformPassword: '',
        platformRoles: ['COLABORADOR'],
        workScheduleId: '',
        birthCity: '',
        birthState: '',
        motherName: '',
        fatherName: '',
        rgNumber: '',
        rgIssuer: '',
        rgState: '',
        rgIssueDate: '',
        pisPasep: '',
        ctpsNumber: '',
        ctpsSeries: '',
        ctpsState: '',
        ctpsIssueDate: '',
        voterTitle: '',
        voterZone: '',
        voterSection: '',
        militaryCertificate: '',
        driverLicense: '',
        driverLicenseCategory: '',
        driverLicenseExpiry: '',
        bankCode: '',
        bankName: '',
        bankAgency: '',
        bankAgencyDigit: '',
        bankAccount: '',
        bankAccountDigit: '',
        bankAccountType: 'CURRENT',
        pixKey: '',
        pixKeyType: 'CPF',
        salaryType: 'MONTHLY',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [hasExistingAccess, setHasExistingAccess] = useState(false);
    const [existingUserId, setExistingUserId] = useState<string | null>(null);
    const [checkingAccess, setCheckingAccess] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [extractModalOpen, setExtractModalOpen] = useState(false);


    // Reference data
    const [departments, setDepartments] = useState<Department[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [managers, setManagers] = useState<ManagerDTO[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loadingReferenceData, setLoadingReferenceData] = useState(true);

    // Load initial reference data
    useEffect(() => {
        const loadData = async () => {
            setLoadingReferenceData(true);

            // Load departments
            try {
                const depts = await employeesApi.getDepartments();
                setDepartments(depts);
            } catch (error) {
                console.error('❌ Failed to load departments:', error);
            }

            // Load cost centers
            try {
                const centers = await employeesApi.getCostCenters();
                setCostCenters(centers);
            } catch (error) {
                console.error('❌ Failed to load cost centers:', error);
            }

            // Load managers
            try {
                const mgrs = await managersApi.list();
                setManagers(mgrs);
            } catch (error) {
                console.error('❌ Failed to load managers:', error);
            }

            // Load schedules
            try {
                const scheds = await timesheetApi.listSchedules();
                setSchedules(scheds);
            } catch (error) {
                console.error('❌ Failed to load schedules:', error);
            }

            setLoadingReferenceData(false);
        };
        loadData();
    }, []);

    // Check if user has platform access based on email
    useEffect(() => {
        const checkAccess = async () => {
            if (formData.email && isValidEmail(formData.email)) {
                try {
                    setCheckingAccess(true);
                    const users = await userApi.list();
                    const existingUser = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());

                    if (existingUser) {
                        setHasExistingAccess(true);
                        setExistingUserId(existingUser.id || null);
                        // Ao detectar acesso existente, sincronizamos roles e ligamos o switch
                        setFormData(prev => ({
                            ...prev,
                            allowPlatformAccess: true,
                            platformRoles: existingUser.roles
                        }));
                    } else {
                        setHasExistingAccess(false);
                        setExistingUserId(null);
                    }
                } catch (error) {
                    console.warn('⚠️ Não foi possível verificar acesso à plataforma:', error);
                } finally {
                    setCheckingAccess(false);
                }
            }
        };
        checkAccess();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.email]);

    // Load initial data when editing
    useEffect(() => {
        if (initialData && Object.keys(initialData).length > 0) {
            setFormData(prev => ({
                ...prev,
                cpf: initialData.cpf || prev.cpf,
                fullName: initialData.fullName || prev.fullName,
                socialName: initialData.socialName || prev.socialName,
                email: initialData.email || prev.email,
                personalEmail: initialData.personalEmail || prev.personalEmail,
                phone: initialData.phone || prev.phone,
                personalPhone: initialData.mobile || prev.personalPhone,
                birthDate: initialData.birthDate || prev.birthDate,
                gender: initialData.gender || prev.gender,
                ethnicity: initialData.ethnicity || prev.ethnicity,
                race: initialData.race || prev.race || initialData.ethnicity || '',
                maritalStatus: initialData.maritalStatus || prev.maritalStatus,
                nationality: initialData.nationality || prev.nationality,
                admissionDate: initialData.hireDate || prev.admissionDate,
                employmentType: initialData.employmentType || prev.employmentType,
                salary: initialData.baseSalary || prev.salary,
                workHoursPerWeek: initialData.weeklyHours || prev.workHoursPerWeek,
                departmentId: initialData.departmentId || prev.departmentId,
                positionId: initialData.positionId || prev.positionId,
                costCenterId: initialData.costCenterId || prev.costCenterId,
                managerId: initialData.managerId || prev.managerId,
                workRegime: initialData.workRegime || prev.workRegime,
                hybridWorkDays: initialData.hybridWorkDays || prev.hybridWorkDays,
                hybridFrequency: initialData.hybridFrequency || prev.hybridFrequency,
                address: {
                    street: initialData.addressStreet || prev.address.street,
                    number: initialData.addressNumber || prev.address.number,
                    complement: initialData.addressComplement || prev.address.complement,
                    neighborhood: initialData.addressNeighborhood || prev.address.neighborhood,
                    city: initialData.addressCity || prev.address.city,
                    state: initialData.addressState || prev.address.state,
                    zipCode: initialData.addressZipCode || prev.address.zipCode,
                    country: initialData.addressCountry || prev.address.country,
                },
                workScheduleId: (initialData as any).workScheduleId || prev.workScheduleId,
                birthCity: (initialData as any).birthCity || prev.birthCity,
                birthState: (initialData as any).birthState || prev.birthState,
                motherName: (initialData as any).motherName || prev.motherName,
                fatherName: (initialData as any).fatherName || prev.fatherName,
                rgNumber: (initialData as any).rgNumber || prev.rgNumber,
                rgIssuer: (initialData as any).rgIssuer || prev.rgIssuer,
                rgState: (initialData as any).rgState || prev.rgState,
                rgIssueDate: (initialData as any).rgIssueDate || prev.rgIssueDate,
                pisPasep: (initialData as any).pisPasep || prev.pisPasep,
                ctpsNumber: (initialData as any).ctpsNumber || prev.ctpsNumber,
                ctpsSeries: (initialData as any).ctpsSeries || prev.ctpsSeries,
                ctpsState: (initialData as any).ctpsState || prev.ctpsState,
                ctpsIssueDate: (initialData as any).ctpsIssueDate || prev.ctpsIssueDate,
                voterTitle: (initialData as any).voterTitle || prev.voterTitle,
                voterZone: (initialData as any).voterZone || prev.voterZone,
                voterSection: (initialData as any).voterSection || prev.voterSection,
                militaryCertificate: (initialData as any).militaryCertificate || prev.militaryCertificate,
                driverLicense: (initialData as any).driverLicense || prev.driverLicense,
                driverLicenseCategory: (initialData as any).driverLicenseCategory || prev.driverLicenseCategory,
                driverLicenseExpiry: (initialData as any).driverLicenseExpiry || prev.driverLicenseExpiry,
                bankCode: (initialData as any).bankCode || prev.bankCode,
                bankName: (initialData as any).bankName || prev.bankName,
                bankAgency: (initialData as any).bankAgency || prev.bankAgency,
                bankAgencyDigit: (initialData as any).bankAgencyDigit || prev.bankAgencyDigit,
                bankAccount: (initialData as any).bankAccount || prev.bankAccount,
                bankAccountDigit: (initialData as any).bankAccountDigit || prev.bankAccountDigit,
                bankAccountType: (initialData as any).bankAccountType || prev.bankAccountType,
                pixKey: (initialData as any).pixKey || prev.pixKey,
                pixKeyType: (initialData as any).pixKeyType || prev.pixKeyType,
                salaryType: (initialData as any).salaryType || prev.salaryType,
                emergencyContactName: (initialData as any).emergencyContactName || prev.emergencyContactName,
                emergencyContactPhone: (initialData as any).emergencyContactPhone || prev.emergencyContactPhone,
                emergencyContactRelationship: (initialData as any).emergencyContactRelationship || prev.emergencyContactRelationship,
            }));
            setErrors({});
        }
    }, [initialData]);

    // Load positions when department changes
    useEffect(() => {
        const loadPositions = async () => {
            if (formData.departmentId) {
                try {
                    const pos = await employeesApi.getPositions(formData.departmentId);
                    setPositions(pos);
                } catch (error: unknown) {
                    console.error('❌ Failed to load positions:', error);
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
            setFormData(prev => {
                const newData = {
                    ...prev,
                    [name]: value,
                };

                if (name === 'ethnicity') {
                    newData.race = value;
                } else if (name === 'race') {
                    newData.ethnicity = value;
                }

                return newData;
            });
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleDataExtracted = (data: Record<string, any>) => {
        setFormData(prev => ({
            ...prev,
            fullName: data.fullName || data.nome || prev.fullName,
            cpf: data.cpf || prev.cpf,
            birthDate: data.birthDate || data.dataNascimento || prev.birthDate,
            gender: data.gender || data.genero || prev.gender,
            maritalStatus: data.maritalStatus || data.estadoCivil || prev.maritalStatus,
            nationality: data.nationality || data.nacionalidade || prev.nationality,
            email: data.email || prev.email,
            phone: data.phone || data.telefone || prev.phone,
            birthCity: data.birthCity || data.naturalidade || prev.birthCity,
            birthState: data.birthState || data.naturalidadeUF || prev.birthState,
            motherName: data.motherName || data.nomeMae || prev.motherName,
            fatherName: data.fatherName || data.nomePai || prev.fatherName,
            rgNumber: data.rgNumber || data.rg || prev.rgNumber,
            rgIssuer: data.rgIssuer || data.rgOrgaoEmissor || prev.rgIssuer,
            rgIssueDate: data.rgIssueDate || data.rgDataEmissao || prev.rgIssueDate,
            pisPasep: data.pisPasep || data.pis || prev.pisPasep,
            ctpsNumber: data.ctpsNumber || data.ctps || prev.ctpsNumber,
            bankCode: data.bankCode || prev.bankCode,
            bankName: data.bankName || prev.bankName,
            bankAgency: data.bankAgency || prev.bankAgency,
            bankAccount: data.bankAccount || prev.bankAccount,
            pixKey: data.pixKey || prev.pixKey,
            address: {
                ...prev.address,
                street: data.addressStreet || data.logradouro || prev.address.street,
                number: data.addressNumber || data.numero || prev.address.number,
                neighborhood: data.addressNeighborhood || data.bairro || prev.address.neighborhood,
                city: data.addressCity || data.cidade || prev.address.city,
                state: data.addressState || data.uf || prev.address.state,
                zipCode: data.addressZipCode || data.cep || prev.address.zipCode,
            }
        }));
    };

    const handleCepBlur = async () => {
        const cep = formData.address.zipCode.replace(/\D/g, '');
        if (cep.length !== 8) return;

        try {
            setLoadingCep(true);
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    address: {
                        ...prev.address,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                    },
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setLoadingCep(false);
        }
    };

    const validate = () => {
        const newErrors: FormErrors = {};

        if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
        else if (!isValidCpf(formData.cpf)) newErrors.cpf = 'CPF inválido';

        if (!formData.fullName) newErrors.fullName = 'Nome completo é obrigatório';
        if (!formData.email) newErrors.email = 'E-mail corporativo é obrigatório';
        else if (!isValidEmail(formData.email)) newErrors.email = 'E-mail inválido';

        if (!formData.birthDate) newErrors.birthDate = 'Data de nascimento é obrigatória';
        if (!formData.admissionDate) newErrors.admissionDate = 'Data de admissão é obrigatória';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            console.warn('❌ Validation failed:', errors);
            toast({
                title: 'Erro de Validação',
                description: 'Por favor, preencha todos os campos obrigatórios corretamente.',
                variant: 'destructive',
            });
            return;
        }

        console.log('🚀 Starting handleSubmit', { isEditing, employeeId });
        setLoading(true);

        try {
            // Limpeza de campos para não enviar string vazia onde o backend espera UUID ou Nulo
            const cleanId = (id?: string) => (id && id.length > 5) ? id : undefined;
            const cleanNumber = (val: string | number | undefined) => {
                const num = Number(val);
                return isNaN(num) ? 0 : num;
            };

            const submitData: EmployeeCreateRequest = {
                cpf: formData.cpf.replace(/\D/g, ''),
                fullName: formData.fullName.trim(),
                socialName: formData.socialName?.trim() || undefined,
                email: formData.email.trim(),
                personalEmail: formData.personalEmail?.trim() || undefined,
                phone: formData.phone?.replace(/\D/g, '') || undefined,
                mobile: formData.personalPhone?.replace(/\D/g, '') || undefined,
                birthDate: formData.birthDate,
                gender: formData.gender,
                ethnicity: formData.ethnicity,
                race: formData.race,
                maritalStatus: formData.maritalStatus,
                nationality: formData.nationality,
                hireDate: formData.admissionDate,
                employmentType: formData.employmentType,
                baseSalary: cleanNumber(formData.salary) > 0 ? cleanNumber(formData.salary) : 0.01,
                weeklyHours: cleanNumber(formData.workHoursPerWeek) > 0 ? cleanNumber(formData.workHoursPerWeek) : 44,
                departmentId: cleanId(formData.departmentId),
                positionId: cleanId(formData.positionId),
                costCenterId: cleanId(formData.costCenterId),
                managerId: cleanId(formData.managerId),
                workRegime: formData.workRegime,
                hybridWorkDays: formData.hybridWorkDays,
                hybridFrequency: formData.hybridFrequency,
                workScheduleId: cleanId(formData.workScheduleId),
                addressStreet: formData.address.street?.trim() || undefined,
                addressNumber: formData.address.number?.trim() || undefined,
                addressComplement: formData.address.complement?.trim() || undefined,
                addressNeighborhood: formData.address.neighborhood?.trim() || undefined,
                addressCity: formData.address.city?.trim() || undefined,
                addressState: formData.address.state?.trim() || undefined,
                addressZipCode: formData.address.zipCode?.replace(/\D/g, '') || undefined,
                addressCountry: formData.address.country || 'Brasil',
                birthCity: formData.birthCity || undefined,
                birthState: formData.birthState || undefined,
                motherName: formData.motherName || undefined,
                fatherName: formData.fatherName || undefined,
                rgNumber: formData.rgNumber || undefined,
                rgIssuer: formData.rgIssuer || undefined,
                rgState: formData.rgState || undefined,
                rgIssueDate: formData.rgIssueDate || undefined,
                pisPasep: formData.pisPasep || undefined,
                ctpsNumber: formData.ctpsNumber || undefined,
                ctpsSeries: formData.ctpsSeries || undefined,
                ctpsState: formData.ctpsState || undefined,
                ctpsIssueDate: formData.ctpsIssueDate || undefined,
                voterTitle: formData.voterTitle || undefined,
                voterZone: formData.voterZone || undefined,
                voterSection: formData.voterSection || undefined,
                militaryCertificate: formData.militaryCertificate || undefined,
                driverLicense: formData.driverLicense || undefined,
                driverLicenseCategory: formData.driverLicenseCategory || undefined,
                driverLicenseExpiry: formData.driverLicenseExpiry || undefined,
                bankCode: formData.bankCode || undefined,
                bankName: formData.bankName || undefined,
                bankAgency: formData.bankAgency || undefined,
                bankAgencyDigit: formData.bankAgencyDigit || undefined,
                bankAccount: formData.bankAccount || undefined,
                bankAccountDigit: formData.bankAccountDigit || undefined,
                bankAccountType: formData.bankAccountType || undefined,
                pixKey: formData.pixKey || undefined,
                pixKeyType: formData.pixKeyType || undefined,
                salaryType: formData.salaryType || undefined,
                emergencyContactName: formData.emergencyContactName || undefined,
                emergencyContactPhone: formData.emergencyContactPhone || undefined,
                emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
            };

            console.log('🚀 Final Payload for API:', JSON.stringify(submitData, null, 2));

            if (!isEditing) {
                // CREATE
                const employee = await employeesApi.create(submitData);
                setEmployeeId(employee.id);
                toast({
                    title: 'Sucesso',
                    description: 'Colaborador cadastrado com sucesso',
                });

                setActiveTab('address');
                window.history.replaceState(null, '', `/employees/${employee.id}/edit`);

                // Create or remove access logic
                if (formData.allowPlatformAccess && !hasExistingAccess && formData.platformPassword) {
                    try {
                        await userApi.create({
                            name: formData.fullName,
                            email: formData.email,
                            password: formData.platformPassword,
                            status: 'ACTIVE',
                            roles: formData.platformRoles
                        });
                        setHasExistingAccess(true);
                        toast({ title: 'Acesso Criado', description: 'O usuário foi criado.' });
                    } catch (e) {
                        toast({ title: 'Erro', description: 'Não foi possível criar o acesso.', variant: 'destructive' });
                    }
                }
            } else {
                // UPDATE
                await employeesApi.update(employeeId!, submitData);

                // Lógica de Acesso (Criação, Atualização de Roles ou Remoção)
                if (formData.allowPlatformAccess) {
                    if (!hasExistingAccess && formData.platformPassword) {
                        // CRIAR NOVO ACESSO
                        try {
                            await userApi.create({
                                name: formData.fullName,
                                email: formData.email,
                                password: formData.platformPassword,
                                status: 'ACTIVE',
                                roles: formData.platformRoles
                            });
                            setHasExistingAccess(true);
                            toast({ title: 'Acesso Criado', description: 'O usuário foi criado com sucesso.' });
                        } catch (e) {
                            console.error('Erro ao criar acesso:', e);
                            toast({ title: 'Ops!', description: 'Não foi possível criar o usuário de acesso.', variant: 'destructive' });
                        }
                    } else if (hasExistingAccess && existingUserId) {
                        // ATUALIZAR ROLES DO ACESSO EXISTENTE
                        try {
                            await userApi.update(existingUserId, {
                                name: formData.fullName,
                                email: formData.email,
                                status: 'ACTIVE',
                                roles: formData.platformRoles
                            });
                            toast({ title: 'Acessos Atualizados', description: 'Os perfis de acesso foram sincronizados.' });
                        } catch (e) {
                            console.error('Erro ao atualizar acesso:', e);
                        }
                    }
                } else if (hasExistingAccess && existingUserId) {
                    // REMOVER ACESSO
                    try {
                        await userApi.delete(existingUserId);
                        setHasExistingAccess(false);
                        setExistingUserId(null);
                        toast({ title: 'Acesso Removido', description: 'O acesso à plataforma foi desabilitado.' });
                    } catch (e) {
                        console.error('Erro ao remover acesso:', e);
                        toast({ title: 'Erro', description: 'Não foi possível remover o acesso.', variant: 'destructive' });
                    }
                }

                toast({
                    title: 'Sucesso',
                    description: 'Colaborador e acessos atualizados.',
                });
            }

        } catch (error: any) {
            console.error('❌ Erro detalhado ao salvar:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            toast({
                title: 'Erro ao Salvar',
                description: error.response?.data?.message || 'Falha ao processar requisição no servidor.',
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
        { key: 'document_info' as TabKey, label: 'Documentação', icon: FileText, disabled: !employeeId },
        { key: 'bank' as TabKey, label: 'Dados Bancários', icon: Key, disabled: !employeeId },
        { key: 'documents' as TabKey, label: 'Arquivos', icon: Upload, disabled: !employeeId },
        { key: 'dependents' as TabKey, label: 'Dependentes', icon: Users, disabled: !employeeId },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => !tab.disabled && setActiveTab(tab.key)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === tab.key
                                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                : "border-transparent text-gray-500 hover:text-gray-700",
                            tab.disabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={tab.disabled}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {
                activeTab === 'personal' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <CardTitle>Dados Pessoais</CardTitle>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setExtractModalOpen(true)}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50 flex items-center gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Preencher com IA
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">CPF</label>
                                    <input
                                        type="text"
                                        name="cpf"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        placeholder="000.000.000-00"
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.cpf ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.fullName ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Nome Social</label>
                                    <input
                                        type="text"
                                        name="socialName"
                                        value={formData.socialName}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        name="birthDate"
                                        value={formData.birthDate}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Gênero</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="">Selecione</option>
                                        <option value="MALE">Masculino</option>
                                        <option value="FEMALE">Feminino</option>
                                        <option value="OTHER">Outro</option>
                                        <option value="PREFER_NOT_TO_SAY">Prefiro não dizer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Raça/Etnia</label>
                                    <select name="ethnicity" value={formData.ethnicity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="">Selecione</option>
                                        <option value="BRANCO">Branca</option>
                                        <option value="PRETO">Preta</option>
                                        <option value="PARDO">Parda</option>
                                        <option value="AMARELO">Amarela</option>
                                        <option value="INDIGENA">Indígena</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Estado Civil</label>
                                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="">Selecione</option>
                                        <option value="SINGLE">Solteiro(a)</option>
                                        <option value="MARRIED">Casado(a)</option>
                                        <option value="DIVORCED">Divorciado(a)</option>
                                        <option value="WIDOWED">Viúvo(a)</option>
                                        <option value="STABLE_UNION">União Estável</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">E-mail Corporativo</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Data de Admissão</label>
                                    <input
                                        type="date"
                                        name="admissionDate"
                                        value={formData.admissionDate}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] ${errors.admissionDate ? 'border-red-500' : 'border-gray-200'}`}
                                    />
                                    {errors.admissionDate && <p className="text-red-500 text-sm mt-1">{errors.admissionDate}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">E-mail Pessoal</label>
                                    <input
                                        type="email"
                                        name="personalEmail"
                                        value={formData.personalEmail}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Celular/Pessoal</label>
                                    <input
                                        type="text"
                                        name="personalPhone"
                                        value={formData.personalPhone}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Nacionalidade</label>
                                    <input
                                        type="text"
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h3 className="text-sm font-semibold mb-3">Naturalidade e Filiação</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium mb-1">Cidade Natal</label>
                                        <input type="text" name="birthCity" value={formData.birthCity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">UF Natal</label>
                                        <input type="text" name="birthState" value={formData.birthState} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" maxLength={2} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Nome da Mãe</label>
                                        <input type="text" name="motherName" value={formData.motherName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1">Nome do Pai</label>
                                        <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                    </div>
                                </div>
                            </div>

                            {/* Platform Access Section */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-[var(--color-text)] flex items-center gap-2">
                                        <Key className="w-5 h-5 text-[var(--color-primary)]" />
                                        Acesso à Plataforma
                                    </h3>
                                    {checkingAccess && (
                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Verificando...
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <div className={cn(
                                        "flex items-center justify-between p-4 border rounded-xl transition-all duration-300",
                                        formData.allowPlatformAccess
                                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm"
                                            : "border-gray-100 bg-gray-50/50"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                formData.allowPlatformAccess ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-400"
                                            )}>
                                                {hasExistingAccess ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="platform-access" className="text-sm font-semibold cursor-pointer">
                                                        {hasExistingAccess ? 'Acesso Ativo' : 'Liberar Acesso'}
                                                    </Label>
                                                    {hasExistingAccess && (
                                                        <span className="px-2 py-0.5 text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full font-bold">
                                                            {formData.platformRoles.join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[var(--color-text-secondary)]">
                                                    {hasExistingAccess ? 'Colaborador já possui acesso' : 'Permite acesso ao sistema'}
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="platform-access"
                                            checked={formData.allowPlatformAccess}
                                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowPlatformAccess: checked }))}
                                        />
                                    </div>

                                    {formData.allowPlatformAccess && (
                                        <div className="p-4 border border-gray-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Perfil de Acesso</Label>
                                                <select
                                                    value={formData.platformRoles[0] || 'COLABORADOR'}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, platformRoles: [e.target.value] }))}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] text-sm"
                                                >
                                                    <option value="COLABORADOR">Colaborador</option>
                                                    <option value="LIDER">Líder / Gestor Direto</option>
                                                    <option value="GESTOR_RH">Gestor de RH</option>
                                                    <option value="ANALISTA_DP">Analista de DP</option>
                                                    <option value="CONTADOR">Contador</option>
                                                    <option value="ADMIN">Administrador</option>
                                                </select>
                                            </div>

                                            {!hasExistingAccess && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Senha Inicial</Label>
                                                    <div className="relative">
                                                        <input
                                                            type={showPassword ? 'text' : 'password'}
                                                            value={formData.platformPassword || ''}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, platformPassword: e.target.value }))}
                                                            className="w-full px-3 py-2 pr-24 border border-gray-200 rounded-lg focus:outline-none text-sm"
                                                        />
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                            <button type="button" onClick={() => setShowPassword(!showPassword)}><Eye className="w-4 h-4 text-gray-400" /></button>
                                                            <button type="button" onClick={() => {
                                                                const p = Math.random().toString(36).slice(-10);
                                                                setFormData(i => ({ ...i, platformPassword: p }));
                                                                setShowPassword(true);
                                                            }}><Wand2 className="w-4 h-4 text-gray-400" /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {hasExistingAccess && !formData.allowPlatformAccess && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4" />
                                            Acesso será removido ao salvar.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {
                activeTab === 'address' && (
                    <Card>
                        <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1">CEP</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="address.zipCode"
                                            value={formData.address.zipCode}
                                            onChange={handleChange}
                                            onBlur={handleCepBlur}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                            placeholder="00000-000"
                                        />
                                        {loadingCep && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Rua/Logradouro</label>
                                    <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Número</label>
                                    <input type="text" name="address.number" value={formData.address.number} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Complemento</label>
                                    <input type="text" name="address.complement" value={formData.address.complement} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Bairro</label>
                                    <input type="text" name="address.neighborhood" value={formData.address.neighborhood} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cidade</label>
                                    <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Estado (UF)</label>
                                    <input type="text" name="address.state" value={formData.address.state} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {
                activeTab === 'professional' && (
                    <Card>
                        <CardHeader><CardTitle>Dados Profissionais</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo de Contratação</label>
                                    <select name="employmentType" value={formData.employmentType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="CLT">CLT</option>
                                        <option value="PJ">PJ (Prestador de Serviço)</option>
                                        <option value="INTERN">Estagiário</option>
                                        <option value="APPRENTICE">Aprendiz</option>
                                        <option value="TEMPORARY">Temporário</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Departamento</label>
                                    <select name="departmentId" value={formData.departmentId} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg ${errors.departmentId ? 'border-red-500' : 'border-gray-200'}`}>
                                        <option value="">Selecione</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cargo</label>
                                    <select name="positionId" value={formData.positionId} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg ${errors.positionId ? 'border-red-500' : 'border-gray-200'}`} disabled={!formData.departmentId}>
                                        <option value="">Selecione</option>
                                        {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Centro de Custo</label>
                                    <select name="costCenterId" value={formData.costCenterId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="">Selecione</option>
                                        {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Gestor Direto</label>
                                    <select name="managerId" value={formData.managerId} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="">Selecione</option>
                                        {managers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Salário Base</label>
                                    <input type="number" name="salary" value={formData.salary} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Carga Horária Semanal</label>
                                    <select
                                        name="workScheduleId"
                                        value={formData.workScheduleId}
                                        onChange={(e) => {
                                            const scheduleId = e.target.value;
                                            const schedule = schedules.find(s => s.id === scheduleId);
                                            setFormData(prev => ({
                                                ...prev,
                                                workScheduleId: scheduleId,
                                                workRegime: schedule?.workRegime || prev.workRegime,
                                                workHoursPerWeek: schedule?.weeklyHoursMinutes ? schedule.weeklyHoursMinutes / 60 : prev.workHoursPerWeek
                                            }));
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                    >
                                        <option value="">Selecione a Escala</option>
                                        {schedules.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.weeklyHoursFormatted})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Regime de Trabalho</label>
                                    <select name="workRegime" value={formData.workRegime} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="PRESENCIAL">Presencial</option>
                                        <option value="REMOTO">Home Office (Total)</option>
                                        <option value="HIBRIDO">Híbrido</option>
                                    </select>
                                </div>
                            </div>

                            {formData.workRegime === 'HIBRIDO' && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                                    <label className="block text-sm font-semibold text-blue-900">Dias de Trabalho Híbrido</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const current = formData.hybridWorkDays || [];
                                                    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                                    setFormData(prev => ({ ...prev, hybridWorkDays: next }));
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                                    formData.hybridWorkDays?.includes(day)
                                                        ? "bg-blue-600 text-white shadow-sm"
                                                        : "bg-white text-blue-600 border border-blue-200 hover:border-blue-400"
                                                )}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )
            }

            {
                activeTab === 'document_info' && (
                    <Card>
                        <CardHeader><CardTitle>Informações de Documentos</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <h3 className="md:col-span-4 text-sm font-semibold flex items-center gap-2 border-b pb-2">
                                    RG (Carteira de Identidade)
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Número</label>
                                    <input type="text" name="rgNumber" value={formData.rgNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Órgão Emissor</label>
                                    <input type="text" name="rgIssuer" value={formData.rgIssuer} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="SSP" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">UF Emissor</label>
                                    <input type="text" name="rgState" value={formData.rgState} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" maxLength={2} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data Emissão</label>
                                    <input type="date" name="rgIssueDate" value={formData.rgIssueDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>

                                <h3 className="md:col-span-4 text-sm font-semibold flex items-center gap-2 border-b pb-2 pt-4">
                                    Trabalhista (PIS / CTPS)
                                </h3>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">PIS / PASEP</label>
                                    <input type="text" name="pisPasep" value={formData.pisPasep} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">CTPS (Nº/Série)</label>
                                    <input type="text" name="ctpsNumber" value={formData.ctpsNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Série</label>
                                    <input type="text" name="ctpsSeries" value={formData.ctpsSeries} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>

                                <h3 className="md:col-span-4 text-sm font-semibold flex items-center gap-2 border-b pb-2 pt-4">
                                    Outros Documentos
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Título de Eleitor</label>
                                    <input type="text" name="voterTitle" value={formData.voterTitle} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Zona</label>
                                    <input type="text" name="voterZone" value={formData.voterZone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Seção</label>
                                    <input type="text" name="voterSection" value={formData.voterSection} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Certificado Militar</label>
                                    <input type="text" name="militaryCertificate" value={formData.militaryCertificate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">CNH (Habilitação)</label>
                                    <input type="text" name="driverLicense" value={formData.driverLicense} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Categoria</label>
                                    <input type="text" name="driverLicenseCategory" value={formData.driverLicenseCategory} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Validade CNH</label>
                                    <input type="date" name="driverLicenseExpiry" value={formData.driverLicenseExpiry} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {
                activeTab === 'bank' && (
                    <Card>
                        <CardHeader><CardTitle>Dados Bancários</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Banco (Cód)</label>
                                    <input type="text" name="bankCode" value={formData.bankCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="001" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Nome do Banco</label>
                                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Banco do Brasil" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Agência</label>
                                    <input type="text" name="bankAgency" value={formData.bankAgency} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Dígito Agência</label>
                                    <input type="text" name="bankAgencyDigit" value={formData.bankAgencyDigit} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo de Conta</label>
                                    <select name="bankAccountType" value={formData.bankAccountType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="CURRENT">Conta Corrente</option>
                                        <option value="SAVINGS">Conta Poupança</option>
                                        <option value="SALARY">Conta Salário</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Número da Conta</label>
                                    <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Dígito Conta</label>
                                    <input type="text" name="bankAccountDigit" value={formData.bankAccountDigit} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>

                                <h3 className="md:col-span-3 text-sm font-semibold flex items-center gap-2 border-b pb-2 pt-4">
                                    PIX
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo de Chave</label>
                                    <select name="pixKeyType" value={formData.pixKeyType} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                                        <option value="CPF">CPF</option>
                                        <option value="EMAIL">E-mail</option>
                                        <option value="PHONE">Telefone</option>
                                        <option value="RANDOM">Chave Aleatória</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Chave PIX</label>
                                    <input type="text" name="pixKey" value={formData.pixKey} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {activeTab === 'documents' && <DocumentsTab employeeId={employeeId!} />}
            {activeTab === 'dependents' && <DependentsTab employeeId={employeeId!} />}

            {
                !['documents', 'dependents'].includes(activeTab) && (
                    <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-100 mb-10">
                        <button type="button" onClick={() => router.push('/employees')} className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-8 py-2 bg-[var(--color-primary)] text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 text-sm font-semibold">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                )
            }
            {/* AI Extraction Modal */}
            <ExtractDataModal
                isOpen={extractModalOpen}
                onClose={() => setExtractModalOpen(false)}
                employee={employeeId ? { id: employeeId, fullName: formData.fullName } as any : null}
                onDataExtracted={handleDataExtracted}
            />
        </form >
    );
}
