/**
 * Crawl concurrency + per-source time budget (OPT-PROFILE-2026-10-02 win #1).
 *
 * - `runWithBudget(id, fn)` runs one source under an AbortController. The source gets `ctx.fetch`
 *   (global fetch bound to the budget signal) and `ctx.signal`. When the budget expires the signal
 *   aborts every in-flight request and the call resolves `{ status: "timeout" }` at the budget even
 *   if the source ignores the signal (e.g. sleeping in its own throttle). It never rejects.
 * - `runConcurrent(tasks)` starts the tasks together (Promise.allSettled), optionally capped, and
 *   returns results in TASK order — never arrival order — so merges stay deterministic.
 *
 * Each source keeps its own throttle/politeness (module-level `lastRequestAt`), cache and pause
 * rules (OpenAlex source-state.json); this file only decides when the crawl stops waiting.
 */

/** arXiv Atom: 3 of 15 crawls took 102–164 s for 4–12 rows with no timeout. */
export const ARXIV_BUDGET_MS = 20_000;
/** Everything else, unless listed below. Normal maxima in 41 logged crawls were ≤ 11 s. */
export const DEFAULT_SOURCE_BUDGET_MS = 25_000;
/**
 * Per-source budgets. lab RSS (9 feeds × 2 s throttle) normally takes 18–19 s on a cache refresh and
 * HN (rotating queries × 2 s throttle) 8–9 s with one 25.8 s outlier, so both get 30 s.
 */
export const SOURCE_BUDGET_MS: Readonly<Record<string, number>> = {
  hf: DEFAULT_SOURCE_BUDGET_MS,
  arxiv: ARXIV_BUDGET_MS,
  openalex: DEFAULT_SOURCE_BUDGET_MS,
  crossref: DEFAULT_SOURCE_BUDGET_MS,
  hn: 30_000,
  rss_labs: 30_000,
  rss_security: DEFAULT_SOURCE_BUDGET_MS,
  gnews: DEFAULT_SOURCE_BUDGET_MS,
  github: DEFAULT_SOURCE_BUDGET_MS,
  wikidata: DEFAULT_SOURCE_BUDGET_MS,
};

export function budgetFor(id: string): number {
  return SOURCE_BUDGET_MS[id] ?? DEFAULT_SOURCE_BUDGET_MS;
}

export class SourceTimeoutError extends Error {
  readonly source: string;
  readonly budgetMs: number;
  constructor(source: string, budgetMs: number) {
    super(`timeout after ${budgetMs}ms budget`);
    this.name = "SourceTimeoutError";
    this.source = source;
    this.budgetMs = budgetMs;
  }
}

/** `fetch` that always carries `signal` (merged with any per-call signal); fails fast once aborted. */
export function boundFetch(signal: AbortSignal, base?: typeof fetch): typeof fetch {
  const f = (input: RequestInfo | URL, init?: RequestInit) => {
    if (signal.aborted) return Promise.reject(signal.reason ?? new Error("aborted"));
    const merged = init?.signal ? AbortSignal.any([init.signal, signal]) : signal;
    return (base ?? globalThis.fetch)(input, { ...init, signal: merged });
  };
  return f as typeof fetch;
}

/** Sleep that rejects as soon as `signal` aborts (for source-internal throttles/backoffs). */
export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (!signal) return new Promise((r) => setTimeout(r, ms));
  if (signal.aborted) return Promise.reject(signal.reason ?? new Error("aborted"));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(signal.reason ?? new Error("aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export type BudgetCtx = {
  id: string;
  signal: AbortSignal;
  /** Global fetch bound to the budget signal — pass as the source's `fetchImpl`. */
  fetch: typeof fetch;
  budgetMs: number;
};

export type SourceRunStatus = "done" | "timeout" | "error";

export type SourceRun<T> = {
  id: string;
  status: SourceRunStatus;
  /** Present when status === "done". */
  value?: T;
  /** Present when status is "timeout" | "error". */
  error?: string;
  duration_ms: number;
  budget_ms: number;
};

/** Schedules `cb` after `ms`; returns a cancel fn. Injectable so tests can fire budgets instantly. */
export type BudgetTimer = (ms: number, cb: () => void) => () => void;

const realTimer: BudgetTimer = (ms, cb) => {
  const t = setTimeout(cb, ms);
  return () => clearTimeout(t);
};

export type RunWithBudgetOpts = {
  budgetMs?: number;
  timer?: BudgetTimer;
  now?: () => number;
  /** Underlying fetch for ctx.fetch (tests). Defaults to globalThis.fetch at call time. */
  baseFetch?: typeof fetch;
};

export async function runWithBudget<T>(
  id: string,
  fn: (ctx: BudgetCtx) => Promise<T>,
  opts: RunWithBudgetOpts = {},
): Promise<SourceRun<T>> {
  const budget = Math.max(1, Math.round(opts.budgetMs ?? budgetFor(id)));
  const now = opts.now ?? (() => performance.now());
  const t0 = now();
  const ctrl = new AbortController();
  const ctx: BudgetCtx = { id, signal: ctrl.signal, fetch: boundFetch(ctrl.signal, opts.baseFetch), budgetMs: budget };
  let cancel: () => void = () => {};
  const expired = new Promise<{ kind: "timeout" }>((resolve) => {
    cancel = (opts.timer ?? realTimer)(budget, () => resolve({ kind: "timeout" }));
  });
  const work = Promise.resolve()
    .then(() => fn(ctx))
    .then(
      (value) => ({ kind: "done" as const, value }),
      (error: unknown) => ({ kind: "error" as const, error }),
    );
  try {
    const r = await Promise.race([work, expired]);
    const duration_ms = Math.max(0, Math.round(now() - t0));
    if (r.kind === "timeout") {
      const err = new SourceTimeoutError(id, budget);
      ctrl.abort(err);
      return { id, status: "timeout", error: err.message, duration_ms, budget_ms: budget };
    }
    if (r.kind === "error") {
      return { id, status: "error", error: String(r.error), duration_ms, budget_ms: budget };
    }
    return { id, status: "done", value: r.value, duration_ms, budget_ms: budget };
  } finally {
    cancel();
  }
}

type Task = () => Promise<unknown>;
type Settled<T extends readonly Task[]> = { -readonly [K in keyof T]: PromiseSettledResult<Awaited<ReturnType<T[K]>>> };

/**
 * Start tasks concurrently (≤ `concurrency` at once; default all) and wait for every one via
 * Promise.allSettled. Result i always belongs to task i, whatever order they finish in.
 */
export async function runConcurrent<const T extends readonly Task[]>(
  tasks: T,
  opts: { concurrency?: number } = {},
): Promise<Settled<T>> {
  const limit = Math.max(1, Math.floor(opts.concurrency ?? tasks.length) || 1);
  let active = 0;
  const waiting: (() => void)[] = [];
  const acquire = (): Promise<void> => {
    if (active < limit) {
      active += 1;
      return Promise.resolve();
    }
    return new Promise((r) => waiting.push(() => r()));
  };
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active -= 1;
  };
  const wrapped = tasks.map(async (t) => {
    await acquire();
    try {
      return await t();
    } finally {
      release();
    }
  });
  return (await Promise.allSettled(wrapped)) as Settled<T>;
}
