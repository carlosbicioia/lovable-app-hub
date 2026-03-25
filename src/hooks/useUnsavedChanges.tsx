import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
 * Hook that warns users when they try to leave a page with unsaved changes.
 * Works with the legacy <BrowserRouter> (no data router required).
 */
export function useUnsavedChanges(isDirty: boolean) {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const pendingPath = useRef<string | null>(null);
  const isConfirmed = useRef(false);

  // Intercept link clicks inside the app to catch SPA navigation
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;

      // Internal link – block and show dialog
      if (!isConfirmed.current) {
        e.preventDefault();
        e.stopPropagation();
        pendingPath.current = href;
        setShowDialog(true);
      }
    };

    // Use capture phase to intercept before react-router processes the click
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirty]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (!isDirty) return;

    const handlePopState = () => {
      if (!isConfirmed.current) {
        // Push current state back to prevent navigation
        window.history.pushState(null, "", window.location.href);
        pendingPath.current = "__back__";
        setShowDialog(true);
      }
    };

    // Push an extra history entry so we can catch the back button
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);

  // Warn on browser close / refresh
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

  const handleProceed = useCallback(() => {
    isConfirmed.current = true;
    setShowDialog(false);
    const path = pendingPath.current;
    pendingPath.current = null;
    if (path === "__back__") {
      window.history.back();
    } else if (path) {
      router.push(path);
    }
  }, [router]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    pendingPath.current = null;
  }, []);

  const UnsavedChangesDialog = useCallback(
    () => (
      <AlertDialog open={showDialog} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Abandonar el proceso?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. Si sales ahora, perderás toda la información introducida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleProceed}>
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    ),
    [showDialog, handleCancel, handleProceed]
  );

  return { UnsavedChangesDialog };
}
