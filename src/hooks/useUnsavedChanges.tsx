import { useEffect, useCallback, useState } from "react";
import { useBlocker } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Hook that blocks navigation when there are unsaved changes.
 * Returns a <UnsavedChangesDialog /> component to render.
 */
export function useUnsavedChanges(isDirty: boolean) {
  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        isDirty && currentLocation.pathname !== nextLocation.pathname,
      [isDirty]
    )
  );

  // Also warn on browser close / refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const UnsavedChangesDialog = useCallback(
    () => (
      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Abandonar el proceso?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, perderás toda la información introducida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [blocker]
  );

  return { UnsavedChangesDialog, blocker };
}
