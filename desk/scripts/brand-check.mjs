#!/usr/bin/env node
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const warnings = [];

function need(path, label) {
  const full = join(root, path);
  if (!existsSync(full)) warnings.push(`missing ${label}: ${path}`);
  return full;
}

const fav = need("public/favicon.svg", "favicon");
const ogJpg = need("public/og.jpg", "og.jpg");
const ogPng = need("public/og.png", "og.png");
const site = need("src/lib/og/site.json", "site.json");

if (existsSync(ogJpg)) {
  const n = statSync(ogJpg).size;
  if (n < 1000) warnings.push("og.jpg suspiciously small");
}
if (existsSync(ogPng)) {
  // soft check dimensions via file header if sharp unavailable — size only
}

const siteJson = JSON.parse(readFileSync(site, "utf8"));
if (siteJson.themeColor !== "#07090c") warnings.push("themeColor must be #07090c");
if (!siteJson.rules?.noHeroPhoto) warnings.push("noHeroPhoto rule missing");
if (!siteJson.rules?.phosphorPrimary) warnings.push("phosphorPrimary rule missing (Skin V2)");
if (siteJson.rules?.amberPrimary) warnings.push("amberPrimary obsolete — Skin V2 phosphor primary");
if (siteJson.rules?.greenSignalOnly) warnings.push("greenSignalOnly obsolete — green is primary chrome");

const layout = readFileSync(join(root, "src/app/layout.tsx"), "utf8");
if (!layout.includes('themeColor: "#07090c"')) warnings.push("layout themeColor != #07090c");
if (!layout.includes('data-theme="phosphor"')) warnings.push('layout missing data-theme="phosphor"');
if (!layout.includes("/og.jpg")) warnings.push("layout missing og.jpg openGraph");
if (!layout.includes("/favicon.svg")) warnings.push("layout missing favicon.svg");

const favTxt = readFileSync(fav, "utf8");
if (!favTxt.includes("#07090c")) warnings.push("favicon missing charcoal #07090c");
if (/jpg|jpeg|png|photo|hero/i.test(favTxt) && favTxt.includes("xlink:href")) {
  warnings.push("favicon must not embed hero photography");
}

if (warnings.length) {
  console.error("brand-check FAIL");
  for (const w of warnings) console.error(" -", w);
  process.exit(1);
}
console.log("brand-check OK — 0 warnings");
