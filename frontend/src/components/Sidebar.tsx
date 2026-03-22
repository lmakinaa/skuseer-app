import { BarChart3, Package, TrendingUp, Megaphone, FileText, Settings, HelpCircle, LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

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

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

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
      <div className="px-3 py-3 border-b border-border">
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-secondary border border-border text-[12px] hover:bg-accent transition-colors">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">FM</div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-foreground font-medium truncate">FreshMart #247</div>
            <div className="text-muted-foreground text-[10px]">Brooklyn, NY</div>
          </div>
          <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
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
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary">MR</div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-foreground font-medium truncate">Maria Rodriguez</div>
            <div className="text-[10px] text-muted-foreground">Store Manager</div>
          </div>
          <LogOut className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
