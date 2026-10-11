import test from 'node:test';
import assert from 'node:assert/strict';
import { discoverClassUrls, parseClassPage } from '../src/parser.js';

const fixture = `
<!doctype html>
<html>
  <body>
    <div class="title">AIRail Class Reference</div>
    <div class="contents">
      <div class="textblock">Class that handles all rail related functions.</div>
      <table class="memberdecls"><tr><td>static RailTrack GetRailStationDirection(TileIndex tile)</td></tr></table>
      <h2 class="memtitle">◆ GetRailStationDirection()</h2>
      <div class="memitem">
        <div class="memproto">RailTrack AIRail::GetRailStationDirection ( TileIndex tile ) static</div>
        <div class="memdoc">
          Gets the direction of a rail station tile.
          Parameters tile The rail station tile.
          Precondition IsRailStationTile(tile).
          Returns The direction of the station (either RAILTRACK_NE_SW or RAILTRACK_NW_SE).
        </div>
      </div>
    </div>
  </body>
</html>`;

test('parses a Doxygen class and member into searchable documents', () => {
  const docs = parseClassPage(fixture, 'https://docs.openttd.org/ai-api/classAIRail');
  assert.equal(docs[0].id, 'class:AIRail');
  const member = docs.find((doc) => doc.symbol === 'GetRailStationDirection');
  assert.ok(member);
  assert.match(member.title, /AIRail::GetRailStationDirection/);
  assert.match(member.content, /IsRailStationTile/);
  assert.match(member.content, /RAILTRACK_NE_SW/);
});

test('discovers only class pages', () => {
  const html = '<a href="classAIRail.html">Rail</a><a href="hierarchy.html">Hierarchy</a><a href="classAIMap">Map</a>';
  assert.deepEqual(discoverClassUrls(html, 'https://docs.openttd.org/ai-api/classes'), [
    'https://docs.openttd.org/ai-api/classAIMap',
    'https://docs.openttd.org/ai-api/classAIRail.html',
  ]);
});
