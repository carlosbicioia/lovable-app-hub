import { Trash2, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onExport: () => void;
  entityName?: string;
}

export default function BulkActionBar({ count, onClear, onDelete, onExport, entityName = "elementos" }: BulkActionBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5 animate-in slide-in-from-top-2 duration-200">
        <span className="text-sm font-medium text-primary">
          {count} {count === 1 ? "seleccionado" : "seleccionados"}
        </span>
        <div className="h-4 w-px bg-primary/20" />
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={onExport}>
          <Download className="w-3.5 h-3.5" /> Exportar CSV
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {count} {entityName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán permanentemente {count} {entityName}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { onDelete(); setConfirmDelete(false); }}>
              Eliminar {count}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
