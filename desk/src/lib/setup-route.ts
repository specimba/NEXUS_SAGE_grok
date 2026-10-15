/** PASS-C3 — ?view / &edit → which surface shows. desk.tsx (view) and setup-view.tsx (edit) re-read it on popstate. */
export function setupRoute(search: string): { setup: boolean; edit: boolean } {
  const p = new URLSearchParams(search);
  const setup = p.get("view") === "setup";
  return { setup, edit: setup && p.get("edit") === "1" };
}
