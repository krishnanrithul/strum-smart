import { describe, it, expect } from "vitest";
import { getStatusColor, getCategoryBadge } from "@/lib/badges";

describe("getCategoryBadge", () => {
  it("gives each category its own colour", () => {
    const technical = getCategoryBadge("Technical");
    const warmup = getCategoryBadge("Warmup");
    const repertoire = getCategoryBadge("Repertoire");

    expect(new Set([technical, warmup, repertoire]).size).toBe(3);
  });

  it("falls back to the muted style for anything unknown", () => {
    expect(getCategoryBadge("Nonsense")).toBe(
      "bg-muted text-muted-foreground border-border",
    );
  });
});

describe("getStatusColor", () => {
  it("styles an in-progress exercise distinctly", () => {
    expect(getStatusColor("In Progress")).not.toBe(getStatusColor("New"));
  });

  it("falls back to the muted style for anything unknown", () => {
    expect(getStatusColor("Nonsense")).toBe(
      "bg-muted text-muted-foreground border-border",
    );
  });

  // The Exercise status union is New | In Progress | Maintenance | Completed.
  // "Mastered" is not one of them, so that branch is unreachable and
  // "Completed" quietly renders as muted. Flagged, not fixed.
  it("documents that Completed has no style of its own", () => {
    expect(getStatusColor("Completed")).toBe(
      "bg-muted text-muted-foreground border-border",
    );
  });
});
