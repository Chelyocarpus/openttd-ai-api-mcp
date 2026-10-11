import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const server = path.join(root, 'src', 'server.js');
const name = 'openttd-ai-api';
const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');

const stdio = {
  type: 'stdio',
  command: process.execPath,
  args: [server],
};

async function readJsonOrEmpty(configPath) {
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    console.error(`\nCould not read this config file:\n  ${configPath}`);
    console.error('It contains invalid JSON, so I left it untouched.');
    throw error;
  }
}

async function mergeJson(configPath, topLevelKey, serverConfig) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  const config = await readJsonOrEmpty(configPath);
  config[topLevelKey] ??= {};
  config[topLevelKey][name] = serverConfig;
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return configPath;
}

async function connectCursor() {
  const configPath = path.join(os.homedir(), '.cursor', 'mcp.json');
  await mergeJson(configPath, 'mcpServers', stdio);
  console.log('\n✓ Connected to Cursor');
  console.log(`  ${configPath}`);
  console.log('  Restart Cursor if it is already open.');
}

async function connectVsCode() {
  // Default VS Code user-profile MCP config on Windows.
  const configPath = path.join(appData, 'Code', 'User', 'mcp.json');
  await mergeJson(configPath, 'servers', stdio);
  console.log('\n✓ Connected to VS Code (default user profile)');
  console.log(`  ${configPath}`);
  console.log('  Restart VS Code if it is already open.');
  console.log('  VS Code may ask you to trust/start the local MCP server once.');
}

async function connectClaudeDesktop() {
  const claudeDir = path.join(appData, 'Claude');
  const configPath = path.join(claudeDir, 'claude_desktop_config.json');

  if (!fsSync.existsSync(claudeDir)) {
    console.log('\n! Claude Desktop config folder does not exist yet.');
    console.log('  That is okay: I will create it.');
    console.log('  If Claude Desktop is not installed, install/open it before trying to use the MCP.');
  }

  // Claude Desktop uses mcpServers; "type" is not required for local stdio entries.
  const claudeConfig = {
    command: process.execPath,
    args: [server],
  };
  await mergeJson(configPath, 'mcpServers', claudeConfig);
  console.log('\n✓ Connected to Claude Desktop');
  console.log(`  ${configPath}`);
  console.log('  Fully quit Claude Desktop, then open it again.');
}

function commandExists(command) {
  const result = spawnSync('where', [command], { stdio: 'ignore', shell: true });
  return result.status === 0;
}

function runClaude(args) {
  const result = spawnSync('claude', args, {
    stdio: 'inherit',
    shell: true,
    cwd: root,
  });
  return result.status ?? 1;
}

async function connectClaudeCode() {
  if (!commandExists('claude')) {
    console.error('\nClaude Code was not found on PATH.');
    console.error('Install Claude Code first, then rerun INSTALL-WINDOWS.cmd and choose Claude Code.');
    process.exitCode = 2;
    return;
  }

  // Remove an old user-scoped entry first so rerunning the installer is safe.
  spawnSync('claude', ['mcp', 'remove', name, '--scope', 'user'], {
    stdio: 'ignore',
    shell: true,
    cwd: root,
  });

  const status = runClaude([
    'mcp',
    'add',
    '--scope',
    'user',
    name,
    '--',
    process.execPath,
    server,
  ]);

  if (status !== 0) {
    console.error('\nCould not add the MCP to Claude Code.');
    console.error('Nothing else was changed by this step.');
    process.exitCode = 1;
    return;
  }

  console.log('\n✓ Connected to Claude Code (user scope)');
  console.log('  It will be available in your Claude Code projects.');
  console.log(`  You can verify it with: claude mcp get ${name}`);
}

async function showOther() {
  const genericPath = path.join(root, 'generated', 'mcp-generic.json');
  console.log('\n✓ Generic MCP configuration is ready here:');
  console.log(`  ${genericPath}`);
  console.log('\nOpen that file and copy the openttd-ai-api entry into your MCP client.');
}

async function connectDetected() {
  let found = false;

  if (fsSync.existsSync(path.join(os.homedir(), '.cursor'))) {
    found = true;
    await connectCursor();
  }

  if (fsSync.existsSync(path.join(appData, 'Code'))) {
    found = true;
    await connectVsCode();
  }

  if (fsSync.existsSync(path.join(appData, 'Claude'))) {
    found = true;
    await connectClaudeDesktop();
  }

  if (commandExists('claude')) {
    found = true;
    await connectClaudeCode();
  }

  if (!found) {
    console.log('\nI could not confidently detect Cursor, VS Code, Claude Desktop, or Claude Code.');
    await showOther();
  }
}

const target = (process.argv[2] || '').toLowerCase();

try {
  switch (target) {
    case 'cursor':
      await connectCursor();
      break;
    case 'vscode':
      await connectVsCode();
      break;
    case 'claude':
    case 'claude-desktop':
      await connectClaudeDesktop();
      break;
    case 'claude-code':
      await connectClaudeCode();
      break;
    case 'other':
      await showOther();
      break;
    case 'detected':
    case 'all':
      await connectDetected();
      break;
    default:
      console.error('Usage: node scripts/connect-client.js cursor|vscode|claude-desktop|claude-code|other|detected');
      process.exitCode = 2;
  }
} catch (error) {
  console.error('\nConnection step failed. Your existing config was not intentionally replaced.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
