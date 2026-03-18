'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Download, 
  Loader2, 
  Users, 
  FileText, 
  Archive
} from 'lucide-react';
import { 
  Card,
  CardContent
} from "@/components/ui/card";
import { Employee } from '@/lib/api/employees';
import { timesheetApi } from '@/lib/api/timesheet';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MassExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  startDate: string;
  endDate: string;
  selectedYear: number;
  selectedMonth: number;
}

export function MassExportModal({
  isOpen,
  onClose,
  employees,
  startDate,
  endDate,
  selectedYear,
  selectedMonth
}: MassExportModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportType, setExportType] = useState<'single' | 'separated'>('single');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const allSelected = filteredEmployees.length > 0 && selectedIds.length === filteredEmployees.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(emp => emp.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos um colaborador.');
      return;
    }

    setIsExporting(true);
    setProgress(0);
    setStatusMessage('Iniciando exportação...');

    try {
      if (exportType === 'single') {
        setStatusMessage('Gerando arquivo único... Isso pode levar alguns segundos.');
        const blob = await timesheetApi.exportMassTimesheet(
          startDate, 
          endDate, 
          format, 
          undefined, 
          selectedIds
        );
        
        if (blob && blob.size > 0) {
          setProgress(100);
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          const monthStr = String(selectedMonth + 1).padStart(2, '0');
          a.download = `espelho-massa-selecionados-${selectedYear}-${monthStr}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          toast.success('Exportação concluída com sucesso.');
          setTimeout(onClose, 1000);
        } else {
            toast.error('Nenhum dado encontrado para exportação.');
        }
      } else {
        const total = selectedIds.length;
        let successCount = 0;

        for (let i = 0; i < total; i++) {
          const id = selectedIds[i];
          const emp = employees.find(e => e.id === id);
          setStatusMessage(`Exportando (${i + 1}/${total}): ${emp?.fullName}`);
          setProgress(Math.round((i / total) * 100));

          try {
            const blob = await timesheetApi.exportTimesheet(id, startDate, endDate, format);
            if (blob && blob.size > 0) {
              const downloadUrl = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = downloadUrl;
              const reg = emp?.registrationNumber || id;
              const monthStr = String(selectedMonth + 1).padStart(2, '0');
              a.download = `espelho-${reg}-${selectedYear}-${monthStr}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
              document.body.appendChild(a);
              a.click();
              await new Promise(resolve => setTimeout(resolve, 300));
              window.URL.revokeObjectURL(downloadUrl);
              document.body.removeChild(a);
              successCount++;
            }
          } catch (err) {
            console.error(`Erro ao exportar ${emp?.fullName}:`, err);
          }
        }
        setProgress(100);
        setStatusMessage('Concluído!');
        toast.success(`${successCount} arquivos exportados com sucesso.`);
        setTimeout(onClose, 1000);
      }
    } catch (error) {
      console.error('Erro na exportação em massa:', error);
      toast.error('Erro ao realizar exportação em massa.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isExporting && onClose()}>
      <DialogContent className="sm:max-w-[600px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Exportação em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione os colaboradores e o formato de exportação dos espelhos de ponto.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          {/* Progress Overlay */}
          {isExporting && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-300">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">{statusMessage}</h3>
              <div className="w-full max-w-sm space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground font-medium">{progress}% completo</p>
              </div>
            </div>
          )}

          {/* Filters & Actions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaborador ou matrícula..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-3 py-1 bg-muted/50 border-none font-semibold">
                  {selectedIds.length} selecionados
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSelectAll}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                >
                  {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
                </Button>
              </div>
            </div>

            {/* List */}
            <Card className="border shadow-none overflow-hidden">
              <ScrollArea className="h-[250px]">
                <div className="p-1">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => toggleSelect(emp.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                        selectedIds.includes(emp.id) && "bg-primary/5"
                      )}
                    >
                      <Checkbox 
                        checked={selectedIds.includes(emp.id)}
                        onCheckedChange={() => toggleSelect(emp.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{emp.fullName}</span>
                        <span className="text-xs text-muted-foreground">
                          Matrícula: {emp.registrationNumber || 'N/A'} • {emp.department?.name || 'Sem departamento'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhum colaborador encontrado
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Archive className="h-4 w-4" /> Tipo de Arquivo
              </label>
              <Select 
                value={exportType} 
                onValueChange={(v: any) => setExportType(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Arquivo Único (PDF com tudo)</SelectItem>
                  <SelectItem value="separated">Separados (Múltiplos downloads)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground italic">
                {exportType === 'single' 
                  ? 'Gera um único PDF contendo todos os espelhos selecionados.' 
                  : 'Inicia o download individual de cada espelho de ponto.'}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Formato de Arquivo
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={format === 'pdf' ? 'primary' : 'outline'}
                  size="sm"
                  className={cn(
                    "w-full h-11 flex items-center justify-center gap-2 border-2",
                    format === 'pdf' ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" : "border-muted"
                  )}
                  onClick={() => setFormat('pdf')}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant={format === 'excel' ? 'primary' : 'outline'}
                  size="sm"
                  className={cn(
                    "w-full h-11 flex items-center justify-center gap-2 border-2",
                    format === 'excel' ? "border-primary bg-primary/10 text-primary hover:bg-primary/20" : "border-muted"
                  )}
                  onClick={() => setFormat('excel')}
                >
                  <Archive className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t">

          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || selectedIds.length === 0}
            className="bg-primary hover:bg-primary/90 shadow-sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Iniciar Exportação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
