// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/transports/stdio";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/transports/streamable-http";
import express from "express";
import { registerAgentScoreTools } from "./tools.js";

const NAME = "agent-score-mcp";
const VERSION = "1.0.0";

async function startStdio() {
  const server = new McpServer({ name: NAME, version: VERSION });
  registerAgentScoreTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(`[${NAME}] Stdio transport ready`);
}

async function startHttp(port: number = 3000) {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const server = new McpServer({ name: NAME, version: VERSION });
    registerAgentScoreTools(server);

    const transport = new StreamableHTTPServerTransport({
      // optional: can add session handling later if needed
    });

    try {
      await server.connect(transport);
      await transport.handle(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(
      `[${NAME}] HTTP/SSE server running on http://localhost:${port}/mcp`,
    );
  });
}

// Choose transport
const httpPort = process.env.HTTP_PORT
  ? parseInt(process.env.HTTP_PORT, 10)
  : undefined;

if (httpPort) {
  startHttp(httpPort);
} else {
  startStdio();
}
