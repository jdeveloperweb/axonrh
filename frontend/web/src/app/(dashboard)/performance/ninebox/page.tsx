'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Star,
  TrendingUp,
  AlertTriangle,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import {
  cyclesApi,
  EvaluationCycle,
  NineBoxMatrix,
  NineBoxEmployee,
} from '@/lib/api/performance';

// Configuracao das posicoes do 9Box
const NINE_BOX_CONFIG: Record<string, { row: number; col: number; bgColor: string; textColor: string }> = {
  STAR: { row: 0, col: 2, bgColor: 'bg-emerald-500', textColor: 'text-white' },
  HIGH_POTENTIAL: { row: 0, col: 1, bgColor: 'bg-emerald-400', textColor: 'text-white' },
  FUTURE_STAR: { row: 0, col: 0, bgColor: 'bg-blue-400', textColor: 'text-white' },
  KEY_PLAYER: { row: 1, col: 2, bgColor: 'bg-green-400', textColor: 'text-white' },
  CORE: { row: 1, col: 1, bgColor: 'bg-yellow-400', textColor: 'text-gray-900' },
  DILEMMA: { row: 1, col: 0, bgColor: 'bg-orange-400', textColor: 'text-white' },
  WORKHORSE: { row: 2, col: 2, bgColor: 'bg-lime-400', textColor: 'text-gray-900' },
  SOLID_PERFORMER: { row: 2, col: 1, bgColor: 'bg-orange-300', textColor: 'text-gray-900' },
  UNDERPERFORMER: { row: 2, col: 0, bgColor: 'bg-red-400', textColor: 'text-white' },
};

const POSITION_LABELS: Record<string, { label: string; description: string }> = {
  STAR: { label: 'Estrela', description: 'Alto desempenho e alto potencial' },
  HIGH_POTENTIAL: { label: 'Alto Potencial', description: 'Medio desempenho, alto potencial' },
  FUTURE_STAR: { label: 'Futuro Destaque', description: 'Baixo desempenho, alto potencial' },
  KEY_PLAYER: { label: 'Jogador Chave', description: 'Alto desempenho, medio potencial' },
  CORE: { label: 'Core', description: 'Medio desempenho e potencial' },
  DILEMMA: { label: 'Dilema', description: 'Baixo desempenho, medio potencial' },
  WORKHORSE: { label: 'Forca de Trabalho', description: 'Alto desempenho, baixo potencial' },
  SOLID_PERFORMER: { label: 'Performer Solido', description: 'Medio desempenho, baixo potencial' },
  UNDERPERFORMER: { label: 'Baixo Desempenho', description: 'Baixo desempenho e potencial' },
};

