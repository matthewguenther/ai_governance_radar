/** App shell: fixed collapsible sidebar (desktop), bottom nav (mobile), global search. */

import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpenCheck,
  ChevronsLeft,
  ChevronsRight,
  Landmark,
  LayoutDashboard,
  Menu,
  Newspaper,
  Radar,
  Search,
  Settings,
  Sunrise,
  X,
} from "lucide-react";
import clsx from "clsx";

import { markVisit, useWatchStatuses } from "../../lib/api";
import { RadarLogo } from "../ui/RadarLogo";

const NAV = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/brief", label: "Morning Brief", icon: Sunrise },
  { to: "/regulatory", label: "Regulatory Radar", icon: Landmark },
  { to: "/standards", label: "Standards", icon: BookOpenCheck },
  { to: "/incidents", label: "Incidents & Risks", icon: AlertTriangle },
  { to: "/items", label: "Intelligence Feed", icon: Newspaper },
  { to: "/watchlist", label: "Watchlist", icon: Radar },
  { to: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = [NAV[1], NAV[0], NAV[6], NAV[4]]; // Brief, Home, Watchlist, Incidents (§56)

function GlobalSearch() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-tx-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search regulations, standards, incidents…"
        aria-label="Search"
        className="w-56 rounded-ctl border border-bd-subtle bg-bg-base py-1.5 pl-8 pr-3 text-xs text-tx-primary placeholder:text-tx-muted focus:border-accent md:w-72"
      />
    </form>
  );
}

export function Shell() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: statuses } = useWatchStatuses();
  const changed = statuses?.filter((s) => s.status !== "NO CHANGE").length ?? 0;

  // Mark visit when the app loads (drives "since your last visit" counts) — after
  // initial queries have had a chance to read the previous timestamp.
  useEffect(() => {
    const t = setTimeout(() => void markVisit().catch(() => undefined), 4000);
    return () => clearTimeout(t);
  }, []);

  const navBody = (isCollapsed: boolean, onNavigate?: () => void) => (
    <nav aria-label="Primary" className="flex flex-col gap-0.5 px-2">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "group relative flex items-center gap-3 rounded-ctl border px-2.5 py-2 text-sm transition-colors",
              isActive
                ? "border-accent/40 bg-accent/10 text-tx-primary"
                : "border-transparent text-tx-secondary hover:bg-bg-raised/60 hover:text-tx-primary",
            )
          }
          title={isCollapsed ? label : undefined}
        >
          <Icon aria-hidden className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="truncate">{label}</span>}
          {!isCollapsed && label === "Watchlist" && changed > 0 && (
            <span className="ml-auto rounded-full bg-sev-critical/15 px-1.5 font-mono text-meta text-sev-critical">
              {changed}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Desktop sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-bd-subtle bg-bg-surface md:flex md:flex-col",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className={clsx("flex items-center gap-2.5 px-4 py-4", collapsed && "justify-center px-2")}>
          <RadarLogo size={collapsed ? 28 : 34} />
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-sm font-semibold text-tx-primary">AI Governance</p>
              <p className="font-mono text-[9.5px] tracking-[0.26em] text-accent">RADAR</p>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto py-2">{navBody(collapsed)}</div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="m-2 flex items-center justify-center rounded-ctl border border-bd-subtle p-1.5 text-tx-muted transition-colors hover:text-tx-primary"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button aria-label="Close navigation" className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-bd-subtle bg-bg-surface pt-4">
            <div className="mb-3 flex items-center justify-between px-4">
              <span className="text-sm font-semibold text-tx-primary">AI Governance Radar</span>
              <button aria-label="Close" onClick={() => setDrawerOpen(false)} className="p-1 text-tx-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            {navBody(false, () => setDrawerOpen(false))}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className={clsx("flex min-h-screen flex-col", collapsed ? "md:pl-16" : "md:pl-60")}>
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-bd-subtle bg-bg-base/95 px-4 py-2.5 backdrop-blur">
          <button
            className="p-1 text-tx-secondary md:hidden"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-tx-muted lg:block">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </span>
            <GlobalSearch />
          </div>
        </header>
        <main className="flex-1 px-4 py-5 pb-20 md:px-6 md:pb-8">
          <Outlet />
        </main>
        <footer className="hidden border-t border-bd-subtle px-6 py-3 text-meta text-tx-muted md:block">
          AI Governance Radar is an information tool, not legal advice. Verify regulatory facts
          against the linked official sources.
        </footer>
      </div>

      {/* Mobile bottom nav (§56) */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-bd-subtle bg-bg-surface md:hidden"
      >
        {MOBILE_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-meta",
                isActive ? "text-accent" : "text-tx-muted",
              )
            }
          >
            <Icon aria-hidden className="h-4 w-4" />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
