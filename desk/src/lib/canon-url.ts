/** Canonical URL key (moved verbatim from dedupe.ts so the browser can import it without the clusterer — PASS-N). */
const TRACKING_PARAMS = new Set([
  "ref",
  "ref_src",
  "ref_url",
  "referrer",
  "source",
  "src",
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "oc",
  "cmp",
  "cmpid",
  "campaign",
  "s",
  "si",
  "amp",
  "output",
  "outputtype",
  "_ga",
  "_gl",
  "yclid",
  "twclid",
  "spm",
  "share",
  "smid",
  "sref",
  "guccounter",
  "guce_referrer",
  "guce_referrer_sig",
  "ncid",
  "mkt_tok",
  "_hsenc",
  "_hsmi",
  "vero_id",
  "sr_share",
  "cid",
  "icid",
  "ito",
  "taid",
  "trk",
  "feature",
  "rss",
]);

function isTrackingParam(key: string): boolean {
  const k = key.toLowerCase();
  return k.startsWith("utm_") || k.startsWith("hsa_") || k.startsWith("pk_") || TRACKING_PARAMS.has(k);
}

function b64urlDecode(s: string): string {
  try {
    const norm = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = norm + "===".slice((norm.length + 3) % 4);
    if (typeof atob === "function") return atob(pad);
    // Node/tests only (browsers always have atob). globalThis lookup keeps webpack from bundling a Buffer polyfill into the page.
    return (globalThis as { Buffer?: typeof Buffer }).Buffer!.from(pad, "base64").toString("binary");
  } catch {
    return "";
  }
}

/**
 * Resolve a news.google.com/rss/articles/<blob> redirect offline when the blob
 * embeds the publisher URL (legacy CBMi… protobuf). Newer encrypted blobs return null.
 */
export function resolveGoogleNewsUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!/(^|\.)news\.google\.com$/i.test(u.hostname)) return null;
  const m = u.pathname.match(/\/(?:rss\/)?articles\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const raw = b64urlDecode(m[1]);
  const hit = raw.match(/https?:\/\/[\x21-\x7e]+/);
  if (!hit) return null;
  const cand = hit[0].replace(/[\x00-\x20"']+$/, "");
  try {
    const out = new URL(cand);
    if (/(^|\.)google\.com$/i.test(out.hostname)) return null;
    return out.toString();
  } catch {
    return null;
  }
}

/** Canonical URL: https, lower host, no www/m/amp prefix, no tracking params, no hash, no AMP path, no trailing slash. */
export function canonicalizeUrl(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  const resolved = resolveGoogleNewsUrl(raw) ?? raw;
  let u: URL;
  try {
    u = new URL(resolved);
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
  let host = u.hostname.toLowerCase().replace(/^(www\d*|m|mobile|amp)\./, "");
  if (host.endsWith(".cdn.ampproject.org")) {
    // https://example-com.cdn.ampproject.org/c/s/example.com/path
    const pm = u.pathname.match(/^\/[a-z]\/(?:s\/)?([^/]+)(\/.*)?$/i);
    if (pm) {
      host = pm[1].toLowerCase().replace(/^(www\d*|m|amp)\./, "");
      u = new URL(`https://${host}${pm[2] ?? "/"}${u.search}`);
    }
  }
  const keep: [string, string][] = [];
  u.searchParams.forEach((v, k) => {
    if (!isTrackingParam(k)) keep.push([k, v]);
  });
  keep.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  let path = u.pathname
    .replace(/\/amp\/?$/i, "")
    .replace(/\.amp(\.html)?$/i, "$1")
    .replace(/\/index\.html?$/i, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\/+$/, "");
  if (!path) path = "";
  const qs = keep.length
    ? `?${keep.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")}`
    : "";
  return `https://${host}${path}${qs}`;
}
