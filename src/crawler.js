import fs from 'node:fs/promises';
import path from 'node:path';
import {
  discoverClassUrls,
  discoverGuideUrls,
  parseClassPage,
  parseDocsVersion,
  parseGuidePage,
} from './parser.js';

const DEFAULT_CONCURRENCY = 6;

export async function crawlOpenTtdDocs({
  docsBase,
  indexPath,
  concurrency = DEFAULT_CONCURRENCY,
  onProgress = () => {},
}) {
  const rootUrl = new URL('.', docsBase).href;
  const classesUrl = new URL('classes', docsBase).href;

  onProgress(`Fetching ${rootUrl}`);
  const rootHtml = await fetchText(rootUrl);
  onProgress(`Fetching ${classesUrl}`);
  const classesHtml = await fetchText(classesUrl);

  const docsVersion = parseDocsVersion(rootHtml) ?? parseDocsVersion(classesHtml) ?? 'unknown';
  const classUrls = discoverClassUrls(classesHtml, classesUrl);
  const guideUrls = discoverGuideUrls(rootHtml, rootUrl);

  const classDocuments = await mapLimit(classUrls, concurrency, async (url, i) => {
    onProgress(`Class ${i + 1}/${classUrls.length}: ${url}`);
    const html = await fetchText(url);
    return parseClassPage(html, url);
  });

  const guideDocuments = await mapLimit(guideUrls, Math.min(concurrency, 3), async (url, i) => {
    onProgress(`Guide ${i + 1}/${guideUrls.length}: ${url}`);
    const html = await fetchText(url);
    return parseGuidePage(html, url);
  });

  const documents = [
    ...classDocuments.flat(),
    ...guideDocuments.filter(Boolean),
  ];

  const index = {
    formatVersion: 1,
    libraryId: '/openttd/ai-api',
    sourceUrl: docsBase,
    docsVersion,
    indexedAt: new Date().toISOString(),
    documentCount: documents.length,
    documents,
  };

  if (indexPath) {
    await fs.mkdir(path.dirname(indexPath), { recursive: true });
    const tempPath = `${indexPath}.tmp`;
    await fs.writeFile(tempPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
    await fs.rename(tempPath, indexPath);
  }

  return index;
}

async function fetchText(url, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'openttd-ai-api-mcp/0.1 (+https://docs.openttd.org/ai-api/)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });

    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      const retryAfter = Number(response.headers.get('retry-after')) || attempt;
      await sleep(Math.min(retryAfter * 1000, 5000));
      return fetchText(url, attempt + 1);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}`);
    }

    return await response.text();
  } catch (error) {
    if (attempt < 3 && (error?.name === 'AbortError' || error instanceof TypeError)) {
      await sleep(attempt * 750);
      return fetchText(url, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function mapLimit(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;

  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return output;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
