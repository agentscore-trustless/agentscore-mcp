// src/index.ts
import { Server } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/transports/stdio';
import express from 'express';
import { registerAgentScoreTools } from './tools.js';

const NAME = 'agent-score-mcp';
const VERSION = '1.0.0';

async function startStdio() {
  const server = new Server({ name: NAME, version: VERSION });
  registerAgentScoreTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log(`[${NAME}] Stdio transport ready`);
}

async function startHttp(port: number = 3000) {
  const app = express();
  app.use(express.json());

  app.post('/mcp', async (req, res) => {
    // For HTTP we usually create a fresh server instance per request (stateless style)
    // or use a singleton + session handling if you need state
    const server = new Server({ name: NAME, version: VERSION });
    registerAgentScoreTools(server);

    // Streamable HTTP transport handling is a bit more involved in recent versions;
    // many examples now use the lower-level protocol handling or helper functions.
    // For simplicity, we can use a basic request/response pattern here.
    // If you need full streaming/SSE later, consider @modelcontextprotocol/server's http helpers.

    try {
      // This is a simplified handler – adapt based on your needs
      const response = await server.handleRequest(req.body);
      res.json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error', details: (err as Error).message });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`[${NAME}] HTTP server running on http://localhost:${port}/mcp`);
  });
}

// Choose transport based on env
const httpPort = process.env.HTTP_PORT ? parseInt(process.env.HTTP_PORT, 10) : undefined;

if (httpPort) {
  startHttp(httpPort);
} else {
  startStdio();
}
