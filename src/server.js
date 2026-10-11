import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { config } from './config.js';
import { DocsStore } from './index-store.js';
import { createOpenTtdServer } from './mcp.js';

const store = await DocsStore.open(config.indexPath);

console.error(`[openttd-ai-api-mcp] index: ${store.meta.documentCount} docs (${store.meta.docsVersion})`);
console.error('[openttd-ai-api-mcp] serving MCP over stdio');

void serveStdio(() => createOpenTtdServer(store));
