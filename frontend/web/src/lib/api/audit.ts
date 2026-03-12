import { api } from "./client";

export interface AuditLog {
    id: string;
    tenantId: string;
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId: string;
    ipAddress: string;
    userAgent: string;
    details: string;
    status: string;
    createdAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

export const auditApi = {
    list: async (page = 0, size = 10): Promise<PageResponse<AuditLog>> => {
        const response = await api.get("/api/v1/audit", {
            params: { page, size, sort: "createdAt,desc" },
        });
        return response.data;
    },
};
