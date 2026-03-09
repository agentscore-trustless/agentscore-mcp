# AgentScore MCP Server

Official MCP server for the AgentScore Registry (Base Sepolia).

## Quick Start

```bash
npm install
npm run build
npm run dev          # stdio (Claude Desktop, Cursor, etc.)
# or
HTTP_PORT=3000 npm start   # HTTP/SSE
```

## Docker (recommended for HTTP)

```bash
npm run docker:build
npm run docker:run
# Server available at http://localhost:3000/mcp
```

## Configure in MCP Clients

Claude Desktop / Cursor / Windsurf
Add to your MCP config (usually `~/Library/Application Support/Claude/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "agent-score": {
      "command": "node",
      "args": ["/absolute/path/to/agent-score-mcp/dist/index.js"]
    }
  }
}
```

### For Docker version:

```json
{
  "mcpServers": {
    "agent-score": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "agent-score-mcp"]
    }
  }
}
```

## HTTP clients (e.g. custom agents)

POST to `http://localhost:3000/mcp` with standard MCP JSON-RPC.

### Available Tools

- `getAgentScore(identifier)` → `{score, historyCount, metadataURI}`
- `getAgentHistory(tokenId, limit)` → `[{score, timestamp}, ...]`
- `listRegisteredAgents(owner?)` → array of enriched agents

All read-only. Zero private keys. Fully trustless.

Enjoy building with AgentScore reputation! 🚀
