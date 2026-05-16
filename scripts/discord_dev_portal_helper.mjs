#!/usr/bin/env node
/**
 * Opens the Discord Developer Portal in a headed Playwright browser,
 * waits for user to log in (120 seconds), then scrapes visible app IDs
 * for the 3 community-bots applications (Trask, HK-86, Pazaak).
 *
 * Usage: node scripts/discord_dev_portal_helper.mjs
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
  throw new Error("Playwright not installed. Run: npx playwright install chromium");
}

const DISCORD_DEV_URL = "https://discord.com/developers/applications";
const LOGIN_WAIT_MS   = 120_000;
const TICK_MS         = 5_000;

const main = async () => {
  const chromium = await loadPlaywright();
  const browser  = await chromium.launch({ headless: false, args: ["--no-sandbox"] });
  const ctx      = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page     = await ctx.newPage();

  console.log(`\n🌐  Opening Discord Developer Portal…`);
  await page.goto(DISCORD_DEV_URL, { timeout: 60_000 });

  // Detect if we're at a login screen
  const isLogin = await page.getByText(/Log In|Sign In/i).count() > 0;
  if (isLogin) {
    console.log(`\n⏳  Login screen detected — you have ${LOGIN_WAIT_MS / 1000}s to log in to Discord.\n`);
    const deadline = Date.now() + LOGIN_WAIT_MS;
    while (Date.now() < deadline) {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      const stillLogin = await page.getByText(/Log In|Sign In/i).count() > 0;
      if (!stillLogin) {
        console.log("✓  Logged in!");
        break;
      }
      process.stdout.write(`\r   ${remaining}s remaining…`);
      await sleep(TICK_MS);
    }
    console.log();
  }

  // Navigate to applications list
  console.log("🔍  Looking for registered applications…\n");
  if (!page.url().includes("/applications")) {
    await page.goto(DISCORD_DEV_URL, { timeout: 30_000 });
  }
  await sleep(2000);

  // Read visible application cards
  const apps = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[class*="applicationCard"], [data-list-item-id], [class*="card"]'));
    return cards.map(c => ({
      name: c.querySelector('[class*="name"], h2, h3')?.textContent?.trim() ?? c.textContent?.trim().slice(0, 60),
      id:   c.getAttribute("data-list-item-id") ?? "",
    })).filter(c => c.name);
  });

  if (apps.length > 0) {
    console.log("Found applications:");
    for (const a of apps) console.log(`  ${a.name}  (id: ${a.id || "(click to see)"})`);
  } else {
    console.log("Could not auto-read app list — check the browser window.");
  }

  console.log(`
Next steps:
  1. In the browser window, click each bot (Trask / HK-86 / Pazaak)
  2. Copy the APPLICATION ID from the "General Information" tab
  3. Go to "Bot" tab → Reset Token → copy the Bot Token
  4. Add to your .env (or apps/<bot>/.env):
     TRASK_DISCORD_APP_ID=...   TRASK_DISCORD_BOT_TOKEN=...
     HK_DISCORD_APP_ID=...      HK_DISCORD_BOT_TOKEN=...
     PAZAAK_DISCORD_APP_ID=...  PAZAAK_DISCORD_BOT_TOKEN=...

Press Ctrl+C or close the browser window when done.
`);

  // Keep browser open so user can copy tokens
  await page.waitForEvent("close", { timeout: 300_000 }).catch(() => {});
  await browser.close();
};

main().catch(e => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
