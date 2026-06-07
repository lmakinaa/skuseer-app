import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Package, TrendingUp, FileText, Settings, HelpCircle, LogOut, Plus, ChevronDown, Building2, Check } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import AddProductDialog from "@/components/AddProductDialog";
import { useTenant } from "@/auth/TenantContext";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", path: "/", quickAdd: false },
  { icon: Package, label: "Products", path: "/products", quickAdd: true },
  { icon: TrendingUp, label: "Forecasts", path: "/forecasts", quickAdd: false },
  // { icon: Megaphone, label: "Promotions", path: "/promotions", quickAdd: false },
  { icon: FileText, label: "Reports", path: "/reports", quickAdd: false },
];

const BOTTOM_ITEMS = [
  { icon: HelpCircle, label: "Help Center", path: "#" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { currentTenant, tenants, switchTenant, user } = useTenant();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const tenantMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (tenantMenuRef.current && !tenantMenuRef.current.contains(event.target as Node)) {
        setShowTenantMenu(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentTenantInitials = useMemo(() => {
    if (!currentTenant?.tenantName) return "ST";
    return currentTenant.tenantName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [currentTenant?.tenantName]);

  const handleSwitchTenant = (tenantId: string) => {
    switchTenant(tenantId);
    setShowTenantMenu(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem("stockseer_tenant_id");
    setShowTenantMenu(false);
    try {
      await auth.signoutRedirect();
    } catch {
      window.location.assign("/");
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <aside className="w-[230px] h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-foreground tracking-tight">SKUSeer</h1>
              <span className="text-[10px] text-muted-foreground">Demand Intelligence</span>
            </div>
          </div>
        </div>

        {/* Store selector */}
        <div className="px-3 py-3 border-b border-border relative" ref={tenantMenuRef}>
          <button
            onClick={() => setShowTenantMenu((value) => !value)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-secondary border border-border text-[12px] hover:bg-accent transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
              {currentTenantInitials}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="text-foreground font-medium truncate">{currentTenant?.tenantName ?? "Select store"}</div>
              <div className="text-muted-foreground text-[10px] truncate">{currentTenant?.roleName ?? "Choose a store to continue"}</div>
            </div>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${showTenantMenu ? "rotate-180" : ""}`} />
          </button>

          {showTenantMenu && (
            <div className="absolute left-3 right-3 top-[calc(100%-0.25rem)] mt-2 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-30">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Stores</div>
              </div>
              <div className="max-h-52 overflow-auto py-1">
                {tenants.map((tenant) => {
                  const isActive = tenant.tenantId === currentTenant?.tenantId;
                  return (
                    <button
                      key={tenant.tenantId}
                      onClick={() => handleSwitchTenant(tenant.tenantId)}
                      className={`w-full px-3 py-2 flex items-center gap-2 text-left hover:bg-accent transition-colors ${isActive ? "bg-primary/5" : ""}`}
                    >
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {tenant.tenantName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-medium text-foreground truncate">{tenant.tenantName}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{tenant.roleName}</div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border p-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <div key={item.label} className="relative"
              onMouseEnter={() => setHoveredItem(item.label)}
              onMouseLeave={() => setHoveredItem(null)}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                  isActive(item.path)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
              {item.quickAdd && hoveredItem === item.label && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAddProduct(true); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                  title="Add new product"
                >
                  <Plus className="w-3 h-3 text-primary" />
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-2 border-t border-border space-y-0.5">
          {BOTTOM_ITEMS.map(item => (
            <button key={item.label} onClick={() => item.path !== "#" && navigate(item.path)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                isActive(item.path) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* User */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary">
              {(user?.fullName ?? user?.email ?? "M").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-foreground font-medium truncate">{user?.fullName ?? user?.email ?? "Signed in user"}</div>
              <div className="text-[10px] text-muted-foreground">{currentTenant?.roleName ?? "No store selected"}</div>
            </div>
            <button onClick={handleLogout} className="p-1 rounded-md hover:bg-accent transition-colors" title="Log out">
              <LogOut className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      </aside>

      <AddProductDialog open={showAddProduct} onClose={() => setShowAddProduct(false)} onAdd={() => { navigate("/products"); }} categories={[]} />
    </>
  );
};

export default Sidebar;
