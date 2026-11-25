// Records the live Koinonia app for the demo film: real clicks, real typing, real AI replies.
//   ONLY=lang,ask,... node scripts/capture.mjs
// Output: .cache/frames/<clip>/ (JPEG screencast + frames.json), .cache/marks.json (event times, wall clock),
// .cache/meta.json (per clip: rects in CSS px, viewport) and .cache/capture.json (real values seen: codes, texts).
// scripts/encode.mjs turns the frames into public/footage/<clip>.mp4.
//
// Phones are 390x844 CSS px at device scale 3; desktops 1600x900 at device scale 2.
// Writes to the live demo (restore server/data/store.json from the backup afterwards):
//   ask     one Spanish prayer request (AI summary and draft)
//   bridge  one meaning check and one approval of that request
//   crisis  one crisis message, typed on the pew page
//   gloss   one glossary comparison (AI)
//   live    "Next" taps on the live service console (put back to the start afterwards)
import { chromium } from "/Users/mrnetwork/QuotaPulse/node_modules/playwright-core/index.mjs";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE || "https://koinonia.netlayerlabs.com";
const ROOT = new URL("..", import.meta.url).pathname;
const FRAMES = join(ROOT, ".cache/frames");
const ONLY = process.env.ONLY?.split(",");
if (!ONLY) { console.error("Set ONLY=<clip,...>: landing,lang,ask,bridge,reply,crisis,gloss,ko,live,insights"); process.exit(1); }
const want = (c) => ONLY.includes(c);
mkdirSync(FRAMES, { recursive: true });
const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {});
const marks = readJson(join(ROOT, ".cache/marks.json"));
const meta = readJson(join(ROOT, ".cache/meta.json"));
const seen = readJson(join(ROOT, ".cache/capture.json"));
const save = () => {
  writeFileSync(join(ROOT, ".cache/marks.json"), JSON.stringify(marks, null, 1));
  writeFileSync(join(ROOT, ".cache/meta.json"), JSON.stringify(meta, null, 1));
  writeFileSync(join(ROOT, ".cache/capture.json"), JSON.stringify(seen, null, 1));
};
const t0 = Date.now();
const log = (...a) => console.log(`+${((Date.now() - t0) / 1000).toFixed(0)}s`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mark = (k) => { marks[k] = Date.now() / 1000; log("mark", k); };

// Headless screencasts come at CSS size unless the scale factor is forced: one browser per device.
const exe = process.env.HOME + "/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const launchAt = (f) => chromium.launch({ executablePath: exe, args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", `--force-device-scale-factor=${f}`] });
const phoneBrowser = await launchAt(3);
const deskBrowser = await launchAt(2);
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" };
const DESK = { viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 };

async function staff(user = "andrea") {
  const ctx = await deskBrowser.newContext(DESK);
  const r = await ctx.request.post(BASE + "/api/login", { data: { username: user, demo: true } });
  if (!r.ok()) throw new Error("login " + r.status());
  return ctx;
}

// A visible pointer for desktop clips, a touch ring for phone clips, and an eased scroll.
const OVERLAY = `(() => {
  if (window.__ease) return;
  window.__ease = (el, prop, to, ms) => new Promise((done) => {
    const from = el[prop]; const start = performance.now();
    const f = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => { const p = Math.min(1, (now - start) / ms); el[prop] = from + (to - from) * f(p); if (p < 1) requestAnimationFrame(step); else done(el[prop]); };
    requestAnimationFrame(step);
  });
  const s = document.createElement('style');
  s.textContent = 'html{scroll-behavior:auto!important}#__cur{position:fixed;left:-40px;top:-40px;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;background:rgba(255,255,255,.96);box-shadow:0 0 0 2px rgba(165,48,30,.85),0 4px 14px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .3s ease,transform .12s ease-out,left .8s cubic-bezier(.22,1,.36,1),top .8s cubic-bezier(.22,1,.36,1)}#__cur.down{transform:scale(.7)}.__ring{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:2px solid rgba(165,48,30,.85);background:rgba(165,48,30,.12);z-index:2147483646;pointer-events:none;animation:__r .55s ease-out forwards}@keyframes __r{from{transform:scale(.35);opacity:1}to{transform:scale(1.5);opacity:0}}';
  document.head.appendChild(s);
  const c = document.createElement('div'); c.id = '__cur'; document.body.appendChild(c);
})()`;

