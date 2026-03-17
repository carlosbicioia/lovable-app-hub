import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AccessDenied from "@/pages/AccessDenied";

type AllowedRole = "admin" | "gestor" | "operario" | "colaborador" | "lectura" | "pantalla";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles allowed. If empty / undefined → any authenticated user */
  roles?: AllowedRole[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, roles: userRoles } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;

  if (roles && roles.length > 0) {
    const hasAccess = roles.some((r) => userRoles.includes(r));
    if (!hasAccess) return <AccessDenied />;
  }

  return <>{children}</>;
}
