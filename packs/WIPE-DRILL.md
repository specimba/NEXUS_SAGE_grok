# Wipe drill — P2 acceptance

From `desk/`:

```bash
bun run pack:export
PACK=$(ls -t ../packs/sage-pack-*.tar.gz | head -1)
# also mirrored at desk/packs/

rm -rf artifacts/sage artifacts/snapshots
rm -f src/data/cycle.ts src/data/digest-pack.ts src/data/x-crawl.ts
bun run check:current   # expect FAIL

bun run pack:import -- "$PACK"
bun run check:current   # cycle 003
bun -e 'import { CYCLE } from "./src/data/cycle.ts"; const l=CYCLE.pins.find(p=>p.kind==="lead"); console.log(CYCLE.id, l?.id);'
# expect: 003 hf-incident
bun test src/lib/__tests__
```
