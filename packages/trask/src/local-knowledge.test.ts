import assert from "node:assert/strict";
import test from "node:test";

import type { ResearchWizardRuntimeConfig, SharedAiConfig } from "@openkotor/config";
import type { SearchProvider } from "@openkotor/retrieval";

import { ResearchWizardClient } from "./research-wizard.js";

const testRuntime: ResearchWizardRuntimeConfig = {
  gptResearcherRoot: undefined,
  pythonExecutable: "python",
  headlessScriptPath: undefined,
  timeoutMs: 1_000,
};

const testAi: SharedAiConfig = {
  openAiApiKey: undefined,
  openAiBaseUrl: undefined,
  openAiDefaultHeaders: undefined,
  firecrawlApiKey: undefined,
  chatModel: "gpt-5.4-mini",
  chatModelFallbacks: [],
  embeddingModel: "text-embedding-3-large",
  databaseUrl: undefined,
};

const makeSearchProvider = (): SearchProvider => ({
  async listSources() {
    return [];
  },
  async search() {
    return [
      {
        sourceId: "approved-discord-knowledge",
        sourceName: "Approved Discord Knowledge",
        kind: "discord",
        title: "asset-transfer thread",
        snippet: "Use TPC textures when converting from TGA for this workflow.",
        url: "discord://approved-channels/123/900-950",
        score: 10,
        tags: ["discord", "qa"],
      },
    ];
  },
  async queueReindex() {
    return { queuedSourceIds: [], mode: "file-queue" as const };
  },
});

test("answerQuestion falls back to local knowledge when research fetch fails", async () => {
  const client = new ResearchWizardClient(testRuntime, testAi, undefined, makeSearchProvider());

  (client as unknown as { fetchResearchReport: () => Promise<never> }).fetchResearchReport = async () => {
    throw new Error("forced failure");
  };

  const response = await client.answerQuestion("How do I fix texture conversion?");
  assert.equal(response.approvedSources.length, 1);
  assert.match(response.answer, /local knowledge/i);
  assert.match(response.answer, /discord:\/\/approved-channels/);
});

test("answerQuestion merges local knowledge sources into final source list", async () => {
  const client = new ResearchWizardClient(testRuntime, testAi, undefined, makeSearchProvider());

  (client as unknown as { fetchResearchReport: () => Promise<{ report: string; payload: { report: string } }> }).fetchResearchReport
    = async () => ({
      report: "Use MDLOps for model conversion steps.",
      payload: { report: "Use MDLOps for model conversion steps." },
    });

  const response = await client.answerQuestion("Which tools convert models?");
  assert.ok(response.approvedSources.some((source) => source.homeUrl.startsWith("discord://approved-channels/")));
  assert.match(response.answer, /Sources/i);
});
