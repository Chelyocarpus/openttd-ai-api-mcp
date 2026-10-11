import fs from 'node:fs/promises';
import MiniSearch from 'minisearch';

export class DocsStore {
  constructor(indexData) {
    this.replace(indexData);
  }

  static async open(indexPath) {
    try {
      const raw = await fs.readFile(indexPath, 'utf8');
      return new DocsStore(JSON.parse(raw));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      return new DocsStore(emptyIndex());
    }
  }

  replace(indexData) {
    this.meta = {
      formatVersion: indexData.formatVersion ?? 1,
      libraryId: indexData.libraryId ?? '/openttd/ai-api',
      sourceUrl: indexData.sourceUrl ?? 'https://docs.openttd.org/ai-api/',
      docsVersion: indexData.docsVersion ?? 'not indexed',
      indexedAt: indexData.indexedAt ?? null,
      documentCount: indexData.documents?.length ?? 0,
    };

    this.documents = Array.isArray(indexData.documents) ? indexData.documents : [];
    this.byId = new Map(this.documents.map((doc) => [doc.id, doc]));

    this.searchIndex = new MiniSearch({
      fields: ['title', 'className', 'symbol', 'content'],
      storeFields: ['id', 'title', 'kind', 'className', 'symbol', 'url', 'content'],
      searchOptions: {
        boost: { title: 5, symbol: 9, className: 4, content: 1 },
        prefix: true,
        fuzzy: 0.18,
      },
    });

    if (this.documents.length) {
      this.searchIndex.addAll(this.documents.map((doc) => ({
        ...doc,
        title: doc.title ?? '',
        className: doc.className ?? '',
        symbol: doc.symbol ?? '',
        content: doc.content ?? '',
      })));
    }
  }

  get ready() {
    return this.documents.length > 0;
  }

  get(id) {
    return this.byId.get(id) ?? null;
  }

  search(query, { limit = 6, className = null, kind = null } = {}) {
    if (!this.ready) return [];

    const normalizedQuery = normalize(query);
    const exact = this.documents
      .filter((doc) => {
        if (className && normalize(doc.className) !== normalize(className)) return false;
        if (kind && doc.kind !== kind) return false;
        const keys = [doc.title, doc.symbol, doc.className, doc.className && doc.symbol ? `${doc.className}::${doc.symbol}` : null]
          .filter(Boolean)
          .map(normalize);
        return keys.some((key) => key === normalizedQuery || key.includes(normalizedQuery));
      })
      .map((doc, i) => ({ ...doc, score: 100_000 - i }));

    const fullText = this.searchIndex.search(query)
      .filter((result) => !className || normalize(result.className) === normalize(className))
      .filter((result) => !kind || result.kind === kind);

    const merged = new Map();
    for (const result of [...exact, ...fullText]) {
      const current = merged.get(result.id);
      if (!current || result.score > current.score) merged.set(result.id, result);
    }

    return [...merged.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export function emptyIndex() {
  return {
    formatVersion: 1,
    libraryId: '/openttd/ai-api',
    sourceUrl: 'https://docs.openttd.org/ai-api/',
    docsVersion: 'not indexed',
    indexedAt: null,
    documents: [],
  };
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\(\)$/g, '');
}
