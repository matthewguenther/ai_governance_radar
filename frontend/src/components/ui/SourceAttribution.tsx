/** Required on every item view (§32): source, pub date, retrieval date, original URL. */

import { ExternalLink } from "lucide-react";

import { shortDate } from "../../lib/format";
import { TierBadge } from "./Badge";

export function SourceAttribution({
  sourceName,
  tier,
  publishedAt,
  retrievedAt,
  url,
}: {
  sourceName: string;
  tier?: number;
  publishedAt: string | null;
  retrievedAt: string;
  url: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tx-muted">
      <span className="inline-flex items-center gap-1.5 text-tx-secondary">
        {tier !== undefined && <TierBadge tier={tier} />}
        {sourceName}
      </span>
      <span>Published {shortDate(publishedAt)}</span>
      <span>Retrieved {shortDate(retrievedAt)}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-accent hover:underline"
      >
        Original source <ExternalLink aria-hidden className="h-3 w-3" />
      </a>
    </div>
  );
}
