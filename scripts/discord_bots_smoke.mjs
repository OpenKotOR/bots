#!/usr/bin/env node
const bots = [
  { name: "Trask", prefix: "TRASK", expectedCommands: ["ask", "sources", "queue-reindex"] },
  { name: "HK-86", prefix: "HK", expectedCommands: ["designations"] },
  { name: "Pazaak", prefix: "PAZAAK", expectedCommands: ["pazaak", "pazaak-admin"] },
];

const getEnv = (name) => process.env[name]?.trim();

const fetchJson = async (url, token) => {
  const res = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Discord API returned non-JSON ${res.status}: ${text.slice(0, 300)}`);
  }
  if (!res.ok) {
    throw new Error(`Discord API ${res.status}: ${JSON.stringify(json).slice(0, 500)}`);
  }
  if (!Array.isArray(json)) {
    throw new Error(`Unexpected Discord command response: ${JSON.stringify(json).slice(0, 500)}`);
  }
  return json;
};

const commandNames = (commands) => new Set(commands.map((command) => command.name).filter(Boolean));

let failures = 0;

for (const bot of bots) {
  const token = getEnv(`${bot.prefix}_DISCORD_BOT_TOKEN`);
  const appId = getEnv(`${bot.prefix}_DISCORD_APP_ID`);
  const guildId = getEnv(`${bot.prefix}_DISCORD_GUILD_ID`) ?? getEnv("DISCORD_TARGET_GUILD_ID");

  if (!token || !appId) {
    console.warn(`SKIP ${bot.name}: set ${bot.prefix}_DISCORD_BOT_TOKEN and ${bot.prefix}_DISCORD_APP_ID.`);
    failures += 1;
    continue;
  }

  const globalUrl = `https://discord.com/api/v10/applications/${encodeURIComponent(appId)}/commands`;
  const guildUrl = guildId
    ? `https://discord.com/api/v10/applications/${encodeURIComponent(appId)}/guilds/${encodeURIComponent(guildId)}/commands`
    : undefined;

  try {
    const globalCommands = await fetchJson(globalUrl, token);
    const guildCommands = guildUrl ? await fetchJson(guildUrl, token) : [];
    const names = commandNames([...globalCommands, ...guildCommands]);
    const missing = bot.expectedCommands.filter((name) => !names.has(name));
    if (missing.length > 0) {
      failures += 1;
      console.error(`FAIL ${bot.name}: missing commands ${missing.join(", ")}. Registered: ${[...names].join(", ") || "(none)"}`);
    } else {
      console.log(`PASS ${bot.name}: commands available (${bot.expectedCommands.join(", ")}).`);
    }
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${bot.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures > 0) {
  process.exit(1);
}
