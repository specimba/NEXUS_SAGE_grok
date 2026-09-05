import { readFileSync, writeFileSync } from 'fs';

let g = readFileSync('/workspace/nexus-sage/desk/src/app/globals.css', 'utf8');

if (!g.includes('.crt-rain')) {
  const chrome = `
  /* === Skin V2 CRT chrome (density pass) === */
  .crt-rain {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0.08;
    background-image: repeating-linear-gradient(
      180deg,
      transparent 0 10px,
      color-mix(in srgb, var(--phosphor) 35%, transparent) 10px 11px
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0 14px,
      color-mix(in srgb, var(--phosphor-dim) 40%, transparent) 14px 15px
    );
    mix-blend-mode: screen;
  }
  @media (prefers-reduced-motion: reduce) {
    .crt-rain { display: none; }
  }

  .block-cursor::after {
    content: "";
    display: inline-block;
    width: 0.55em;
    height: 1em;
    margin-left: 0.15em;
    vertical-align: -0.1em;
    background: var(--phosphor);
    box-shadow: 0 0 6px var(--phosphor-glow);
    animation: block-blink 1.1s steps(2, jump-none) infinite;
  }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes block-blink {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .block-cursor::after { animation: none; opacity: 1; }
  }

  .lane-prefix {
    color: var(--pip-amber);
    margin-right: 0.35rem;
    font-variant-numeric: tabular-nums;
  }

  .desk-lane-btn[aria-current="page"] .lane-prefix {
    color: var(--primary-foreground);
  }

  .sage-panel.sage-ticks {
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--phosphor-deep) 80%, transparent);
  }
`;
  // insert before final reduced-motion or at end of utilities
  if (g.includes('  .holo-edge {')) {
    g = g.replace(
      /  \.holo-edge \{[^}]+\}\n/,
      (m) => m + chrome
    );
  } else {
    g = g.replace(/\n\}\n\n::-webkit-scrollbar/, '\n' + chrome + '}\n\n::-webkit-scrollbar');
  }
  writeFileSync('/workspace/nexus-sage/desk/src/app/globals.css', g);
  writeFileSync('/workspace/nexus-sage/desk/src/styles.css', g);
  console.log('css chrome added');
} else {
  console.log('css chrome already present');
}

let desk = readFileSync('/workspace/nexus-sage/desk/src/components/sage/desk.tsx', 'utf8');

// brand with block cursor
desk = desk.replace(
  'className="desk-brand text-kicker text-phosphor">SAGE://DESK</p>',
  'className="desk-brand block-cursor text-kicker text-phosphor">SAGE://DESK</p>'
);

// lane prefixes [01] style
if (!desk.includes('lane-prefix')) {
  desk = desk.replace(
    `{LANES.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                aria-current={lane === id ? "page" : undefined}
                className="desk-lane-btn focus-phosphor"
              >
                {id}
              </button>
            ))}`,
    `{LANES.map((id, i) => (
              <button
                key={id}
                type="button"
                onClick={() => go(id)}
                aria-current={lane === id ? "page" : undefined}
                className="desk-lane-btn focus-phosphor"
              >
                <span className="lane-prefix">[{String(i + 1).padStart(2, "0")}]</span>
                {id}
              </button>
            ))}`
  );
}

// stage rail with > prompt
desk = desk.replace(
  '<span>lane · {lane}</span>',
  '<span className="block-cursor">&gt; lane · {lane}</span>'
);

// rain behind stage
if (!desk.includes('crt-rain')) {
  desk = desk.replace(
    '<div className="desk-stage sage-ticks overflow-hidden">',
    `<div className="desk-stage sage-ticks relative overflow-hidden">
          <div className="crt-rain" aria-hidden />`
  );
}

writeFileSync('/workspace/nexus-sage/desk/src/components/sage/desk.tsx', desk);
console.log('desk chrome patched');
