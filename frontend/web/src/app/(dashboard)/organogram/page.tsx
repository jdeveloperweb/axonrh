'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
    Users,
    Settings2,
    ChevronRight,
    ChevronDown,
    Building2,
    Briefcase,
    User,
    DollarSign,
    FileJson,
    FileSpreadsheet,
    FileText,
    UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { departmentsApi, DepartmentDTO } from '@/lib/api/departments';
import { employeesApi, Employee } from '@/lib/api/employees';
import { positionsApi, Position } from '@/lib/api/positions';
import { cn, getPhotoUrl } from '@/lib/utils';

// --- Types ---

interface OrgNode {
    department: DepartmentDTO;
    manager?: Employee;
    employees: Employee[];
    positions: Position[];
    children: OrgNode[];
}

interface ExportOptions {
    showManager: boolean;
    showSalary: boolean;
    showEmployees: boolean;
    showPhotos: boolean;
    showPositions: boolean;
    isImpersonal: boolean;
}

// --- Component ---

export default function OrganogramPage() {
    const [loading, setLoading] = useState(true);
    const [tree, setTree] = useState<OrgNode[]>([]);
    const [showConfig, setShowConfig] = useState(false);
    const [options, setOptions] = useState<ExportOptions>({
        showManager: true,
        showSalary: false,
        showEmployees: true,
        showPhotos: true,
        showPositions: true,
        isImpersonal: false,
    });

    const chartRef = useRef<HTMLDivElement>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [depts, empsResponse, positionsResponse] = await Promise.all([
                departmentsApi.list(),
                employeesApi.list({ size: 1000 }),
                positionsApi.getActivePositions()
            ]);

            const employees = empsResponse.content;
            const positions = positionsResponse;

            // Build tree
            const builtTree = buildTree(depts, employees, positions);
            setTree(builtTree);
        } catch (error) {
            console.error('Error loading organogram data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const buildTree = (
        depts: DepartmentDTO[],
        emps: Employee[],
        poss: Position[]
    ): OrgNode[] => {
        const deptMap = new Map<string, OrgNode>();

        // Create nodes for each department
        depts.forEach(dept => {
            deptMap.set(dept.id, {
                department: dept,
                manager: emps.find(e => e.id === dept.manager?.id),
                employees: emps.filter(e => e.department?.id === dept.id && e.id !== dept.manager?.id),
                positions: poss.filter(p => p.departmentId === dept.id),
                children: []
            });
        });

        const rootNodes: OrgNode[] = [];

        // Link parents and children
        depts.forEach(dept => {
            const node = deptMap.get(dept.id);
            if (node) {
                if (dept.parent?.id && deptMap.has(dept.parent.id)) {
                    deptMap.get(dept.parent.id)?.children.push(node);
                } else {
                    rootNodes.push(node);
                }
            }
        });

        return rootNodes;
    };

    const handleExport = async (format: 'pdf' | 'json' | 'xlsx' | 'csv') => {
        if (format === 'json') {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tree, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "organograma.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } else if (format === 'csv') {
            let csvContent = "data:text/csv;charset=utf-8,Departamento,Gestor,Cod. Depto,Total Colaboradores\n";
            const flatten = (nodes: OrgNode[]) => {
                nodes.forEach(node => {
                    const totalEmp = node.employees.length + (node.manager ? 1 : 0);
                    csvContent += `"${node.department.name}","${node.manager?.fullName || ''}","${node.department.code}","${totalEmp}"\n`;
                    flatten(node.children);
                });
            };
            flatten(tree);
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "organograma.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } else if (format === 'xlsx') {
            try {
                const XLSX = await import('xlsx');
                interface FlattenedNode {
                    Nivel: number;
                    Departamento: string;
                    Codigo: string;
                    Gestor: string;
                    Salario_Gestor: string | number;
                    Total_Colaboradores: number;
                }
                const flattenData: FlattenedNode[] = [];
                const flatten = (nodes: OrgNode[], level = 0) => {
                    nodes.forEach(node => {
                        flattenData.push({
                            Nivel: level,
                            Departamento: node.department.name,
                            Codigo: node.department.code,
                            Gestor: node.manager?.fullName || '',
                            Salario_Gestor: options.showSalary && node.manager ? node.manager.baseSalary || 0 : '***',
                            Total_Colaboradores: node.employees.length + (node.manager ? 1 : 0)
                        });
                        flatten(node.children, level + 1);
                    });
                };
                flatten(tree);
                const ws = XLSX.utils.json_to_sheet(flattenData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Organograma");
                XLSX.writeFile(wb, "organograma.xlsx");
            } catch (err) {
                console.error("XLSX export failed", err);
            }
        } else if (format === 'pdf') {
            try {
                const jspdf = await import('jspdf');
                const html2canvas = (await import('html2canvas')).default;

                if (chartRef.current) {
                    // Show a toast or loading state here if possible
                    const canvas = await html2canvas(chartRef.current, {
                        scale: 3, // Higher scale for better quality
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#f8fafc' // Match background-offset
                    });

                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jspdf.jsPDF({
                        orientation: canvas.width > canvas.height ? 'l' : 'p',
                        unit: 'mm',
                        format: 'a4'
                    });

                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();

                    const margin = 10;
                    const maxWidth = pdfWidth - (margin * 2);
                    const maxHeight = pdfHeight - (margin * 2);

                    const ratio = canvas.width / canvas.height;
                    let finalWidth = maxWidth;
                    let finalHeight = maxWidth / ratio;

                    if (finalHeight > maxHeight) {
                        finalHeight = maxHeight;
                        finalWidth = maxHeight * ratio;
                    }

                    const x = (pdfWidth - finalWidth) / 2;
                    const y = (pdfHeight - finalHeight) / 2;

                    pdf.setFontSize(10);
                    pdf.setTextColor(100);
                    pdf.text(`Organograma - ${new Date().toLocaleDateString('pt-BR')}`, margin, 8);

                    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
                    pdf.save(`organograma_${new Date().getTime()}.pdf`);
                }
            } catch (err) {
                console.error("PDF export failed", err);
            }
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Organograma</h1>
                    <p className="text-[var(--color-text-secondary)]">Visualização hierárquica da estrutura organizacional</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowConfig(!showConfig)}
                        className="flex items-center gap-2"
                    >
                        <Settings2 className="w-4 h-4" />
                        Configurações
                    </Button>
                    <div className="flex items-center border rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface)]">
                        <Button variant="ghost" size="sm" onClick={() => handleExport('pdf')} title="PDF" className="rounded-none border-r"><FileText className="w-4 h-4 mr-1 md:mr-0" /> <span className="hidden md:inline ml-1 text-xs">PDF</span></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleExport('xlsx')} title="Excel" className="rounded-none border-r"><FileSpreadsheet className="w-4 h-4 mr-1 md:mr-0" /> <span className="hidden md:inline ml-1 text-xs">XLSX</span></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleExport('csv')} title="CSV" className="rounded-none border-r"><Users className="w-4 h-4 mr-1 md:mr-0" /> <span className="hidden md:inline ml-1 text-xs">CSV</span></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleExport('json')} title="JSON" className="rounded-none"><FileJson className="w-4 h-4 mr-1 md:mr-0" /> <span className="hidden md:inline ml-1 text-xs">JSON</span></Button>
                    </div>
                </div>
            </div>

            {/* Hint Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Building2 className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900">Dica de Estrutura</h4>
                    <p className="text-sm text-blue-700">
                        Para visualizar a hierarquia corretamente, acesse a página de <b>Departamentos</b> e defina o &quot;Departamento Superior&quot; para cada área. Departamentos sem superior serão exibidos como raízes.
                    </p>
                </div>
            </div>

            {/* Configuration View */}
            {showConfig && (
                <Card className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-[var(--color-surface)] border-[var(--color-border)] shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-[var(--color-primary)]">
                            <Building2 className="w-4 h-4" /> Elementos Visuais
                        </h3>
                        <div className="grid gap-3">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="showManager"
                                    checked={options.showManager}
                                    onCheckedChange={(val) => setOptions({ ...options, showManager: !!val })}
                                />
                                <label htmlFor="showManager" className="text-sm font-medium leading-none cursor-pointer">Exibir Gestor</label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="showSalary"
                                    checked={options.showSalary}
                                    onCheckedChange={(val) => setOptions({ ...options, showSalary: !!val })}
                                />
                                <label htmlFor="showSalary" className="text-sm font-medium leading-none cursor-pointer">Exibir Salários</label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="showEmployees"
                                    checked={options.showEmployees}
                                    onCheckedChange={(val) => setOptions({ ...options, showEmployees: !!val })}
                                />
                                <label htmlFor="showEmployees" className="text-sm font-medium leading-none cursor-pointer">Exibir Lista de Colaboradores</label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="showPhotos"
                                    checked={options.showPhotos}
                                    onCheckedChange={(val) => setOptions({ ...options, showPhotos: !!val })}
                                />
                                <label htmlFor="showPhotos" className="text-sm font-medium leading-none cursor-pointer">Exibir Fotos</label>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="showPositions"
                                    checked={options.showPositions}
                                    onCheckedChange={(val) => setOptions({ ...options, showPositions: !!val })}
                                />
                                <label htmlFor="showPositions" className="text-sm font-medium leading-none cursor-pointer">Exibir Cargos do Setor</label>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-[var(--color-primary)]">
                            <UserCog className="w-4 h-4" /> Preferências
                        </h3>
                        <div className="grid gap-3">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="isImpersonal"
                                    checked={options.isImpersonal}
                                    onCheckedChange={(val) => setOptions({ ...options, isImpersonal: !!val })}
                                />
                                <label htmlFor="isImpersonal" className="text-sm font-medium leading-none cursor-pointer">Modo Impessoal (Somente cargos)</label>
                            </div>
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] italic">
                            O modo impessoal oculta nomes e fotos, focando na estrutura de cargos.
                        </p>
                    </div>
                    <div className="flex flex-col justify-between items-end">
                        <div className="w-full h-px bg-[var(--color-border)] mb-4 lg:hidden" />
                        <Button className="w-full lg:w-auto" onClick={() => setShowConfig(false)}>Aplicar e Fechar</Button>
                    </div>
                </Card>
            )}

            {/* Main Chart Area */}
            <div className="relative overflow-auto min-h-[600px] border-[var(--color-border)] border rounded-[var(--radius-lg)] bg-[var(--color-background-offset)] p-12 transition-colors duration-500" ref={chartRef}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                        <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[var(--color-text-secondary)] animate-pulse">Construindo hierarquia...</p>
                    </div>
                ) : tree.length > 0 ? (
                    <div className="flex flex-row items-start justify-center gap-24 min-w-max">
                        {tree.map(node => (
                            <OrgTreeNode key={node.department.id} node={node} options={options} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-center max-w-md mx-auto">
                        <Building2 className="w-12 h-12 text-[var(--color-text-tertiary)] mb-4" />
                        <h3 className="text-lg font-semibold">Nenhum departamento encontrado</h3>
                        <p className="text-[var(--color-text-secondary)]">Cadastre departamentos e colaboradores para começar a visualizar o organograma.</p>
                    </div>
                )}
            </div>

            <style jsx global>{`
        .org-node-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .org-children-container {
          display: flex;
          padding-top: 48px; /* Espaço para as linhas */
          gap: 48px;
          position: relative;
          transition: all 0.3s ease;
        }

        /* Linha vertical que desce do pai até a junção */
        .org-children-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 3px;
          height: 24px;
          background-color: #cbd5e1; /* slate-300 */
          transform: translateX(-50%);
        }

        /* Junção central (bolinha) */
        .org-junction {
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background-color: #94a3b8; /* slate-400 */
          border: 2px solid white;
          border-radius: 50%;
          z-index: 20;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        /* Linhas nos filhos */
        .org-child-node-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Linha vertical que sobe de cada filho até a linha horizontal */
        .org-child-node-wrapper::before {
          content: "";
          position: absolute;
          top: -24px;
          left: 50%;
          width: 3px;
          height: 24px;
          background-color: #cbd5e1;
          transform: translateX(-50%);
        }

        /* Linha horizontal conectando os filhos */
        .org-child-node-wrapper::after {
          content: "";
          position: absolute;
          top: -24px;
          width: 100%;
          height: 3px;
          background-color: #cbd5e1;
        }

        /* Ajustes para o primeiro e último filho */
        .org-child-node-wrapper:first-child:not(:last-child)::after {
          width: 50%;
          left: 50%;
        }
        .org-child-node-wrapper:last-child:not(:first-child)::after {
          width: 50%;
          left: 0;
        }
        .org-child-node-wrapper:only-child::after {
          display: none;
        }
      `}</style>
        </div>
    );
}

