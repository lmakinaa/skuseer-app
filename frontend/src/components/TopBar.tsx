import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useTopBarContext, useTopBarSearch } from "@/hooks/useApi";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

const TopBar = ({ title, subtitle }: TopBarProps) => {
  const navigate = useNavigate();
  const { data: topBarContext } = useTopBarContext();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchValue(searchValue), 250);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const { data: searchResults = [], isFetching } = useTopBarSearch(debouncedSearchValue);

  const showSearchResults = debouncedSearchValue.trim().length > 1;

  const searchStatus = useMemo(() => {
    if (!showSearchResults) return "Search products, categories, or forecast runs";
    if (isFetching) return "Searching...";
    if (!searchResults.length) return "No results found";
    return `${searchResults.length} result${searchResults.length === 1 ? "" : "s"}`;
  }, [isFetching, searchResults.length, showSearchResults]);

  return (
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
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search products, categories..."
            className="bg-secondary border border-border rounded-lg pl-8 pr-3 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 w-72 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {showSearchResults && (
            <div className="absolute right-0 mt-2 w-[22rem] rounded-xl border border-border bg-card shadow-lg overflow-hidden z-20">
              <div className="px-3 py-2 border-b border-border text-[11px] text-muted-foreground">
                {searchStatus}
              </div>
              <div className="max-h-80 overflow-auto">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-accent/60 transition-colors border-b border-border last:border-b-0"
                    onClick={() => {
                      navigate(result.path);
                      setSearchValue("");
                      setDebouncedSearchValue("");
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-medium text-foreground truncate">{result.title}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                        {result.type.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">{result.subtitle}</div>
                  </button>
                ))}
                {!isFetching && !searchResults.length && (
                  <div className="px-3 py-4 text-[11px] text-muted-foreground">No matches for “{debouncedSearchValue.trim()}”.</div>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          title={topBarContext ? `${topBarContext.dateLabel} · ${topBarContext.timezone}` : undefined}
        >
          {topBarContext?.rangeLabel ?? "Loading date..."}
        </button>
        {/* Notification bell reserved for future support. */}
      </div>
    </header>
  );
};

export default TopBar;
