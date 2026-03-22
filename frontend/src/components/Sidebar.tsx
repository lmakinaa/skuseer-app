import { BarChart3, Package, TrendingUp, Megaphone, FileText, Settings, HelpCircle, LogOut, Shield, Users, Building2, ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useTenant } from "../auth/TenantContext";
import { useState, useRef, useEffect } from "react";

const NAV_ITEMS = [
  { icon: BarChart3, label: "Dashboard", path: "/" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: TrendingUp, label: "Forecasts", path: "/forecasts" },
  { icon: Megaphone, label: "Promotions", path: "/promotions" },
  { icon: FileText, label: "Reports", path: "/reports" },
];

const BOTTOM_ITEMS = [
  { icon: HelpCircle, label: "Help Center", path: "#" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const { currentTenant, tenants, user, switchTenant } = useTenant();
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTenantDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const tenantInitials = currentTenant
    ? initials(currentTenant.tenantName)
    : "??";

  const userName = user?.fullName || user?.email || "User";
  const userInitials = initials(userName);
  const roleName = currentTenant?.roleName || "Member";

  return (
    <aside className="w-[230px] h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-display font-bold text-foreground tracking-tight">StockSeer</h1>
            <span className="text-[10px] text-muted-foreground">Demand Intelligence</span>
          </div>
        </div>
      </div>

      {/* Store selector */}
      <div className="px-3 py-3 border-b border-border" ref={dropdownRef}>
        <button
          onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-secondary border border-border text-[12px] hover:bg-accent transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
            {tenantInitials}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-foreground font-medium truncate">
              {currentTenant?.tenantName || "No store selected"}
            </div>
            <div className="text-muted-foreground text-[10px]">{roleName}</div>
          </div>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${tenantDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {tenantDropdownOpen && tenants.length > 1 && (
          <div className="mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {tenants.map(t => (
              <button
                key={t.tenantId}
                onClick={() => {
                  switchTenant(t.tenantId);
                  setTenantDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] hover:bg-accent transition-colors ${
                  t.tenantId === currentTenant?.tenantId ? "bg-primary/5 text-primary" : "text-foreground"
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                  {initials(t.tenantName)}
                </div>
                <span className="truncate">{t.tenantName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
              isActive(item.path)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}

        {/* Tenant Settings */}
        <button
          onClick={() => navigate("/tenant-settings")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
            isActive("/tenant-settings")
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Users className="w-4 h-4" />
          Store Settings
        </button>

        {/* Admin section */}
        {user?.isPlatformAdmin && (
          <>
            <div className="pt-3 pb-1 px-2.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Back Office</span>
            </div>
            <button
              onClick={() => navigate("/admin/tenants")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                isActive("/admin/tenants")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Tenants
            </button>
            <button
              onClick={() => navigate("/admin/users")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
                isActive("/admin/users")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Shield className="w-4 h-4" />
              Users
            </button>
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-2 border-t border-border space-y-0.5">
        {BOTTOM_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => item.path !== "#" && navigate(item.path)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
              isActive(item.path)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-foreground font-medium truncate">{userName}</div>
            <div className="text-[10px] text-muted-foreground">{roleName}</div>
          </div>
          <LogOut
            className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => auth.signoutRedirect()}
          />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