class Rec {
  constructor(page, clip, kind) { this.page = page; this.clip = clip; this.kind = kind; }
  async overlay() { await this.page.evaluate(OVERLAY); }
  async start() {
    const dir = join(FRAMES, this.clip);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    this.frames = [];
    this.cdp = await this.page.context().newCDPSession(this.page);
    this.cdp.on("Page.screencastFrame", (p) => {
      const file = join(dir, `f${String(this.frames.length).padStart(5, "0")}.jpg`);
      writeFileSync(file, Buffer.from(p.data, "base64"));
      this.frames.push({ file, t: p.metadata.timestamp });
      this.cdp.send("Page.screencastFrameAck", { sessionId: p.sessionId }).catch(() => {});
    });
    const v = this.page.viewportSize(), dpr = this.kind === "phone" ? 3 : 2;
    await this.cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1, maxWidth: v.width * dpr, maxHeight: v.height * dpr });
    meta[this.clip] = { kind: this.kind, view: this.page.viewportSize(), rects: {} };
    mark(`${this.clip}:start`);
  }
  async stop() {
    await this.cdp.send("Page.stopScreencast");
    if (this.frames.length) this.frames.push({ file: this.frames.at(-1).file, t: Date.now() / 1000 });
    writeFileSync(join(FRAMES, this.clip, "frames.json"), JSON.stringify(this.frames));
    mark(`${this.clip}:end`);
    log(`${this.clip}: ${this.frames.length} frames`);
    save();
  }
  async rect(name, locator) {
    const b = await locator.boundingBox().catch(() => null);
    meta[this.clip].rects[name] = b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
  }
  /** Desktop: glide the pointer to an element and click it. Phone: a touch ring and a tap. */
  async press(locator, settle = 700) {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    const b = await locator.boundingBox();
    if (!b) throw new Error(`${this.clip}: nothing to press`);
    const x = Math.round(b.x + b.width / 2), y = Math.round(b.y + b.height / 2);
    if (this.kind === "desk") {
      await this.page.evaluate(([x, y]) => { const k = document.getElementById("__cur"); if (k) { k.style.opacity = "1"; k.style.left = x + "px"; k.style.top = y + "px"; } }, [x, y]);
      await sleep(850);
      await this.page.mouse.move(x, y);
      await this.page.evaluate(([x, y]) => { const k = document.getElementById("__cur"); k?.classList.add("down"); const r = document.createElement("div"); r.className = "__ring"; r.style.left = x + "px"; r.style.top = y + "px"; document.body.appendChild(r); setTimeout(() => { k?.classList.remove("down"); r.remove(); }, 600); }, [x, y]);
      await this.page.mouse.click(x, y);
    } else {
      await this.page.evaluate(([x, y]) => { const r = document.createElement("div"); r.className = "__ring"; r.style.left = x + "px"; r.style.top = y + "px"; document.body.appendChild(r); setTimeout(() => r.remove(), 600); }, [x, y]);
      await sleep(120);
      await this.page.touchscreen.tap(x, y);
    }
    await sleep(settle);
  }
  async scrollTo(y, ms = 1200) { await this.page.evaluate(([y, ms]) => window.__ease(document.scrollingElement, "scrollTop", y, ms), [y, ms]); await sleep(150); }
  async scrollBy(dy, ms = 1200) { const y = await this.page.evaluate(() => scrollY); await this.scrollTo(y + dy, ms); }
  async hideCursor() { await this.page.evaluate(() => { const k = document.getElementById("__cur"); if (k) k.style.opacity = "0"; }); }
}

const tabs = (page) => page.locator("[class*=fixed][class*=bottom-0] button");
async function typeSlow(page, locator, text, ms = 42) {
  await locator.click();
  for (const ch of text) { await page.keyboard.type(ch); await sleep(ms + (ch === " " ? 25 : 0) + (/[.,?]/.test(ch) ? 140 : 0)); }
}
async function newPage(ctx, url, wait = 2500) {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => log("pageerror", e.message.slice(0, 160)));
  await page.goto(url);
  await sleep(wait);
  await page.evaluate(OVERLAY);
  return page;
}

// ---------- landing: the rose window turning, then a slow scroll down the page
if (want("landing")) {
  const ctx = await deskBrowser.newContext(DESK);
  const p = await newPage(ctx, BASE + "/", 3500);
  const r = new Rec(p, "landing", "desk");
  await r.start();
  await sleep(9000);
  mark("landing:scroll");
  await r.scrollBy(900, 2600);
  await sleep(2500);
  await r.stop();
  await ctx.close();
}

