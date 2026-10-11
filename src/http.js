import { createServer } from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { config } from './config.js';
import { DocsStore } from './index-store.js';
import { createOpenTtdServer } from './mcp.js';

const host = process.env.MCP_HOST ?? '127.0.0.1';
const port = Number(process.env.MCP_PORT ?? 3000);
const store = await DocsStore.open(config.indexPath);
const mcpHandler = createMcpHandler(() => createOpenTtdServer(store));
const nodeHandler = toNodeHandler(mcpHandler);

const httpServer = createServer(async (req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(store.ready ? 200 : 503, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      ok: store.ready,
      docsVersion: store.meta.docsVersion,
      documents: store.meta.documentCount,
    }));
    return;
  }

  if (req.url?.startsWith('/mcp')) {
    await nodeHandler(req, res);
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found. MCP endpoint: /mcp\n');
});

httpServer.listen(port, host, () => {
  console.error(`[openttd-ai-api-mcp] HTTP MCP listening at http://${host}:${port}/mcp`);
});
