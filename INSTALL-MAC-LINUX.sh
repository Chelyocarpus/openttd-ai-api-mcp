#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo
echo "====================================================="
echo "  OpenTTD AI API MCP - Easy Installer"
echo "====================================================="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20+ is required but was not found."
  echo "Install the current Node.js LTS from https://nodejs.org/"
  echo "Then run this installer again."
  exit 1
fi

major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "$major" -lt 20 ]; then
  echo "Your Node.js is too old: $(node --version)"
  echo "Install Node.js 20 or newer from https://nodejs.org/ and try again."
  exit 1
fi

echo "Found Node.js $(node --version)"
echo
echo "[1/3] Installing dependencies..."
npm install

echo
echo "[2/3] Building the OpenTTD documentation index..."
npm run index

echo
echo "[3/3] Creating MCP configuration files..."
node scripts/write-configs.js

echo
echo "====================================================="
echo "  DONE!"
echo "====================================================="
echo
echo "The server is installed."
echo "Ready-to-copy configs are in ./generated/"
echo "If you use Cursor, run: ./CONNECT-CURSOR.sh"
echo