// ---------- lang: a phone opens the pew page, picks Arabic (right to left), then Italian, and listens
let phoneCtx;
const phoneCtxOnce = async () => (phoneCtx ??= await phoneBrowser.newContext(PHONE));
if (want("lang")) {
  const ctx = await phoneBrowser.newContext(PHONE);
  const p = await newPage(ctx, BASE + "/#/pew?church=san-venanzio-unicam", 3000);
  const r = new Rec(p, "lang", "phone");
  await r.start();
  await sleep(1800);
  await r.press(p.locator("button").filter({ hasText: /^En$/ }).first(), 900);
  mark("lang:picker");
  await sleep(700);
  await r.press(p.locator("button").filter({ hasText: "العربية" }).first(), 400);
  mark("lang:ar");
  await sleep(2600);
  await r.scrollBy(380, 1400);
  await sleep(1200);
  await r.scrollTo(0, 900);
  await sleep(600);
  await r.press(p.locator("button").filter({ hasText: /^ع$/ }).first(), 900);
  mark("lang:picker2");
  await sleep(500);
  await r.press(p.locator("button").filter({ hasText: "Italiano" }).first(), 400);
  mark("lang:it");
  await sleep(2200);
  const listen = p.locator("button").filter({ hasText: "Ascolta" }).first();
  await listen.scrollIntoViewIfNeeded();
  await sleep(300);
  const y = await p.evaluate(() => scrollY);
  await r.scrollTo(Math.max(0, y + 120), 900);
  await sleep(700);
  await r.press(listen, 300);
  mark("lang:listen");
  await sleep(5000);
  await r.stop();
  await ctx.close();
}

// ---------- ask (phone, Spanish) with the pastor's Today screen open at the same time
const REQUEST = "Hola, me llamo Lucía Gómez. Llegué de Bogotá hace tres semanas para estudiar y me siento muy sola. Mi número es +39 347 812 5531. ¿Pueden orar por mí?";
if (want("ask")) {
  const ctx = await phoneCtxOnce();
  const sctx = await staff("andrea");
  const s = await newPage(sctx, BASE + "/#/app/today", 3000);
  const p = await newPage(ctx, BASE + "/#/pew?church=san-venanzio-unicam&lang=es", 2500);
  const r = new Rec(p, "ask", "phone");
  const rs = new Rec(s, "arrive", "desk");
  await rs.start();
  await r.start();
  await sleep(1200);
  await r.press(tabs(p).nth(2), 900);
  mark("ask:tab");
  const ta = p.locator("textarea").last();
  await ta.scrollIntoViewIfNeeded();
  await r.scrollBy(150, 700);
  await r.press(ta, 400);
  await ta.fill("");
  mark("ask:type");
  await typeSlow(p, ta, REQUEST);
  mark("ask:typed");
  await sleep(900);
  await p.keyboard.press("Tab").catch(() => {});
  const prev = p.locator("text=/Lo que saldrá|saldrá de este teléfono|eliminad/i").first();
  await prev.scrollIntoViewIfNeeded().catch(() => {});
  await sleep(300);
  await r.scrollBy(120, 900);
  mark("ask:preview");
  await sleep(2600);
  const send = p.getByText("Enviar al equipo de acompañamiento");
  await r.press(send, 300);
  mark("ask:send");
  await p.waitForSelector("text=/\\b[A-Z0-9]{3}-[A-Z0-9]{3}\\b/", { timeout: 120000 });
  mark("ask:code");
  seen.code = (await p.locator("body").innerText()).match(/\b[A-Z0-9]{3}-[A-Z0-9]{3}\b/)[0];
  log("code", seen.code);
  await sleep(3500);
  await r.stop();
  await sleep(2500);
  mark("arrive:landed");
  seen.today = (await s.locator("body").innerText()).match(/\d+ requests? (are|is) waiting[^\n]*/)?.[0];
  await sleep(1500);
  await rs.stop();
  await sctx.close();
}