export default function NineBoxPage() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [matrix, setMatrix] = useState<NineBoxMatrix | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<NineBoxEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadCycles = async () => {
      try {
        const response = await cyclesApi.list();
        const data = response;
        setCycles(data.filter((c: EvaluationCycle) => c.status === 'COMPLETED' || c.status === 'CALIBRATION'));
        if (data.length > 0) {
          setSelectedCycleId(data[0].id);
        }
      } catch (error: unknown) {
        console.error('Erro ao carregar ciclos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCycles();
  }, []);

  useEffect(() => {
    const loadMatrix = async () => {
      try {
        setLoading(true);
        const response = await cyclesApi.getNineBox(selectedCycleId);
        setMatrix(response);
      } catch (error: unknown) {
        console.error('Erro ao carregar matriz:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCycleId) {
      loadMatrix();
    }
  }, [selectedCycleId]);

  const getEmployeesInPosition = (position: string) => {
    if (!matrix) return [];
    return matrix.employees.filter((e) => e.position.position === position);
  };

  const handleEmployeeClick = (employee: NineBoxEmployee) => {
    setSelectedEmployee(employee);
    setDialogOpen(true);
  };

  const exportMatrix = () => {
    // Logica de exportacao para CSV/PDF
    console.log('Exportar matriz');
  };

  if (loading && !matrix) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/performance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Matriz 9Box</h1>
          <p className="text-muted-foreground">
            Mapeamento de talentos por desempenho e potencial
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCycleId} onValueChange={setSelectedCycleId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Selecione o ciclo" />
            </SelectTrigger>
            <SelectContent>
              {cycles.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportMatrix}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatisticas */}
      {matrix && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Avaliados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matrix.statistics.totalEmployees}</div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-500" />
                Estrelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                {matrix.statistics.starCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Top performers
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Alto Potencial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {matrix.statistics.hiPoCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {matrix.statistics.hiPoPercentage.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Em Risco
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {matrix.statistics.atRiskCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {matrix.statistics.atRiskPercentage.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Matriz 9Box */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Talentos</CardTitle>
          <CardDescription>
            Clique em um colaborador para ver detalhes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Labels do eixo Y (Potencial) */}
            <div className="absolute -left-2 top-0 bottom-0 w-8 flex flex-col justify-between items-center py-8">
              <span className="text-xs text-muted-foreground rotate-180 [writing-mode:vertical-lr]">
                Alto Potencial
              </span>
              <span className="text-xs text-muted-foreground rotate-180 [writing-mode:vertical-lr]">
                Medio Potencial
              </span>
              <span className="text-xs text-muted-foreground rotate-180 [writing-mode:vertical-lr]">
                Baixo Potencial
              </span>
            </div>

            {/* Grid da Matriz */}
            <div className="ml-8">
              <div className="grid grid-cols-3 gap-2">
                {/* Linha 1 - Alto Potencial */}
                {['FUTURE_STAR', 'HIGH_POTENTIAL', 'STAR'].map((position) => (
                  <NineBoxCell
                    key={position}
                    position={position}
                    config={NINE_BOX_CONFIG[position]}
                    label={POSITION_LABELS[position]}
                    employees={getEmployeesInPosition(position)}
                    onEmployeeClick={handleEmployeeClick}
                  />
                ))}

                {/* Linha 2 - Medio Potencial */}
                {['DILEMMA', 'CORE', 'KEY_PLAYER'].map((position) => (
                  <NineBoxCell
                    key={position}
                    position={position}
                    config={NINE_BOX_CONFIG[position]}
                    label={POSITION_LABELS[position]}
                    employees={getEmployeesInPosition(position)}
                    onEmployeeClick={handleEmployeeClick}
                  />
                ))}

                {/* Linha 3 - Baixo Potencial */}
                {['UNDERPERFORMER', 'SOLID_PERFORMER', 'WORKHORSE'].map((position) => (
                  <NineBoxCell
                    key={position}
                    position={position}
                    config={NINE_BOX_CONFIG[position]}
                    label={POSITION_LABELS[position]}
                    employees={getEmployeesInPosition(position)}
                    onEmployeeClick={handleEmployeeClick}
                  />
                ))}
              </div>

              {/* Labels do eixo X (Desempenho) */}
              <div className="flex justify-between mt-4 px-8">
                <span className="text-xs text-muted-foreground">Baixo Desempenho</span>
                <span className="text-xs text-muted-foreground">Medio Desempenho</span>
                <span className="text-xs text-muted-foreground">Alto Desempenho</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle>Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(POSITION_LABELS).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded ${NINE_BOX_CONFIG[key].bgColor}`}
                />
                <div>
                  <p className="font-medium text-sm">{value.label}</p>
                  <p className="text-xs text-muted-foreground">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Colaborador */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.employeeName}</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.positionTitle} - {selectedEmployee?.departmentName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{selectedEmployee.performanceScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Desempenho</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{selectedEmployee.potentialScore.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">Potencial</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Badge
                  className={`${NINE_BOX_CONFIG[selectedEmployee.position.position]?.bgColor} ${NINE_BOX_CONFIG[selectedEmployee.position.position]?.textColor} text-sm px-4 py-2`}
                >
                  {POSITION_LABELS[selectedEmployee.position.position]?.label}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {POSITION_LABELS[selectedEmployee.position.position]?.description}
              </p>

              <div className="flex gap-2 justify-center pt-4">
                <Link href={`/employees/${selectedEmployee.employeeId}`}>
                  <Button variant="outline">Ver Perfil</Button>
                </Link>
                <Link href={`/performance/pdi/new?employeeId=${selectedEmployee.employeeId}`}>
                  <Button>Criar PDI</Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Celula do 9Box
function NineBoxCell({
  config,
  label,
  employees,
  onEmployeeClick,
}: {
  position: string;
  config: { bgColor: string; textColor: string };
  label: { label: string; description: string };
  employees: NineBoxEmployee[];
  onEmployeeClick: (employee: NineBoxEmployee) => void;
}) {
  return (
    <div
      className={`${config.bgColor} ${config.textColor} rounded-lg p-4 min-h-[180px] flex flex-col`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{label.label}</h3>
        <Badge variant="secondary" className="bg-white/20 text-inherit">
          {employees.length}
        </Badge>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex flex-wrap gap-1">
          {employees.slice(0, 8).map((employee) => (
            <button
              key={employee.employeeId}
              onClick={() => onEmployeeClick(employee)}
              className="w-8 h-8 rounded-full bg-white/30 hover:bg-white/50 transition-colors flex items-center justify-center text-xs font-medium"
              title={employee.employeeName}
            >
              {employee.employeeName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </button>
          ))}
          {employees.length > 8 && (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">
              +{employees.length - 8}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
