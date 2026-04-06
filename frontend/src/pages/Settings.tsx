import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, RefreshCw, ExternalLink, Plus, Mail, Trash2,
  Shield, Store, MapPin, Phone, Globe, Clock, Users, Plug, Package,
  Upload, Download, FolderTree, Pencil, Check, ChevronDown, ChevronRight,
} from "lucide-react";
import PageLayout from "@/components/PageLayout";
import {
  useIntegrations, useConnectIntegration, useDisconnectIntegration, useRefreshIntegration,
  useCurrentTenant, useUpdateCurrentTenant,
  useTenantMembers, useInviteMember, useRemoveMember,
  useRoles, useAllPermissions, useCreateRole, useUpdateRole, useRolePermissions, useSetRolePermissions, useDeleteRole,
  useCategories, useCreateCategory, useUpdateCategory, useCreateSubcategory,
  useProductImportHistory, useImportProductsCsv, useExportProductsCsv, useImportSalesCsv,
} from "@/hooks/useApi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

type RoleDraft = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  builtIn: boolean;
  isNew: boolean;
};

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const toJoinedAt = (acceptedAt: string | null) => {
  if (!acceptedAt) return "Invited";
  const d = new Date(acceptedAt);
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
};

/* ── component ── */
const Settings = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const salesFileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: tenant } = useCurrentTenant();
  const updateTenant = useUpdateCurrentTenant();

  const { data: members = [] } = useTenantMembers();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();

  const [storeForm, setStoreForm] = useState({
    name: "",
    storeId: "",
    address: "",
    phone: "",
    website: "",
    timezone: "",
    location: "",
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [editingRole, setEditingRole] = useState<RoleDraft | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const { data: roles = [] } = useRoles();
  const { data: permissions = [] } = useAllPermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const setRolePermissions = useSetRolePermissions();

  const { data: roleDetail } = useRolePermissions(editingRole && !editingRole.isNew ? editingRole.id : null);

  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const renameCategory = useUpdateCategory();
  const createSubcategory = useCreateSubcategory();

  const { data: importHistory = [] } = useProductImportHistory();
  const importProducts = useImportProductsCsv();
  const importSales = useImportSalesCsv();
  const exportProducts = useExportProductsCsv();

  const { data: integrations = [] } = useIntegrations();
  const connectIntegration = useConnectIntegration();
  const disconnectIntegration = useDisconnectIntegration();
  const refreshIntegration = useRefreshIntegration();

  const permissionGroups = useMemo(() => {
    const order = ["dashboard", "products", "forecasts", "promotions", "reports", "settings"];
    const grouped = new Map<string, { key: string; label: string }[]>();
    for (const p of permissions) {
      const [resource] = p.codename.split(".");
      if (!grouped.has(resource)) grouped.set(resource, []);
      grouped.get(resource)!.push({ key: p.codename, label: p.description ?? p.codename });
    }
    return order
      .filter((k) => grouped.has(k))
      .map((k) => ({ group: k[0].toUpperCase() + k.slice(1), permissions: grouped.get(k)! }));
  }, [permissions]);

  const allPermKeys = useMemo(
    () => permissionGroups.flatMap((g) => g.permissions.map((p) => p.key)),
    [permissionGroups],
  );

  const codenameToId = useMemo(
    () => Object.fromEntries(permissions.map((p) => [p.codename, p.id])),
    [permissions],
  );

  useEffect(() => {
    if (!tenant) return;
    setStoreForm({
      name: tenant.name ?? "",
      storeId: tenant.storeId ?? "",
      address: tenant.address ?? "",
      phone: tenant.phone ?? "",
      website: tenant.website ?? "",
      timezone: tenant.timezone ?? "",
      location: tenant.location ?? "",
    });
  }, [tenant]);

  useEffect(() => {
    if (!inviteRole && roles.length > 0) {
      setInviteRole(roles[0].id);
    }
  }, [inviteRole, roles]);

  useEffect(() => {
    if (!editingRole || !roleDetail || roleDetail.id !== editingRole.id) return;
    setEditingRole((prev) =>
      prev
        ? {
            ...prev,
            permissions: roleDetail.permissions.map((p) => p.codename),
          }
        : prev,
    );
  }, [editingRole, roleDetail]);

  const toggleCategory = (id: string) =>
    setExpandedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const openRoleEditor = (roleId: string | null) => {
    const role = roleId ? roles.find((r) => r.id === roleId) : null;
    setEditingRole(
      role
        ? {
            id: role.id,
            name: role.name,
            description: role.description ?? "",
            permissions: [],
            builtIn: ["Owner", "Store Admin"].includes(role.name),
            isNew: false,
          }
        : {
            id: `new-${Date.now()}`,
            name: "",
            description: "",
            permissions: [],
            builtIn: false,
            isNew: true,
          },
    );
    setRoleDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    if (!editingRole) return;
    setEditingRole({
      ...editingRole,
      permissions: editingRole.permissions.includes(key)
        ? editingRole.permissions.filter((p) => p !== key)
        : [...editingRole.permissions, key],
    });
  };

  const toggleGroupAll = (group: typeof PERMISSION_GROUPS[0]) => {
    if (!editingRole) return;
    const groupKeys = group.permissions.map((p) => p.key);
    const allChecked = groupKeys.every((k) => editingRole.permissions.includes(k));
    setEditingRole({
      ...editingRole,
      permissions: allChecked
        ? editingRole.permissions.filter((p) => !groupKeys.includes(p))
        : [...new Set([...editingRole.permissions, ...groupKeys])],
    });
  };

  const saveRole = async () => {
    if (!editingRole || !editingRole.name.trim()) return;
    const permissionIds = editingRole.permissions
      .map((code) => codenameToId[code])
      .filter(Boolean);
    if (editingRole.isNew) {
      const created = await createRole.mutateAsync({
        name: editingRole.name,
        description: editingRole.description,
      });
      await setRolePermissions.mutateAsync({ roleId: created.id, permissionIds });
    } else {
      await updateRole.mutateAsync({
        roleId: editingRole.id,
        body: { name: editingRole.name, description: editingRole.description },
      });
      await setRolePermissions.mutateAsync({ roleId: editingRole.id, permissionIds });
    }
    setRoleDialogOpen(false);
    setEditingRole(null);
  };

  const roleBadgeClass = (roleName: string) => {
    if (roleName === "Owner" || roleName === "Store Admin") return "bg-primary/10 text-primary border-primary/20";
    if (roleName === "Store Manager") return "bg-blue-50 text-blue-700 border-blue-200";
    if (roleName === "Analyst") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-muted text-muted-foreground border-border";
  };

  const displayMembers = members.map((m) => {
    const name = m.fullName ?? m.email;
    return {
      id: m.userId,
      name,
      email: m.email,
      role: m.roleName,
      avatar: initials(name),
      joinedAt: toJoinedAt(m.acceptedAt),
    };
  });

  return (
    <PageLayout title="Settings" subtitle="Manage your store, team, and data sources">
      <Tabs defaultValue="store" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 border border-border rounded-xl p-1 h-auto gap-1 flex-wrap">
          <TabsTrigger value="store" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 text-[13px] gap-2">
            <Store className="w-4 h-4" /> Store Info
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 text-[13px] gap-2">
            <Users className="w-4 h-4" /> Members
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 text-[13px] gap-2">
            <Package className="w-4 h-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 text-[13px] gap-2">
            <Shield className="w-4 h-4" /> Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2.5 text-[13px] gap-2">
            <Plug className="w-4 h-4" /> Data Sources
          </TabsTrigger>
        </TabsList>

        {/* ────────── Store Info ────────── */}
        <TabsContent value="store" className="mt-5 space-y-5">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-[15px] font-semibold text-foreground mb-4">General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Store Name" value={storeForm.name} onChange={(v) => setStoreForm((p) => ({ ...p, name: v }))} icon={<Store className="w-4 h-4 text-muted-foreground" />} />
              <Field label="Store ID" value={storeForm.storeId} onChange={() => {}} icon={<Shield className="w-4 h-4 text-muted-foreground" />} disabled />
              <Field label="Address" value={storeForm.address} onChange={(v) => setStoreForm((p) => ({ ...p, address: v }))} icon={<MapPin className="w-4 h-4 text-muted-foreground" />} />
              <Field label="Phone" value={storeForm.phone} onChange={(v) => setStoreForm((p) => ({ ...p, phone: v }))} icon={<Phone className="w-4 h-4 text-muted-foreground" />} />
              <Field label="Website" value={storeForm.website} onChange={(v) => setStoreForm((p) => ({ ...p, website: v }))} icon={<Globe className="w-4 h-4 text-muted-foreground" />} />
              <Field label="Timezone" value={storeForm.timezone} onChange={(v) => setStoreForm((p) => ({ ...p, timezone: v }))} icon={<Clock className="w-4 h-4 text-muted-foreground" />} />
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button
                size="sm"
                className="text-[12px]"
                onClick={() =>
                  updateTenant.mutate({
                    name: storeForm.name,
                    location: storeForm.location,
                    address: storeForm.address,
                    phone: storeForm.phone,
                    website: storeForm.website,
                    timezone: storeForm.timezone,
                  })
                }
              >
                Save Changes
              </Button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-[15px] font-semibold text-foreground mb-1">Operating Hours</h3>
            <p className="text-[12px] text-muted-foreground mb-4">StockSeer uses these to adjust forecasts for open/closed hours.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
              {["Mon – Fri", "Saturday", "Sunday", "Holidays"].map((d, i) => (
                <div key={d} className="bg-secondary/50 rounded-lg px-4 py-3">
                  <span className="text-muted-foreground block mb-1">{d}</span>
                  <span className="text-foreground font-medium">
                    {i === 0 ? "6:00 AM – 10:00 PM" : i === 1 ? "7:00 AM – 11:00 PM" : i === 2 ? "8:00 AM – 9:00 PM" : "9:00 AM – 6:00 PM"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ────────── Members ────────── */}
        <TabsContent value="members" className="mt-5 space-y-5">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-[15px] font-semibold text-foreground mb-1">Invite a Team Member</h3>
            <p className="text-[12px] text-muted-foreground mb-4">They'll receive an email invitation to join this store on StockSeer.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="colleague@store.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="pl-9 text-[13px]" />
              </div>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-[13px] text-foreground">
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <Button
                size="sm"
                className="gap-1.5 text-[12px]"
                onClick={() => inviteMember.mutate({ email: inviteEmail, roleId: inviteRole })}
              >
                <Plus className="w-3.5 h-3.5" /> Send Invite
              </Button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-[15px] font-semibold text-foreground">Team Members</h3>
              <p className="text-[12px] text-muted-foreground">{displayMembers.length} people have access to this store</p>
            </div>
            <div className="divide-y divide-border">
              {displayMembers.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-semibold shrink-0">{m.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground">{m.email}</div>
                  </div>
                  <div className="text-[11px] text-muted-foreground hidden sm:block">Joined {m.joinedAt}</div>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${roleBadgeClass(m.role)}`}>{m.role}</Badge>
                  {m.role !== "Owner" && (
                    <button className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors group" onClick={() => removeMember.mutate(m.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ────────── Products ────────── */}
        <TabsContent value="products" className="mt-5 space-y-5">
          {/* Categories */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Categories</h3>
                <p className="text-[12px] text-muted-foreground">Organize your products into departments and subcategories.</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-[12px]"
                onClick={() => {
                  const name = window.prompt("Category name");
                  if (name) createCategory.mutate(name);
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </Button>
            </div>
            <div className="space-y-1">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                  >
                    {expandedCategories.includes(cat.id) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <FolderTree className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-medium text-foreground flex-1">{cat.name}</span>
                    <span className="text-[11px] text-muted-foreground">{cat.products} products</span>
                    <span className="text-[11px] text-muted-foreground">{cat.subcategories?.length ?? 0} subcategories</span>
                    <button
                      className="p-1 rounded hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextName = window.prompt("Rename category", cat.name);
                        if (nextName) renameCategory.mutate({ categoryId: cat.id, body: { name: nextName } });
                      }}
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </button>
                  {expandedCategories.includes(cat.id) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-11 pl-3 border-l border-border space-y-1 py-1">
                      {(cat.subcategories ?? []).map((sub) => (
                        <div key={sub} className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent/30 text-[12px] text-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                          {sub}
                        </div>
                      ))}
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] text-primary hover:text-primary/80"
                        onClick={() => {
                          const name = window.prompt("Subcategory name");
                          if (name) createSubcategory.mutate({ categoryId: cat.id, name });
                        }}
                      >
                        <Plus className="w-3 h-3" /> Add Subcategory
                      </button>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Import / Export */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-[15px] font-semibold text-foreground mb-1">Import & Export</h3>
            <p className="text-[12px] text-muted-foreground mb-4">Bulk import products or sales from CSV, or export your catalog.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Upload className="w-5 h-5 text-primary" /></div>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-foreground">Import Products</div>
                  <div className="text-[11px] text-muted-foreground">SKU, name, category, price, etc.</div>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors" onClick={() => salesFileInputRef.current?.click()}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Upload className="w-5 h-5 text-primary" /></div>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-foreground">Import Sales</div>
                  <div className="text-[11px] text-muted-foreground">SKU, date, sold quantity</div>
                </div>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 mb-6">
              <button
                className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                onClick={async () => {
                  const blob = await exportProducts.mutateAsync();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "products_catalog.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center"><Download className="w-5 h-5 text-foreground" /></div>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-foreground">Export Catalog</div>
                  <div className="text-[11px] text-muted-foreground">Download as CSV or Excel</div>
                </div>
              </button>
            </div>
            <h4 className="text-[13px] font-medium text-foreground mb-3">Recent Imports</h4>
            <div className="space-y-2">
              {importHistory.map((imp) => (
                <div key={imp.id} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/30 text-[12px]">
                  <CheckCircle className="w-4 h-4 text-success shrink-0" />
                  <span className="font-medium text-foreground flex-1">{imp.file}</span>
                  <span className="text-muted-foreground">{imp.items} items</span>
                  <span className="text-muted-foreground">{imp.date}</span>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importProducts.mutate(file);
              }}
            />
            <input
              ref={salesFileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) importSales.mutate(file);
                e.target.value = "";
              }}
            />
          </div>
        </TabsContent>

        {/* ────────── Roles & Permissions ────────── */}
        <TabsContent value="roles" className="mt-5 space-y-5">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[15px] font-semibold text-foreground">Roles</h3>
              <Button size="sm" className="gap-1.5 text-[12px]" onClick={() => openRoleEditor(null)}>
                <Plus className="w-3.5 h-3.5" /> Create Role
              </Button>
            </div>
            <p className="text-[12px] text-muted-foreground mb-5">Define what each role can see and do inside StockSeer.</p>

            <div className="space-y-3">
              {roles.map((role, i) => (
                <motion.div key={role.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-accent/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${roleBadgeClass(role.name)}`}>{role.name}</Badge>
                      {role.isDefault && <span className="text-[10px] text-muted-foreground">(default)</span>}
                    </div>
                    <p className="text-[12px] text-muted-foreground">{role.description}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="text-[11px] h-8 px-3 gap-1" onClick={() => openRoleEditor(role.id)}>
                      <Pencil className="w-3 h-3" /> Edit
                    </Button>
                    {!role.isDefault && role.name !== "Owner" && role.name !== "Store Admin" && (
                      <Button size="sm" variant="outline" className="text-[11px] h-8 px-3 gap-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={() => deleteRole.mutate(role.id)}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ────────── Integrations ────────── */}
        <TabsContent value="integrations" className="mt-5 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 mb-2">
            <h3 className="text-[14px] font-semibold text-foreground mb-1">AI Data Sources</h3>
            <p className="text-[12px] text-muted-foreground">
              StockSeer connects to external data sources to improve forecast accuracy. Each integration feeds real-world signals into the AI models.
            </p>
          </div>
          <div className="space-y-3">
            {integrations.map((integration: any, i: number) => (
              <motion.div key={integration.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`bg-card border rounded-xl p-5 ${integration.status === "connected" ? "border-border" : "border-dashed border-border"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">{integration.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[14px] font-medium text-foreground">{integration.name}</h4>
                      {integration.status === "connected" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Connected</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Not Connected</span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mb-3">{integration.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                      <div><span className="text-muted-foreground block mb-1">Provider</span><span className="text-foreground">{integration.provider}</span></div>
                      <div><span className="text-muted-foreground block mb-1">Data Points</span><span className="text-foreground">{integration.dataPoints}</span></div>
                      <div><span className="text-muted-foreground block mb-1">Impact</span><span className={integration.status === "connected" ? "text-success" : "text-muted-foreground"}>{integration.impact}</span></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {integration.status === "connected" ? (
                      <>
                        <div className="text-[10px] text-muted-foreground text-right">Last sync: {integration.lastSync}</div>
                        <div className="flex gap-1.5">
                          <button className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors" onClick={() => refreshIntegration.mutate(integration.id)}><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
                          <button className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors" onClick={() => disconnectIntegration.mutate(integration.id)}><ExternalLink className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        </div>
                      </>
                    ) : (
                      <Button size="sm" className="text-[12px]" onClick={() => connectIntegration.mutate(integration.id)}>Connect</Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ────────── Role Editor Dialog ────────── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{editingRole?.isNew ? "Create New Role" : `Edit Role — ${editingRole?.name}`}</DialogTitle>
            <DialogDescription className="text-[12px]">Configure role name and assign permissions by checking the boxes below.</DialogDescription>
          </DialogHeader>

          {editingRole && (
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">Role Name</label>
                  <Input value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} placeholder="e.g. Department Lead" className="text-[13px]" />
                </div>
                <div>
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">Description</label>
                  <Input value={editingRole.description} onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })} placeholder="What can this role do?" className="text-[13px]" />
                </div>
              </div>

              <div>
                <h4 className="text-[13px] font-semibold text-foreground mb-3">Permissions</h4>
                <div className="space-y-4">
                  {permissionGroups.map((group) => {
                    const groupKeys = group.permissions.map((p) => p.key);
                    const checkedCount = groupKeys.filter((k) => editingRole.permissions.includes(k)).length;
                    const allChecked = checkedCount === groupKeys.length;
                    const someChecked = checkedCount > 0 && !allChecked;

                    return (
                      <div key={group.group} className="rounded-lg border border-border overflow-hidden">
                        <button
                          onClick={() => toggleGroupAll(group)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <Checkbox checked={allChecked} className={someChecked ? "opacity-60" : ""} />
                          <span className="text-[13px] font-medium text-foreground flex-1">{group.group}</span>
                          <span className="text-[11px] text-muted-foreground">{checkedCount}/{groupKeys.length}</span>
                        </button>
                        <div className="px-4 py-2 space-y-1">
                          {group.permissions.map((perm) => (
                            <label key={perm.key} className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/30 cursor-pointer transition-colors">
                              <Checkbox
                                checked={editingRole.permissions.includes(perm.key)}
                                onCheckedChange={() => togglePermission(perm.key)}
                              />
                              <span className="text-[12px] text-foreground">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-[12px]" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button size="sm" className="text-[12px] gap-1.5" onClick={saveRole}><Check className="w-3.5 h-3.5" /> Save Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

/* ── small field helper ── */
function Field({ label, value, onChange, icon, disabled }: { label: string; value: string; onChange: (v: string) => void; icon: ReactNode; disabled?: boolean }) {
  return (
    <div>
      <label className="text-[12px] text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className="pl-9 text-[13px]" />
      </div>
    </div>
  );
}

export default Settings;
