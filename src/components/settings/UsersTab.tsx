import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil, Loader2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useSystemUsers, useUpdateUserRole, useManageUser } from "@/hooks/useSystemUsers";
import { useCreateAppUser } from "@/hooks/useAppUsers";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { roles } from "./settingsConstants";

export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const { data: systemUsers, isLoading: systemUsersLoading } = useSystemUsers();
  const updateRole = useUpdateUserRole();
  const manageUser = useManageUser();
  const createUser = useCreateAppUser();
  const queryClient = useQueryClient();

  const { data: collaboratorsList } = useQuery({
    queryKey: ["collaborators_list"],
    queryFn: async () => {
      const { data } = await supabase.from("collaborators").select("id, company_name").order("company_name");
      return data ?? [];
    },
  });

  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "operario", password: "", collaborator_id: "" });
  const [editingUser, setEditingUser] = useState<{ id: string; auth_user_id: string | null; full_name: string; email: string; role: string | null; collaborator_id: string | null } | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", role: "", collaborator_id: "" });
  const [resetPwUser, setResetPwUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) return;
    createUser.mutate(newUser, {
      onSuccess: () => {
        setShowNewUser(false);
        setNewUser({ name: "", email: "", role: "operario", password: "", collaborator_id: "" });
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Usuarios con acceso</CardTitle>
            <CardDescription>Usuarios autenticados en la plataforma y sus roles asignados</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{systemUsers?.length ?? 0} usuario(s)</span>
            <Button size="sm" onClick={() => setShowNewUser(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {systemUsersLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (systemUsers ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No se encontraron usuarios registrados</p>
          ) : (
            <div className="divide-y divide-border">
              {(systemUsers ?? []).map((u) => {
                const initials = u.full_name
                  ? u.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                  : u.email?.[0]?.toUpperCase() ?? "?";
                const roleCfg = roles.find(r => r.value === u.role);
                return (
                  <div key={u.id} className={cn("flex items-center justify-between py-3 gap-4", u.banned && "opacity-50")}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden", u.banned ? "bg-muted" : "bg-primary/10")}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-primary">{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-card-foreground truncate">{u.full_name || "Sin nombre"}</p>
                          {u.banned && <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-medium">Desactivado</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        <p className="text-[10px] text-muted-foreground/60">Registrado: {new Date(u.created_at).toLocaleDateString("es-ES")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Select
                        value={u.role ?? "sin_rol"}
                        disabled={u.banned}
                        onValueChange={(v) => { if (v === "sin_rol") return; updateRole.mutate({ userId: u.id, role: v }); }}
                      >
                        <SelectTrigger className={cn(
                          "h-7 w-[140px] text-xs font-medium",
                          u.role === "admin" ? "border-primary/30 text-primary" :
                          u.role === "gestor" ? "border-info/30 text-info" :
                          u.role === "colaborador" ? "border-warning/30 text-warning" :
                          "border-border text-muted-foreground"
                        )}>
                          <SelectValue>{roleCfg?.label ?? (u.role === "colaborador" ? "Colaborador" : "Sin rol")}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sin_rol" disabled><p className="text-sm text-muted-foreground">Sin rol asignado</p></SelectItem>
                          {roles.map(r => (
                            <SelectItem key={r.value} value={r.value}>
                              <div><p className="text-sm">{r.label}</p><p className="text-[10px] text-muted-foreground">{r.desc}</p></div>
                            </SelectItem>
                          ))}
                          <SelectItem value="colaborador">
                            <div><p className="text-sm">Colaborador</p><p className="text-[10px] text-muted-foreground">Acceso al portal de colaborador</p></div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {u.collaborator_id && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{u.collaborator_id}</span>}
                      {u.id === currentUser?.id ? (
                        <span className="text-[10px] text-muted-foreground italic px-2">Tú</span>
                      ) : (
                        <>
                          <Switch checked={!u.banned} disabled={manageUser.isPending} onCheckedChange={(checked) => manageUser.mutate({ userId: u.id, action: checked ? "unban" : "ban" })} className="scale-75" />
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Restablecer contraseña" onClick={() => { setResetPwUser({ id: u.id, name: u.full_name, email: u.email }); setNewPassword(""); }}>
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setEditingUser({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, collaborator_id: u.collaborator_id });
                            setEditForm({ full_name: u.full_name, role: u.role ?? "operario", collaborator_id: u.collaborator_id ?? "" });
                          }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
                            if (!confirm(`¿Eliminar permanentemente a ${u.full_name || u.email}? Esta acción no se puede deshacer.`)) return;
                            manageUser.mutate({ userId: u.id, action: "delete" });
                          }} disabled={manageUser.isPending}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New User Dialog */}
      <Dialog open={showNewUser} onOpenChange={setShowNewUser}>
        <DialogContent>
          <DialogHeader><DialogTitle>Añadir usuario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={newUser.name} onChange={(e) => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Nombre y apellidos" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser(p => ({ ...p, email: e.target.value }))} placeholder="usuario@empresa.es" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div><p className="text-sm font-medium">{r.label}</p><p className="text-[10px] text-muted-foreground">{r.desc}</p></div>
                    </SelectItem>
                  ))}
                  <SelectItem value="colaborador">
                    <div><p className="text-sm font-medium">Colaborador</p><p className="text-[10px] text-muted-foreground">Acceso al portal de colaborador</p></div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newUser.role === "colaborador" && (
              <div className="space-y-2">
                <Label>Colaborador vinculado</Label>
                <Select value={newUser.collaborator_id} onValueChange={(v) => setNewUser(p => ({ ...p, collaborator_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar colaborador..." /></SelectTrigger>
                  <SelectContent>
                    {(collaboratorsList ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">El usuario tendrá acceso al portal de este colaborador</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" />
              <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, una mayúscula y un número</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewUser(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending || !newUser.name || !newUser.email || newUser.password.length < 8 || (newUser.role === "colaborador" && !newUser.collaborator_id)}>
              {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar usuario</DialogTitle></DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input value={editForm.full_name} onChange={(e) => setEditForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm(p => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map(r => (
                      <SelectItem key={r.value} value={r.value}>
                        <div><p className="text-sm font-medium">{r.label}</p><p className="text-[10px] text-muted-foreground">{r.desc}</p></div>
                      </SelectItem>
                    ))}
                    <SelectItem value="colaborador">
                      <div><p className="text-sm font-medium">Colaborador</p><p className="text-[10px] text-muted-foreground">Acceso al portal de colaborador</p></div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editForm.role === "colaborador" && (
                <div className="space-y-2">
                  <Label>Colaborador vinculado</Label>
                  <Select value={editForm.collaborator_id} onValueChange={(v) => setEditForm(p => ({ ...p, collaborator_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar colaborador..." /></SelectTrigger>
                    <SelectContent>
                      {(collaboratorsList ?? []).map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!editingUser) return;
                if (!confirm(`¿Eliminar permanentemente a ${editingUser.full_name || editingUser.email}? Esta acción no se puede deshacer.`)) return;
                manageUser.mutate({ userId: editingUser.id, action: "delete" }, { onSuccess: () => setEditingUser(null) });
              }}
              disabled={manageUser.isPending}
            >
              {manageUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
              <Button
                disabled={!editForm.full_name}
                onClick={async () => {
                  if (!editingUser) return;
                  const { error: profileErr } = await supabase.from("profiles").update({ full_name: editForm.full_name }).eq("id", editingUser.id);
                  if (profileErr) { toast.error("Error al actualizar perfil"); return; }
                  const roleChanged = editForm.role !== (editingUser.role ?? "");
                  const collabChanged = editForm.collaborator_id !== (editingUser.collaborator_id ?? "");
                  if (roleChanged || collabChanged) {
                    const { data: existing } = await supabase.from("user_roles").select("id").eq("user_id", editingUser.id).limit(1);
                    const updateData: Record<string, unknown> = { role: editForm.role };
                    if (editForm.role === "colaborador") { updateData.collaborator_id = editForm.collaborator_id || null; } else { updateData.collaborator_id = null; }
                    if (existing && existing.length > 0) {
                      await supabase.from("user_roles").update(updateData as any).eq("user_id", editingUser.id);
                    } else {
                      await supabase.from("user_roles").insert({ user_id: editingUser.id, ...updateData } as any);
                    }
                  }
                  toast.success("Usuario actualizado");
                  setEditingUser(null);
                  queryClient.invalidateQueries({ queryKey: ["system_users"] });
                }}
              >
                Guardar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPwUser} onOpenChange={(o) => !o && setResetPwUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Restablecer contraseña</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Establece una nueva contraseña para <strong>{resetPwUser?.name || resetPwUser?.email}</strong></p>
          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
            {newPassword.length > 0 && newPassword.length < 8 && <p className="text-xs text-destructive">La contraseña debe tener al menos 8 caracteres</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwUser(null)}>Cancelar</Button>
            <Button
              disabled={newPassword.length < 8 || manageUser.isPending}
              onClick={() => { manageUser.mutate({ userId: resetPwUser!.id, action: "reset_password", new_password: newPassword }, { onSuccess: () => setResetPwUser(null) }); }}
            >
              {manageUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