// --- Subcomponents ---

function OrgTreeNode({ node, options, depth = 0 }: { node: OrgNode, options: ExportOptions, depth?: number }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const levelColors = [
        'border-blue-500 bg-blue-50/30',
        'border-purple-500 bg-purple-50/30',
        'border-emerald-500 bg-emerald-50/30',
        'border-orange-500 bg-orange-50/30',
        'border-pink-500 bg-pink-50/30',
    ];
    const borderColor = levelColors[depth % levelColors.length];
    const hasChildren = node.children.length > 0;

    return (
        <div className="org-node-container">
            {/* Node Card */}
            <div className="relative">
                <Card className={cn(
                    "relative w-80 p-5 transition-all duration-300 border-2 bg-[var(--color-surface)] shadow-lg hover:shadow-2xl hover:-translate-y-2",
                    borderColor,
                    depth > 0 && "mt-0"
                )}>
                    {/* Level Badge */}
                    <div className="absolute -top-3 -right-3 px-2 py-1 rounded-md bg-black text-white text-[9px] font-bold shadow-md z-10">
                        NÍVEL {depth + 1}
                    </div>

                    <div className="space-y-4">
                        {/* Dept Header */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-2 rounded-lg text-white shadow-sm",
                                    depth === 0 ? "bg-blue-600" : "bg-gray-600"
                                )}>
                                    <Building2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-sm leading-tight text-[var(--color-text-primary)]">{node.department.name}</h4>
                                    <span className="text-[10px] uppercase text-[var(--color-text-tertiary)] font-mono tracking-tighter">
                                        {node.department.code}
                                    </span>
                                </div>
                            </div>
                            <div className="text-[10px] bg-white border border-gray-100 px-2 py-0.5 rounded-full font-bold shadow-sm">
                                {node.employees.length + (node.manager ? 1 : 0)} Colabs
                            </div>
                        </div>

                        {/* Manager info (Personal or Impersonal) */}
                        {options.showManager && node.manager && (
                            <div className={cn(
                                "group relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                                options.isImpersonal
                                    ? "bg-gray-50 border-dashed border-gray-300"
                                    : "bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent border-[var(--color-primary)]/10"
                            )}>
                                {!options.isImpersonal ? (
                                    <>
                                        {options.showPhotos && (
                                            <div className="relative">
                                                <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[var(--color-surface-variant)] flex items-center justify-center border-2 border-[var(--color-primary)]/30 ring-2 ring-white dark:ring-gray-900 group-hover:scale-110 transition-transform duration-300">
                                                    {node.manager.photoUrl ? (
                                                        <img
                                                            src={getPhotoUrl(node.manager.photoUrl, node.manager.updatedAt) || ''}
                                                            alt={node.manager.fullName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    {(true) && (
                                                        <div className={`${node.manager.photoUrl ? 'hidden' : ''}`}>
                                                            <User className="w-6 h-6 text-[var(--color-text-tertiary)]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-sm">
                                                    <UserCog className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold truncate text-[var(--color-text-primary)]">{node.manager.fullName}</p>
                                            <p className="text-[10px] text-[var(--color-text-secondary)] truncate font-medium">
                                                {node.manager.position?.title || 'Gestor'}
                                            </p>
                                            {options.showSalary && node.manager.baseSalary && (
                                                <p className="text-[11px] font-bold text-[var(--color-success)] flex items-center mt-1.5 bg-[var(--color-success)]/10 w-fit px-2 py-0.5 rounded-md">
                                                    <DollarSign className="w-3 h-3 mr-0.5" />
                                                    {node.manager.baseSalary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 text-center py-1">
                                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Cargo de Gestão</p>
                                        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                            {node.manager.position?.title || 'Gestor do Departamento'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!options.isImpersonal && options.showEmployees && node.employees.length > 0 && (
                            <div className="py-2 px-1">
                                <div className="flex -space-x-3 overflow-hidden mb-2">
                                    {node.employees.slice(0, 6).map((emp) => (
                                        <div key={emp.id} className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-800 overflow-hidden group/item">
                                            {options.showPhotos && emp.photoUrl ? (
                                                <>
                                                    <img
                                                        src={getPhotoUrl(emp.photoUrl, emp.updatedAt) || ''}
                                                        className="h-full w-full object-cover"
                                                        alt={emp.fullName}
                                                        title={emp.fullName}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                    <div className="hidden h-full w-full flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)]">
                                                        {emp.fullName.charAt(0)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)]">
                                                    {emp.fullName.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {node.employees.length > 6 && (
                                        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-[var(--color-surface-variant)] text-[10px] font-bold text-[var(--color-text-secondary)]">
                                            +{node.employees.length - 6}
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] font-medium text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                                    <Users className="w-3 h-3" />
                                    {node.employees.length} colaborador{node.employees.length !== 1 ? 'es' : ''}
                                </p>
                            </div>
                        )}

                        {/* Positions Tags */}
                        {options.showPositions && node.positions.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-[var(--color-border)]/50">
                                <p className="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest flex items-center gap-1">
                                    <Briefcase className="w-2.5 h-2.5" /> Cargos no Setor
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {node.positions.map(pos => (
                                        <span key={pos.id} className="px-2 py-0.5 rounded-md bg-[var(--color-background)] text-[9px] font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
                                            {pos.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Expand/Collapse Toggle */}
                    {hasChildren && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center transition-all z-10 shadow-lg hover:scale-110",
                                isExpanded ? "text-[var(--color-primary)]" : "text-[var(--color-text-tertiary)]"
                            )}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                </Card>
            </div>

            {/* Children Container */}
            {hasChildren && isExpanded && (
                <div className="org-children-container">
                    {/* Ponto de junção central */}
                    <div className="org-junction" />

                    {node.children.map(child => (
                        <div key={child.department.id} className="org-child-node-wrapper">
                            <OrgTreeNode node={child} options={options} depth={depth + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
