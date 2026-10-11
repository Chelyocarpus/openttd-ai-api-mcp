import test from 'node:test';
import assert from 'node:assert/strict';
import { DocsStore } from '../src/index-store.js';

test('exact OpenTTD symbols rank before generic text matches', () => {
  const store = new DocsStore({
    docsVersion: 'test',
    documents: [
      {
        id: 'symbol:AIRail:GetRailStationDirection',
        kind: 'symbol',
        title: 'AIRail::GetRailStationDirection',
        className: 'AIRail',
        symbol: 'GetRailStationDirection',
        url: 'https://example.test/classAIRail',
        content: 'Gets the direction of a rail station tile.',
      },
      {
        id: 'guide:rail',
        kind: 'guide',
        title: 'Rail guide',
        className: null,
        symbol: null,
        url: 'https://example.test/rail',
        content: 'This guide mentions GetRailStationDirection in passing.',
      },
    ],
  });

  const [first] = store.search('GetRailStationDirection');
  assert.equal(first.id, 'symbol:AIRail:GetRailStationDirection');
});
