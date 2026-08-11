/** Home dashboard (§17, approved Direction A rev 2): tinted KPI cards with
 * sparklines, color-tick module headers, avatars/flags, glowing map, incidents,
 * standards watch with donut, regulatory pulse, live feed strip. */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, GraduationCap, ShieldAlert } from "lucide-react";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { WorldMap } from "../components/map/WorldMap";
import { PageHeader } from "../components/layout/PageHeader";
import { StatusPill } from "../components/ui/Badge";
import { Donut } from "../components/ui/charts";
import { FlagChip } from "../components/ui/FlagChip";
import { KpiCard } from "../components/ui/KpiCard";
import { OrgAvatar } from "../components/ui/OrgAvatar";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import {
  useDashboardSummary,
  useItems,
  useMapData,
  useRegulations,
  useStandards,
} from "../lib/api";
import { shortDate } from "../lib/format";
import { T } from "../lib/tokens";
import type { ItemOut } from "../lib/types";

const WINDOW_DAYS = 7;

function Card({
  title,
  tick,
  linkTo,
  linkLabel,
  headRight,
  children,
}: {
  title: string;
  tick: string;
  linkTo?: string;
  linkLabel?: string;
  headRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col">
      <header className="flex items-center justify-between border-b border-bd-subtle px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-tx-primary">
          <span aria-hidden className="head-tick" style={{ background: tick }} />
          {title}
        </h2>
        {headRight ??
          (linkTo && (
            <Link to={linkTo} className="text-xs text-accent hover:underline">
              {linkLabel ?? "View all"}
            </Link>
          ))}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

/** Per-day item counts for KPI sparklines (real data, last n days). */
function sparkSeries(items: ItemOut[], days = 14): number[] {
  const counts = new Array(days).fill(0);
  const now = Date.now();
  items.forEach((i) => {
    const t = new Date(i.published_at ?? i.first_seen_at).getTime();
    const age = Math.floor((now - t) / 86400000);
    if (age >= 0 && age < days) counts[days - 1 - age] += 1;
  });
  return counts;
}

export default function Dashboard() {
  const summary = useDashboardSummary(WINDOW_DAYS);
  const top = useItems({ min_impact: 50, sort: "impact", limit: 5, collapse_clusters: true });
  const feed = useItems({ sort: "newest", limit: 6, collapse_clusters: true });
  // Wider sample purely for the KPI sparklines — six rows is not a trend.
  const activity = useItems({ sort: "newest", limit: 100, collapse_clusters: true });
  const incidentReports = useItems({
    category: "incident", sort: "newest", limit: 4, collapse_clusters: true,
  });
  const standards = useStandards();
  const regulations = useRegulations();
  const map = useMapData();
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  const spark = useMemo(() => sparkSeries(activity.data?.items ?? []), [activity.data]);

  const stdSegments = useMemo(() => {
    const rows = standards.data ?? [];
    const count = (s: string) => rows.filter((e) => e.standard?.status === s).length;
    const known = count("final") + count("updated") + count("draft");
    return [
      { value: count("final"), color: T.positive },
      { value: count("updated"), color: T.high },
      { value: count("draft"), color: T.watch },
      { value: rows.length - known, color: T.txMuted },
    ];
  }, [standards.data]);

  return (
    <>
      <PageHeader
        title="AI Governance Intelligence"
        detail={`Your command center for AI governance, risk, and policy developments · rolling ${WINDOW_DAYS}-day window`}
      />

      {/* KPI row (§19) — tinted cards with sparklines */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <KpiCard
          label="High impact"
          value={summary.data?.high_impact ?? "—"}
          loading={summary.isPending}
          to="/items?min_impact=70"
          tone="critical"
          icon={ShieldAlert}
          spark={spark}
          sub="see what's new"
        />
        <KpiCard
          label="Total changes"
          value={summary.data?.total_changes ?? "—"}
          loading={summary.isPending}
          to="/items"
          tone="accent"
          icon={Activity}
          spark={spark}
          sub={`last ${WINDOW_DAYS} days`}
        />
        <KpiCard
          label="Incident reports"
          value={summary.data?.new_incidents ?? "—"}
          loading={summary.isPending}
          to="/items?category=incident"
          tone="high"
          icon={AlertTriangle}
          spark={spark}
          sub="reported harms & actions"
        />
        <KpiCard
          label="Opportunities"
          value={summary.data?.new_opportunities ?? "—"}
          loading={summary.isPending}
          to="/events"
          tone="positive"
          icon={GraduationCap}
          spark={spark}
          sub="events & training"
        />
      </div>

      <div className="mt-3.5 grid gap-3.5 xl:grid-cols-12">
        {/* Top developments (§20) */}
        <div className="xl:col-span-5">
          <Card title="Top Developments" tick={T.critical} linkTo="/items?min_impact=50">
            {top.isPending ? (
              <CardSkeleton rows={4} />
            ) : top.isError ? (
              <ErrorState detail={String(top.error)} onRetry={() => top.refetch()} />
            ) : top.data.items.length === 0 ? (
              <EmptyState
                title="No high-signal developments"
                detail="Nothing above the impact threshold in this window. Run ingestion or widen the window."
              />
            ) : (
              top.data.items.map((item) => <ItemRow key={item.id} item={item} onOpen={setOpenItem} />)
            )}
          </Card>
        </div>

        {/* Heat map (§21) */}
        <div className="xl:col-span-7">
          <Card title="Global AI Regulatory Heat Map" tick={T.accent} linkTo="/regulatory" linkLabel="Open radar">
            <div className="p-4">
              {map.isPending ? (
                <CardSkeleton rows={4} />
              ) : map.isError ? (
                <ErrorState detail={String(map.error)} onRetry={() => map.refetch()} />
              ) : (
                <WorldMap rows={map.data} />
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-3.5 grid gap-3.5 lg:grid-cols-3">
        {/* Incident reports — newest first: incident signal is only useful if it's current */}
        <Card
          title="AI Incident Reports"
          tick={T.high}
          headRight={
            <Link to="/incidents" className="text-xs text-accent hover:underline">
              All incidents
            </Link>
          }
        >
          {incidentReports.isPending ? (
            <CardSkeleton rows={3} />
          ) : incidentReports.isError ? (
            <ErrorState detail={String(incidentReports.error)} onRetry={() => incidentReports.refetch()} />
          ) : incidentReports.data.items.length === 0 ? (
            <EmptyState
              title="No incident reports collected"
              detail="Enable the AI Incident Database source in Settings to monitor reported AI harms."
            />
          ) : (
            incidentReports.data.items.map((item) => (
              <ItemRow key={item.id} item={item} onOpen={setOpenItem} />
            ))
          )}
        </Card>

        {/* Standards watch card */}
        <Card
          title="Standards Watch"
          tick={T.info}
          headRight={
            <span className="flex items-center gap-2">
              <Donut size={30} stroke={5.5} centerLabel={`${standards.data?.length ?? 0}`} segments={stdSegments} />
              <Link to="/standards" className="text-xs text-accent hover:underline">View all</Link>
            </span>
          }
        >
          {standards.isPending ? (
            <CardSkeleton rows={3} />
          ) : standards.isError ? (
            <ErrorState detail={String(standards.error)} onRetry={() => standards.refetch()} />
          ) : standards.data.length === 0 ? (
            <EmptyState title="No tracked standards" />
          ) : (
            <ul>
              {[...standards.data]
                .sort((a, b) =>
                  (b.standard?.last_updated_at ?? b.standard?.published_at ?? "").localeCompare(
                    a.standard?.last_updated_at ?? a.standard?.published_at ?? "",
                  ),
                )
                .slice(0, 4)
                .map((e) => (
                  <li key={e.slug} className="border-b border-bd-subtle last:border-b-0">
                    <Link
                      to={`/entities/${e.slug}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/5"
                    >
                      <OrgAvatar name={`${e.standard?.publisher ?? ""} ${e.name}`} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-tx-primary">{e.name}</span>
                        <span className="mt-0.5 block font-mono text-[10px] text-tx-muted">
                          {e.standard?.last_updated_at
                            ? `updated ${shortDate(e.standard.last_updated_at)}`
                            : `published ${shortDate(e.standard?.published_at)}`}
                        </span>
                      </span>
                      {e.standard && <StatusPill status={e.standard.status} kind="standard" />}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        {/* Regulatory pulse card */}
        <Card title="Regulatory Pulse" tick={T.emerging} linkTo="/regulatory">
          {regulations.isPending ? (
            <CardSkeleton rows={3} />
          ) : regulations.isError ? (
            <ErrorState detail={String(regulations.error)} onRetry={() => regulations.refetch()} />
          ) : regulations.data.length === 0 ? (
            <EmptyState title="No tracked regulations" />
          ) : (
            <ul>
              {regulations.data.slice(0, 5).map((r) => (
                <li key={r.slug} className="border-b border-bd-subtle last:border-b-0">
                  <Link
                    to={`/entities/${r.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/5"
                  >
                    <FlagChip code={r.jurisdiction_code ?? "GLOBAL"} title={r.jurisdiction_code ?? undefined} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-tx-primary">{r.name}</span>
                      <span className="mt-0.5 block font-mono text-[9.5px] text-tx-muted">
                        {r.jurisdiction_code} · eff. {shortDate(r.regulation?.effective_at)}
                      </span>
                    </span>
                    {r.regulation && <StatusPill status={r.regulation.status} kind="regulation" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Live feed strip */}
      <div className="mt-3.5">
        <Card
          title="Intelligence Feed"
          tick={T.positive}
          headRight={
            <span className="inline-flex items-center gap-2 font-mono text-[10.5px] text-tx-secondary">
              <span aria-hidden className="live-dot" />
              LIVE
              <Link to="/items" className="text-accent hover:underline">
                Open feed
              </Link>
            </span>
          }
        >
          {feed.isPending ? (
            <CardSkeleton rows={3} />
          ) : feed.isError ? (
            <ErrorState detail={String(feed.error)} onRetry={() => feed.refetch()} />
          ) : feed.data.items.length === 0 ? (
            <EmptyState
              title="No collected items yet"
              detail="Run ingestion from Settings to pull the latest from your sources."
            />
          ) : (
            <div className="grid md:grid-cols-2">
              {feed.data.items.map((item) => (
                <ItemRow key={item.id} item={item} onOpen={setOpenItem} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
