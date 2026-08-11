/** Events & Training (§13/§14).
 *
 * Coverage note: unlike regulation and incident data, there is no credible free
 * aggregator feed for AI governance conferences and certifications. This page
 * therefore shows what monitored sources actually surface and says so plainly,
 * rather than implying comprehensive coverage.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, GraduationCap } from "lucide-react";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { PageHeader } from "../components/layout/PageHeader";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useItems } from "../lib/api";
import { T } from "../lib/tokens";
import type { ItemOut } from "../lib/types";

function Section({
  title,
  tick,
  icon: Icon,
  query,
  emptyTitle,
  emptyDetail,
  onOpen,
}: {
  title: string;
  tick: string;
  icon: typeof CalendarDays;
  query: ReturnType<typeof useItems>;
  emptyTitle: string;
  emptyDetail: string;
  onOpen: (item: ItemOut) => void;
}) {
  return (
    <section className="card">
      <header className="flex items-center justify-between border-b border-bd-subtle px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-tx-primary">
          <span aria-hidden className="head-tick" style={{ background: tick }} />
          <Icon aria-hidden className="h-4 w-4 text-tx-muted" />
          {title}
        </h2>
        {query.data && (
          <span className="font-mono text-meta text-tx-muted">{query.data.total} tracked</span>
        )}
      </header>
      {query.isPending ? (
        <CardSkeleton rows={3} />
      ) : query.isError ? (
        <ErrorState detail={String(query.error)} onRetry={() => query.refetch()} />
      ) : query.data.items.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          detail={emptyDetail}
          action={
            <Link to="/settings" className="text-xs text-accent hover:underline">
              Add a source in Settings
            </Link>
          }
        />
      ) : (
        query.data.items.map((item) => <ItemRow key={item.id} item={item} onOpen={onOpen} />)
      )}
    </section>
  );
}

export default function Events() {
  const events = useItems({ category: "event", sort: "newest", limit: 15 });
  const training = useItems({ category: "training", sort: "newest", limit: 15 });
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  return (
    <>
      <PageHeader
        title="Events & Training"
        detail="Conferences, webinars, and professional credentials surfaced by your monitored sources."
      />

      <div className="mb-4 rounded-card border border-bd-subtle bg-bg-surface/60 px-4 py-3 text-xs leading-relaxed text-tx-secondary">
        <span className="font-medium text-tx-primary">About this coverage.</span> Regulation,
        standards, and incident data come from authoritative feeds. Events and certifications
        have no equivalent open aggregator, so this page only reflects what your enabled
        sources publish — expect gaps. To improve it, add organizer feeds (professional bodies,
        standards organizations, university programmes) in{" "}
        <Link to="/settings" className="text-accent hover:underline">Settings</Link>.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title="Events & conferences"
          tick={T.positive}
          icon={CalendarDays}
          query={events}
          onOpen={setOpenItem}
          emptyTitle="No events collected yet"
          emptyDetail="None of your enabled sources have published AI governance events recently."
        />
        <Section
          title="Training & certifications"
          tick={T.info}
          icon={GraduationCap}
          query={training}
          onOpen={setOpenItem}
          emptyTitle="No training or certifications collected yet"
          emptyDetail="Add a professional body or training provider feed to populate this."
        />
      </div>

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
