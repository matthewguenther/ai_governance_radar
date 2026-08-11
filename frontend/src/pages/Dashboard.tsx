/** Home dashboard (§17): KPI row, Top Developments, heat map, incidents, standards watch. */

import { useState } from "react";
import { Link } from "react-router-dom";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { WorldMap } from "../components/map/WorldMap";
import { PageHeader } from "../components/layout/PageHeader";
import { DemoBadge, SeverityBadge, StatusPill, FactStatusBadge } from "../components/ui/Badge";
import { KpiCard } from "../components/ui/KpiCard";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import {
  useDashboardSummary,
  useIncidents,
  useItems,
  useMapData,
  useStandards,
} from "../lib/api";
import { relativeTime, shortDate } from "../lib/format";
import type { ItemOut } from "../lib/types";

const WINDOW_DAYS = 7;

function Card({
  title,
  linkTo,
  linkLabel,
  children,
}: {
  title: string;
  linkTo?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-bd-subtle px-4 py-2.5">
        <h2 className="meta-label !text-tx-secondary">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="text-xs text-accent hover:underline">
            {linkLabel ?? "View all"}
          </Link>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export default function Dashboard() {
  const summary = useDashboardSummary(WINDOW_DAYS);
  const top = useItems({ min_impact: 50, sort: "impact", limit: 6, collapse_clusters: true });
  const incidents = useIncidents();
  const standards = useStandards();
  const map = useMapData();
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  return (
    <>
      <PageHeader
        title="AI Governance Intelligence"
        detail={`Rolling ${WINDOW_DAYS}-day window · ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`}
      />

      {/* KPI row (§19) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="High impact"
          value={summary.data?.high_impact ?? "—"}
          loading={summary.isPending}
          to="/items?min_impact=70"
          tone="critical"
          sub="changes needing attention"
        />
        <KpiCard
          label="Total changes"
          value={summary.data?.total_changes ?? "—"}
          loading={summary.isPending}
          to="/items"
          sub={`in the last ${WINDOW_DAYS} days`}
        />
        <KpiCard
          label="AI incidents"
          value={summary.data?.new_incidents ?? "—"}
          loading={summary.isPending}
          to="/incidents"
          sub="new incident records"
        />
        <KpiCard
          label="Opportunities"
          value={summary.data?.new_opportunities ?? "—"}
          loading={summary.isPending}
          to="/items?category=training"
          sub="training & events"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-5">
        {/* Top developments (§20) */}
        <div className="xl:col-span-2">
          <Card title="Top Developments" linkTo="/items?min_impact=50">
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
        <div className="xl:col-span-3">
          <Card title="Global Regulatory Activity" linkTo="/regulatory" linkLabel="Open radar">
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

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Incidents card */}
        <Card title="AI Incidents" linkTo="/incidents">
          {incidents.isPending ? (
            <CardSkeleton rows={3} />
          ) : incidents.isError ? (
            <ErrorState detail={String(incidents.error)} onRetry={() => incidents.refetch()} />
          ) : incidents.data.length === 0 ? (
            <EmptyState title="No incident records" />
          ) : (
            <ul>
              {incidents.data.slice(0, 4).map((inc) => (
                <li key={inc.id} className="border-b border-bd-subtle last:border-b-0">
                  <Link
                    to={`/incidents/${inc.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-bg-raised/50"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SeverityBadge severity={inc.severity} />
                      <FactStatusBadge status={inc.fact_status} />
                      <DemoBadge show={inc.is_demo} />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm font-medium text-tx-primary">{inc.title}</p>
                    <p className="mt-1 text-xs text-tx-muted">
                      {inc.category.replace(/_/g, " ")} · {relativeTime(inc.reported_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Standards watch card */}
        <Card title="Standards Watch" linkTo="/standards">
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
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bg-raised/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-tx-primary">{e.name}</p>
                        <p className="mt-0.5 text-xs text-tx-muted">
                          {e.standard?.publisher} ·{" "}
                          {e.standard?.last_updated_at
                            ? `updated ${shortDate(e.standard.last_updated_at)}`
                            : `published ${shortDate(e.standard?.published_at)}`}
                        </p>
                      </div>
                      {e.standard && <StatusPill status={e.standard.status} kind="standard" />}
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
