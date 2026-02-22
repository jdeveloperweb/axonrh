'use client';

import { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Clock,
    User,
    Mic2,
    Linkedin,
    ChevronRight,
    Plus,
    Trash2,
    CheckCircle2,
    ArrowRight,
    Search,
    Filter,
    FileText,
    Link as LinkIcon,
    Edit,
    Settings,
    Users,
    UserPlus,
    X as CloseIcon
} from 'lucide-react';
import { eventsApi, Event as AppEvent, EventResource, EventSubscriber } from '@/lib/api/events';
import { employeesApi, Employee } from '@/lib/api/employees';
import { useAuthStore } from '@/stores/auth-store';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EventsPage() {
    const { user } = useAuthStore();
    const { success, error } = useToast();
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'REGISTERED' | 'UPCOMING'>('ALL');
    const [search, setSearch] = useState('');

    // Modals
    const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
    const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
    const [isSubscribersModalOpen, setIsSubscribersModalOpen] = useState(false);
    const [subscribers, setSubscribers] = useState<EventSubscriber[]>([]);
    const [subscribersLoading, setSubscribersLoading] = useState(false);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
    const [isAddSubscriberOpen, setIsAddSubscriberOpen] = useState(false);
    const [selectedEmployeesToAdd, setSelectedEmployeesToAdd] = useState<string[]>([]);
    const [employeeSearchText, setEmployeeSearchText] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('ALL');
    const [departments, setDepartments] = useState<{ id: string, name: string }[]>([]);

    // Form State
    const [newEvent, setNewEvent] = useState<Partial<AppEvent>>({
        title: '',
        description: '',
        date: '',
        location: '',
        category: 'GENERAL',
        speakerName: '',
        speakerRole: '',
        speakerBio: '',
        speakerLinkedin: '',
        resources: []
    });

    const roles = user?.roles || [];
    const isManagement = roles.includes('ADMIN') || roles.includes('RH') || roles.includes('GESTOR_RH');

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await eventsApi.getAll();
            setEvents(data);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleSaveEvent = async () => {
        try {
            if (!newEvent.title || !newEvent.date) {
                error('Dados incompletos', 'Título e data são obrigatórios');
                return;
            }
            await eventsApi.save(newEvent);
            success(newEvent.id ? 'Evento atualizado!' : 'Evento salvo!',
                newEvent.id ? 'As alterações foram salvas.' : 'O evento foi publicado com sucesso.');
            setIsNewEventModalOpen(false);
            resetForm();
            loadEvents();
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const resetForm = () => {
        setNewEvent({
            title: '',
            description: '',
            date: '',
            location: '',
            category: 'GENERAL',
            speakerName: '',
            speakerRole: '',
            speakerBio: '',
            speakerLinkedin: '',
            resources: []
        });
    };

    const handleEditEvent = (event: AppEvent) => {
        // Format date for datetime-local input (YYYY-MM-DDThh:mm)
        const date = event.date ? new Date(event.date).toISOString().slice(0, 16) : '';
        setNewEvent({
            ...event,
            date: date
        });
        setIsNewEventModalOpen(true);
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Deseja realmente excluir este evento?')) return;
        try {
            await eventsApi.delete(id);
            success('Evento excluído', 'O evento foi removido.');
            loadEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const handleRegister = async (id: string) => {
        try {
            await eventsApi.register(id);
            success('Inscrição confirmada!', 'Você está inscrito no evento.');
            loadEvents();
            if (isEventDetailsOpen && selectedEvent?.id === id) {
                setSelectedEvent(prev => prev ? { ...prev, isUserRegistered: true, registrationCount: prev.registrationCount + 1 } : null);
            }
        } catch (err: any) {
            console.error('Error registering:', err);
            error('Erro na inscrição', err.response?.data?.message || 'Não foi possível realizar a inscrição.');
        }
    };

    const handleUnregister = async (id: string) => {
        try {
            await eventsApi.unregister(id);
            loadEvents();
            if (isEventDetailsOpen && selectedEvent?.id === id) {
                setSelectedEvent(prev => prev ? { ...prev, isUserRegistered: false, registrationCount: prev.registrationCount - 1 } : null);
            }
        } catch (error) {
            console.error('Error unregistering:', error);
        }
    };

    const loadSubscribers = async (eventId: string) => {
        try {
            setSubscribersLoading(true);
            const data = await eventsApi.getSubscribers(eventId);
            setSubscribers(data);
        } catch (error) {
            console.error('Error loading subscribers:', error);
        } finally {
            setSubscribersLoading(false);
        }
    };

    const loadEmployees = async () => {
        try {
            setIsLoadingEmployees(true);
            const res = await employeesApi.list({ size: 1000, status: 'ACTIVE' });
            setAllEmployees(res.content || []);

            // Unique departments
            const depts = Array.from(new Set(res.content.map(e => JSON.stringify(e.department)).filter(Boolean)))
                .map(d => JSON.parse(d as string));
            setDepartments(depts);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setIsLoadingEmployees(false);
        }
    };

    const handleOpenSubscribers = (event: AppEvent) => {
        setSelectedEvent(event);
        setIsSubscribersModalOpen(true);
        loadSubscribers(event.id);
        loadEmployees();
    };

    const handleRemoveSubscriber = async (employeeId: string) => {
        if (!selectedEvent) return;
        if (!confirm('Deseja remover este inscrito?')) return;
        try {
            await eventsApi.removeSubscriber(selectedEvent.id, employeeId);
            success('Inscrito removido', 'O colaborador foi desvinculado do evento.');
            loadSubscribers(selectedEvent.id);
            loadEvents();
        } catch (error) {
            console.error('Error removing subscriber:', error);
        }
    };

    const handleAddSubscribers = async () => {
        if (!selectedEvent || selectedEmployeesToAdd.length === 0) return;
        try {
            await eventsApi.addSubscribers(selectedEvent.id, selectedEmployeesToAdd);
            success('Inscritos adicionados!', `${selectedEmployeesToAdd.length} pessoas foram inscritas no evento.`);
            setIsAddSubscriberOpen(false);
            setSelectedEmployeesToAdd([]);
            loadSubscribers(selectedEvent.id);
            loadEvents();
        } catch (error) {
            console.error('Error adding subscribers:', error);
        }
    };

    const handleAddByDepartment = async (deptId: string) => {
        if (!selectedEvent) return;
        const deptEmployees = allEmployees.filter(e => e.department?.id === deptId);
        if (deptEmployees.length === 0) return;

        if (!confirm(`Deseja inscrever todos os ${deptEmployees.length} colaboradores deste departamento?`)) return;

        try {
            const ids = deptEmployees.map(e => e.id);
            await eventsApi.addSubscribers(selectedEvent.id, ids);
            success('Inscritos adicionados!', 'O grupo foi inscrito com sucesso.');
            loadSubscribers(selectedEvent.id);
            loadEvents();
        } catch (error) {
            console.error('Error adding group:', error);
        }
    };

    const filteredEvents = events.filter(e => {
        const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.speakerName?.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'ALL' ||
            (filter === 'REGISTERED' && e.isUserRegistered) ||
            (filter === 'UPCOMING' && e.status === 'UPCOMING');
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Mic2 className="w-6 h-6" />
                        </div>
                        Eventos e Palestras
                    </h1>
                    <p className="text-gray-500 font-medium ml-1">
                        Desenvolvimento profissional, saúde e cultura organizacional em um só lugar.
                    </p>
                </div>

                {isManagement && (
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsNewEventModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 px-8 font-bold text-lg shadow-xl shadow-primary/10 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Criar Novo Evento
                    </Button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar por título ou palestrante..."
                        className="pl-12 h-12 bg-white border-transparent focus:border-primary/20 rounded-xl transition-all shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'ALL' ? "bg-primary text-white shadow-md shadow-primary/10" : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('REGISTERED')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'REGISTERED' ? "bg-primary text-white shadow-md shadow-primary/10" : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        Inscritos
                    </button>
                    <button
                        onClick={() => setFilter('UPCOMING')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'UPCOMING' ? "bg-primary text-white shadow-md shadow-primary/10" : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        Próximos
                    </button>
                </div>
            </div>

            {/* Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
                    ))
                ) : filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <Card
                            key={event.id}
                            className="group relative overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 rounded-[32px] cursor-pointer bg-white flex flex-col h-full"
                            onClick={() => {
                                setSelectedEvent(event);
                                setIsEventDetailsOpen(true);
                            }}
                        >
                            {/* Card Decorative Header */}
                            <div className={cn(
                                "h-4 relative overflow-hidden",
                                event.category === 'WELLBEING' ? "bg-emerald-500" :
                                    event.category === 'TECHNICAL' ? "bg-indigo-600" :
                                        "bg-primary"
                            )} />

                            <div className="p-8 flex-1 flex flex-col">
                                {/* Date & Category Row */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex flex-col items-center bg-gray-50 rounded-[20px] p-3 min-w-[64px] group-hover:bg-primary/10 transition-colors border border-gray-100">
                                        <span className="text-[10px] font-black uppercase tracking-[2px] text-primary/60 leading-none mb-1">
                                            {event.date ? format(new Date(event.date), 'MMM', { locale: ptBR }) : '---'}
                                        </span>
                                        <span className="text-2xl font-black text-gray-900 leading-none">
                                            {event.date ? format(new Date(event.date), 'dd') : '--'}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <Badge className={cn(
                                            "uppercase text-[9px] tracking-[2px] font-black py-1.5 px-3 border-none shadow-sm",
                                            event.category === 'WELLBEING' ? "bg-emerald-50 text-emerald-600" :
                                                event.category === 'TECHNICAL' ? "bg-indigo-50 text-indigo-600" :
                                                    "bg-primary/10 text-primary"
                                        )}>
                                            {event.category}
                                        </Badge>
                                        {event.isUserRegistered && (
                                            <Badge className="bg-green-500 text-white border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full animate-pulse">
                                                Inscrito
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Title & Description */}
                                <div className="space-y-3 mb-8 flex-1">
                                    <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors leading-[1.2] line-clamp-2">
                                        {event.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 font-medium line-clamp-2 leading-relaxed italic">
                                        {event.description || "Nenhuma descrição informada."}
                                    </p>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl group-hover:bg-gray-100/50 transition-colors border border-transparent group-hover:border-gray-100">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Horário</span>
                                            <span className="text-xs font-black text-gray-800 tracking-tight">
                                                {event.date ? format(new Date(event.date), 'HH:mm') : '--:--'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl group-hover:bg-gray-100/50 transition-colors border border-transparent group-hover:border-gray-100">
                                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Local</span>
                                            <span className="text-xs font-black text-gray-800 tracking-tight truncate">
                                                {event.location}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Info */}
                                <div className="pt-6 border-t border-dashed border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-ping opacity-50" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                            {event.registrationCount}{" "}
                                            <span>Participantes</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 bg-primary text-white p-2 rounded-xl group-hover:px-4 transition-all duration-300">
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline opacity-0 group-hover:opacity-100">Ver</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            {/* Management Actions */}
                            {isManagement && (
                                <div className="absolute top-24 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-20">
                                    <button
                                        className="p-2 bg-white rounded-xl shadow-lg text-gray-400 hover:text-primary transition-all scale-90 hover:scale-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditEvent(event);
                                        }}
                                        title="Editar Evento"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-2 bg-white rounded-xl shadow-lg text-gray-400 hover:text-blue-500 transition-all scale-90 hover:scale-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenSubscribers(event);
                                        }}
                                        title="Gerenciar Inscritos"
                                    >
                                        <Users className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-2 bg-white rounded-xl shadow-lg text-gray-400 hover:text-red-500 transition-all scale-90 hover:scale-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteEvent(event.id);
                                        }}
                                        title="Excluir Evento"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                            <Calendar className="w-10 h-10" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-400">Nenhum evento encontrado</p>
                            <p className="text-gray-400">Tente ajustar seus filtros ou busca.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Dialog open={isNewEventModalOpen} onOpenChange={setIsNewEventModalOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    <DialogHeader className="bg-primary p-8 text-white">
                        <DialogTitle className="text-2xl font-black">
                            {newEvent.id ? 'Editar Evento' : 'Criar Novo Evento'}
                        </DialogTitle>
                        <DialogDescription className="text-white opacity-80">
                            {newEvent.id ? 'Atualize as informações do seu evento.' : 'Preencha as informações para divulgar o evento na plataforma.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Título do Evento</label>
                                <Input
                                    placeholder="Ex: Workshop de Liderança Estratégica"
                                    className="h-12 rounded-xl"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Data e Hora</label>
                                <Input
                                    type="datetime-local"
                                    className="h-12 rounded-xl"
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Local ou Link</label>
                                <Input
                                    placeholder="Teams / Auditório B"
                                    className="h-12 rounded-xl"
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Categoria</label>
                                <select
                                    className="w-full h-12 rounded-xl border border-gray-200 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newEvent.category}
                                    onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                                >
                                    <option value="GENERAL">Geral</option>
                                    <option value="WELLBEING">Bem-estar</option>
                                    <option value="TECHNICAL">Técnico</option>
                                </select>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-500">Descrição</label>
                                <Textarea
                                    placeholder="Detalhes sobre o que será abordado..."
                                    className="rounded-xl min-h-[100px]"
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 space-y-6">
                            <h4 className="text-sm font-black uppercase tracking-widest text-primary">Informações do Palestrante (Opcional)</h4>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Nome</label>
                                    <Input
                                        placeholder="Nome completo"
                                        className="h-12 rounded-xl"
                                        value={newEvent.speakerName}
                                        onChange={e => setNewEvent({ ...newEvent, speakerName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Cargo / Empresa</label>
                                    <Input
                                        placeholder="Ex: Fundador da Empresa X"
                                        className="h-12 rounded-xl"
                                        value={newEvent.speakerRole}
                                        onChange={e => setNewEvent({ ...newEvent, speakerRole: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Link LinkedIn</label>
                                    <Input
                                        placeholder="https://linkedin.com/in/..."
                                        className="h-12 rounded-xl"
                                        value={newEvent.speakerLinkedin}
                                        onChange={e => setNewEvent({ ...newEvent, speakerLinkedin: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">Breve Bio</label>
                                    <Textarea
                                        placeholder="Resumo profissional do palestrante..."
                                        className="rounded-xl"
                                        value={newEvent.speakerBio}
                                        onChange={e => setNewEvent({ ...newEvent, speakerBio: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-gray-50 p-6">
                        <Button variant="ghost" onClick={() => setIsNewEventModalOpen(false)}>Cancelar</Button>
                        <Button className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-xl font-bold" onClick={handleSaveEvent}>
                            Salvar e Publicar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Event Details Modal */}
            <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    {selectedEvent && (
                        <>
                            <div className="bg-primary p-10 text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <Mic2 className="w-40 h-40" />
                                </div>
                                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md mb-4 font-black tracking-widest uppercase">
                                    {selectedEvent.category}
                                </Badge>
                                <h2 className="text-3xl font-black leading-tight mb-4">{selectedEvent.title}</h2>
                                <div className="flex flex-wrap items-center gap-6 text-white/90 font-bold">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        {selectedEvent.date ? format(new Date(selectedEvent.date), "dd 'de' MMMM", { locale: ptBR }) : '---'}
                                    </div>
                                    <div className="flex items-center gap-2 text-white/80">
                                        <Clock className="w-5 h-5 text-white/70" />
                                        {selectedEvent.date ? format(new Date(selectedEvent.date), 'HH:mm') : '--:--'}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-5 h-5" />
                                        {selectedEvent.location}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Sobre o Evento</h4>
                                    <p className="text-gray-600 leading-relaxed font-medium">{selectedEvent.description}</p>
                                </div>

                                {selectedEvent.speakerName && (
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary">Palestrante Confirmado</h4>
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl font-black">
                                                {selectedEvent.speakerName.charAt(0)}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div>
                                                    <h5 className="text-lg font-black text-gray-900">{selectedEvent.speakerName}</h5>
                                                    <p className="text-sm font-bold text-gray-500">{selectedEvent.speakerRole}</p>
                                                </div>
                                                <p className="text-sm text-gray-500 italic line-clamp-3">{selectedEvent.speakerBio}</p>
                                                {selectedEvent.speakerLinkedin && (
                                                    <a
                                                        href={selectedEvent.speakerLinkedin.startsWith('http') ? selectedEvent.speakerLinkedin : `https://${selectedEvent.speakerLinkedin}`}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
                                                    >
                                                        <Linkedin className="w-4 h-4" />
                                                        Perfil LinkedIn
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.resources && selectedEvent.resources.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Materiais e Cartilhas</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {selectedEvent.resources.map((resource, i) => (
                                                <a
                                                    key={resource.id || i}
                                                    href={resource.url}
                                                    target="_blank"
                                                    className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-primary/20 hover:shadow-md transition-all group flex items-center gap-3"
                                                >
                                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{resource.title}</p>
                                                        <p className="text-[10px] text-gray-400 uppercase font-black uppercase tracking-tighter">{resource.type}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="bg-gray-50 p-6 flex flex-row items-center justify-between">
                                <div className="text-sm font-black text-gray-400">
                                    {selectedEvent.registrationCount} Participantes
                                </div>
                                {selectedEvent.isUserRegistered ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleUnregister(selectedEvent.id)}
                                        className="border-red-200 text-red-500 hover:bg-red-50 rounded-xl h-12 font-bold"
                                    >
                                        Cancelar Inscrição
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleRegister(selectedEvent.id)}
                                        className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 px-10 font-black shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                                    >
                                        Quero Participar
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                )}
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Subscribers Management Modal */}
            <Dialog open={isSubscribersModalOpen} onOpenChange={setIsSubscribersModalOpen}>
                <DialogContent className="max-w-4xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
                    <DialogHeader className="bg-slate-900 p-8 text-white shrink-0">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-black flex items-center gap-3">
                                    <Users className="w-6 h-6 text-primary" />
                                    Gerenciar Inscritos
                                </DialogTitle>
                                <DialogDescription className="text-slate-400 font-medium">
                                    {selectedEvent?.title}
                                </DialogDescription>
                            </div>
                            <Button
                                onClick={() => setIsAddSubscriberOpen(true)}
                                className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-6 font-bold"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Incluir Pessoas
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-8">
                        {subscribersLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Carregando lista...</span>
                            </div>
                        ) : subscribers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subscribers.map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xl font-black overflow-hidden bg-white border border-gray-100 shadow-sm">
                                                {sub.photoUrl ? (
                                                    <img src={sub.photoUrl} alt={sub.name} className="w-full h-full object-cover" />
                                                ) : sub.name.charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-gray-900 truncate">{sub.name}</span>
                                                <span className="text-xs text-gray-500 truncate">{sub.email}</span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveSubscriber(sub.id)}
                                            className="h-10 w-10 text-gray-400 hover:text-red-500 rounded-xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <Users className="w-10 h-10" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-400">Nenhum inscrito ainda</p>
                                    <p className="text-gray-400">Comece adicionando pessoas manualmente ou aguarde as inscrições.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="bg-gray-50 p-6 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            {subscribers.length} Colaboradores Inscritos
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Subscribers Modal */}
            <Dialog open={isAddSubscriberOpen} onOpenChange={setIsAddSubscriberOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[85vh]">
                    <DialogHeader className="bg-primary p-8 text-white shrink-0">
                        <DialogTitle className="text-2xl font-black">Incluir Colaboradores</DialogTitle>
                        <DialogDescription className="text-white/80">Busque pessoas individualmente ou selecione um departamento inteiro.</DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[300px] relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    placeholder="Buscar por nome..."
                                    className="pl-12 h-12 rounded-xl"
                                    value={employeeSearchText}
                                    onChange={e => setEmployeeSearchText(e.target.value)}
                                />
                            </div>
                            <select
                                className="h-12 rounded-xl border border-gray-200 px-4 text-sm font-bold min-w-[200px]"
                                value={departmentFilter}
                                onChange={e => setDepartmentFilter(e.target.value)}
                            >
                                <option value="ALL">Todos os Departamentos</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Department Group Actions */}
                        {departmentFilter !== 'ALL' && (
                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-primary uppercase tracking-widest">Ação em Grupo</p>
                                    <p className="text-xs text-gray-500 font-medium">Inscrever todos os colaboradores deste departamento.</p>
                                </div>
                                <Button
                                    onClick={() => handleAddByDepartment(departmentFilter)}
                                    className="bg-primary text-white hover:bg-primary/90 font-bold rounded-xl"
                                >
                                    Inscrever Todos
                                </Button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Resultados</p>
                            <div className="grid gap-2">
                                {isLoadingEmployees ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
                                    ))
                                ) : allEmployees
                                    .filter(e => {
                                        const matchesSearch = e.fullName.toLowerCase().includes(employeeSearchText.toLowerCase());
                                        const matchesDept = departmentFilter === 'ALL' || e.department?.id === departmentFilter;
                                        return matchesSearch && matchesDept;
                                    })
                                    .slice(0, 15)
                                    .map(emp => {
                                        const isSelected = selectedEmployeesToAdd.includes(emp.id);
                                        const isAlreadySubscribed = subscribers.some(s => s.id === emp.id);

                                        return (
                                            <div
                                                key={emp.id}
                                                onClick={() => {
                                                    if (isAlreadySubscribed) return;
                                                    setSelectedEmployeesToAdd(prev =>
                                                        isSelected ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                                                    );
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer",
                                                    isSelected ? "bg-primary/5 border-primary" : "bg-white border-gray-100 hover:border-gray-300",
                                                    isAlreadySubscribed && "opacity-50 cursor-not-allowed bg-gray-50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                                                        {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover rounded-xl" /> : emp.fullName.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900">{emp.fullName}</span>
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{emp.department?.name || 'Sem depto'}</span>
                                                    </div>
                                                </div>
                                                {isAlreadySubscribed ? (
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Já Inscrito</span>
                                                ) : isSelected ? (
                                                    <CheckCircle2 className="w-5 h-5 text-primary" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-gray-50 p-6 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                            {selectedEmployeesToAdd.length} Selecionados
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setIsAddSubscriberOpen(false)}>Cancelar</Button>
                            <Button
                                disabled={selectedEmployeesToAdd.length === 0}
                                onClick={handleAddSubscribers}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8"
                            >
                                Confirmar Inscrição
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
