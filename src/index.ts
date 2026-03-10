// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAgentScoreTools } from './tools.js';

const NAME = 'agent-score-mcp';
const VERSION = '1.0.0';

async function main() {
  const server = new McpServer({ name: NAME, version: VERSION });
  registerAgentScoreTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[${NAME}] MCP server started via stdio`);
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
