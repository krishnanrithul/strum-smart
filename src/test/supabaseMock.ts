import { vi } from "vitest";

export interface QueryResult {
  data?: unknown;
  error?: unknown;
}

export interface RecordedCall {
  table: string;
  method: string;
  args: unknown[];
}

// Every builder method supabase-js exposes that this codebase chains off.
const CHAIN_METHODS = [
  "select", "insert", "update", "upsert", "delete",
  "eq", "neq", "gt", "gte", "lt", "lte",
  "like", "ilike", "is", "in", "contains",
  "order", "limit", "range", "filter", "match",
];

/**
 * A stand-in for the supabase client.
 *
 * Each `.from(table)` call consumes one result: the next queued result for
 * that table, or the table's default. That matters because some
 * StorageService methods issue two queries against the same table (read then
 * write), and the test needs to control each one independently.
 *
 * The returned chain is thenable, so queries that end without `.single()`
 * resolve correctly when awaited.
 */
export function createSupabaseMock() {
  const state = {
    user: { id: "user-a" } as { id: string } | null,
    defaults: new Map<string, QueryResult>(),
    queues: new Map<string, QueryResult[]>(),
    calls: [] as RecordedCall[],
  };

  const takeResult = (table: string): QueryResult => {
    const queued = state.queues.get(table);
    if (queued && queued.length > 0) return queued.shift()!;
    return state.defaults.get(table) ?? { data: [], error: null };
  };

  const makeChain = (table: string) => {
    // Resolved once per .from() — one from() call is one query.
    const result = takeResult(table);
    const chain: Record<string, unknown> = {};

    for (const method of CHAIN_METHODS) {
      chain[method] = vi.fn((...args: unknown[]) => {
        state.calls.push({ table, method, args });
        return chain;
      });
    }

    const single = vi.fn(() => {
      state.calls.push({ table, method: "single", args: [] });
      return Promise.resolve(result);
    });
    chain.single = single;
    chain.maybeSingle = single;

    chain.then = (onFulfilled?: unknown, onRejected?: unknown) =>
      Promise.resolve(result).then(
        onFulfilled as never,
        onRejected as never,
      );

    return chain;
  };

  const supabase = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: state.user },
        error: null,
      })),
      getSession: vi.fn(async () => ({
        data: { session: null },
        error: null,
      })),
    },
    from: vi.fn((table: string) => makeChain(table)),
  };

  return Object.assign(supabase, {
    /** Set the signed-in user, or null to simulate signed-out. */
    __setUser(user: { id: string } | null) {
      state.user = user;
    },
    /** Result returned for every unqueued query against `table`. */
    __setTable(table: string, result: QueryResult) {
      state.defaults.set(table, result);
    },
    /** Results returned for the next N queries against `table`, in order. */
    __queue(table: string, results: QueryResult[]) {
      const existing = state.queues.get(table) ?? [];
      state.queues.set(table, [...existing, ...results]);
    },
    __calls: () => state.calls,
    __callsFor: (table: string, method: string) =>
      state.calls.filter((c) => c.table === table && c.method === method),
    /** Payload passed to the most recent insert/update on `table`. */
    __lastPayload(table: string, method: "insert" | "update") {
      const calls = state.calls.filter(
        (c) => c.table === table && c.method === method,
      );
      return calls.length ? calls[calls.length - 1].args[0] : undefined;
    },
    __reset() {
      state.user = { id: "user-a" };
      state.defaults.clear();
      state.queues.clear();
      state.calls.length = 0;
      supabase.auth.getUser.mockClear();
      supabase.from.mockClear();
    },
  });
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>;
