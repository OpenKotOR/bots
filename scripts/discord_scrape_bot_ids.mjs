#!/usr/bin/env node
/**
 * Navigates Discord Developer Portal, handles login flow, reads all application
 * names + IDs, and prints the .env snippet needed to start community-bots bots.
 *
 * Usage: node scripts/discord_scrape_bot_ids.mjs
 * A headed Chromium window will open — log in when prompted.
 */
import { setTimeout as sleep } from "node:timers/promises";

async function loadPlaywright() {
  for (const pkg of ["playwright", "@playwright/test"]) {
    try {
      const m = await import(pkg);
      const c = m.chromium ?? m.default?.chromium;
      if (c) return c;
    } catch { /* try next */ }
  }
  throw new Error("Playwright not installed.");
}

const BOTS = [
  { envPrefix: "TRASK",  keywords: ["trask", "holocron", "kotor", "openkotor", "qa bot"] },
  { envPrefix: "HK",     keywords: ["hk", "hk-86", "hk86", "hk 86"] },
  { envPrefix: "PAZAAK", keywords: ["pazaak", "cardworld", "card world"] },
];

const LOGIN_WAIT_MS = 120_000;

const waitForAppsPage = async (page) => {
  // The Applications page is authenticated once we see app cards OR the sort-by bar without a modal
  const deadline = Date.now() + LOGIN_WAIT_MS;
  let dotsPrinted = 0;
  while (Date.now() < deadline) {
    // Check if the Login modal is gone
    const modal = await page.locator('button:has-text("Log In"), a:has-text("Log In")').count();
    const onApps = page.url().includes("/applications");
    if (onApps && modal === 0) {
      process.stdout.write("\n");
      return true;
    }
    // Click "Log In" button in modal if visible
    try {
      const loginBtn = page.locator('button:has-text("Log In")').first();
      if (await loginBtn.isVisible({ timeout: 500 })) {
        await loginBtn.click();
        await sleep(1500);
        continue;
      }
    } catch { /* not visible yet */ }
    if (dotsPrinted % 5 === 0) {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      process.stdout.write(`\r   ⏳ Waiting for login… ${remaining}s remaining `);
    }
    dotsPrinted++;
    await sleep(2000);
  }
  return false;
};

const main = async () => {
  const chromium = await loadPlaywright();
  const browser  = await chromium.launch({
    headless: false,
    args: ["--no-sandbox"],
    slowMo: 100,
  });
  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  console.log("\n🌐  Opening Discord Developer Portal…");
  console.log("   A browser window will open — log in to your Discord account.\n");

  await page.goto("https://discord.com/developers/applications", {
    timeout: 60_000,
    waitUntil: "domcontentloaded",
  });

  const loggedIn = await waitForAppsPage(page);
  if (!loggedIn) {
    await page.screenshot({ path: "/tmp/discord-apps.png" });
    console.error("✗  Login timed out. Screenshot: /tmp/discord-apps.png");
    await browser.close();
    process.exit(1);
  }
  console.log("✓  On Applications page.");

  // Wait for app list to populate
  await sleep(2000);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.screenshot({ path: "/tmp/discord-apps-logged-in.png" });
  console.log("Screenshot saved: /tmp/discord-apps-logged-in.png");

  // Extract app links from the page
  const apps = await page.evaluate(() => {
    const results = new Map();
    // Pattern 1: links to /developers/applications/<id>
    for (const el of document.querySelectorAll('a[href*="/developers/applications/"]')) {
      const m = el.getAttribute("href")?.match(/\/applications\/(\d+)/);
      if (!m) continue;
      const id = m[1];
      if (results.has(id)) continue;
      // Walk up to find the card root and grab its display name
      let name = el.textContent?.trim() || "";
      let node = el;
      for (let i = 0; i < 5 && node; i++) {
        const heading = node.querySelector("h2,h3,[class*='name'],[class*='title']");
        if (heading?.textContent?.trim()) { name = heading.textContent.trim(); break; }
        node = node.parentElement;
      }
      results.set(id, { id, name: name || "(unnamed)" });
    }
    return [...results.values()];
  });

  console.log(`\nFound ${apps.length} application(s):`);
  for (const a of apps) console.log(`  [${a.id}]  ${a.name}`);

  const envLines = [];
  const found = {};
  for (const bot of BOTS) {
    const match = apps.find(a =>
      bot.keywords.some(k => a.name.toLowerCase().includes(k))
    );
    if (match) {
      envLines.push(`${bot.envPrefix}_DISCORD_APP_ID=${match.id}`);
      found[bot.envPrefix] = match;
      console.log(`\n✓  ${bot.envPrefix} → "${match.name}" (${match.id})`);
    } else {
      envLines.push(`# ${bot.envPrefix}_DISCORD_APP_ID=  (click app in browser to find ID)`);
      console.log(`\n?  ${bot.envPrefix} — not matched. Check app names above.`);
    }
  }

  console.log("\n══════════════════════════════════════════════════════");
  console.log("Copy to your .env (App IDs only — get Bot Tokens from Bot tab):");
  console.log(envLines.join("\n"));
  console.log("══════════════════════════════════════════════════════\n");
  console.log("The browser stays open — click each app to get its Bot Token:");
  console.log("  App → Bot tab → Reset/Copy Token → add to .env\n");
  console.log("Press Ctrl+C when you're done copying tokens.\n");

  await page.waitForEvent("close", { timeout: 300_000 }).catch(() => {});
  await browser.close();
};

main().catch(e => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
