/** Explicit 404 (QA-3) — never silently render the wrong page under a bogus URL. */

import { Link, useLocation } from "react-router-dom";
import { RadarIcon } from "lucide-react";

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div className="card mx-auto mt-16 max-w-md p-8 text-center">
      <RadarIcon aria-hidden className="mx-auto h-8 w-8 text-tx-muted" />
      <h1 className="mt-3 text-lg font-semibold text-tx-primary">Nothing on this frequency</h1>
      <p className="mt-1 break-all font-mono text-xs text-tx-muted">{pathname}</p>
      <p className="mt-2 text-sm text-tx-secondary">That page doesn't exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-accent hover:underline">
        Back to the dashboard
      </Link>
    </div>
  );
}
