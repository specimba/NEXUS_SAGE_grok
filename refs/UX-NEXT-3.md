# UX-NEXT-3 — three creative upgrades (UX Gürok, 2026-10-16 00:25 UTC+3)

Audited live at 1280 and 390 (`#brief`, `#pulse`, `?view=setup`, crawl 21:21 UTC+3, lead "Fish Audio Drama 3"). Every mockup is the **live page's own DOM and CSS** with the change injected (Skin V2 tokens only, no new hex, no token remaps, `color-mix` on existing vars). All mocks pass the overflow-390 rule (scrollWidth 390, no text past x=390). Each idea is one small pass. Combined First Load delta is about **+1.3 kB** (178 → ~179.3 kB, cap 185).

Before shots: `refs/ux-next-3/before-{brief,pulse,setup}-{1280,390}.png`. Mockups (static HTML plus PNG): `refs/ux-next-3/after-*.{html,png}`.

---

## 1 · Clearance plate: the lead shows why it won, and HELD becomes a SIGNAL HOLD test card
**Problem.** The lead plate says *what* the lead is, but not *why*. The proof is one grey line (`2 SRC · sig 7 · <24h · picked … · sticky till next pick`). On a HELD day the card collapses to a small chip and a dim carried headline, which reads like a broken panel instead of a decision.

**Proposal.**
- **Picked:** swap the meta line for a **gate rail**: three lit gate chips for the pick rule (`2 SRC ≥2` · `HN own publisher` · `<24h fresh`), plus a dashed `sig 7` chip. Under it goes a **sticky bar**, a segmented phosphor meter that drains from `picked 06:21` to `next pick 06:11 · 5h 55m`.
- **HELD:** the plate becomes a **SIGNAL HOLD test card**. It has monochrome phosphor test bars and a big Share Tech `SIGNAL HOLD▮`. The reason (`no lead today · nothing cleared the gates at 06:11`) sits under it. Then comes the **closest candidate** with the *same* gate rail, where the failed gate is the only amber on the card (`GNW only ✗ own publisher`). The retry bar reads `next try 10:11`. At the bottom is `last pick · 2026-10-15 → log`, which also shows the correct last-pick date. For the stale reason, the fresh gate fails instead (`>48h ✗ fresh`).

**Creative upside.** Trust becomes something you can see: in one second Canberk knows the lead earned its spot, and on HELD days he sees what almost made it and why it didn't. The empty state becomes the most designed moment on the desk. The time bar makes "sticky till next pick" something you can feel.

**Build scope (one pass).**
- `desk.tsx` `Brief()`: replace the `.sage-take-meta` `<p>` with a `<TakeGates>` helper (about 25 lines) and add the HELD test-card branch inside the existing `staleLead` branch. The time bar reuses `nextCrawlSlotHHMM` and `useNow`, so there's no new timer.
- Data, `desk-view.ts` ingest: add `pub` (top non-GNW publisher label) to `SlimLead`. On HELD days only, add `LEAD_CLOSEST = {headline, sources, reason, age_band}` from lead-history `excluded[0]` (reason code `GNW_ONLY` / stale / <2 SRC). This is ~0.15 kB of data and never invents a lead.
- `globals.css`: new `.take-gate*`, `.take-burn*`, `.take-hold*` (CSS, not counted in First Load JS).
- Size: **+~0.6 kB** First Load JS.

