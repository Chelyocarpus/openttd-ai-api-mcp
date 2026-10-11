import { config } from './config.js';
import { crawlOpenTtdDocs } from './crawler.js';

try {
  const index = await crawlOpenTtdDocs({
    docsBase: config.docsBase,
    indexPath: config.indexPath,
    onProgress: (message) => console.error(message),
  });
  console.error(`Done: ${index.documentCount} documents, OpenTTD docs ${index.docsVersion}`);
} catch (error) {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
}
