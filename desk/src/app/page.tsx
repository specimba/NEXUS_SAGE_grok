import { Desk } from "@/components/sage/desk";
import { BUILD_META } from "@/lib/build-meta";

// Static export (B1): CURRENT lock + build id are baked in at build (src/data/build-stamp.ts); no request-time fs.

function HardGate({ path, message }: { path: string; message: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="scanline absolute inset-0 opacity-40" />
      <div className="term term-amber relative max-w-xl p-6">
        <p className="font-mono text-kicker uppercase tracking-kicker text-amber">SAGE://HARD-GATE</p>
        <h1 className="mt-3 font-display text-2xl">CURRENT.json required</h1>
        <p className="mt-3 text-sm text-muted">{message}</p>
        <p className="mt-4 font-mono text-kicker text-subtle">{path}</p>
        <p className="mt-4 text-sm text-muted">
          Restore <code className="text-amber">artifacts/sage/CURRENT.json</code> and rebuild. No soft-fallback.
        </p>
      </div>
    </main>
  );
}

export default function Home() {
  // prebuild + next.config.ts already refuse a bad lock; this only guards a hand-edited stamp.
  if (!BUILD_META.cycleId) {
    return <HardGate path="desk/artifacts/sage/CURRENT.json" message="SAGE HARD GATE: no cycle lock baked into this build" />;
  }
  return (
    <>
      {/* cycle lock stamp for gate verification */}
      <span className="sr-only" data-sage-cycle={BUILD_META.cycleId} data-sage-compiled={BUILD_META.compiledAt}>
        cycle {BUILD_META.cycleId}
      </span>
      <Desk buildId={BUILD_META.buildId} builtAt={BUILD_META.builtAt} pauses={BUILD_META.pauses} />
    </>
  );
}
