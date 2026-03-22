import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageLayout from "@/components/PageLayout";
import { useTenant } from "@/auth/TenantContext";
import { getAdminTenants, createTenant, type TenantResponse } from "@/lib/api";
import { Building2, Plus, MapPin, Users } from "lucide-react";

const AdminTenants = () => {
  const { user } = useTenant();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", location: "" });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["admin", "tenants"],
    queryFn: getAdminTenants,
    enabled: !!user?.isPlatformAdmin,
  });

  const createMut = useMutation({
    mutationFn: () => createTenant(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      setShowCreate(false);
      setForm({ name: "", slug: "", location: "" });
    },
  });

  if (!user?.isPlatformAdmin) {
    return (
      <PageLayout title="Access Denied">
        <p className="text-muted-foreground">Platform admin access required.</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Tenants" subtitle="Manage all stores on the platform">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tenants.length} tenant(s)</p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Tenant
        </button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold">New Tenant</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Store name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
            />
            <input
              placeholder="Slug (url-friendly)"
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
            />
            <input
              placeholder="Location (optional)"
              value={form.location}
              onChange={e => setForm({ ...form, location: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => createMut.mutate()}
              disabled={!form.name || !form.slug || createMut.isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {createMut.isPending ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-accent"
            >
              Cancel
            </button>
          </div>
          {createMut.isError && (
            <p className="text-xs text-destructive">{(createMut.error as Error).message}</p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Members</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t: TenantResponse) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.location ? (
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />{t.memberCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      t.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
};

export default AdminTenants;
