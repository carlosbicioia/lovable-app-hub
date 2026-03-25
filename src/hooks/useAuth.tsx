"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type UserRole = "admin" | "gestor" | "operario" | "colaborador" | "lectura" | "pantalla";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];
  collaboratorId: string | null;
  isCollaborator: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  collaboratorId: null,
  isCollaborator: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role, collaborator_id")
      .eq("user_id", userId);
    if (data) {
      setRoles(data.map((r: any) => r.role as UserRole));
      const collab = data.find((r: any) => r.role === "colaborador");
      setCollaboratorId(collab?.collaborator_id ?? null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer role fetch to avoid Supabase deadlock
          setTimeout(() => fetchRoles(session.user.id), 0);
        } else {
          setRoles([]);
          setCollaboratorId(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
    setCollaboratorId(null);
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, roles, collaboratorId,
      isCollaborator: roles.includes("colaborador"),
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
