
import { api } from "./client";

export interface Permission {
    id: string;
    resource: string;
    action: string;
    displayName: string;
    description: string;
    module: string;
    code: string;
    createdAt: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    systemRole: boolean;
    hierarchyLevel: number;
    active: boolean;
    permissions: Permission[];
    createdAt: string;
    updatedAt: string;
}

export interface RoleRequest {
    name: string;
    description: string;
    permissionIds: string[];
    active: boolean;
}

export const rolesApi = {
    list: async () => {
        return api.get<Role[]>("/roles");
    },

    get: async (id: string) => {
        return api.get<Role>(`/roles/${id}`);
    },

    create: async (data: RoleRequest) => {
        return api.post<Role>("/roles", data);
    },

    update: async (id: string, data: RoleRequest) => {
        return api.put<Role>(`/roles/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete<void>(`/roles/${id}`);
    },

    listPermissions: async () => {
        return api.get<Permission[]>("/permissions");
    },

    listPermissionsGrouped: async () => {
        return api.get<Record<string, Permission[]>>("/permissions/grouped");
    },
};
