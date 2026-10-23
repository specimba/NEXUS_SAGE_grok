/** PASS-A2 (a): the desk base URL for page checks — no #hash, no view/edit params (checks add those themselves). */
export function baseDeskUrl(raw: string): string {
  const u = new URL(raw.replace(/#.*$/, ""));
  u.searchParams.delete("view");
  u.searchParams.delete("edit");
  return u.href;
}
