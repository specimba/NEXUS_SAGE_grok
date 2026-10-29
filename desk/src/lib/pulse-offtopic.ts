/** PASS-U U6 — off-topic Pulse: crypto-price / "is Bitcoin safe" clickbait as the dominant frame → `noise:offtopic`.
 *  Small dedicated check until held PASS-NOISE merges (then fold into its helper). */
const OFFTOPIC: readonly RegExp[] = [
  /\bis (bitcoin|btc|crypto|ethereum|eth|xrp)\b[^?]{0,20}\bsafe\b/i,
  /\b(bitcoin|btc|ethereum|xrp|dogecoin|solana|crypto(currency)?) (price|prices|rally|crash|surges?|plunges?|soars?)\b/i,
  /\bprice prediction\b/i,
];
export function offtopicNoiseReason(title: string | null | undefined): "noise:offtopic" | null {
  const t = String(title ?? "");
  return OFFTOPIC.some((re) => re.test(t)) ? "noise:offtopic" : null;
}
