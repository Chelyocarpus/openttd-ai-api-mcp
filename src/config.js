import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

export const config = {
  docsBase: ensureTrailingSlash(process.env.OPENTTD_DOCS_BASE ?? 'https://docs.openttd.org/ai-api/'),
  indexPath: process.env.OPENTTD_INDEX_PATH ?? path.join(root, 'data', 'index.json'),
  libraryId: '/openttd/ai-api',
  maxQueryChars: Number(process.env.OPENTTD_MAX_QUERY_CHARS ?? 20_000),
};

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}
