import { Desk } from "@/components/sage/desk";
import { MissingCurrentError, requireCurrent } from "@/lib/require-current";
import { readBuildId, SERVER_STARTED_AT } from "@/lib/server-boot";

export const dynamic = "force-dynamic";

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
          Restore <code className="text-amber">artifacts/sage/CURRENT.json</code> and reload. No soft-fallback.
        </p>
      </div>
    </main>
  );
}

export default function Home() {
  try {
    const lock = requireCurrent();
    const buildId = readBuildId();
    return (
      <>
        {/* cycle lock stamp for gate verification */}
        <span className="sr-only" data-sage-cycle={lock.id} data-sage-compiled={lock.compiled_at ?? ""}>
          cycle {lock.id}
        </span>
        <Desk buildId={buildId} serverStartedAt={SERVER_STARTED_AT} />
      </>
    );
  } catch (err) {
    if (err instanceof MissingCurrentError) {
      return <HardGate path={err.path} message={err.message} />;
    }
    throw err;
  }
}
