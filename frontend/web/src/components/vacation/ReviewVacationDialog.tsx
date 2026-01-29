import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { VacationRequest } from '@/lib/api/vacation';

interface ReviewVacationDialogProps {
    request: VacationRequest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (requestId: string, notes: string, type: 'APPROVE' | 'REJECT') => Promise<void>;
}

export function ReviewVacationDialog({
    request,
    open,
    onOpenChange,
    onConfirm,
}: ReviewVacationDialogProps) {
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [type, setType] = useState<'APPROVE' | 'REJECT' | null>(null);

    const handleConfirm = async () => {
        if (!request || !type) return;

        try {
            setIsSubmitting(true);
            await onConfirm(request.id, notes, type);
            onOpenChange(false);
            setNotes('');
            setType(null);
        } catch (error) {
            console.error('Error reviewing request:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!request) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Revisar Solicitação de Férias</DialogTitle>
                    <DialogDescription>
                        {request.employeeName} solicitou {request.daysCount} dias.
                        <br />
                        Período: {new Date(request.startDate).toLocaleDateString('pt-BR')} a{' '}
                        {new Date(request.endDate).toLocaleDateString('pt-BR')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Notas / Motivo</Label>
                        <Textarea
                            placeholder={
                                type === 'REJECT'
                                    ? 'Descreva o motivo da rejeição (obrigatório)'
                                    : 'Adicione observações sobre a aprovação (opcional)'
                            }
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="h-32"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <div className="flex w-full justify-between gap-2">
                        {!type ? (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => setType('REJECT')}
                                    className="w-full"
                                >
                                    Rejeitar
                                </Button>
                                <Button
                                    onClick={() => setType('APPROVE')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Aprovar
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" onClick={() => setType(null)} disabled={isSubmitting}>
                                    Voltar
                                </Button>
                                <Button
                                    variant={type === 'REJECT' ? 'destructive' : 'default'}
                                    className={type === 'APPROVE' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                                    onClick={handleConfirm}
                                    disabled={isSubmitting || (type === 'REJECT' && !notes.trim())}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmar {type === 'APPROVE' ? 'Aprovação' : 'Rejeição'}
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
