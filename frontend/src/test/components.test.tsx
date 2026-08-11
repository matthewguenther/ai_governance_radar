/** Primitive render tests: every badge/state renders with accessible text (never color-only). */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import {
  ConfidenceBadge,
  DemoBadge,
  FactStatusBadge,
  ImpactBadge,
  SeverityBadge,
  StatusPill,
  TierBadge,
} from "../components/ui/Badge";
import { KpiCard } from "../components/ui/KpiCard";
import { EmptyState, ErrorState } from "../components/ui/States";
import { ItemRow } from "../components/items/ItemRow";
import type { ItemOut } from "../lib/types";

describe("badges carry text, not just color", () => {
  it("ImpactBadge shows label + score", () => {
    render(<ImpactBadge score={85} />);
    expect(screen.getByText(/High impact 85/)).toBeInTheDocument();
  });
  it("SeverityBadge shows severity word", () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText("critical")).toBeInTheDocument();
  });
  it("ConfidenceBadge distinct from impact", () => {
    render(<ConfidenceBadge confidence="low" />);
    expect(screen.getByText(/Conf low/)).toBeInTheDocument();
  });
  it("TierBadge has descriptive title", () => {
    render(<TierBadge tier={1} />);
    expect(screen.getByTitle(/primary authoritative/)).toBeInTheDocument();
  });
  it("StatusPill renders regulation status", () => {
    render(<StatusPill status="public_comment" kind="standard" />);
    expect(screen.getByText("public comment")).toBeInTheDocument();
  });
  it("DemoBadge marks demo data explicitly", () => {
    render(<DemoBadge show={true} />);
    expect(screen.getByText("DEMO DATA")).toBeInTheDocument();
  });
  it("FactStatusBadge renders nothing when absent", () => {
    const { container } = render(<FactStatusBadge status={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("states", () => {
  it("EmptyState shows title + detail + action", () => {
    render(<EmptyState title="Nothing here" detail="Adjust filters" action={<button>Clear</button>} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });
  it("ErrorState is an alert with retry", () => {
    const retry = vi.fn();
    render(<ErrorState detail="HTTP 500" onRetry={retry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    screen.getByRole("button", { name: /retry/i }).click();
    expect(retry).toHaveBeenCalled();
  });
});

const item: ItemOut = {
  id: 1,
  url: "https://example.org/a",
  title: "Colorado AI Act guidance",
  excerpt: "Guidance released.",
  published_at: new Date().toISOString(),
  first_seen_at: new Date().toISOString(),
  last_seen_at: new Date().toISOString(),
  categories: ["regulation"],
  jurisdiction_code: "US-CO",
  change_type: "new",
  impact_score: 72,
  impact_factors: [{ factor: "Category: regulation", points: 30 }],
  confidence: "high",
  fact_status: null,
  cluster_id: null,
  is_demo: true,
  source_name: "Test Source",
  source_tier: 1,
  entities: [],
  cluster_size: 3,
};

describe("ItemRow", () => {
  it("renders avatar, impact ring, source, cluster count, and DEMO flag", () => {
    const onOpen = vi.fn();
    render(<MemoryRouter><ItemRow item={item} onOpen={onOpen} /></MemoryRouter>);
    expect(screen.getByText("Colorado AI Act guidance")).toBeInTheDocument();
    // impact ring: accessible label + visible score text (never color-only)
    expect(screen.getByRole("img", { name: /impact score 72/i })).toBeInTheDocument();
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("Test Source")).toBeInTheDocument();
    expect(screen.getByText(/3 src/)).toBeInTheDocument();
    expect(screen.getByText("DEMO DATA")).toBeInTheDocument();
    // jurisdiction flag chip renders for US-CO
    expect(screen.getAllByTitle("US-CO").length).toBeGreaterThan(0);
    screen.getByRole("button").click();
    expect(onOpen).toHaveBeenCalledWith(item);
  });
});

describe("KpiCard", () => {
  it("links to its filtered view", () => {
    render(<MemoryRouter><KpiCard label="High impact" value={3} to="/items?min_impact=70" /></MemoryRouter>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/items?min_impact=70");
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
