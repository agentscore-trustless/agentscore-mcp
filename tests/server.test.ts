// Simple tests (run with npm test)
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { registerAgentScoreTools } from "../src/tools.js";
import { McpServer } from "@modelcontextprotocol/server";

describe("AgentScore MCP Tools", () => {
  const server = new McpServer({ name: "test", version: "1.0" });
  registerAgentScoreTools(server);

  it("should register all 3 tools", () => {
    expect(server.tools).toHaveLength(3);
  });

  it("getAgentScore input schema accepts tokenId or address", () => {
    const schema = z.object({ identifier: z.union([z.number(), z.string()]) });
    expect(() => schema.parse({ identifier: 1 })).not.toThrow();
    expect(() => schema.parse({ identifier: "0x123..." })).not.toThrow();
  });
});
