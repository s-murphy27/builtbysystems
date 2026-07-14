#!/usr/bin/env node
/*
 * Smoke tests for the four "Built by Systems" home-management tools.
 *
 * For each tool it:
 *   1) boots the tool in headless Chrome and asserts the core UI renders
 *      (panels, tabs, default data) — i.e. init ran without a fatal error;
 *   2) fires REAL checkbox clicks in the page and reads the resulting state
 *      back out, proving every checklist item toggles independently and
 *      persists to localStorage on its own.
 *
 * This is the regression guard for the duplicate-id bug (all checklist items
 * once shared one id, so only the first row toggled).
 *
 * Usage:   node tests/smoke.js
 *          CHROME="/path/to/chrome" node tests/smoke.js   (override browser)
 *
 * Exit code is non-zero if any check fails.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const REPO = path.resolve(__dirname, "..");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "bbs-smoke-"));

function findChrome() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error("Chrome/Chromium not found. Set the CHROME env var to your browser's path.");
}
const CHROME = findChrome();

let seq = 0;
function fileUrl(p) {
  return "file:///" + p.replace(/\\/g, "/").replace(/^\//, "");
}
function dumpDom(url, extraFlags) {
  const args = [
    "--headless", "--disable-gpu", "--no-sandbox",
    "--virtual-time-budget=4000",
    "--user-data-dir=" + path.join(TMP, "profile_" + seq++),
    ...(extraFlags || []),
    "--dump-dom", url,
  ];
  return execFileSync(CHROME, args, { encoding: "utf8", maxBuffer: 1 << 27 });
}
function count(s, re) { return (s.match(re) || []).length; }
function stripScripts(s) { return s.replace(/<script[\s\S]*?<\/script>/g, ""); }
function uniqueIds(s, tag) {
  const ids = [...s.matchAll(new RegExp('id="' + tag + '_([^"]+)"', "g"))].map((m) => m[1]);
  return ids.length > 0 && new Set(ids).size === ids.length;
}

// Run an in-page interaction test by loading the tool in an iframe and
// executing `testFn` against its window/document, returning the JSON result.
function interact(slug, testFn) {
  const toolUrl = fileUrl(path.join(REPO, slug, slug + ".html"));
  const wrapper =
    "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body>" +
    '<iframe id="f" src="' + toolUrl + '" style="width:1200px;height:900px"></iframe>' +
    "<script>var TESTFN=" + testFn + ";" +
    "var f=document.getElementById('f');" +
    "f.addEventListener('load',function(){setTimeout(function(){var r;" +
    "try{r=TESTFN(f.contentWindow,f.contentWindow.document);}catch(e){r={error:e.message};}" +
    "document.title='RESULT::'+JSON.stringify(r);},400);});" +
    "</script></body></html>";
  const wpath = path.join(TMP, "wrap_" + slug + ".html");
  fs.writeFileSync(wpath, wrapper);
  // cross-frame access to a file:// child requires these flags
  const dom = dumpDom(fileUrl(wpath), ["--allow-file-access-from-files", "--disable-web-security"]);
  const m = dom.match(/RESULT::([^<]*)/);
  return m ? JSON.parse(m[1]) : { error: "no result captured" };
}

// ----------------------------------------------------------------------------
// Tool definitions: structural checks (on rendered DOM) + interaction check.
// ----------------------------------------------------------------------------
const TOOLS = [
  {
    slug: "first-year-homeowner",
    name: "The First-Year Homeowner Kit",
    structural: (body, raw) => [
      ["title renders", /First-Year Homeowner Kit/.test(raw)],
      ["12 month panels", count(body, /data-ord="/g) === 12],
      ["progress banner present", /id="progPct"/.test(raw)],
      ["4 tabs", count(body, /data-tab="/g) === 4],
      ["checklist ids unique", uniqueIds(body, "c")],
    ],
    interaction:
      "function(w,d){function clk(s,i){d.querySelectorAll(s)[i].click();}" +
      "clk('#listWeek1 input[type=checkbox]',0);clk('#listWeek1 input[type=checkbox]',2);clk('#listWeek1 input[type=checkbox]',5);" +
      "clk('#listDocs input[type=checkbox]',1);clk('#listDocs input[type=checkbox]',3);" +
      "var wk=w.data.week1.map(function(t,i){return t.done?i:-1;}).filter(function(i){return i>=0;});" +
      "var dc=w.data.docs.map(function(t,i){return t.done?i:-1;}).filter(function(i){return i>=0;});" +
      "var saved=JSON.parse(w.localStorage.getItem('first_year_data_v1'));" +
      "var sv=saved.week1.map(function(t,i){return t.done?i:-1;}).filter(function(i){return i>=0;});" +
      "return {week1Checked:wk,docsChecked:dc,savedWeek1Checked:sv};}",
    verify: (r) => [
      ["Week-1 rows 0,2,5 toggle independently", JSON.stringify(r.week1Checked) === "[0,2,5]"],
      ["Document rows 1,3 toggle independently", JSON.stringify(r.docsChecked) === "[1,3]"],
      ["state persisted to localStorage", JSON.stringify(r.savedWeek1Checked) === "[0,2,5]"],
    ],
  },
  {
    slug: "home-operations-system",
    name: "The Home Operations System",
    structural: (body, raw) => [
      ["title renders", /Home Operations System/.test(raw)],
      ["4 seasonal panels", count(body, /data-season="/g) === 4],
      ["Due-Soon rollup present", /id="dueSystems"/.test(raw) && /id="dueSeasonal"/.test(raw)],
      ["4 tabs", count(body, /data-tab="/g) === 4],
      ["seasonal task ids unique", uniqueIds(body, "t")],
    ],
    interaction:
      "function(w,d){w.switchTab('seasonal');var b=d.querySelectorAll('#seasons .task input[type=checkbox]');" +
      "b[0].click();b[4].click();b[9].click();var done=[];" +
      "w.SEASONS.forEach(function(s){(w.data.seasonal[s.key]||[]).forEach(function(t,i){if(t.done)done.push(s.key+'#'+i);});});" +
      "return {totalBoxes:b.length,doneCount:done.length,done:done};}",
    verify: (r) => [
      ["3 distinct seasonal tasks toggle independently", r.doneCount === 3 && new Set(r.done).size === 3],
    ],
  },
  {
    slug: "home-inventory-vault",
    name: "The Home Inventory & Insurance Vault",
    structural: (body, raw) => [
      ["title renders", /Home Inventory/.test(raw)],
      ["total-value banner present", /id="totalValue"/.test(raw)],
      ["3 tabs", count(body, /data-tab="/g) === 3],
      ["claim-report container present", /id="claimReport"/.test(raw)],
    ],
    interaction:
      "function(w,d){var before=w.data.items.length;w.addItem();w.addItem();" +
      "w.data.items[w.data.items.length-1].currentValue='1000';" +
      "w.data.items[w.data.items.length-2].currentValue='250';w.renderTotals();" +
      "return {addedFrom:before,nowItems:w.data.items.length,totalText:d.getElementById('totalValue').textContent};}",
    verify: (r) => [
      ["adds items", r.addedFrom === 0 && r.nowItems === 2],
      ["portfolio total computes ($1,250)", r.totalText === "$1,250"],
    ],
  },
  {
    slug: "multi-property-edition",
    name: "The Multi-Property Edition",
    structural: (body, raw) => [
      ["title renders", /Multi-Property Edition/.test(raw)],
      ["property switcher present", count(body, /class="pchip/g) >= 3],
      ["4 seasonal panels (active property)", count(body, /data-season="/g) === 4],
      ["4 sub-tabs", count(body, /data-sub="/g) === 4],
      ["seasonal task ids unique", uniqueIds(body, "t")],
    ],
    interaction:
      "function(w,d){w.data.ui.sub='seasonal';w.render();" +
      "var b=d.querySelectorAll('#seasons .task input[type=checkbox]');b[0].click();b[5].click();" +
      "var p=w.activeProp();var done=[];" +
      "w.SEASONS.forEach(function(s){(p.seasonal[s.key]||[]).forEach(function(t,i){if(t.done)done.push(s.key+'#'+i);});});" +
      "return {totalBoxes:b.length,doneCount:done.length,done:done};}",
    verify: (r) => [
      ["2 distinct seasonal tasks toggle independently", r.doneCount === 2 && new Set(r.done).size === 2],
    ],
  },
];

// ----------------------------------------------------------------------------
let failures = 0;
function line(ok, label) {
  console.log("   " + (ok ? "PASS" : "FAIL") + "  " + label);
  if (!ok) failures++;
}

console.log("Built by Systems — tool smoke tests");
console.log("Browser: " + CHROME + "\n");

for (const tool of TOOLS) {
  console.log("== " + tool.name + " ==");
  const toolUrl = fileUrl(path.join(REPO, tool.slug, tool.slug + ".html"));
  const raw = dumpDom(toolUrl);
  const body = stripScripts(raw);

  console.log("  structure:");
  for (const [label, ok] of tool.structural(body, raw)) line(ok, label);

  console.log("  interaction:");
  const result = interact(tool.slug, tool.interaction);
  if (result && result.error) {
    line(false, "interaction test errored: " + result.error);
  } else {
    for (const [label, ok] of tool.verify(result)) line(ok, label);
  }
  console.log("");
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* best effort */ }

if (failures) {
  console.log("RESULT: " + failures + " check(s) FAILED");
  process.exit(1);
} else {
  console.log("RESULT: all smoke checks passed");
}
