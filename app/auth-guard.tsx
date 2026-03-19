"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Routes accessible without authentication
const PUBLIC_ROUTES = ["/login", "/reset-password"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, roles, isCollaborator } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (loading) return;

    // Not logged in → /login (skip if already there)
    if (!user && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    // Logged in on a public route → redirect to appropriate home
    if (user && isPublicRoute) {
      if (isCollaborator) {
        router.replace("/colaborador");
      } else if (roles.includes("pantalla")) {
        router.replace("/tv");
      } else {
        router.replace("/");
      }
      return;
    }

    // Collaborator anywhere outside their portal → /colaborador
    if (user && isCollaborator && !pathname.startsWith("/colaborador")) {
      router.replace("/colaborador");
      return;
    }

    // Pantalla role anywhere outside TV → /tv
    if (user && roles.includes("pantalla") && !pathname.startsWith("/tv")) {
      router.replace("/tv");
      return;
    }
  }, [user, loading, roles, isCollaborator, pathname, isPublicRoute, router]);

  // Show spinner while auth state is resolving
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated and not on a public route — don't flash content
  if (!user && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