**Acceptance (Reviewer).**
- 1280: the gate rail shows 3 lit gates plus a sig chip under the plate. The time bar fill equals elapsed/total and is labelled with both times. The Yesterday row stays.
- HELD fixture (both `held` and `stale`): the SIGNAL HOLD card shows, exactly one amber gate (the failing one), the closest-candidate headline **wraps** (no clamp, since it's a headline), the retry slot is correct, and the last-pick date equals the lead-history date of the last picked entry.
- No Gmail or X-taste item can ever be the closest candidate.
- 390: gates wrap to 2 lines and nothing passes x=390. overflow-390 is OK on all 6 lanes and the HELD fixture. Tap targets for `→ log` are ≥44px.

**Files.** Mocks: `refs/ux-next-3/after-lead-{1280,390}.{html,png}`, `after-lead-held-{1280,390}.{html,png}`. Simulated current HELD: `before-lead-held-{1280,390}.png`. **Pair:** `refs/ux-next-3/pair-1-clearance-plate.png`.

---

## 2 · Morning edition day tape: the morning, read in one glance
**Problem.** A morning reader lands on chrome, a ticker and the lead, but nothing says *what happened overnight* or *when the 06:21 pick was made*. The crawl rhythm (21:24 → 06:21 → 11:22 → 16:23 → 21:22) is spread across topbar chips, the INGEST line and the Wire header (`vs 16:22`).

**Proposal.** One band at the top of Brief: `EDITION · THU 15 OCT` in Share Tech, a one-line summary (`overnight +6 · lead picked 06:21 · today +56 new clusters`), and a **tape** of the day's crawl slots. Each slot shows a segmented bar sized by new clusters, its time and its `+N`. The pick slot gets a lit `PICK` plate and a diamond notch on the rail. The current slot is boxed `NOW`, and the next pick is a dotted `NEXT 06:11` ghost. The existing Beat 10 since-baseline puts a small amber `▲ you` under the slot where you last left. It's the same amber already used by the since divider, so no new amber role. It never repeats the lead headline, so it doesn't add to the "lead 3× above the fold" issue.

**Creative upside.** The desk turns from a dashboard into a *morning edition*: a front page with a date line and a timeline you can read in one look. "Where was I, what came in while I slept, when was the lead picked" is answered before the first scroll, and the slots are a natural home for slot filtering later.

**Build scope (one pass).**
- Data, `desk-view.ts` ingest: `DAY_TAPE: {at, new, pick?}[]` (≤6 entries from crawl stamps plus `first_seen` counts, the last-crawl-of-yesterday slot included). About 0.25 kB.
- `desk.tsx`: a `<DayTape>` component (about 35 lines) rendered above `.brief-v5`. The `you` marker comes from `useDeskKeys().since`, which is already in context. Slots are display-only in this pass (no new key handling).
- `globals.css`: `.day-tape*`, `.day-slot*`.
- Size: **+~0.6 kB** First Load JS.

**Acceptance (Reviewer).**
- 1280: the band sits above the rail/plate, slot count equals the crawls since yesterday's last slot, and the bar heights rank by `new`. `PICK` is on the slot whose time equals `LEAD_TODAY.pick_slot`, `NOW` equals `CRAWL_AT`, and `NEXT` equals the next pick slot.
- On a HELD day the pick slot shows a hollow `HELD` tag instead of `PICK`.
- 390: all 6 slots fit in one row (`next` tag shortens), the summary wraps under the date, there's no sideways scroll, and overflow-390 is OK.
- With no since baseline (first visit) there's no `you` marker.

**Files.** Mocks: `refs/ux-next-3/after-tape-{1280,390}.{html,png}`. Before: `before-brief-1280.png`, `before-tape-390.png`. **Pair:** `refs/ux-next-3/pair-2-day-tape.png`.

---

## 3 · Setup patch bay: config you can read like hardware
**Problem.** `?view=setup` is a 5-column text table stacked *above* the Brief, while the lane rail still says `lane · brief` and the BRIEF tab stays lit. At 390 every row wraps its caps onto a second line, and the keyword lists are hidden behind four `<details>` with just a count.

**Proposal.** Setup **takes over the lane**: the rail reads `> lane · setup`, no tab is lit, and `close` returns to Brief. At the top sits a summary of chips (`12 sources · 10 live · 2 box-only · 0 soft-fail · 314 rows last crawl · since 0a9d704`). Below is a **patch bay** grid of source modules (4 columns at 1280, 2 at 390). Each module has a phosphor LED, the id in Share Tech, an `on` toggle glyph, a big last-rows number, a 12-segment log meter, and its caps. `box-only` modules are dashed with a hollow LED, and soft-fail modules get the single amber LED and border. Keyword lists become **cartridges** whose terms show as chips (`+41 more`), with `politics deny` struck through. Taste is a **dial**: weight 0 on a 0–0.3 track, labelled `pulse shelf only · never lead`.

**Creative upside.** The config is a control surface you can read at a glance: which feeds are hot, which are box-only, and what each one catches. It's also the visual shell PASS-C3 option B needs later (toggles and dial become real controls), with no rework.

**Build scope (one pass).**
- `setup-view.tsx` (lazy chunk) gets the new markup from the existing `SAGE_SETUP` fields, so there's no data change.
- `desk.tsx`: when `view=setup`, hide the lane body and set the rail label to `setup`. That's about 5 lines.
- `globals.css`: `.bay-*`, replacing `.sage-setup-src` grid rules.
- Size: **0 kB** in First Load for the view (lazy), plus **~0.1 kB** for the desk.tsx label/hide. The setup chunk grows by ~1.5 kB, loaded only on `?view=setup`.

**Acceptance (Reviewer).**
- 1280: 12 modules in 4 columns, and the summary counts equal the `sources[]` states. The meter segments are monotonic in `last_rows`. The Brief is not rendered under Setup, the rail says `setup`, and `close` returns to `./#brief`.
- 390: 2 columns, ids never break mid-word (`HF_PAPERS`, `OPENALEX` on one line), and there's no sideways scroll. overflow-390 is OK on `?view=setup` (add it to the check's URL list).
- The `config invalid` state shows the error list above the bay in amber.
- First Load for `/` is unchanged except for the ≤0.1 kB label.

**Files.** Mocks: `refs/ux-next-3/after-setup-{1280,390}.{html,png}`. Before: `before-setup-{1280,390}.png`, `before-setup-scrolled-390.png`. **Pair:** `refs/ux-next-3/pair-3-setup-patch-bay.png`.

---

### Ranking
1. **Clearance plate.** Biggest visible change on the page Canberk opens most, and it fixes the HELD date bug.
2. **Day tape.** Changes what the morning *feels* like with a small data addition.
3. **Setup patch bay.** Zero First Load risk and lays the groundwork for editable Setup.

Rules held: green signal, amber only for failure, since and soft-fail; leads and headlines wrap; taste stays Pulse-only and never lead; cycle label 003; free/OSS only. The mocks are injected into a static copy of the live page and are not a build; Coder builds from the class lists above.
