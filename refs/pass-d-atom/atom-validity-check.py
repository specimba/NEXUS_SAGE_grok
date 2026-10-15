#!/usr/bin/env python3
"""PASS-D proof: XML parse (stdlib expat via ElementTree) + RFC 4287 required elements for desk/public/feed.xml."""
import sys, re, xml.etree.ElementTree as ET
from datetime import datetime
path = sys.argv[1] if len(sys.argv) > 1 else "desk/public/feed.xml"
raw = open(path, "rb").read()
A = "{http://www.w3.org/2005/Atom}"
errs = []
ok = lambda c, m: None if c else errs.append(m)
ok(raw.startswith(b'<?xml version="1.0" encoding="utf-8"?>'), "no XML declaration")
ok(len(raw) <= 65536, f"size {len(raw)} > 65536")
root = ET.fromstring(raw)
ok(root.tag == A + "feed", f"root is {root.tag}, not Atom feed")
def rfc3339(s): return bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z", s or "")) and datetime.fromisoformat(s.replace("Z", "+00:00"))
for n in ("id", "title", "updated"):
    ok(len(root.findall(A + n)) == 1, f"feed needs exactly one <{n}>")
ok(rfc3339(root.findtext(A + "updated")), "feed updated not RFC 3339")
ok(root.find(A + "author/" + A + "name") is not None, "feed author/name missing")
links = {l.get("rel", "alternate"): l.get("href") for l in root.findall(A + "link")}
ok(links.get("self") == "https://specimba.github.io/NEXUS_SAGE_grok/feed.xml", f"self link {links.get('self')}")
ok(links.get("alternate") == "https://specimba.github.io/NEXUS_SAGE_grok/", f"alternate link {links.get('alternate')}")
entries = root.findall(A + "entry")
ok(1 <= len(entries) <= 14, f"{len(entries)} entries (want 1..14)")
ids = set()
for i, e in enumerate(entries):
    for n in ("id", "title", "updated", "content"):
        ok(len(e.findall(A + n)) == 1, f"entry {i} needs exactly one <{n}>")
    eid = e.findtext(A + "id"); ok(eid not in ids, f"duplicate id {eid}"); ids.add(eid)
    ok(re.fullmatch(r"tag:specimba\.github\.io,2026:nexus-sage/morning/\d{4}-\d{2}-\d{2}", eid or ""), f"entry id {eid}")
    ok(rfc3339(e.findtext(A + "updated")), f"entry {i} updated not RFC 3339")
    ok(rfc3339(e.findtext(A + "published")), f"entry {i} published not RFC 3339")
    ok(e.find(A + "content").get("type") == "html", f"entry {i} content type")
    html = e.findtext(A + "content") or ""
    ok(not re.search(r"<(script|style|img|iframe)\b", html, re.I), f"entry {i} has non-plain tags")
    for h in re.findall(r'href="([^"]+)"', html) + [l.get("href") for l in e.findall(A + "link")]:
        ok(h.startswith("https://"), f"entry {i} non-https link {h}")
    ok(e.find(A + "link").get("href", "").startswith("https://"), f"entry {i} alternate link")
dates = [x[-10:] for x in [e.findtext(A + "id") for e in entries]]
ok(dates == sorted(dates, reverse=True), "entries not newest first")
print(f"file: {path} · {len(raw)} B · {len(entries)} entr{'y' if len(entries) == 1 else 'ies'}")
print(f"root: {root.tag}")
print(f"feed id: {root.findtext(A + 'id')} · updated {root.findtext(A + 'updated')}")
for e in entries: print(f"  entry {e.findtext(A + 'id')} · {e.findtext(A + 'title')}")
print("ATOM CHECK: " + ("PASS" if not errs else "FAIL\n  " + "\n  ".join(errs)))
sys.exit(1 if errs else 0)
