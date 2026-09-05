import { readFileSync, writeFileSync } from 'fs';

const tokenBlock = `:root,
[data-theme='phosphor'] {
  --phosphor: #33ff66;
  --phosphor-bright: #7dffa6;
  --phosphor-dim: #1f6b33;
  --phosphor-deep: #0a1f12;
  --phosphor-glow: rgba(51, 255, 102, 0.45);

  --pip-amber: #ffb000;
  --accent-amber: #ffb000;
  --accent-amber-dim: #6b4a00;

  --holo: #00e5ff;
  --cyber: #ff2bd6;

  --destructive: #ff2a6d;
  --destructive-foreground: #1a0008;

  --background: #050a07;
  --bg-deep: #020403;
  --card: #0a140f;
  --border: #1a4d2e;
  --radius: 0.125rem;

  --foreground: var(--phosphor);
  --card-foreground: var(--phosphor);
  --popover: var(--background);
  --popover-foreground: var(--phosphor);
  --primary: var(--phosphor);
  --primary-foreground: #021005;
  --secondary: var(--phosphor-deep);
  --secondary-foreground: var(--phosphor-bright);
  --muted: var(--phosphor-deep);
  --muted-foreground: var(--phosphor-dim);
  --accent: var(--phosphor-deep);
  --accent-foreground: var(--phosphor-bright);
  --input: var(--border);
  --ring: var(--phosphor-dim);

  --signal: var(--phosphor-bright);
  --signal-bright: var(--phosphor-bright);
  --signal-dim: var(--phosphor-dim);
  --signal-deep: var(--phosphor-deep);
  --signal-glow: var(--phosphor-glow);

  --crt-scanline-opacity: 0.14;
  color-scheme: dark;

  --bg: var(--background);
  --amber: var(--pip-amber);
  --line: var(--border);
  --subtle: var(--phosphor-dim);
  --ok: var(--phosphor-bright);
  --accent-ui: var(--phosphor);
  --accent-fg: var(--primary-foreground);
}`;

writeFileSync('/workspace/nexus-sage/refs/SAGE-tokens.v2.css', '/* Skin V2 */\n' + tokenBlock + '\n');

let g = readFileSync('/workspace/nexus-sage/desk/src/app/globals.css', 'utf8');
const rootRe = /:root,\s*\[data-theme='amber'\]\s*\{[\s\S]*?--accent-fg: var\(--primary-foreground\);\s*\}/;
if (!rootRe.test(g)) {
  // try phosphor already
  const rootRe2 = /:root,\s*\[data-theme='phosphor'\]\s*\{[\s\S]*?--accent-fg: var\(--primary-foreground\);\s*\}/;
  if (rootRe2.test(g)) {
    g = g.replace(rootRe2, tokenBlock);
  } else {
    console.error('root block not found');
    process.exit(1);
  }
} else {
  g = g.replace(rootRe, tokenBlock);
}

if (!g.includes('--color-pip-amber')) {
  g = g.replace(
    '--color-accent: var(--phosphor);',
    '--color-accent: var(--phosphor);\n  --color-pip-amber: var(--pip-amber);\n  --color-holo: var(--holo);\n  --color-cyber: var(--cyber);'
  );
}

g = g.replaceAll('border-top: 1px solid var(--phosphor);\n    border-left: 1px solid var(--phosphor);', 'border-top: 1px solid var(--pip-amber);\n    border-left: 1px solid var(--pip-amber);');
g = g.replaceAll('border-right: 1px solid var(--phosphor);\n    border-bottom: 1px solid var(--phosphor);', 'border-right: 1px solid var(--pip-amber);\n    border-bottom: 1px solid var(--pip-amber);');

if (!g.includes('.sage-lead')) {
  g = g.replace(
    '.desk-lane-btn[aria-current="page"] {\n    color: var(--primary-foreground);\n    background: var(--phosphor);\n    text-shadow: none;\n  }',
    `.desk-lane-btn[aria-current="page"] {
    color: var(--primary-foreground);
    background: var(--phosphor);
    text-shadow: none;
    box-shadow: inset 0 0 0 1px var(--pip-amber);
  }

  .sage-lead {
    background: var(--phosphor);
    color: var(--primary-foreground);
    border-color: var(--phosphor-bright);
  }
  .sage-lead .sage-signal,
  .sage-lead dt,
  .sage-lead dd {
    color: var(--primary-foreground);
  }

  .holo-edge {
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--holo) 55%, transparent);
  }`
  );
}

writeFileSync('/workspace/nexus-sage/desk/src/app/globals.css', g);
writeFileSync('/workspace/nexus-sage/desk/src/styles.css', g);

let layout = readFileSync('/workspace/nexus-sage/desk/src/app/layout.tsx', 'utf8');
layout = layout.replaceAll('data-theme="amber"', 'data-theme="phosphor"');
writeFileSync('/workspace/nexus-sage/desk/src/app/layout.tsx', layout);

let desk = readFileSync('/workspace/nexus-sage/desk/src/components/sage/desk.tsx', 'utf8');
desk = desk.replace('p.kind === "lead" && "sage-panel-glow"', 'p.kind === "lead" && "sage-lead"');
desk = desk.replace(
  '<span className="inline-block h-2 w-2 rounded-none bg-signal" aria-hidden />\n              <span className="sage-signal">lead</span>',
  '<span className="inline-block h-2 w-2 rounded-none bg-phosphor" aria-hidden />\n              <span className="text-phosphor">lead</span>'
);
desk = desk.replace(
  'sage-panel sage-ticks sage-panel-glow p-5 lg:col-span-7',
  'sage-panel sage-ticks sage-panel-glow holo-edge p-5 lg:col-span-7'
);
writeFileSync('/workspace/nexus-sage/desk/src/components/sage/desk.tsx', desk);

writeFileSync('/workspace/nexus-sage/refs/SAGE-TOKEN-SHEET.md', `# NEXUS SAGE — Skin V2 Token Sheet
Boot: \`data-theme="phosphor"\` · green primary · amber scarce · holo/cyber 1px sparks only.

| Role | Hex |
|------|-----|
| Primary phosphor | \`#33ff66\` |
| Bright / dim / deep | \`#7dffa6\` / \`#1f6b33\` / \`#0a1f12\` |
| Amber accent | \`#ffb000\` (ticks, companion, warn) |
| BG / card / border | \`#050a07\` / \`#0a140f\` / \`#1a4d2e\` |
| Holo / cyber | \`#00e5ff\` / \`#ff2bd6\` — never fills |

See SKIN-V2-PHOSPHOR.md.
`);

console.log('ok');
