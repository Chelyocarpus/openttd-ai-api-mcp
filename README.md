# OpenTTD AI API MCP

A small Context7-style MCP server for the official OpenTTD AI API documentation:
<https://docs.openttd.org/ai-api/>

It lets coding agents search the OpenTTD AI API with normal questions such as:

```text
How do I find the direction of a rail station tile?
```

or exact symbols such as:

```text
AIRail::GetRailStationDirection
```

No API key, database, embeddings service, or Context7 account is required.

# 🧸 Windows installation — toddler mode

You only need **one file**:

```text
INSTALL-WINDOWS.cmd
```

## Step 1 — unzip

Extract the ZIP somewhere you want to keep it, for example:

```text
C:\Tools\openttd-ai-api-mcp
```

Do not delete or move the folder after installing the MCP.

## Step 2 — double-click

Double-click:

```text
INSTALL-WINDOWS.cmd
```

That is the entire installer.

It automatically:

1. checks whether Node.js is installed;
2. tries to install Node.js LTS with Windows `winget` if needed;
3. installs the MCP dependencies;
4. downloads and indexes the OpenTTD AI API documentation;
5. creates the correct absolute paths for your computer;
6. asks which AI application you use;
7. connects the MCP for you.

You do **not** need to use npm, edit JSON, find config folders, or manually start the MCP server.

## Step 3 — choose your app

The installer shows this menu:

```text
Almost done - which AI app do you use?

[1] Cursor
[2] VS Code / GitHub Copilot
[3] Claude Desktop
[4] Claude Code
[5] Other MCP app
[6] Connect every app I can detect
```

Press one number.

That is it. 🥳

## Cursor

Choose:

```text
[1] Cursor
```

The installer safely adds `openttd-ai-api` to:

```text
%USERPROFILE%\.cursor\mcp.json
```

Existing MCP servers are kept.

Restart Cursor if it was already open.

## VS Code / GitHub Copilot

Choose:

```text
[2] VS Code / GitHub Copilot
```

The installer safely adds the server to the default Windows VS Code user MCP configuration.

Existing MCP servers are kept.

Restart VS Code if it was already open. VS Code may ask you once to trust/start the local MCP server.

## Claude Desktop

Choose:

```text
[3] Claude Desktop
```

The installer safely adds `openttd-ai-api` to:

```text
%APPDATA%\Claude\claude_desktop_config.json
```

Existing Claude Desktop MCP servers are kept.

After installation, **fully quit Claude Desktop** and open it again. Closing only its window may leave the app running.

## Claude Code

Choose:

```text
[4] Claude Code
```

If the `claude` command is installed, the wizard adds the MCP at **user scope**, so it is available across Claude Code projects.

The installer uses Claude Code's MCP command rather than asking you to edit its configuration manually.

You can later verify it with:

```bash
claude mcp get openttd-ai-api
```

## Other MCP app

Choose:

```text
[5] Other MCP app
```

The installer opens/selects:

```text
generated\mcp-generic.json
```

The file already contains the correct absolute paths for your computer.

## I use several apps

Choose:

```text
[6] Connect every app I can detect
```

The installer looks for Cursor, VS Code, Claude Desktop, and Claude Code and connects the ones it can confidently detect.

You can also simply rerun `INSTALL-WINDOWS.cmd` later and choose another app. Rerunning the installer is safe.

# ✅ Test it

After restarting your AI app, try:

```text
Using the OpenTTD AI API docs, explain AIRail::GetRailStationDirection.
```

Or:

```text
Using the OpenTTD docs, how can I tell which direction a rail station tile faces?
```

# You do not manually start the MCP

For normal local MCP usage, the AI application starts the server automatically using stdio.

You do **not** keep a terminal window open.

# What the installer actually did

```text
OpenTTD documentation
        ↓
      crawler
        ↓
  data/index.json
        ↓
 OpenTTD MCP server
        ↓
 Cursor / VS Code / Claude / other MCP client
```

The AI application does not scrape the OpenTTD website for every question. The documentation is indexed locally first and then searched quickly through MCP tools.

# Updating the documentation later

The easiest method is simply to rerun:

```text
INSTALL-WINDOWS.cmd
```

Or, from a terminal inside the folder:

```bash
npm run index
```

The MCP also exposes a `refresh-docs` tool.

# MCP tools

The server exposes four tools.

## `resolve-library-id`

Returns:

```text
/openttd/ai-api
```

This exists mainly to make the server behave similarly to Context7.

## `query-docs`

Natural-language or exact-symbol documentation search.

```text
query-docs({
  libraryId: "/openttd/ai-api",
  query: "How do I determine the direction of a rail station tile?"
})
```

Exact lookup:

```text
query-docs({
  libraryId: "/openttd/ai-api",
  query: "AIRail::GetRailStationDirection"
})
```

## `search-symbols`

Fast class/member lookup for coding agents.

Examples:

```text
AIRail
AIStation
AIVehicle
GetRailStationDirection
```

## `refresh-docs`

Re-downloads the official OpenTTD AI API documentation and atomically replaces the local search index.

# Generated configuration files

The installer also creates fallback configuration examples:

```text
generated/
├── mcp-cursor.json
├── mcp-vscode.json
├── mcp-claude-desktop.json
└── mcp-generic.json
```

These files contain the **actual absolute Node.js and server paths on your machine**.

Normally you do not need them because `INSTALL-WINDOWS.cmd` connects the supported apps itself.

# macOS / Linux

The original shell installer is still available:

```bash
./INSTALL-MAC-LINUX.sh
```

If needed:

```bash
chmod +x INSTALL-MAC-LINUX.sh
./INSTALL-MAC-LINUX.sh
```

Node.js 20 or newer must already be installed.

# Folder layout

```text
openttd-ai-api-mcp/
├── data/
│   └── index.json
├── generated/
│   ├── mcp-cursor.json
│   ├── mcp-vscode.json
│   ├── mcp-claude-desktop.json
│   └── mcp-generic.json
├── scripts/
│   ├── connect-client.js
│   └── write-configs.js
├── src/
│   ├── cli-index.js
│   ├── config.js
│   ├── crawler.js
│   ├── http.js
│   ├── index-store.js
│   ├── mcp.js
│   ├── parser.js
│   └── server.js
├── test/
├── INSTALL-WINDOWS.cmd       <- Windows: double-click this
├── INSTALL-MAC-LINUX.sh
├── CONNECT-CURSOR.sh         <- macOS/Linux helper
├── package.json
└── README.md
```

# Advanced installation

Requires Node.js 20 or newer.

```bash
npm install
npm run index
npm run config
npm test
```

Or:

```bash
npm run setup
```

Manual stdio start:

```bash
npm start
```

Generic MCP configuration looks approximately like:

```json
{
  "mcpServers": {
    "openttd-ai-api": {
      "command": "node",
      "args": ["/absolute/path/to/openttd-ai-api-mcp/src/server.js"]
    }
  }
}
```

Using the installer is easier because it writes the absolute paths automatically.

# HTTP mode

You can also expose the MCP using Streamable HTTP:

```bash
npm run start:http
```
