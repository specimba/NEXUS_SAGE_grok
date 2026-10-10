/** Archive fold header state word — follows <details> open state (UX 390 catch). */
export function archiveFoldLabel(open: boolean): "open" | "closed" {
  return open ? "open" : "closed";
}