// ---------- bridge (desktop): open the request, read the summary and draft, check the meaning, approve
if (want("bridge")) {
  const sctx = await staff("andrea");
  const s = await newPage(sctx, BASE + "/#/app/care", 3500);
  const r = new Rec(s, "bridge", "desk");
  await r.start();
  await sleep(1500);
  const item = s.locator("button").filter({ hasText: "Needs your sign-off" }).filter({ hasText: /Bogot|sola|lonely|alone|Spanish/i }).first();
  await r.rect("item", item);
  await r.press(item, 1500);
  mark("bridge:open");
  const body = await s.locator("body").innerText();
  seen.summary = body.match(/[^\n]*(Bogot|lonely|alone|three weeks)[^\n]*/i)?.[0];
  const ta = s.locator("textarea").first();
  seen.draft = await ta.inputValue();
  await r.rect("summary", s.locator("text=/summary/i").first());
  await sleep(2500);
  await r.scrollBy(380, 1600);
  mark("bridge:draft");
  await sleep(2500);
  const check = s.getByRole("button", { name: /Translate into Spanish and check meaning/ });
  await check.scrollIntoViewIfNeeded();
  await r.rect("check", check);
  await r.press(check, 300);
  mark("bridge:check");
  await s.waitForSelector("text=/Meaning kept|Small change|Meaning changed/i", { timeout: 180000 });
  mark("bridge:checked");
  await sleep(800);
  const res = await s.locator("body").innerText();
  seen.verdict = res.match(/Meaning kept[^\n]*|Small change[^\n]*|Meaning changed[^\n]*/)?.[0];
  const verdict = s.locator("text=/Meaning kept|Small change|Meaning changed/i").first();
  await verdict.scrollIntoViewIfNeeded();
  await r.scrollBy(-200, 900);
  await sleep(1500);
  await r.scrollBy(320, 1600);
  mark("bridge:result");
  await sleep(3000);
  const approve = s.getByRole("button", { name: /Approve and release to pickup code/ });
  await approve.scrollIntoViewIfNeeded();
  await r.scrollBy(140, 700);
  await sleep(600);
  await r.press(approve, 300);
  mark("bridge:approve");
  await sleep(3500);
  seen.approved = (await s.locator("body").innerText()).match(/[^\n]*(Ready for pickup|Released|Approved)[^\n]*/)?.[0];
  await r.stop();
  // the translated texts, for the film's cards
  seen.spanish = res.match(/[^\n]*(Querid|Hola|Lucía|bienvenid)[^\n]*/i)?.[0];
  await sctx.close();
}

// ---------- reply (phone): the same phone opens its reply with the code; the name comes back on this phone only
if (want("reply")) {
  const ctx = await phoneCtxOnce();
  const code = seen.code;
  if (!code) throw new Error("no code: run ask first in the same run");
  const p = await newPage(ctx, BASE + "/#/pew?church=san-venanzio-unicam&lang=es", 2000);
  const r = new Rec(p, "reply", "phone");
  await r.start();
  await sleep(1000);
  await r.press(tabs(p).nth(3), 900);
  const mine = p.locator("button:visible").filter({ hasText: /respuestas|código/i }).first();
  await r.press(mine, 1200);
  mark("reply:codes");
  const row = p.locator("button:visible, a:visible").filter({ hasText: code }).first();
  if (await row.count()) await r.press(row, 1500);
  else { await p.goto(BASE + "/#/pickup/" + code); await sleep(2000); await r.overlay(); }
  mark("reply:open");
  seen.reply = (await p.locator("body").innerText()).slice(0, 1600);
  await sleep(2500);
  await r.scrollBy(420, 2200);
  mark("reply:scroll");
  await sleep(2500);
  await r.scrollBy(520, 2200);
  await sleep(2500);
  await r.stop();
}

// ---------- crisis: typed on a phone (English) while the pastor's dashboard is open
if (want("crisis")) {
  const sctx = await staff("andrea");
  const s = await newPage(sctx, BASE + "/#/app/today", 3000);
  const ctx = await phoneBrowser.newContext(PHONE);
  const p = await newPage(ctx, BASE + "/#/pew?church=san-venanzio-unicam&lang=en", 2000);
  const r = new Rec(p, "crisis", "phone");
  const rs = new Rec(s, "alert", "desk");
  await rs.start();
  await r.start();
  await sleep(1000);
  await r.press(tabs(p).nth(2), 900);
  const ta = p.locator("textarea").last();
  await ta.scrollIntoViewIfNeeded();
  await r.scrollBy(150, 700);
  await r.press(ta, 300);
  await ta.fill("");
  mark("crisis:type");
  await typeSlow(p, ta, "I don't feel safe at home tonight.", 55);
  await sleep(1200);
  const send = p.locator("button").filter({ hasText: /^Send/ }).last();
  await r.press(send, 200);
  mark("crisis:send");
  await sleep(4500);
  seen.crisisPhone = (await p.locator("body").innerText()).slice(0, 700);
  await r.scrollBy(300, 1500);
  await sleep(2500);
  await r.stop();
  mark("alert:seen");
  seen.alert = (await s.locator("body").innerText()).match(/[^\n]*(Urgent|crisis)[^\n]*/i)?.[0];
  await sleep(1500);
  const open = s.locator("button, a").filter({ hasText: /Urgent request|Open|crisis/i }).first();
  if (await open.count()) { await rs.press(open, 2500); mark("alert:open"); await sleep(3000); }
  await rs.stop();
  await ctx.close();
  await sctx.close();
}

