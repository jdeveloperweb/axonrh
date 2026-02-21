import { api } from './client';

export interface EventResource {
    id?: string;
    title: string;
    description?: string;
    url: string;
    type: 'GUIDE' | 'VIDEO' | 'ARTICLE' | 'PRESENTATION';
}

export interface Event {
    id: string;
    title: string;
    description: string;
    date: string;
    location: string;
    url?: string;
    category: string;
    status: 'UPCOMING' | 'ONGOING' | 'FINISHED' | 'CANCELLED';

    // Speaker info
    speakerName?: string;
    speakerRole?: string;
    speakerBio?: string;
    speakerLinkedin?: string;
    speakerAvatarUrl?: string;

    resources?: EventResource[];
    registrationCount: number;
    isUserRegistered: boolean;
}

export const eventsApi = {
    getAll: async (): Promise<Event[]> => {
        const response = await api.get('/employees/events');
        return response.data;
    },

    getById: async (id: string): Promise<Event> => {
        const response = await api.get(`/employees/events/${id}`);
        return response.data;
    },

    save: async (data: Partial<Event>): Promise<void> => {
        return await api.post('/employees/events', data);
    },

    delete: async (id: string): Promise<void> => {
        return await api.delete(`/employees/events/${id}`);
    },

    register: async (id: string): Promise<void> => {
        return await api.post(`/employees/events/${id}/register`);
    },

    unregister: async (id: string): Promise<void> => {
        return await api.post(`/employees/events/${id}/unregister`);
    }
};
