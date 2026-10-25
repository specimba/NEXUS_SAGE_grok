const p=require('puppeteer-core');const O='/tmp/nexus-main/refs/ux-next-4/';const B='https://specimba.github.io/NEXUS_SAGE_grok/';
const CSS=`.mx{font-family:var(--font-mono);color:var(--phosphor);border:1px solid var(--line);background:var(--bg-deep);padding:10px 12px;margin:10px 0}
.mx .k{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted-foreground)}
.mx .b{color:var(--phosphor-bright)} .mx .a{color:var(--pip-amber)} .mx .d{color:var(--phosphor-dim)}
.mx .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.mx .bar{height:8px;background:var(--phosphor);box-shadow:0 0 6px var(--phosphor-glow)}
.mx .cell{border:1px solid var(--line);padding:6px 8px;flex:1;min-width:0}
.mx h3{font-family:var(--font-display);color:var(--phosphor-bright);font-size:20px;margin:4px 0;overflow-wrap:anywhere}`;
const ideas={
lanes:{h:'#pulse',js:()=>{const nav=F(/^\[01\]\s*BRIEF/i).closest('nav,[role=tablist]')||F(/^\[01\]\s*BRIEF/i).parentElement;
const names=['BRIEF','PULSE','DIGEST','PAPERS','VOICE','GOV'];const cnt=['+6','+29','HOLD','27','READY','3'];
const d=document.createElement('div');d.className='mx';d.style.cssText='position:sticky;top:0;z-index:50;display:flex;gap:0;padding:0;overflow:hidden';
d.innerHTML=names.map((n,i)=>`<div style="flex:1;min-width:0;text-align:center;padding:8px 2px;border-right:1px solid var(--line);${i==1?'background:var(--phosphor);color:var(--bg-deep)':''}"><div style="font-size:10px;letter-spacing:.1em;${i==1?'':'color:var(--muted-foreground)'}">${n}</div><div style="font-size:12px" class="${i==1?'':'b'}">${cnt[i]}</div></div>`).join('');
nav.replaceWith(d);const ing=[...document.querySelectorAll('*')].find(e=>/^INGEST/.test(e.textContent.trim())&&e.children.length<4);if(ing)ing.style.display='none';}},
pulse:{h:'#pulse',js:()=>{const hn=(()=>{let e=F(/TIMEOUT AFTER/i);while(e&&!(/\bWD\b/.test(e.innerText)&&/\bHN\b/.test(e.innerText)))e=e.parentElement;return e})();
const d=document.createElement('div');d.className='mx';
const s=[['HN',60],['GNW',31],['SEC',74],['HF',50],['AHL',6],['REL',1],['HNT',2]];
d.innerHTML=`<div class="row" style="justify-content:space-between"><span class="k">SCAN · 21:20 · 7/9 SOURCES LIVE</span><span class="a">2 OFF · LAB ARX ▸</span></div>
<div class="row" style="margin-top:8px;gap:4px;align-items:flex-end;height:46px">${s.map(([n,v])=>`<div style="flex:1;min-width:0;text-align:center"><div class="bar" style="height:${Math.max(3,v*0.5)}px"></div><div class="k" style="font-size:10px;letter-spacing:.05em">${n} ${v}</div></div>`).join('')}</div>
<div class="row" style="margin-top:10px"><span class="k">MOVERS</span><span class="b">GOOGLE 42 ▲1</span><span>OPENAI 32 ▼2</span><span>NVIDIA 29 ▲1</span><span class="d">quiet: HF 14</span></div>`;
hn.replaceWith(d);}},
papers:{h:'#papers',js:()=>{const t=document.querySelector('table')||[...document.querySelectorAll('*')].find(e=>/^PAPERS ·/.test(e.textContent.trim()));
const d=document.createElement('div');d.className='mx';
const P=[['WeVisOne-VL: Unified Visual Perception from Objects to Pixels',242,'vision'],['Editing Images into Reusable Layers via Compositional Edit-Prior Distillation',184,'image'],['Making MLLM Latents Matter: Factor-Aware Predictive Learning for Cinematic Video Generation',173,'video']];
d.innerHTML=`<div class="k">SHELF · TODAY'S 3 MOST-UPVOTED · ARX+HF</div><div class="row" style="margin-top:8px;align-items:stretch">${P.map(([t,u,c],i)=>`<div class="cell" style="min-width:220px"><div class="row" style="justify-content:space-between"><span class="k">#0${i+1} · ${c}</span><span class="b">▲${u}</span></div><div class="bar" style="width:${u/2.42}%;margin:6px 0"></div><h3 style="font-size:15px">${t}</h3><div class="d" style="font-size:12px">ABS · PDF · 2 lines of abstract on open</div></div>`).join('')}</div>
<div class="k" style="margin-top:10px">TABLE ↓ · UP column becomes an inline spine bar per row</div>`;
t.parentElement.insertBefore(d,t);}},
voice:{h:'#voice',js:()=>{const s=F(/^>?\s*SCRIPT\s*·\s*STORY/i);
const d=document.createElement('div');d.className='mx';
const C=[['00:00','HOOK','Google just gave Managed Agents a home.',9],['00:06','TAKE','AI Studio is getting a hub to build, run and watch agents in one place.',14],['00:20','WHY','2 sources, own publisher, under 24h — picked 18:36.',10],['00:32','MOVE','Digest and Voice follow the Brief lead; next pick 06:11.',11]];
d.innerHTML=`<div class="row" style="justify-content:space-between"><span class="k">CUE SHEET · AVA · ~40s</span><span class="b">44 WORDS</span></div>${C.map(([t,n,x,w],i)=>`<div class="row" style="margin-top:8px;align-items:flex-start;flex-wrap:nowrap"><span class="d" style="width:52px;flex:none;white-space:nowrap">${t}</span><span style="width:46px;flex:none" class="${i==0?'b':'k'}">${n}</span><span style="flex:1;min-width:0;overflow-wrap:anywhere" class="${i==0?'b':''}">${x}</span><span class="d" style="flex:none">${w}w</span></div>`).join('')}
<div style="display:flex;margin-top:10px;height:6px;gap:2px">${C.map(c=>`<div class="bar" style="flex:${c[3]}"></div>`).join('')}</div>`;
s.parentElement.insertBefore(d,s.nextSibling);}},
governance:{h:'#governance',js:()=>{const a=F(/^>?\s*GOVERNANCE\s*·\s*TRUST/i).parentElement;
const d=document.createElement('div');d.className='mx';
d.innerHTML=`<div class="k">VERDICT LEDGER · WHAT THE DESK REFUSED TODAY</div>
<div style="display:flex;margin:8px 0;height:10px;gap:2px"><div class="bar" style="flex:3"></div><div style="flex:4;background:var(--pip-amber)"></div><div style="flex:2;border:1px solid var(--line)"></div></div>
<div class="row"><span class="b">3 ALLOW</span><span class="a">4 DENY</span><span class="d">2 OPEN</span><span class="k">· 2 WIKIDATA REJECT · 1 MATCH</span></div>
<div style="margin-top:8px;font-size:13px"><span class="a">DENY</span> X Ads mutation <span class="d">— rule: no paid surfaces in Brief · since 10-11</span></div>
<div style="font-size:13px"><span class="d">OPEN</span> What killed Wave 2 on 12 Jul? <span class="d">— waiting on 1 source</span></div>`;
a.parentElement.insertBefore(d,a);}}};
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--headless=new','--disable-gpu','--disable-dev-shm-usage','--user-data-dir=/tmp/mk'+Date.now()]});
for(const [w,h,m] of [[1280,800,0],[390,844,1]])for(const [k,v] of Object.entries(ideas)){const pg=await b.newPage();
await pg.setViewport({width:w,height:h,deviceScaleFactor:m?2:1,isMobile:!!m,hasTouch:!!m});
await pg.goto(B+v.h,{waitUntil:'networkidle2',timeout:90000});await pg.evaluate(()=>document.fonts.ready);await new Promise(r=>setTimeout(r,800));
try{await pg.addStyleTag({content:CSS});await pg.evaluate("window.F=(re)=>{let c=[...document.querySelectorAll('body *')].filter(e=>e.offsetParent!==null&&re.test((e.innerText||'').trim()));return c.filter(e=>!c.some(o=>o!==e&&e.contains(o))).pop()};");await pg.evaluate(v.js);}catch(e){console.log(k,w,e.message)}
await pg.evaluate(k=>{const e=document.querySelector('.mx');if(e&&k!=='lanes'){e.scrollIntoView({block:'start'});scrollBy(0,-170)}else scrollTo(0,0)},k);await new Promise(r=>setTimeout(r,300));
const sw=await pg.evaluate(()=>document.documentElement.scrollWidth);console.log(k,w,'sw',sw);
await pg.screenshot({path:O+`after-${k}-${w}.png`});await pg.close();}
await b.close();})();
