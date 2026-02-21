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
    Link as LinkIcon
} from 'lucide-react';
import { eventsApi, Event as AppEvent, EventResource } from '@/lib/api/events';
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
            success('Evento salvo!', 'O evento foi publicado com sucesso.');
            setIsNewEventModalOpen(false);
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
            loadEvents();
        } catch (error) {
            console.error('Error saving event:', error);
        }
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
        } catch (error) {
            console.error('Error registering:', error);
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
                        <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
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
                        onClick={() => setIsNewEventModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl h-14 px-8 font-bold text-lg shadow-xl shadow-purple-100 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Criar Novo Evento
                    </Button>
                )}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <Input
                        placeholder="Buscar por título ou palestrante..."
                        className="pl-12 h-12 bg-white border-transparent focus:border-purple-200 rounded-xl transition-all shadow-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-white rounded-xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'ALL' ? "bg-purple-600 text-white shadow-md shadow-purple-100" : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('REGISTERED')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'REGISTERED' ? "bg-purple-600 text-white shadow-md shadow-purple-100" : "text-gray-500 hover:bg-gray-50"
                        )}
                    >
                        Inscritos
                    </button>
                    <button
                        onClick={() => setFilter('UPCOMING')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            filter === 'UPCOMING' ? "bg-purple-600 text-white shadow-md shadow-purple-100" : "text-gray-500 hover:bg-gray-50"
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
                            className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl cursor-pointer bg-white"
                            onClick={() => {
                                setSelectedEvent(event);
                                setIsEventDetailsOpen(true);
                            }}
                        >
                            <CardContent className="p-0">
                                {/* Top Decoration */}
                                <div className={cn(
                                    "h-24 w-full bg-gradient-to-r relative overflow-hidden",
                                    event.category === 'WELLBEING' ? "from-emerald-400 to-teal-500" :
                                        event.category === 'TECHNICAL' ? "from-blue-500 to-indigo-600" :
                                            "from-purple-500 to-indigo-600"
                                )}>
                                    <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform">
                                        {event.isUserRegistered ? (
                                            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md uppercase text-[10px] tracking-widest font-black">
                                                Inscrito
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-black/10 text-white border-white/20 backdrop-blur-md uppercase text-[10px] tracking-widest font-black">
                                                {event.category}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-2xl shadow-lg border-4 border-white flex flex-col items-center justify-center text-purple-600 leading-none">
                                        <span className="text-xs font-black uppercase tracking-tighter opacity-70">
                                            {format(new Date(event.date), 'MMM', { locale: ptBR })}
                                        </span>
                                        <span className="text-2xl font-black">
                                            {format(new Date(event.date), 'dd')}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 pt-10 space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                                            {event.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(event.date), 'HH:mm')}
                                            </span>
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="w-3 h-3" />
                                                {event.location}
                                            </span>
                                        </div>
                                    </div>

                                    {event.speakerName && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl group-hover:bg-purple-50 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-black">
                                                {event.speakerName.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">{event.speakerName}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{event.speakerRole}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between group-hover:border-purple-100 transition-colors">
                                        <span className="text-xs font-bold text-gray-400">
                                            {event.registrationCount} Inscritos
                                        </span>
                                        <div className="flex items-center gap-1 text-purple-600 text-xs font-black uppercase tracking-widest translate-x-1 group-hover:translate-x-3 transition-transform">
                                            Ver Detalhes
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            {isManagement && (
                                <button
                                    className="absolute bottom-4 left-4 p-2 text-red-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEvent(event.id);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
                    <DialogHeader className="bg-purple-600 p-8 text-white">
                        <DialogTitle className="text-2xl font-black">Criar Novo Evento</DialogTitle>
                        <DialogDescription className="text-purple-100 opacity-90">
                            Preencha as informações para divulgar o evento na plataforma.
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
                            <h4 className="text-sm font-black uppercase tracking-widest text-purple-600">Informações do Palestrante (Opcional)</h4>

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
                        <Button className="bg-purple-600 hover:bg-purple-700 h-12 px-8 rounded-xl font-bold" onClick={handleSaveEvent}>
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
                            <div className="bg-purple-600 p-10 text-white relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <Mic2 className="w-40 h-40" />
                                </div>
                                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md mb-4 font-black tracking-widest uppercase">
                                    {selectedEvent.category}
                                </Badge>
                                <h2 className="text-3xl font-black leading-tight mb-4">{selectedEvent.title}</h2>
                                <div className="flex flex-wrap items-center gap-6 text-purple-100 font-bold">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        {format(new Date(selectedEvent.date), "dd 'de' MMMM", { locale: ptBR })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5" />
                                        {format(new Date(selectedEvent.date), 'HH:mm')}
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
                                        <h4 className="text-xs font-black uppercase tracking-widest text-purple-600">Palestrante Confirmado</h4>
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 text-2xl font-black">
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
                                                    className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-md transition-all group flex items-center gap-3"
                                                >
                                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-purple-600 group-hover:bg-purple-50 transition-colors">
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
                                        className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 px-10 font-black shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95"
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
        </div>
    );
}
