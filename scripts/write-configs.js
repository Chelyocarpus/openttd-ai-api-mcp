import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.join(root, 'generated');
const server = path.join(root, 'src', 'server.js');

await fs.mkdir(outDir, { recursive: true });

const base = {
  command: process.execPath,
  args: [server],
};

const generic = {
  mcpServers: {
    'openttd-ai-api': base,
  },
};

const cursor = {
  mcpServers: {
    'openttd-ai-api': {
      type: 'stdio',
      ...base,
    },
  },
};

const vscode = {
  servers: {
    'openttd-ai-api': {
      type: 'stdio',
      ...base,
    },
  },
};

const claudeDesktop = {
  mcpServers: {
    'openttd-ai-api': base,
  },
};

const files = [
  ['mcp-generic.json', generic],
  ['mcp-cursor.json', cursor],
  ['mcp-vscode.json', vscode],
  ['mcp-claude-desktop.json', claudeDesktop],
];

for (const [name, value] of files) {
  await fs.writeFile(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

console.log('Created MCP config files in:');
console.log(outDir);
console.log('');
console.log('Server file:');
console.log(server);
