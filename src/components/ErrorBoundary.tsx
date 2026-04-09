import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="max-w-md w-full bg-card shadow-lg rounded-xl p-8 border border-border flex flex-col items-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Algo salió mal
            </h1>
            <p className="text-muted-foreground mb-6 text-sm">
              La aplicación encontró un error inesperado al intentar mostrar esta página.
            </p>
            
            {this.state.error?.message?.includes("insertBefore") && (
              <div className="bg-destructive/5 border border-destructive/20 text-destructive text-sm text-left p-4 rounded-lg mb-6 w-full">
                <strong>💡 Sugerencia:</strong> Este error suele ocurrir cuando una extensión del navegador (como traductor o modificador de páginas) interfiere con la visualización. Intenta desactivar las extensiones o usar una ventana de incógnito.
              </div>
            )}

            <Button onClick={this.handleReset} className="w-full h-11">
              <RefreshCw className="mr-2 h-4 w-4" />
              Recargar aplicación
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
