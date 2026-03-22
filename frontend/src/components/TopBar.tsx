import { Bell, Search } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

const TopBar = ({ title, subtitle }: TopBarProps) => (
  <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
    <div className="flex items-center gap-4">
      <h2 className="text-[15px] font-display font-semibold text-foreground">{title}</h2>
      {subtitle && <span className="text-[11px] text-muted-foreground font-mono-data">{subtitle}</span>}
    </div>
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search products, categories..."
          className="bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
        Sep 1 – Sep 30, 2024
      </button>
      <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-warning" />
      </button>
    </div>
  </header>
);

export default TopBar;
