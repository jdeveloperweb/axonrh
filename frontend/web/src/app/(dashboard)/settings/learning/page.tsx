'use client';

import { useState, useEffect } from 'react';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Settings,
    Eye,
    ChevronRight,
    Layout,
    Layers,
    BookOpen,
    Video,
    FileText,
    Save,
    X,
    CheckCircle2,
    Calendar,
    GraduationCap,
    Clock,
    Zap,
    MoreVertical,
    FileVideo,
    Link2,
    Type,
    Pencil,
    BrainCircuit,
    ListChecks,
    Code,
    Image as ImageIcon,
    List,
    Heading1,
    AlertCircle,
    Award
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    coursesApi,
    categoriesApi,
    Course,
    CourseModule,
    Lesson,
    TrainingCategory,
    CourseType,
    DifficultyLevel,
    CourseStatus,
    ContentType,
    Enrollment,
    enrollmentsApi,
    certificateConfigsApi,
    CertificateConfig
} from '@/lib/api/learning';
import { employeesApi, Employee } from '@/lib/api/employees';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LearningManagementPage() {
    const { confirm } = useConfirm();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<TrainingCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [enrollmentLoading, setEnrollmentLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [assignmentData, setAssignmentData] = useState({
        courseId: '',
        employeeId: '',
        dueDate: ''
    });

    const [courseCertificateConfig, setCourseCertificateConfig] = useState<CertificateConfig | null>(null);

    // Form states
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '',
        description: '',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'INICIANTE' as DifficultyLevel,
        status: 'DRAFT' as CourseStatus,
        isMandatory: false,
    });

    // Navigation state
    const [activeView, setActiveView] = useState<'LIST' | 'CATEGORIES' | 'EDITOR' | 'ENROLLMENTS'>('LIST');
    const [categoryForm, setCategoryForm] = useState<Partial<TrainingCategory>>({ name: '', description: '' });
    const [moduleForm, setModuleForm] = useState<Partial<CourseModule>>({ title: '', description: '', sequenceOrder: 1 });
    const [lessonForm, setLessonForm] = useState<Partial<Lesson>>({
        title: '',
        contentType: 'VIDEO' as ContentType,
        contentUrl: '',
        contentText: '',
        durationMinutes: 10,
        sequenceOrder: 1,
        isRequired: true
    });

    // Dialog states
    const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
    const [lessonTab, setLessonTab] = useState<'edit' | 'preview'>('edit');


    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);

        // Load Categories
        try {
            const catsRes = await categoriesApi.list();
            setCategories((catsRes as any) || []);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Erro ao carregar categorias');
        }

        // Load Courses
        try {
            const coursesRes = await coursesApi.listPublished();
            setCourses((coursesRes as any) || []);
        } catch (error) {
            console.error('Error loading courses:', error);
            toast.error('Erro ao carregar treinamentos');
        }

        setLoading(false);
    };

    useEffect(() => {
        if (selectedCourse?.id && activeView === 'EDITOR') {
            loadCourseCertificateConfig(selectedCourse.id);
        } else {
            setCourseCertificateConfig(null);
        }
    }, [selectedCourse?.id, activeView]);

    const loadCourseCertificateConfig = async (courseId: string) => {
        try {
            const res = await certificateConfigsApi.get(courseId);
            if (res && (res as any).data) {
                setCourseCertificateConfig((res as any).data);
            } else {
                setCourseCertificateConfig({
                    courseId,
                    instructorName: '',
                    instructorSignatureUrl: '',
                    showCompanyLogo: true
                } as any);
            }
        } catch (error) {
            console.error('Error loading course certificate config:', error);
        }
    };

    const loadEnrollments = async () => {
        try {
            setEnrollmentLoading(true);
            const res = await enrollmentsApi.listAll(0, 50);
            setEnrollments(res.content || []);
        } catch (error) {
            console.error('Error loading enrollments:', error);
            // toast.error('Erro ao carregar matrículas');
        } finally {
            setEnrollmentLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!assignmentData.courseId || !assignmentData.employeeId) {
            return toast.error('Selecione um curso e um colaborador');
        }

        try {
            setAssigning(true);
            const employee = employees.find(e => e.id === assignmentData.employeeId);
            await enrollmentsApi.enroll(assignmentData.courseId, {
                employeeId: assignmentData.employeeId,
                employeeName: employee?.fullName || 'Colaborador',
                dueDate: assignmentData.dueDate || undefined
            });
            toast.success('Treinamento atribuído com sucesso!');
            setAssignmentData({ courseId: '', employeeId: '', dueDate: '' });
            await loadEnrollments();
        } catch (error) {
            console.error('Error assigning course:', error);
            toast.error('Erro ao atribuir treinamento');
        } finally {
            setAssigning(false);
        }
    };

    const handleRemoveEnrollment = async (enrollmentId: string) => {
        if (!await confirm({
            title: 'Remover Matrícula',
            description: 'Deseja realmente remover esta matrícula? O colaborador perderá o acesso e todo o progresso deste treinamento.',
            variant: 'destructive',
            confirmLabel: 'Remover'
        })) return;

        try {
            await enrollmentsApi.unenroll(enrollmentId);
            toast.success('Inscrição removida com sucesso!');
            await loadEnrollments();
        } catch (error) {
            console.error('Error removing enrollment:', error);
            toast.error('Erro ao remover inscrição');
        }
    };

    const handleCreateNew = () => {
        setFormData({
            title: '',
            description: '',
            courseType: 'ONLINE' as CourseType,
            difficultyLevel: 'INICIANTE' as DifficultyLevel,
            status: 'DRAFT' as CourseStatus,
            isMandatory: false,
        });
        setSelectedCourse(null);
        setActiveView('EDITOR');
    };

    const handleEdit = (course: Course) => {
        setFormData(course);
        setSelectedCourse(course);
        setActiveView('EDITOR');
    };

    const handleSave = async () => {
        if (!formData.title) return toast.error('O título é obrigatório');

        try {
            setIsSaving(true);
            let savedCourse: Course;
            if (selectedCourse?.id) {
                savedCourse = await coursesApi.update(selectedCourse.id, formData as Course) as any;

                // Save specific certificate config if exists
                if (courseCertificateConfig) {
                    await certificateConfigsApi.save(courseCertificateConfig);
                }

                toast.success('Treinamento atualizado com sucesso!');
            } else {
                savedCourse = await coursesApi.create(formData as Course) as any;

                // Save specific certificate config for new course
                if (courseCertificateConfig) {
                    await certificateConfigsApi.save({ ...courseCertificateConfig, courseId: savedCourse.id });
                }

                toast.success('Treinamento criado com sucesso!');
            }
            loadInitialData();
        } catch (error) {
            toast.error('Erro ao salvar treinamento');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (!selectedCourse?.id) return;
        if (!await confirm({
            title: 'Excluir Treinamento',
            description: 'Deseja realmente excluir este treinamento? Esta ação é irreversível e removerá todos os módulos e lições vinculados.',
            variant: 'destructive',
            confirmLabel: 'Excluir'
        })) return;

        try {
            setIsSaving(true);
            await coursesApi.delete(selectedCourse.id);
            toast.success('Treinamento excluído com sucesso');
            setActiveView('LIST');
            loadInitialData();
        } catch (error) {
            console.error('Erro ao excluir curso:', error);
            toast.error('Erro ao excluir treinamento');
        } finally {
            setIsSaving(false);
        }
    };

    // Category Handlers
    const handleSaveCategory = async () => {
        if (!categoryForm.name) return toast.error('Nome da categoria é obrigatório');
        try {
            setIsSaving(true);
            if (categoryForm.id) {
                await categoriesApi.update(categoryForm.id, categoryForm);
                toast.success('Categoria atualizada com sucesso!');
            } else {
                await categoriesApi.create(categoryForm);
                toast.success('Categoria criada com sucesso!');
            }
            // Limpa o form e recarrega
            setCategoryForm({ name: '', description: '' });
            await loadInitialData();
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            toast.error('Erro ao salvar categoria. Verifique se o nome já existe.');
        } finally {
            setIsSaving(false);
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!await confirm({
            title: 'Excluir Categoria',
            description: 'Deseja realmente excluir esta categoria? Isso pode afetar os cursos vinculados.',
            variant: 'destructive',
            confirmLabel: 'Excluir'
        })) return;
        try {
            await categoriesApi.delete(id);
            toast.success('Categoria removida!');
            await loadInitialData();
        } catch (error: any) {
            console.error('Erro ao excluir categoria:', error);
            const message = error.response?.data?.message || 'Esta categoria não pode ser excluída pois existem cursos vinculados a ela.';
            toast.error(message, { duration: 5000 });
        }
    }

    // Module Handlers
    const handleSaveModule = async () => {
        if (!selectedCourse?.id || !moduleForm.title) return;
        try {
            let updated;
            if (moduleForm.id) {
                updated = await coursesApi.updateModule(selectedCourse.id, moduleForm.id, moduleForm) as any;
                toast.success('Módulo atualizado!');
            } else {
                updated = await coursesApi.addModule(selectedCourse.id, moduleForm) as any;
                toast.success('Módulo adicionado!');
            }
            setSelectedCourse(updated);
            setIsModuleDialogOpen(false);
            setModuleForm({ title: '', description: '', sequenceOrder: (selectedCourse.modules?.length || 0) + 1 });
        } catch (error) { toast.error('Erro ao salvar módulo'); }
    }

    // Lesson Handlers
    const handleSaveLesson = async () => {
        if (!selectedCourse?.id || !selectedModule?.id || !lessonForm.title) return;
        try {
            const updated = await coursesApi.addLesson(selectedCourse.id, selectedModule.id, lessonForm) as any;
            setSelectedCourse(updated);
            setIsLessonDialogOpen(false);
            setLessonForm({ title: '', contentType: 'VIDEO', contentUrl: '', contentText: '', durationMinutes: 10 });
            toast.success('Lição salva!');
        } catch (error) { toast.error('Erro ao salvar lição'); }
    }

    const handleDeleteModule = async (moduleId: string) => {
        if (!selectedCourse?.id || !await confirm({
            title: 'Excluir Módulo',
            description: 'Deseja excluir este módulo?',
            variant: 'destructive',
            confirmLabel: 'Excluir'
        })) return;
        try {
            const updated = await coursesApi.removeModule(selectedCourse.id, moduleId) as any;
            setSelectedCourse(updated);
            toast.success('Módulo removido');
        } catch (error) { toast.error('Erro ao remover módulo'); }
    }

    const insertText = (before: string, after: string = '') => {
        const textarea = document.getElementById('lesson-editor') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const beforeText = text.substring(0, start);
        const afterText = text.substring(end);
        const selectedText = text.substring(start, end);
        const newText = beforeText + before + selectedText + after + afterText;
        setLessonForm({ ...lessonForm, contentText: newText });
    };

    const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
        if (!selectedCourse?.id || !await confirm({
            title: 'Excluir Lição',
            description: 'Deseja excluir esta lição?',
            variant: 'destructive',
            confirmLabel: 'Excluir'
        })) return;
        try {
            const updated = await coursesApi.removeLesson(selectedCourse.id, moduleId, lessonId) as any;
            setSelectedCourse(updated);
            toast.success('Lição removida');
        } catch (error) { toast.error('Erro ao remover lição'); }
    }

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="h-10 w-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Carregando Acadamy Console...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 pb-20 px-4 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] w-fit shadow-xl">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Management Console
                    </div>
                    <div className="flex items-center gap-4">
                        {activeView !== 'LIST' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setActiveView('LIST')}
                                className="h-12 w-12 rounded-2xl hover:bg-slate-100 border border-slate-50 shadow-sm"
                            >
                                <ChevronRight className="h-6 w-6 rotate-180" />
                            </Button>
                        )}
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-4">
                            {activeView === 'CATEGORIES' ? 'Central de Categorias' :
                                activeView === 'EDITOR' ? 'Editor de Conteúdo' :
                                    'Hub de Gestão'}
                            {activeView === 'EDITOR' && selectedCourse && (
                                <Badge className="bg-slate-100 text-slate-400 border-none px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest h-fit">
                                    ID: {selectedCourse.id.substring(0, 8)}
                                </Badge>
                            )}
                        </h1>
                    </div>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl">
                        {activeView === 'CATEGORIES' ? 'Organize os temas e pilares de conhecimento da sua companhia.' :
                            activeView === 'EDITOR' ? 'Configure os detalhes, rituais, módulos e lições do treinamento.' :
                                'Crie experiências de aprendizado incríveis para seus colaboradores.'}
                    </p>
                </div>

                {activeView === 'LIST' && (
                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="outline"
                            onClick={() => setActiveView('ENROLLMENTS')}
                            className="h-16 px-8 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-50 flex gap-3 shadow-sm"
                        >
                            <Plus className="h-4 w-4 text-emerald-600" />
                            Matrículas & Indicações
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setActiveView('CATEGORIES')}
                            className="h-16 px-8 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-50 flex gap-3 shadow-sm"
                        >
                            <Layers className="h-4 w-4 text-blue-600" />
                            Categorias
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/learning/settings/certificate')}
                            className="h-16 px-8 rounded-2xl border-slate-200 text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-slate-50 flex gap-3 shadow-sm"
                        >
                            <Award className="h-4 w-4 text-primary" />
                            Configurações Gerais
                        </Button>
                        <Button
                            onClick={handleCreateNew}
                            className="h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 flex gap-3"
                        >
                            <Plus className="h-5 w-5" />
                            Novo Treinamento
                        </Button>
                    </div>
                )}
            </div>

            {activeView === 'EDITOR' ? (
                /* Edit Form Mode - Full Page */
                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-50 py-8 px-10">
                                <CardTitle className="text-2xl font-black">{selectedCourse ? 'Editar Treinamento' : 'Novo Treinamento'}</CardTitle>
                                <CardDescription>Configure as informações principais do curso.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Título do Curso</label>
                                    <Input
                                        className="h-14 rounded-xl border-slate-200 bg-white font-bold text-lg shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                        placeholder="Ex: Liderança para Novos Gerentes"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Categoria</label>
                                        <div className="relative">
                                            <select
                                                className="w-full h-14 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-700 appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
                                                value={formData.categoryId || ''}
                                                onChange={e => setFormData({ ...formData, categoryId: e.target.value as any })}
                                            >
                                                <option value="">Sem categoria definida</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <ChevronRight className="h-5 w-5 rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Nível de Dificuldade</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['INICIANTE', 'INTERMEDIARIO', 'AVANCADO'].map(lvl => (
                                                <button
                                                    key={lvl}
                                                    onClick={() => setFormData({ ...formData, difficultyLevel: lvl as any })}
                                                    className={cn(
                                                        "h-12 rounded-xl border text-[10px] font-black transition-all",
                                                        formData.difficultyLevel === lvl
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30"
                                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                                    )}
                                                >
                                                    {lvl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Descrição Completa</label>
                                    <textarea
                                        className="w-full min-h-[150px] p-6 rounded-2xl border border-slate-200 bg-white font-medium text-slate-600 leading-relaxed outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                                        placeholder="Descreva o que os alunos aprenderão neste curso..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="space-y-1">
                                        <h4 className="font-black text-sm">Treinamento Obrigatório</h4>
                                        <p className="text-xs text-slate-500">Este curso será marcado como mandatório para todos.</p>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, isMandatory: !formData.isMandatory })}
                                        className={cn(
                                            "w-14 h-8 rounded-full transition-all relative",
                                            formData.isMandatory ? "bg-blue-600" : "bg-slate-300"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all",
                                            formData.isMandatory ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>

                        {selectedCourse && (
                            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden mt-10">
                                <CardHeader className="border-b border-slate-50 py-8 px-10 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-black">Estrutura de Conteúdo</CardTitle>
                                        <CardDescription>Módulos e Lições do curso.</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-slate-200 font-bold gap-2"
                                        onClick={() => {
                                            setModuleForm({ title: '', sequenceOrder: (selectedCourse!.modules?.length || 0) + 1 });
                                            setIsModuleDialogOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Novo Módulo
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {selectedCourse!.modules?.length === 0 ? (
                                        <div className="p-16 text-center space-y-4">
                                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                                <Layers className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum módulo adicionado ainda.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {selectedCourse!.modules?.map((module, idx) => (
                                                <div key={module.id} className={cn(
                                                    "p-8 hover:bg-slate-50/50 transition-all border-l-4",
                                                    selectedModule?.id === module.id ? "border-l-blue-600 bg-blue-50/20" : "border-l-transparent"
                                                )}>
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                                                {idx + 1}
                                                            </div>
                                                            <h4 className="font-black text-lg">{module.title}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => {
                                                                setModuleForm(module);
                                                                setIsModuleDialogOpen(true);
                                                            }}><Edit2 className="h-4 w-4" /></Button>
                                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-rose-500" onClick={() => handleDeleteModule(module.id)}><Trash2 className="h-4 w-4" /></Button>
                                                        </div>
                                                    </div>
                                                    <div className="pl-12 grid gap-3">
                                                        {module.lessons?.map((lesson, lIdx) => (
                                                            <div key={lesson.id} className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-blue-200 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    {lesson.contentType === 'VIDEO' && <Video className="h-3 w-3 text-blue-500" />}
                                                                    {lesson.contentType === 'DOCUMENTO' && <FileText className="h-3 w-3 text-rose-500" />}
                                                                    {lesson.contentType === 'QUIZ' && <BrainCircuit className="h-3 w-3 text-amber-500" />}
                                                                    {lesson.contentType === 'ARTIGO' && <Type className="h-3 w-3 text-emerald-500" />}
                                                                    <span className="text-sm font-bold text-slate-600">{lesson.title}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase">{lesson.durationMinutes}m</span>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-rose-500"
                                                                        onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="ghost"
                                                            className="w-fit h-10 px-4 mt-2 rounded-xl text-xs font-black uppercase text-blue-600 hover:bg-blue-50/50 gap-2"
                                                            onClick={() => {
                                                                setSelectedModule(module);
                                                                setLessonForm({ title: '', contentType: 'VIDEO', sequenceOrder: (module.lessons?.length || 0) + 1 });
                                                                setIsLessonDialogOpen(true);
                                                            }}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Adicionar Aula
                                                        </Button>
                                                        </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden mt-10">
                                <CardHeader className="border-b border-slate-50 py-8 px-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Award className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black">Personalização do Certificado</CardTitle>
                                            <CardDescription>Configure o instrutor e assinatura específicos para este treinamento.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10 space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Nome do Instrutor Responsável</label>
                                            <Input
                                                className="h-14 rounded-xl border-slate-200 bg-white font-bold text-lg shadow-sm"
                                                placeholder="Ex: Dr. Rodrigo Porto"
                                                value={courseCertificateConfig?.instructorName || ''}
                                                onChange={e => setCourseCertificateConfig(prev => prev ? { ...prev, instructorName: e.target.value } : null)}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">URL da Assinatura do Instrutor</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    className="h-14 rounded-xl border-slate-200 bg-white font-bold text-sm shadow-sm"
                                                    placeholder="https://sua-empresa.com/assinatura.png"
                                                    value={courseCertificateConfig?.instructorSignatureUrl || ''}
                                                    onChange={e => setCourseCertificateConfig(prev => prev ? { ...prev, instructorSignatureUrl: e.target.value } : null)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50 flex gap-4">
                                        <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                                        <p className="text-[11px] text-blue-700 font-medium">
                                            Se estes campos ficarem em branco, o sistema utilizará as configurações gerais de certificado (Configurações Gerais > Certificados).
                                            Dica: Use imagens PNG com fundo transparente para as assinaturas.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-xl shadow-slate-200/20 space-y-8 sticky top-6">
                            <div className="space-y-2">
                                <h3 className="font-black text-lg">Ações e Status</h3>
                                <p className="text-xs text-slate-500">Controle a visibilidade do conteúdo.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado Atual</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setFormData({ ...formData, status: 'DRAFT' as CourseStatus })}
                                        className={cn(
                                            "h-12 rounded-xl border text-[10px] font-black transition-all",
                                            formData.status === 'DRAFT' ? "bg-amber-50 border-amber-200 text-amber-700" : "border-slate-100 text-slate-400"
                                        )}
                                    >
                                        RASCUNHO
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, status: 'PUBLISHED' as CourseStatus })}
                                        className={cn(
                                            "h-12 rounded-xl border text-[10px] font-black transition-all",
                                            formData.status === 'PUBLISHED' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-slate-100 text-slate-400"
                                        )}
                                    >
                                        PUBLICADO
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-50 space-y-3">
                                <Button
                                    className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 flex gap-2"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    <Save className="h-5 w-5" />
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 flex gap-2 transition-all hover:text-slate-600"
                                    onClick={() => {
                                        setSelectedCourse(null);
                                        setActiveView('LIST');
                                    }}
                                >
                                    <X className="h-5 w-5" />
                                    Voltar para Lista
                                </Button>
                            </div>

                            {selectedCourse && (
                                <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100/50 space-y-4 mt-4 transition-all hover:bg-rose-50">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                                            <AlertCircle className="h-4 w-4 text-rose-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Zona Crítica</h4>
                                            <p className="text-[9px] text-rose-400 font-bold">Ações irreversíveis</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex gap-2"
                                        onClick={handleDeleteCourse}
                                        disabled={isSaving}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Excluir este Treinamento
                                    </Button>
                                    <p className="text-[9px] text-center text-rose-300 font-medium px-2">
                                        Ao confirmar, todos os dados relacionados a este curso serão removidos permanentemente.
                                    </p>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            ) : activeView === 'CATEGORIES' ? (
                /* Categories View - Inline Section */
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[700px] animate-in slide-in-from-bottom-6 duration-700">
                    {/* Form Side */}
                    <div className="w-full md:w-[400px] p-12 bg-slate-50/50 border-r border-slate-100 space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                                {categoryForm.id ? "Modo Edição" : "Configuração de Tema"}
                            </label>
                            <h2 className="text-3xl font-black text-slate-900">
                                {categoryForm.id ? "Editar Categoria" : "Nova Categoria"}
                            </h2>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-tight">Nome da Categoria</label>
                                <Input
                                    placeholder="Ex: Recursos Humanos, TI..."
                                    value={categoryForm.name}
                                    onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    className="h-14 rounded-2xl border-slate-200 bg-white font-bold text-lg shadow-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-tight">Descrição Detalhada</label>
                                <textarea
                                    placeholder="Explique o propósito desta categoria..."
                                    value={categoryForm.description || ''}
                                    onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    className="w-full min-h-[160px] p-6 rounded-2xl border border-slate-200 bg-white font-medium text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button
                                    onClick={handleSaveCategory}
                                    disabled={isSaving}
                                    className="flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 transition-all active:scale-95"
                                >
                                    {isSaving ? "Processando..." : categoryForm.id ? "Salvar Alterações" : "Criar Agora"}
                                </Button>
                                {categoryForm.id && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setCategoryForm({ name: '', description: '' })}
                                        className="h-16 w-16 rounded-2xl border-slate-200 text-slate-400 hover:bg-slate-100"
                                    >
                                        <X className="h-6 w-6" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* List Side */}
                    <div className="flex-1 p-12 space-y-8">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Categorias Ativas ({categories.length})
                            </label>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {categories.length === 0 ? (
                                <div className="col-span-full py-32 text-center space-y-4">
                                    <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                                        <Layers className="h-8 w-8 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Nenhuma categoria encontrada.</p>
                                </div>
                            ) : (
                                categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        onClick={() => setCategoryForm(cat)}
                                        className={cn(
                                            "group p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-6",
                                            categoryForm.id === cat.id
                                                ? "bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-200 -translate-y-1"
                                                : "bg-white border-slate-100 hover:border-blue-100 hover:shadow-xl hover:-translate-y-1"
                                        )}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className={cn(
                                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                                    categoryForm.id === cat.id ? "bg-white/20" : "bg-slate-50"
                                                )}>
                                                    <Layers className={cn(
                                                        "h-5 w-5",
                                                        categoryForm.id === cat.id ? "text-white" : "text-blue-600"
                                                    )} />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all",
                                                        categoryForm.id === cat.id ? "text-white hover:bg-white/10" : "text-rose-500 hover:bg-rose-50"
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCategory(cat.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <h3 className="font-black text-xl tracking-tight">{cat.name}</h3>
                                            <p className={cn(
                                                "text-xs font-medium line-clamp-2",
                                                categoryForm.id === cat.id ? "text-blue-100" : "text-slate-400"
                                            )}>
                                                {cat.description || "Sem descrição definida para este tema."}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest",
                                            categoryForm.id === cat.id ? "text-white" : "text-slate-300"
                                        )}>
                                            <div className="h-1 w-1 rounded-full bg-current" />
                                            {courses.filter(c => c.categoryId === cat.id).length} Treinamentos
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : activeView === 'ENROLLMENTS' ? (
                <div className="space-y-10">
                    <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="p-8 border-b bg-slate-50/50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <CardTitle className="text-2xl font-black">Indicar Treinamento</CardTitle>
                                    <CardDescription>Atribua cursos para colaboradores específicos com data limite.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-4 items-end">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</label>
                                        <Select
                                            value={assignmentData.employeeId}
                                            onValueChange={(val) => setAssignmentData({ ...assignmentData, employeeId: val })}
                                        >
                                            <SelectTrigger className="h-12 w-64 rounded-xl border-slate-200 bg-white font-bold shadow-sm hover:border-blue-300 transition-colors">
                                                <SelectValue placeholder="Selecione um colaborador">
                                                    {employees.find(emp => emp.id === assignmentData.employeeId)?.fullName}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Curso</label>
                                        <Select
                                            value={assignmentData.courseId}
                                            onValueChange={(val) => setAssignmentData({ ...assignmentData, courseId: val })}
                                        >
                                            <SelectTrigger className="h-12 w-64 rounded-xl border-slate-200 bg-white font-bold shadow-sm hover:border-blue-300 transition-colors">
                                                <SelectValue placeholder="Selecione o treinamento">
                                                    {courses.find(course => course.id === assignmentData.courseId)?.title}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {courses.map(course => (
                                                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Limite</label>
                                        <Input
                                            type="date"
                                            className="h-12 w-48 rounded-xl border-slate-200 bg-white font-bold"
                                            value={assignmentData.dueDate}
                                            onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                                        />
                                    </div>
                                    <Button
                                        className="h-12 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px]"
                                        onClick={handleAssign}
                                        disabled={assigning}
                                    >
                                        {assigning ? '...' : 'Atribuir'}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-50 bg-slate-50/30">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Treinamento</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Limite</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {enrollments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center space-y-4">
                                                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                                        <Plus className="h-8 w-8 text-slate-200" />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Nenhuma matrícula encontrada.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            enrollments.map(enrollment => (
                                                <tr key={enrollment.id} className="hover:bg-slate-50/50 transition-all group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-black text-blue-600 text-xs">
                                                                {enrollment.employeeName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm text-slate-900">{enrollment.employeeName}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                                    {employees.find(e => e.id === enrollment.employeeId)?.position?.title || 'Colaborador'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 font-bold text-sm text-slate-600">{enrollment.courseName}</td>
                                                    <td className="px-8 py-6 text-sm">
                                                        <Badge className={cn(
                                                            "border-none font-black text-[9px] uppercase tracking-widest",
                                                            enrollment.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" :
                                                                enrollment.status === 'IN_PROGRESS' ? "bg-blue-50 text-blue-600" :
                                                                    "bg-slate-50 text-slate-600"
                                                        )}>
                                                            {enrollment.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="w-32 space-y-2">
                                                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase">
                                                                <span>{enrollment.status === 'COMPLETED' ? 'Concluído' : 'Progresso'}</span>
                                                                <span>{Math.round(enrollment.progressPercentage || 0)}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn(
                                                                        "h-full transition-all",
                                                                        enrollment.status === 'COMPLETED' ? "bg-emerald-500" : "bg-blue-500"
                                                                    )}
                                                                    style={{ width: `${enrollment.progressPercentage || 0}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className={cn(
                                                            "flex items-center gap-2 font-black text-[10px] uppercase",
                                                            enrollment.dueDate ? "text-rose-500" : "text-slate-400"
                                                        )}>
                                                            <Calendar className="h-3 w-3" />
                                                            {enrollment.dueDate ? new Date(enrollment.dueDate).toLocaleDateString('pt-BR') : 'SEM PRAZO'}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="rounded-xl opacity-0 group-hover:opacity-100 transition-all text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                            onClick={() => handleRemoveEnrollment(enrollment.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-10">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                            <Input
                                placeholder="Buscar por título ou descrição..."
                                className="h-16 pl-14 rounded-2xl border-slate-100 bg-white shadow-sm font-bold text-lg focus-visible:ring-blue-500/10 placeholder:text-slate-200"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {filteredCourses.map(course => (
                            <div key={course.id} className="bg-white border border-slate-100 rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-xl hover:border-blue-200 transition-all group cursor-pointer shadow-sm">
                                <div className="flex items-center gap-6">
                                    <div className="h-24 w-24 rounded-2xl bg-slate-900 relative overflow-hidden shrink-0 shadow-lg">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-60" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <GraduationCap className="h-10 w-10 text-white fill-white/20" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{course.title}</h3>
                                            {course.isMandatory && <Badge className="bg-rose-50 text-rose-600 border-none px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Obrigatório</Badge>}
                                            {course.categoryId && (
                                                <Badge variant="outline" className="border-slate-100 text-slate-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                                                    {categories.find(c => c.id === course.categoryId)?.name || 'Categoria'}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-slate-400 font-medium text-sm line-clamp-1">{course.description || 'Sem descrição definida.'}</p>
                                        <div className="flex flex-wrap items-center gap-4 pt-2">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <Clock className="h-3 w-3" /> {course.durationMinutes || 0} min
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-l pl-4 border-slate-100">
                                                <Layers className="h-3 w-3" /> {course.modules?.length || 0} Módulos
                                            </div>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em]",
                                                course.status === 'PUBLISHED' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                            )}>
                                                {course.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <Link href={`/learning/course/${course.id}`} target="_blank">
                                        <Button variant="ghost" className="h-14 w-14 rounded-2xl hover:bg-slate-50 text-slate-400"><Eye className="h-6 w-6" /></Button>
                                    </Link>
                                    <Button
                                        onClick={() => handleEdit(course)}
                                        className="h-14 px-8 rounded-2xl bg-white border border-slate-100 text-slate-900 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 font-black shadow-sm transition-all active:scale-95 flex gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Gerenciar
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {filteredCourses.length === 0 && (
                            <div className="py-24 text-center space-y-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                    <BookOpen className="h-8 w-8 text-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-slate-900 uppercase">Nenhum treinamento encontrado</h3>
                                    <p className="text-slate-400 max-w-sm mx-auto font-medium">Você ainda não criou nenhum treinamento ou sua busca não retornou resultados.</p>
                                </div>
                                <div className="flex justify-center">
                                    <Button onClick={handleCreateNew} className="h-14 px-10 rounded-2xl bg-slate-900 font-black uppercase tracking-widest text-[10px]">Começar Agora</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* Module Dialog */}
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent className="max-w-md rounded-[2rem] border-slate-100 p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">{moduleForm.id ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título do Módulo</label>
                            <Input
                                placeholder="Ex: Introdução ao CRM"
                                value={moduleForm.title}
                                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                                className="h-12 rounded-xl border-slate-200 bg-white font-bold shadow-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ordem de Exibição</label>
                            <Input
                                type="number"
                                value={moduleForm.sequenceOrder}
                                onChange={e => setModuleForm({ ...moduleForm, sequenceOrder: parseInt(e.target.value) })}
                                className="h-12 rounded-xl border-slate-200 bg-white font-bold shadow-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-6 gap-2">
                        <Button variant="ghost" onClick={() => setIsModuleDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button className="rounded-xl bg-slate-900 font-black uppercase tracking-widest text-[10px]" onClick={handleSaveModule}>Salvar Módulo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog - The "Robust" Content Builder */}
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent className="max-w-5xl w-[95vw] rounded-[2rem] border-slate-100 p-0 overflow-hidden flex flex-col h-[90vh]">
                    <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                                {lessonForm.contentType === 'VIDEO' ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">Studio de Conteúdo</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Montando material para: {selectedModule?.title}</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setLessonTab('edit')}
                                className={cn("px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2", lessonTab === 'edit' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                            >
                                <Code className="h-3 w-3" /> EDITOR
                            </button>
                            <button
                                onClick={() => setLessonTab('preview')}
                                className={cn("px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2", lessonTab === 'preview' ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300")}
                            >
                                <Eye className="h-3 w-3" /> PREVIEW
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex">
                        {/* Sidebar Configs */}
                        <div className="w-80 border-r border-slate-100 bg-slate-50/50 p-8 space-y-8 overflow-y-auto">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Configurações Gerais</label>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-slate-500">Título da Aula</span>
                                        <Input
                                            value={lessonForm.title}
                                            onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                                            className="h-10 rounded-xl border-slate-200 bg-white font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-slate-500">Tipo de Conteúdo</span>
                                        <Select
                                            value={lessonForm.contentType}
                                            onValueChange={val => setLessonForm({ ...lessonForm, contentType: val as ContentType })}
                                        >
                                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="VIDEO">Vídeo</SelectItem>
                                                <SelectItem value="ARTIGO">Artigo / Texto</SelectItem>
                                                <SelectItem value="DOCUMENTO">Documento</SelectItem>
                                                <SelectItem value="QUIZ">Quiz</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-slate-500">Duração (min)</span>
                                        <Input
                                            type="number"
                                            value={lessonForm.durationMinutes}
                                            onChange={e => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value) })}
                                            className="h-10 rounded-xl border-slate-200 bg-white font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Obrigatória</span>
                                    <button
                                        onClick={() => setLessonForm({ ...lessonForm, isRequired: !lessonForm.isRequired })}
                                        className={cn("w-10 h-5 rounded-full relative transition-all", lessonForm.isRequired ? "bg-blue-600" : "bg-slate-300")}
                                    >
                                        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", lessonForm.isRequired ? "left-[22px]" : "left-0.5")} />
                                    </button>
                                </div>
                            </div>

                            {lessonForm.contentType === 'ARTIGO' && (
                                <div className="pt-6 border-t border-slate-200 space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Atalhos de Conteúdo</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" className="h-10 rounded-lg text-[10px] font-bold gap-2" onClick={() => insertText('<h2 class="text-2xl font-black mb-4">', '</h2>')}>
                                            <Heading1 className="h-3 w-3" /> Título
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-10 rounded-lg text-[10px] font-bold gap-2" onClick={() => insertText('<p class="text-slate-600 mb-4">', '</p>')}>
                                            <Type className="h-3 w-3" /> Parágrafo
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-10 rounded-lg text-[10px] font-bold gap-2" onClick={() => insertText('<div class="p-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl mb-4">\n  ', '\n</div>')}>
                                            <AlertCircle className="h-3 w-3 text-blue-500" /> Alerta
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-10 rounded-lg text-[10px] font-bold gap-2" onClick={() => insertText('<img src="', '" class="w-full rounded-3xl shadow-xl mb-6" />')}>
                                            <ImageIcon className="h-3 w-3" /> Imagem
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main Interaction Area */}
                        <div className="flex-1 overflow-y-auto bg-white p-12">
                            {lessonTab === 'edit' ? (
                                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {lessonForm.contentType === 'ARTIGO' ? (
                                        <div className="space-y-4">
                                            <h4 className="text-xl font-black flex items-center gap-2">
                                                <Pencil className="h-5 w-5 text-blue-600" />
                                                Corpo do Material de Estudo
                                            </h4>
                                            <textarea
                                                id="lesson-editor"
                                                className="w-full min-h-[500px] p-8 rounded-[2rem] border-2 border-slate-200 bg-white font-mono text-sm leading-relaxed outline-none focus:border-blue-500/20 transition-all shadow-sm"
                                                placeholder="Escreva seu material usando HTML básico ou texto puro..."
                                                value={lessonForm.contentText}
                                                onChange={e => setLessonForm({ ...lessonForm, contentText: e.target.value })}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-8 py-20 text-center">
                                            <div className="h-24 w-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600">
                                                {lessonForm.contentType === 'VIDEO' ? <Video className="h-12 w-12" /> : <Link2 className="h-12 w-12" />}
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-black">Link do Conteúdo Externo</h3>
                                                <p className="text-slate-400 font-medium">Insira a URL do vídeo (YouTube/Vimeo) ou do documento (PDF/Drive).</p>
                                                <Input
                                                    placeholder="https://..."
                                                    value={lessonForm.contentUrl}
                                                    onChange={e => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                                                    className="h-16 rounded-2xl border-slate-200 bg-white font-bold text-lg text-center max-w-xl mx-auto shadow-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-10 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="space-y-4 text-center">
                                        <Badge variant="outline" className="text-blue-600 border-blue-100 font-black uppercase text-[10px] tracking-widest px-4 py-1">{lessonForm.contentType}</Badge>
                                        <h2 className="text-4xl font-black tracking-tight">{lessonForm.title || 'Sem título'}</h2>
                                        <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full" />
                                    </div>

                                    {lessonForm.contentType === 'VIDEO' && lessonForm.contentUrl ? (
                                        <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
                                            <div className="flex items-center justify-center h-full text-white/20 font-black italic">VIDEO PREVIEW MODE</div>
                                        </div>
                                    ) : (
                                        <div
                                            className="prose prose-slate max-w-none text-lg leading-relaxed text-slate-600"
                                            dangerouslySetInnerHTML={{ __html: lessonForm.contentText || '<p class="text-center italic text-slate-300">Nenhum conteúdo escrito ainda...</p>' }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 border-t border-slate-200 flex items-center justify-between">
                        <Button variant="ghost" className="h-12 px-6 rounded-xl font-bold" onClick={() => setIsLessonDialogOpen(false)}>Fechar sem salvar</Button>
                        <div className="flex gap-4">
                            <Button className="h-12 px-10 rounded-xl bg-blue-600 text-white font-black shadow-xl shadow-blue-200 flex gap-2 active:scale-95 transition-all" onClick={handleSaveLesson}>
                                <Save className="h-5 w-5" />
                                Salvar e Publicar Aula
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