// ---------- gloss (desktop): the tradition glossary, Korean, before and after
if (want("gloss")) {
  const sctx = await staff("andrea");
  const s = await newPage(sctx, BASE + "/#/app/care", 3000);
  const r = new Rec(s, "gloss", "desk");
  await r.start();
  await sleep(1000);
  await r.press(s.getByRole("button", { name: "Tradition glossary" }), 1500);
  mark("gloss:open");
  const ko = s.locator("button").filter({ hasText: /Korean|한국어/ }).first();
  if (await ko.count()) { await r.press(ko, 1200); mark("gloss:ko"); }
  await sleep(1500);
  const cmp = s.getByRole("button", { name: /Compare live translations/ });
  await cmp.scrollIntoViewIfNeeded();
  await r.scrollBy(200, 900);
  await r.press(cmp, 300);
  mark("gloss:compare");
  await s.waitForSelector("text=/Without the glossary/", { timeout: 120000 });
  mark("gloss:result");
  await sleep(600);
  await r.scrollBy(220, 1000);
  await sleep(4500);
  seen.gloss = (await s.locator("body").innerText()).match(/Without the glossary[\s\S]{0,400}/)?.[0];
  await r.stop();
  await sctx.close();
}

// ---------- ko (phone): the same Korean pew page in each church: 미사 for the parish, 예배 for the Protestant church
if (want("ko")) {
  for (const [clip, church] of [["ko-cath", "san-venanzio-unicam"], ["ko-prot", "grace-fellowship-us"]]) {
    const ctx = await phoneBrowser.newContext(PHONE);
    const p = await newPage(ctx, `${BASE}/#/pew?church=${church}&lang=ko`, 2500);
    const r = new Rec(p, clip, "phone");
    await r.start();
    await sleep(1500);
    await r.press(tabs(p).nth(1), 1200);
    mark(`${clip}:tab`);
    await sleep(2500);
    seen[clip] = (await tabs(p).allInnerTexts()).join(" | ");
    await r.stop();
    await ctx.close();
  }
}

// ---------- live: a phone following the service while a volunteer taps Next on the console
if (want("live")) {
  const sctx = await staff("minh");
  const s = await newPage(sctx, BASE + "/#/app/live", 3000);
  const back = s.getByRole("button", { name: /^Back/ });
  while (await back.isEnabled()) { await back.click(); await sleep(400); }
  const ctx = await phoneBrowser.newContext(PHONE);
  const p = await newPage(ctx, BASE + "/#/pew?church=san-venanzio-unicam&lang=ar", 2500);
  await tabs(p).nth(1).click();
  await sleep(800);
  const r = new Rec(p, "follow", "phone");
  const rs = new Rec(s, "live", "desk");
  await rs.start();
  await r.start();
  await sleep(1200);
  const follow = p.locator("button").filter({ hasText: /مباشر|live/i }).first();
  await r.press(follow, 1500);
  mark("follow:on");
  await sleep(1500);
  const next = s.getByRole("button", { name: /^Next/ });
  await rs.press(next, 200);
  mark("live:next1");
  await sleep(3500);
  await rs.press(next, 200);
  mark("live:next2");
  await sleep(3500);
  await r.stop();
  await rs.stop();
  while (await back.isEnabled()) { await back.click(); await sleep(400); }
  await ctx.close();
  await sctx.close();
}

// ---------- insights (desktop): who is in the pews, and the greeter gap
if (want("insights")) {
  const sctx = await staff("minh");
  const s = await newPage(sctx, BASE + "/#/app/groups", 3500);
  const r = new Rec(s, "insights", "desk");
  await r.start();
  await sleep(2500);
  await r.rect("notes", s.locator("text=Notes for the volunteer rota").first());
  await r.rect("arabic", s.locator("text=/Arabic scans up/").first());
  mark("insights:notes");
  await sleep(4500);
  await r.stop();
  await sctx.close();
}

save();
await phoneBrowser.close();
await deskBrowser.close();
log("done", JSON.stringify(seen).slice(0, 300));
