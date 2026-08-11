/** Events & Training (§13/§14).
 *
 * Events carry real schema.org dates, so this is an upcoming-first calendar
 * rather than a reverse-chronological feed — the only ordering that makes sense
 * for something you might attend. Past events are kept but demoted.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ExternalLink, GraduationCap, MapPin } from "lucide-react";

import { ItemDetailDrawer } from "../components/items/ItemDetailDrawer";
import { ItemRow } from "../components/items/ItemRow";
import { PageHeader } from "../components/layout/PageHeader";
import { MicroPill } from "../components/ui/Badge";
import { CardSkeleton, EmptyState, ErrorState } from "../components/ui/States";
import { useItems } from "../lib/api";
import { T } from "../lib/tokens";
import type { ItemOut } from "../lib/types";

const MONTH = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });

function EventCard({ item, past = false }: { item: ItemOut; past?: boolean }) {
  const ev = item.event;
  const start = ev?.start ? new Date(ev.start) : null;
  const end = ev?.end ? new Date(ev.end) : null;
  const sameDay = start && end && start.toDateString() === end.toDateString();

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`card hover-card flex gap-4 p-4 ${past ? "opacity-60" : ""}`}
    >
      {start && (
        <span
          aria-hidden
          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-ctl border border-bd-strong bg-bg-raised"
        >
          <span className="font-mono text-[10px] uppercase tracking-wider text-tx-muted">
            {start.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="font-mono text-lg font-semibold leading-none text-tx-primary">
            {start.getDate()}
          </span>
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-tx-primary">{item.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tx-secondary">
          {start && (
            <span className="font-mono">
              {start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {end && !sameDay &&
                ` – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </span>
          )}
          {ev?.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="h-3 w-3 text-tx-muted" />
              {ev.location}
            </span>
          )}
          {ev?.organizer && <MicroPill>{ev.organizer}</MicroPill>}
        </span>
        {item.excerpt && (
          <span className="mt-1.5 line-clamp-2 block text-xs text-tx-muted">{item.excerpt}</span>
        )}
        <span className="mt-1.5 flex items-center gap-1 text-[10.5px] text-tx-muted">
          via {item.source_name}
          <ExternalLink aria-hidden className="h-3 w-3" />
        </span>
      </span>
    </a>
  );
}

export default function Events() {
  const events = useItems({ category: "event", sort: "newest", limit: 60 });
  const training = useItems({ category: "training", sort: "newest", limit: 15 });
  const [openItem, setOpenItem] = useState<ItemOut | null>(null);

  const { upcoming, past } = useMemo(() => {
    const rows = (events.data?.items ?? []).filter((i) => i.event?.start);
    const now = Date.now();
    const byStart = (a: ItemOut, b: ItemOut) =>
      new Date(a.event!.start!).getTime() - new Date(b.event!.start!).getTime();
    return {
      upcoming: rows.filter((i) => new Date(i.event!.end ?? i.event!.start!).getTime() >= now).sort(byStart),
      past: rows.filter((i) => new Date(i.event!.end ?? i.event!.start!).getTime() < now).sort((a, b) => byStart(b, a)),
    };
  }, [events.data]);

  const grouped = useMemo(() => {
    const map = new Map<string, ItemOut[]>();
    upcoming.forEach((i) => {
      const key = MONTH(i.event!.start!);
      map.set(key, [...(map.get(key) ?? []), i]);
    });
    return [...map.entries()];
  }, [upcoming]);

  return (
    <>
      <PageHeader
        title="Events & Training"
        detail="Upcoming AI, security, and governance events with real dates from published event data."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {events.isPending ? (
            <div className="card"><CardSkeleton rows={4} /></div>
          ) : events.isError ? (
            <div className="card"><ErrorState detail={String(events.error)} onRetry={() => events.refetch()} /></div>
          ) : upcoming.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No upcoming events"
                detail="Run ingestion from Settings, or add an event source that publishes schema.org event data."
                action={<Link to="/settings" className="text-xs text-accent hover:underline">Open Settings</Link>}
              />
            </div>
          ) : (
            grouped.map(([month, rows]) => (
              <section key={month} className="mb-5">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-tx-primary">
                  <span aria-hidden className="head-tick" style={{ background: T.positive }} />
                  <CalendarDays aria-hidden className="h-4 w-4 text-tx-muted" />
                  {month}
                  <span className="font-mono text-meta text-tx-muted">{rows.length}</span>
                </h2>
                <div className="space-y-2.5">
                  {rows.map((item) => <EventCard key={item.id} item={item} />)}
                </div>
              </section>
            ))
          )}

          {past.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-tx-muted hover:text-tx-secondary">
                {past.length} past event{past.length === 1 ? "" : "s"} in the catalogue
              </summary>
              <div className="mt-2.5 space-y-2.5">
                {past.slice(0, 10).map((item) => <EventCard key={item.id} item={item} past />)}
              </div>
            </details>
          )}
        </div>

        <div className="space-y-4">
          <section className="card">
            <header className="flex items-center justify-between border-b border-bd-subtle px-4 py-2.5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-tx-primary">
                <span aria-hidden className="head-tick" style={{ background: T.info }} />
                <GraduationCap aria-hidden className="h-4 w-4 text-tx-muted" />
                Training & certifications
              </h2>
              {training.data && (
                <span className="font-mono text-meta text-tx-muted">{training.data.total}</span>
              )}
            </header>
            {training.isPending ? (
              <CardSkeleton rows={2} />
            ) : training.isError ? (
              <ErrorState detail={String(training.error)} onRetry={() => training.refetch()} />
            ) : (training.data?.items.length ?? 0) === 0 ? (
              <EmptyState
                title="No training or certifications tracked"
                detail="No monitored source currently publishes AI governance credentials. Add a professional body or training provider feed to populate this."
                action={<Link to="/settings" className="text-xs text-accent hover:underline">Add a source</Link>}
              />
            ) : (
              training.data.items.map((item) => (
                <ItemRow key={item.id} item={item} onOpen={setOpenItem} />
              ))
            )}
          </section>

          <div className="rounded-card border border-bd-subtle bg-bg-surface/60 px-4 py-3 text-xs leading-relaxed text-tx-secondary">
            <span className="font-medium text-tx-primary">About this coverage.</span> Events come
            from sources that publish machine-readable event data, so the catalogue is only as
            broad as those sources — it spans AI, developer, and security conferences rather than
            AI governance exclusively. Certifications have no equivalent open source yet.
          </div>
        </div>
      </div>

      <ItemDetailDrawer item={openItem} onClose={() => setOpenItem(null)} />
    </>
  );
}
