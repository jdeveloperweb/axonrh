import { api } from './client';

export interface UserDTO {
    id?: string;
    name: string;
    email: string;
    password?: string;
    status: string;
    avatarUrl?: string;
    roles: string[];
}

export const userApi = {
    list: () => api.get<UserDTO[], UserDTO[]>('/users'),
    create: (user: UserDTO) => api.post<UserDTO, UserDTO>('/users', user),
    update: (id: string, user: UserDTO) => api.put<UserDTO, UserDTO>(`/users/${id}`, user),
    delete: (id: string) => api.delete<void, void>(`/users/${id}`),
};
