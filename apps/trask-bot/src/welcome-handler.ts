import { Events, type Client, type GuildMember } from "discord.js";

import type { TraskBotConfig } from "@openkotor/config";
import type { Logger } from "@openkotor/core";

const renderWelcomeMessage = (template: string, member: GuildMember): string => {
  return template
    .replaceAll("$mention", `<@${member.id}>`)
    .replaceAll("$user", member.user.username)
    .replaceAll("$server", member.guild.name)
    .replaceAll("@everyone", "@\u200beveryone")
    .replaceAll("@here", "@\u200bhere")
    .trim();
};

export const registerTraskWelcomeHandler = (client: Client, config: TraskBotConfig, logger: Logger): void => {
  if (!config.welcome) {
    return;
  }

  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      if (config.allowedGuildIds.length > 0 && !config.allowedGuildIds.includes(member.guild.id)) {
        return;
      }

      const channel = await client.channels.fetch(config.welcome!.channelId).catch(() => null);
      if (!channel || !channel.isTextBased() || channel.isDMBased()) {
        return;
      }

      const content = renderWelcomeMessage(config.welcome!.message, member);
      if (!content) {
        return;
      }

      await channel.send({
        content,
        allowedMentions: { users: [member.id], parse: [] },
      });
    } catch (error) {
      logger.warn("Trask welcome handler failed to post welcome message.", {
        error: error instanceof Error ? error.message : String(error),
        guildId: member.guild.id,
        memberId: member.id,
      });
    }
  });
};
