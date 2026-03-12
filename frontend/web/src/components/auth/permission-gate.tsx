
"use client";

import { usePermissions, type Permission } from "@/hooks/use-permissions";
import React from "react";

interface PermissionGateProps {
    permission?: Permission | Permission[];
    allPermissions?: Permission[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Componente que exibe o conteúdo apenas se o usuário tiver as permissões necessárias.
 */
export function PermissionGate({
    permission,
    allPermissions,
    children,
    fallback = null
}: PermissionGateProps) {
    const { hasPermission, hasAllPermissions } = usePermissions();

    let canShow = true;

    if (permission) {
        canShow = hasPermission(permission);
    }

    if (canShow && allPermissions) {
        canShow = hasAllPermissions(allPermissions);
    }

    if (!canShow) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
