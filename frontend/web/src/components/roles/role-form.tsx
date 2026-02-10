
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Permission, Role, rolesApi } from "@/lib/api/roles";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const roleSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
    active: z.boolean().default(true),
    permissionIds: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
    initialData?: Role;
    permissionsGrouped: Record<string, Permission[]>;
}

export function RoleForm({ initialData, permissionsGrouped }: RoleFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);

    // Initialize form
    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            active: initialData?.active ?? true,
            permissionIds: initialData?.permissions.map(p => p.id) || [],
        },
    });

    async function onSubmit(data: RoleFormValues) {
        try {
            setSaving(true);

            if (initialData) {
                await rolesApi.update(initialData.id, data);
                toast({
                    title: "Perfil atualizado",
                    description: "As alterações foram salvas com sucesso.",
                });
            } else {
                await rolesApi.create(data);
                toast({
                    title: "Perfil criado",
                    description: "O novo perfil foi criado com sucesso.",
                });
            }

            router.push("/settings/roles");
            router.refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: "Ocorreu um erro ao salvar o perfil. Tente novamente.",
            });
        } finally {
            setSaving(false);
        }
    }

    // Helper to check if all permissions in a module are selected
    const isModuleSelected = (modulePermissions: Permission[]) => {
        const currentPermissions = form.watch("permissionIds");
        return modulePermissions.every(p => currentPermissions.includes(p.id));
    };

    // Helper to toggle all permissions in a module
    const toggleModule = (modulePermissions: Permission[], checked: boolean) => {
        const currentPermissions = new Set(form.watch("permissionIds"));

        modulePermissions.forEach(p => {
            if (checked) {
                currentPermissions.add(p.id);
            } else {
                currentPermissions.delete(p.id);
            }
        });

        form.setValue("permissionIds", Array.from(currentPermissions));
    };

    const modules = Object.keys(permissionsGrouped).sort();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Básicas</CardTitle>
                            <CardDescription>
                                Defina o nome e descrição do perfil.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Perfil</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Gestor de Projetos" {...field} disabled={initialData?.systemRole} />
                                        </FormControl>
                                        <FormDescription>
                                            {initialData?.systemRole && "Este é um perfil de sistema e o nome não pode ser alterado."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva as responsabilidades deste perfil..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Ativo</FormLabel>
                                            <FormDescription>
                                                Perfis desativados não podem ser atribuídos a novos usuários.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Permissões de Acesso</CardTitle>
                            <CardDescription>
                                Selecione as permissões que este perfil terá acesso.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {modules.map((module) => (
                                    <Card key={module} className="border-muted bg-muted/20">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base capitalize">
                                                    {module === 'null' ? 'Geral' : module}
                                                </CardTitle>
                                                <Checkbox
                                                    checked={isModuleSelected(permissionsGrouped[module])}
                                                    onCheckedChange={(checked) =>
                                                        toggleModule(permissionsGrouped[module], checked as boolean)
                                                    }
                                                />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="grid gap-2">
                                            <Separator className="mb-2" />
                                            {permissionsGrouped[module].map((permission) => (
                                                <FormField
                                                    key={permission.id}
                                                    control={form.control}
                                                    name="permissionIds"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={permission.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(permission.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, permission.id])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== permission.id
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                                                        {permission.displayName || permission.code}
                                                                    </FormLabel>
                                                                    {permission.description && (
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {permission.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </form>
        </Form>
    );
}
