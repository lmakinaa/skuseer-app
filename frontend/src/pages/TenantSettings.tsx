import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import { useTenant } from "@/auth/TenantContext";
import {
  getCurrentTenant, updateCurrentTenant,
  getTenantMembers, inviteMember, removeMember, changeMemberRole,
  getRoles, createRole, getAllPermissions, getRolePermissions, setRolePermissions, deleteRole,
  type TenantResponse, type MemberResponse, type RoleResponse, type PermissionItem, type RoleWithPermissions,
} from "@/lib/api";
import { UserPlus, Trash2, Check, X } from "lucide-react";

type Tab = "general" | "members" | "roles";

const TenantSettings = () => {
  const { currentTenant } = useTenant();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("general");

  const tenantId = currentTenant?.tenantId;
  const tabs: { key: Tab; label: string }[] = [
    { key: "general", label: "General" },
    { key: "members", label: "Members" },
    { key: "roles", label: "Roles & Permissions" },
  ];

  return (
    <PageLayout title="Store Settings" subtitle={currentTenant?.tenantName || ""}>
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab tenantId={tenantId} />}
      {tab === "members" && <MembersTab tenantId={tenantId} />}
      {tab === "roles" && <RolesTab tenantId={tenantId} />}
    </PageLayout>
  );
};

// ── General Tab ──────────────────────────────────────────────────────────────
function GeneralTab({ tenantId }: { tenantId?: string }) {
  const queryClient = useQueryClient();
  const { data: tenant } = useQuery({
    queryKey: ["tenant", "current", tenantId],
    queryFn: getCurrentTenant,
    enabled: !!tenantId,
  });

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (tenant && !initialized) {
    setName(tenant.name);
    setLocation(tenant.location || "");
    setInitialized(true);
  }

  const updateMut = useMutation({
    mutationFn: () => updateCurrentTenant({ name, location }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant"] }),
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Store Name</label>
        <input value={name} onChange={e => setName(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Location</label>
        <input value={location} onChange={e => setLocation(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background" />
      </div>
      <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        {updateMut.isPending ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}

// ── Members Tab ─────────────────────────────────────────────────────────────
function MembersTab({ tenantId }: { tenantId?: string }) {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");

  const { data: members = [] } = useQuery({
    queryKey: ["tenant", "members", tenantId],
    queryFn: getTenantMembers,
    enabled: !!tenantId,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", tenantId],
    queryFn: getRoles,
    enabled: !!tenantId,
  });

  const inviteMut = useMutation({
    mutationFn: () => inviteMember(inviteEmail, inviteRoleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "members"] });
      setShowInvite(false);
      setInviteEmail("");
      setInviteRoleId("");
    },
  });

  const removeMut = useMutation({
    mutationFn: (userId: string) => removeMember(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant", "members"] }),
  });

  const changeRoleMut = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      changeMemberRole(userId, roleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant", "members"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{members.length} member(s)</p>
        <button onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
          <UserPlus className="w-3.5 h-3.5" /> Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Email address" value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background" />
            <select value={inviteRoleId} onChange={e => setInviteRoleId(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background">
              <option value="">Select role...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => inviteMut.mutate()}
              disabled={!inviteEmail || !inviteRoleId || inviteMut.isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
              {inviteMut.isPending ? "Sending..." : "Send Invite"}
            </button>
            <button onClick={() => setShowInvite(false)}
              className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent">Cancel</button>
          </div>
          {inviteMut.isError && <p className="text-xs text-destructive">{(inviteMut.error as Error).message}</p>}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m: MemberResponse) => (
              <tr key={m.userId} className="border-b border-border last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{m.fullName || "Pending"}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select value={m.roleId}
                    onChange={e => changeRoleMut.mutate({ userId: m.userId, roleId: e.target.value })}
                    className="px-2 py-1 border border-border rounded-md text-xs bg-background">
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {m.acceptedAt ? "Active" : "Invited"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => removeMut.mutate(m.userId)}
                    className="p-1 hover:bg-destructive/10 rounded text-destructive/70 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Roles & Permissions Tab ─────────────────────────────────────────────────
function RolesTab({ tenantId }: { tenantId?: string }) {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const { data: roles = [] } = useQuery({
    queryKey: ["roles", tenantId],
    queryFn: getRoles,
    enabled: !!tenantId,
  });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: getAllPermissions,
    enabled: !!tenantId,
  });

  const { data: selectedRole } = useQuery({
    queryKey: ["role", selectedRoleId],
    queryFn: () => getRolePermissions(selectedRoleId!),
    enabled: !!selectedRoleId,
  });

  const createMut = useMutation({
    mutationFn: () => createRole({ name: newRoleName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowCreate(false);
      setNewRoleName("");
    },
  });

  const permMut = useMutation({
    mutationFn: (permIds: string[]) => setRolePermissions(selectedRoleId!, permIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role", selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ["rolePermissions"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (roleId: string) => deleteRole(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setSelectedRoleId(null);
    },
  });

  const selectedPermIds = new Set(selectedRole?.permissions?.map(p => p.id) ?? []);

  const togglePerm = (permId: string) => {
    const current = [...selectedPermIds];
    const next = current.includes(permId)
      ? current.filter(id => id !== permId)
      : [...current, permId];
    permMut.mutate(next);
  };

  // Group permissions by resource
  const grouped = allPermissions.reduce<Record<string, PermissionItem[]>>((acc, p) => {
    const resource = p.codename.split(":")[0];
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{roles.length} role(s)</p>
        <button onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
          + New Role
        </button>
      </div>

      {showCreate && (
        <div className="flex items-center gap-2">
          <input placeholder="Role name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background" />
          <button onClick={() => createMut.mutate()} disabled={!newRoleName}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50">Create</button>
          <button onClick={() => setShowCreate(false)}
            className="px-3 py-1.5 border border-border rounded-lg text-xs">Cancel</button>
        </div>
      )}

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Role list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {roles.map(r => (
            <button key={r.id}
              onClick={() => setSelectedRoleId(r.id)}
              className={`w-full text-left px-4 py-3 text-sm border-b border-border last:border-0 transition-colors ${
                selectedRoleId === r.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"
              }`}>
              <div>{r.name}</div>
              {r.isDefault && <span className="text-[10px] text-muted-foreground">Default</span>}
            </button>
          ))}
        </div>

        {/* Permission matrix */}
        {selectedRoleId && selectedRole ? (
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{selectedRole.name} — Permissions</h3>
              <button onClick={() => deleteMut.mutate(selectedRoleId)}
                className="flex items-center gap-1 px-2 py-1 text-xs border border-destructive/30 text-destructive rounded-md hover:bg-destructive/10">
                <Trash2 className="w-3 h-3" /> Delete Role
              </button>
            </div>
            {deleteMut.isError && <p className="text-xs text-destructive">{(deleteMut.error as Error).message}</p>}

            <div className="space-y-3">
              {Object.entries(grouped).map(([resource, perms]) => (
                <div key={resource}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 capitalize">{resource}</h4>
                  <div className="flex gap-2">
                    {perms.map(p => {
                      const action = p.codename.split(":")[1];
                      const active = selectedPermIds.has(p.id);
                      return (
                        <button key={p.id} onClick={() => togglePerm(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            active
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-background border-border text-muted-foreground hover:border-primary/20"
                          }`}>
                          {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-30" />}
                          {action}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-sm text-muted-foreground bg-card border border-border rounded-xl p-8">
            Select a role to manage permissions
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantSettings;
