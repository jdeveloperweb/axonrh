
import { useAuthStore } from "@/stores/auth-store";
import { useCallback } from "react";

export type Permission =
    | 'EMPLOYEE:READ' | 'EMPLOYEE:CREATE' | 'EMPLOYEE:UPDATE' | 'EMPLOYEE:DELETE' | 'EMPLOYEE:EXPORT' | 'EMPLOYEE:IMPORT' | 'EMPLOYEE:TERMINATE'
    | 'PAYROLL:READ' | 'PAYROLL:CREATE' | 'PAYROLL:UPDATE' | 'PAYROLL:APPROVE' | 'PAYROLL:EXPORT'
    | 'VACATION:READ' | 'VACATION:CREATE' | 'VACATION:UPDATE' | 'VACATION:APPROVE' | 'VACATION:DELETE'
    | 'TIMESHEET:READ' | 'TIMESHEET:CREATE' | 'TIMESHEET:UPDATE' | 'TIMESHEET:APPROVE' | 'TIMESHEET:EXPORT'
    | 'PERFORMANCE:READ' | 'PERFORMANCE:CREATE' | 'PERFORMANCE:UPDATE' | 'PERFORMANCE:APPROVE'
    | 'LEARNING:READ' | 'LEARNING:CREATE' | 'LEARNING:UPDATE' | 'LEARNING:DELETE'
    | 'HIRING:READ' | 'HIRING:CREATE' | 'HIRING:UPDATE' | 'HIRING:DELETE' | 'HIRING:MANAGE_STAGES'
    | 'ADMISSION:READ' | 'ADMISSION:CREATE' | 'ADMISSION:UPDATE' | 'ADMISSION:APPROVE'
    | 'BENEFIT:READ' | 'BENEFIT:CREATE' | 'BENEFIT:UPDATE' | 'BENEFIT:DELETE' | 'BENEFIT:APPROVE'
    | 'AUDIT:READ' | 'WELLBEING:READ' | 'EVENT:READ' | 'ORG:READ'
    | 'USER:READ' | 'USER:CREATE' | 'USER:UPDATE' | 'USER:DELETE'
    | 'ROLE:READ' | 'ROLE:CREATE' | 'ROLE:UPDATE' | 'ROLE:DELETE'
    | 'CONFIG:READ' | 'CONFIG:UPDATE'
    | 'INTEGRATION:READ' | 'INTEGRATION:UPDATE'
    | 'AI_ASSISTANT:READ';

export function usePermissions() {
    const { user } = useAuthStore();

    const hasPermission = useCallback((permission: Permission | Permission[]): boolean => {
        if (!user) return false;

        // ADMIN sempre tem acesso a tudo
        if (user.roles?.includes('ADMIN')) return true;

        const userPermissions = user.permissions || [];

        if (Array.isArray(permission)) {
            // Se for array, basta ter UMA das permissões (OR logic)
            // Se quiser AND logic, pode criar outra função hasAllPermissions
            return permission.some(p => userPermissions.includes(p));
        }

        return userPermissions.includes(permission);
    }, [user]);

    const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
        if (!user) return false;
        if (user.roles?.includes('ADMIN')) return true;

        const userPermissions = user.permissions || [];
        return permissions.every(p => userPermissions.includes(p));
    }, [user]);

    const roles = user?.roles || [];
    const isAdmin = roles.includes('ADMIN');
    const isRH = roles.includes('RH') || roles.includes('GESTOR_RH') || roles.includes('ANALISTA_DP');
    const isManager = roles.includes('MANAGER') || roles.includes('GESTOR') || roles.includes('LIDER');
    const hasManagementAccess = isAdmin || ((isRH || isManager) && (user?.permissions || []).length > 0);

    return {
        permissions: user?.permissions || [],
        isAdmin,
        hasManagementAccess,
        hasPermission,
        hasAllPermissions
    };
}
