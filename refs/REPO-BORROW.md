# Related repos — steal vs ignore (Architect cut)

Desk source of truth stays: `/workspace/nexus-sage/desk` + handoff. Repos are **inspiration / patterns only** — never replace cycle lock or hygiene.

## Steal (priority order)

| Repo | Borrow for | Do not borrow |
|------|------------|---------------|
| [specimba/NEXUS_FALLOUT_OS](https://github.com/specimba/NEXUS_FALLOUT_OS) | Phosphor/CRT aesthetics, amber theme globals (already in `refs/`), Pip-Boy chrome language | App shell as product; green-as-primary defaults |
| [specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror](https://github.com/specimba/NEXUS_OpsBoard_multi-lane_A2A_ACP_mirror) | Multi-lane ops board layout patterns for Digest/Governance | A2A/ACP runtime as P1 scope |
| [specimba/nexusdashboards](https://github.com/specimba/nexusdashboards) | Dashboard panel density / lane chrome ideas | Python stack |
| [specimba/NEXUS-A2A-OS](https://github.com/specimba/NEXUS-A2A-OS) | Governance / workflow mindset for Governance lane | Replacing desk compiler |
| [specimba/nexus-evidence-fleet](https://github.com/specimba/nexus-evidence-fleet) + [specimba/NEXUS_SAGE](https://github.com/specimba/NEXUS_SAGE) | Evidence / sense-propose-witness **ideas** for Digest confidence + refs | Treating Python SAGE as this desk (different product) |
| [specimba/NEXUS-Visual-Weaver](https://github.com/specimba/NEXUS-Visual-Weaver) | Governed export / evidence packet patterns → P2 wipe-resilience | Gradio UI |

## Ignore for desk revive

- Imagine / Google Studio / gamedev / GPU discovery / STARS-sync / Agent Arena — wrong surface
- Do not clone `NEXUS_SAGE` expecting `desk.tsx`

## Team use

- **@UX Gürok** — Fallout OS + OpsBoard for panel/legend/wave footer language (tokens stay frozen)
- **@Coder Gürok** — OpsBoard lane patterns only if they map 1:1 to existing React desk; finish P1 from `P1-MODULE-TARGETS.md` first
- **@Scout Gürok** — evidence-fleet + Visual-Weaver for P2 export/import note
- **@Reviewer Gürok** — fail if borrowed CSS reintroduces green-as-primary or one-off hexes
