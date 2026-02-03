'use client';

import { useState, useEffect } from 'react';
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
    Zap,
    MoreVertical,
    FileVideo,
    Link2,
    Type,
    BrainCircuit,
    ListChecks,
    Pencil
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
    CourseStatus
} from '@/lib/api/learning';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LearningManagementPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<TrainingCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '',
        description: '',
        courseType: 'ONLINE' as CourseType,
        difficultyLevel: 'INICIANTE' as DifficultyLevel,
        status: 'DRAFT' as CourseStatus,
        isMandatory: false,
    });

    // Dialog & UI states
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
    const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
    const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    // Temp Form States
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

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            const [coursesRes, catsRes] = await Promise.all([
                coursesApi.listPublished(), // We might need a listAll endpoint later
                categoriesApi.list()
            ]);
            setCourses((coursesRes as any) || []);
            setCategories((catsRes as any) || []);
        } catch (error) {
            console.error('Error loading management data:', error);
            toast.error('Erro ao carregar dados do catálogo');
        } finally {
            setLoading(false);
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
        setIsEditing(true);
    };

    const handleEdit = (course: Course) => {
        setFormData(course);
        setSelectedCourse(course);
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!formData.title) return toast.error('O título é obrigatório');

        try {
            setIsSaving(true);
            let savedCourse: Course;
            if (selectedCourse?.id) {
                savedCourse = await coursesApi.update(selectedCourse.id, formData as Course) as any;
                toast.success('Treinamento atualizado com sucesso!');
            } else {
                savedCourse = await coursesApi.create(formData as Course) as any;
                toast.success('Treinamento criado com sucesso!');
            }
            setSelectedCourse(savedCourse);
            setIsEditing(true); // Keep in edit mode to add modules
            loadInitialData();
        } catch (error) {
            toast.error('Erro ao salvar treinamento');
        } finally {
            setIsSaving(false);
        }
    };

    // Category Handlers
    const handleSaveCategory = async () => {
        if (!categoryForm.name) return toast.error('Nome da categoria é obrigatório');
        try {
            await categoriesApi.create(categoryForm);
            toast.success('Categoria criada!');
            setIsCategoryDialogOpen(false);
            setCategoryForm({ name: '', description: '' });
            loadInitialData();
        } catch (error) { toast.error('Erro ao criar categoria'); }
    }

    // Module Handlers
    const handleSaveModule = async () => {
        if (!selectedCourse?.id || !moduleForm.title) return;
        try {
            const updated = await coursesApi.addModule(selectedCourse.id, moduleForm) as any;
            setSelectedCourse(updated);
            setIsModuleDialogOpen(false);
            setModuleForm({ title: '', description: '', sequenceOrder: (selectedCourse.modules?.length || 0) + 1 });
            toast.success('Módulo adicionado!');
        } catch (error) { toast.error('Erro ao adicionar módulo'); }
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
        if (!selectedCourse?.id || !confirm('Deseja excluir este módulo?')) return;
        try {
            const updated = await coursesApi.removeModule(selectedCourse.id, moduleId) as any;
            setSelectedCourse(updated);
            toast.success('Módulo removido');
        } catch (error) { toast.error('Erro ao remover módulo'); }
    }

    const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
        if (!selectedCourse?.id || !confirm('Deseja excluir esta lição?')) return;
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                        <Settings className="h-3 w-3" />
                        Management Console
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Gestão de Treinamentos</h1>
                    <p className="text-slate-500 font-medium">Crie, edite e organize o conteúdo da sua Academy Cloud.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button
                        variant="outline"
                        onClick={() => setIsCategoryDialogOpen(true)}
                        className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-black transition-all hover:bg-slate-50 flex gap-2"
                    >
                        <Layers className="h-5 w-5" />
                        Categorias
                    </Button>
                    <Button
                        onClick={handleCreateNew}
                        className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-200 transition-all hover:scale-105 active:scale-95 flex gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Novo Treinamento
                    </Button>
                </div>
            </div>

            {isEditing ? (
                /* Edit Form Mode */
                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
                            <CardHeader className="border-b border-slate-50 py-8 px-10">
                                <CardTitle className="text-2xl font-black">{selectedCourse ? 'Editar Treinamento' : 'Novo Treinamento'}</CardTitle>
                                <CardDescription>Configure as informações principais do curso.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-10 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Título do Curso</label>
                                    <Input
                                        className="h-14 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-lg"
                                        placeholder="Ex: Liderança para Novos Gerentes"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Categoria</label>
                                        <select
                                            className="w-full h-14 rounded-xl border border-slate-100 bg-slate-50/50 px-4 font-bold text-slate-700"
                                            value={formData.categoryId || ''}
                                            onChange={e => setFormData({ ...formData, categoryId: e.target.value as any })}
                                        >
                                            <option value="">Selecione uma categoria</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
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
                                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                                            : "border-slate-100 text-slate-400 hover:bg-slate-50"
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
                                        className="w-full min-h-[150px] p-6 rounded-2xl border border-slate-100 bg-slate-50/50 font-medium text-slate-600 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/10"
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
                            <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden mt-10">
                                <CardHeader className="border-b border-slate-50 py-8 px-10 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-black">Estrutura de Conteúdo</CardTitle>
                                        <CardDescription>Módulos e Lições do curso.</CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-slate-200 font-bold gap-2"
                                        onClick={() => {
                                            setModuleForm({ title: '', sequenceOrder: (selectedCourse.modules?.length || 0) + 1 });
                                            setIsModuleDialogOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Novo Módulo
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {selectedCourse.modules?.length === 0 ? (
                                        <div className="p-16 text-center space-y-4">
                                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                                <Layers className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum módulo adicionado ainda.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-50">
                                            {selectedCourse.modules?.map((module, idx) => (
                                                <div key={module.id} className="p-8 hover:bg-slate-50/50 transition-colors">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                                                {idx + 1}
                                                            </div>
                                                            <h4 className="font-black text-lg">{module.title}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button size="icon" variant="ghost" className="h-10 w-10"><Edit2 className="h-4 w-4" /></Button>
                                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-rose-500"><Trash2 className="h-4 w-4" /></Button>
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
                        )}
                    </div>

                    <aside className="lg:col-span-4 space-y-6">
                        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-xl shadow-slate-200/20 space-y-8 sticky top-6">
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
                                    className="w-full h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 flex gap-2"
                                    onClick={() => setIsEditing(false)}
                                >
                                    <X className="h-5 w-5" />
                                    Cancelar
                                </Button>
                            </div>

                            {selectedCourse && (
                                <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Trash2 className="h-4 w-4 text-rose-600" />
                                        <h4 className="text-xs font-black text-rose-600 uppercase">Zona de Perigo</h4>
                                    </div>
                                    <Button variant="ghost" className="w-full h-10 rounded-xl text-rose-600 hover:bg-rose-100 text-xs font-black uppercase">
                                        Excluir Treinamento
                                    </Button>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            ) : (
                /* List View Mode */
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
                            <div key={course.id} className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-xl hover:border-blue-200 transition-all group cursor-pointer shadow-sm">
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
                            <div className="py-24 text-center space-y-6 bg-slate-50 rounded-[4rem] border border-dashed border-slate-200">
                                <div className="h-20 w-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
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

            {/* Category Dialog */}
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent className="max-w-md rounded-[2rem] border-slate-100 p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Gerenciar Categorias</DialogTitle>
                        <DialogDescription className="font-medium">Crie categorias para organizar seus treinamentos.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome da Categoria</label>
                            <Input
                                placeholder="Ex: Liderança, Vendas, Tecnologia"
                                onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                className="h-12 rounded-xl border-slate-100 font-bold"
                            />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                            {categories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" onClick={async () => {
                                        if (confirm('Excluir categoria?')) {
                                            await categoriesApi.delete(cat.id);
                                            loadInitialData();
                                        }
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter className="pt-6">
                        <Button className="w-full h-12 rounded-xl bg-blue-600 font-black uppercase tracking-widest text-[10px]" onClick={handleSaveCategory}>Criar Categoria</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Module Dialog */}
            <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
                <DialogContent className="max-w-md rounded-[2rem] border-slate-100 p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Novo Módulo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título do Módulo</label>
                            <Input
                                placeholder="Ex: Introdução ao CRM"
                                value={moduleForm.title}
                                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                                className="h-12 rounded-xl border-slate-100 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ordem de Exibição</label>
                            <Input
                                type="number"
                                value={moduleForm.sequenceOrder}
                                onChange={e => setModuleForm({ ...moduleForm, sequenceOrder: parseInt(e.target.value) })}
                                className="h-12 rounded-xl border-slate-100 font-bold"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-6 gap-2">
                        <Button variant="ghost" onClick={() => setIsModuleDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                        <Button className="rounded-xl bg-slate-900 font-black uppercase tracking-widest text-[10px]" onClick={handleSaveModule}>Salvar Módulo</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog - The "Robust" Screen */}
            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                <DialogContent className="max-w-2xl rounded-[2rem] border-slate-100 p-10 overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tight">Configurar Lição</DialogTitle>
                        <DialogDescription className="font-medium italic">"{selectedModule?.title}"</DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-8 py-8 pr-2">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Título da Lição</label>
                            <Input
                                placeholder="Ex: Aula 01 - Boas Vindas"
                                value={lessonForm.title}
                                onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                                className="h-14 rounded-xl border-slate-100 font-bold text-lg"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tipo de Conteúdo</label>
                                <Select
                                    value={lessonForm.contentType}
                                    onValueChange={val => setLessonForm({ ...lessonForm, contentType: val as ContentType })}
                                >
                                    <SelectTrigger className="h-14 rounded-xl border-slate-100 font-bold bg-slate-50">
                                        <SelectValue placeholder="Selecione o tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                        <SelectItem value="VIDEO" className="focus:bg-blue-50">Vídeo (Embed/Link)</SelectItem>
                                        <SelectItem value="DOCUMENTO" className="focus:bg-rose-50">Documento (PDF/URL)</SelectItem>
                                        <SelectItem value="ARTIGO" className="focus:bg-emerald-50">Texto Interativo</SelectItem>
                                        <SelectItem value="QUIZ" className="focus:bg-amber-50">Quiz / Avaliação</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Duração (minutos)</label>
                                <Input
                                    type="number"
                                    value={lessonForm.durationMinutes}
                                    onChange={e => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value) })}
                                    className="h-14 rounded-xl border-slate-100 font-bold bg-slate-50"
                                />
                            </div>
                        </div>

                        {/* Contextual Fields */}
                        {(lessonForm.contentType === 'VIDEO' || lessonForm.contentType === 'DOCUMENTO') && (
                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-2">
                                    <Link2 className="h-4 w-4 text-blue-600" />
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">URL do Conteúdo</label>
                                </div>
                                <Input
                                    placeholder="https://youtube.com/embed/... ou link do PDF"
                                    value={lessonForm.contentUrl}
                                    onChange={e => setLessonForm({ ...lessonForm, contentUrl: e.target.value })}
                                    className="h-14 rounded-xl border-slate-100 font-bold bg-blue-50/30"
                                />
                                <p className="text-[10px] text-slate-400 font-medium italic">Links do YouTube e Vimeo serão convertidos em player automaticamente.</p>
                            </div>
                        )}

                        {lessonForm.contentType === 'ARTIGO' && (
                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Conteúdo do Artigo (HTML/Texto)</label>
                                <textarea
                                    className="w-full min-h-[300px] p-6 rounded-2xl border border-slate-100 bg-slate-50/50 font-medium text-slate-600 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/10"
                                    placeholder="Escreva seu conteúdo aqui..."
                                    value={lessonForm.contentText}
                                    onChange={e => setLessonForm({ ...lessonForm, contentText: e.target.value })}
                                />
                            </div>
                        )}

                        {lessonForm.contentType === 'QUIZ' && (
                            <div className="p-8 bg-amber-50 rounded-3xl border border-amber-100 space-y-6 animate-in slide-in-from-top-4 duration-300">
                                <div className="flex items-center gap-3">
                                    <BrainCircuit className="h-6 w-6 text-amber-600" />
                                    <h4 className="font-black text-amber-900">Configuração de Quiz</h4>
                                </div>
                                <p className="text-sm text-amber-700/70 font-medium">Vinculado ao sistema de avaliação automática do Axon Academy.</p>
                                <Button variant="outline" className="w-full h-12 rounded-xl bg-white border-amber-200 text-amber-700 font-bold gap-2">
                                    <ListChecks className="h-4 w-4" />
                                    Configurar Perguntas
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-8 border-t border-slate-50">
                        <Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold" onClick={() => setIsLessonDialogOpen(false)}>Cancelar</Button>
                        <Button className="h-14 px-10 rounded-2xl bg-blue-600 text-white font-black shadow-xl shadow-blue-100 flex gap-2" onClick={handleSaveLesson}>
                            <Save className="h-5 w-5" />
                            Finalizar Lição
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
