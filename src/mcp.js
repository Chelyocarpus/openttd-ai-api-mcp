import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { crawlOpenTtdDocs } from './crawler.js';
import { config } from './config.js';

export function createOpenTtdServer(store) {
  const server = new McpServer({
    name: 'openttd-ai-api-docs',
    version: '0.1.0',
    description: 'Context7-style documentation lookup for the OpenTTD AI API.',
  });

  server.registerTool(
    'resolve-library-id',
    {
      title: 'Resolve OpenTTD AI API library',
      description: 'Resolve the OpenTTD AI API documentation to the canonical library ID used by this MCP server.',
      inputSchema: z.object({
        libraryName: z.string().default('OpenTTD AI API').describe('Library name or OpenTTD AI API identifier.'),
      }),
    },
    async () => textResult([
      `Library ID: ${config.libraryId}`,
      'Name: OpenTTD AI API',
      `Source: ${store.meta.sourceUrl}`,
      `Indexed docs version: ${store.meta.docsVersion}`,
      `Indexed documents: ${store.meta.documentCount}`,
      `Indexed at: ${store.meta.indexedAt ?? 'not indexed yet'}`,
    ].join('\n')),
  );

  server.registerTool(
    'query-docs',
    {
      title: 'Query OpenTTD AI API documentation',
      description: 'Search the indexed OpenTTD AI API documentation and return the most relevant classes, methods, signatures, parameters, preconditions, and return-value documentation.',
      inputSchema: z.object({
        libraryId: z.string().default(config.libraryId).describe('Use /openttd/ai-api.'),
        query: z.string().min(1).describe('Natural-language question or exact API symbol, e.g. AIRail::GetRailStationDirection.'),
        className: z.string().optional().describe('Optional class filter such as AIRail.'),
        limit: z.number().int().min(1).max(10).default(6),
      }),
    },
    async ({ libraryId, query, className, limit }) => {
      if (libraryId !== config.libraryId) {
        return errorResult(`Unknown library ID "${libraryId}". Use ${config.libraryId}.`);
      }
      if (!store.ready) return notIndexedResult();

      const results = store.search(query, { limit, className });
      if (!results.length) return textResult(`No OpenTTD AI API documentation matched: ${query}`);

      return textResult(formatResults(results, config.maxQueryChars));
    },
  );

  server.registerTool(
    'search-symbols',
    {
      title: 'Search OpenTTD API symbols',
      description: 'Find OpenTTD AI API classes and members by exact or fuzzy symbol name.',
      inputSchema: z.object({
        query: z.string().min(1).describe('Class or member name, e.g. GetRailStationDirection or AIRail.'),
        className: z.string().optional(),
        limit: z.number().int().min(1).max(25).default(10),
      }),
    },
    async ({ query, className, limit }) => {
      if (!store.ready) return notIndexedResult();
      const results = store.search(query, { limit: Math.min(75, limit * 3), className })
        .filter((result) => result.kind === 'class' || result.kind === 'symbol')
        .slice(0, limit);

      const body = results.length
        ? results.map((result, i) => `${i + 1}. ${result.title}\n   ${result.url}`).join('\n')
        : `No API symbols matched: ${query}`;
      return textResult(body);
    },
  );

  server.registerTool(
    'refresh-docs',
    {
      title: 'Refresh OpenTTD AI API index',
      description: 'Download the current OpenTTD AI API Doxygen documentation and rebuild the local search index.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        const index = await crawlOpenTtdDocs({
          docsBase: config.docsBase,
          indexPath: config.indexPath,
          onProgress: (message) => console.error(`[index] ${message}`),
        });
        store.replace(index);
        return textResult(`Indexed ${index.documentCount} OpenTTD AI API documents from ${index.docsVersion} at ${index.indexedAt}.`);
      } catch (error) {
        return errorResult(`Failed to refresh OpenTTD docs: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  );

  server.registerResource(
    'openttd-ai-api-about',
    'openttd://ai-api/about',
    {
      title: 'OpenTTD AI API MCP index metadata',
      mimeType: 'text/plain',
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: [
          `Library ID: ${config.libraryId}`,
          `Source: ${store.meta.sourceUrl}`,
          `Version: ${store.meta.docsVersion}`,
          `Documents: ${store.meta.documentCount}`,
          `Indexed at: ${store.meta.indexedAt ?? 'not indexed yet'}`,
        ].join('\n'),
      }],
    }),
  );

  return server;
}

function formatResults(results, maxChars) {
  let used = 0;
  const sections = [];

  for (const result of results) {
    const content = String(result.content ?? '').trim();
    const section = [
      `## ${result.title}`,
      result.className ? `Class: ${result.className}` : null,
      result.symbol ? `Symbol: ${result.symbol}` : null,
      `Source: ${result.url}`,
      '',
      content,
    ].filter((line) => line !== null).join('\n');

    if (used + section.length > maxChars) {
      const remaining = Math.max(0, maxChars - used);
      if (remaining > 400) sections.push(`${section.slice(0, remaining)}\n…[truncated]`);
      break;
    }

    sections.push(section);
    used += section.length;
  }

  return sections.join('\n\n---\n\n');
}

function notIndexedResult() {
  return errorResult('The local OpenTTD documentation index is empty. Run `npm run index` once, or call the `refresh-docs` MCP tool, then retry.');
}

function textResult(text) {
  return { content: [{ type: 'text', text }] };
}

function errorResult(text) {
  return { isError: true, content: [{ type: 'text', text }] };
}
