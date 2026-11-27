import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceProgress, initialProgress, zoneAt } from './driveProgress.js';

test('district lookup repeats consistently with the recycled world', () => {
  assert.equal(zoneAt(0).id, 'center');
  assert.equal(zoneAt(-70).id, 'industrial');
  assert.equal(zoneAt(-185).id, 'racing');
  assert.equal(zoneAt(-370).id, 'industrial');
  assert.equal(zoneAt(15).id, 'center');
  assert.equal(zoneAt(-300).id, 'center');
});

test('missions grant rewards once when real progress reaches the target', () => {
  let progress = initialProgress();
  for (const id of ['center', 'industrial', 'nature']) progress = advanceProgress(progress, 'zones', id).progress;
  assert.equal(progress.xp, 100);
  assert.deepEqual(progress.completed, ['zones']);
  const repeated = advanceProgress(progress, 'zones', 'nature');
  assert.equal(repeated.progress.xp, 100);
  assert.equal(repeated.earned.length, 0);
  const route = advanceProgress(progress, 'route', true);
  assert.equal(route.progress.xp, 225);
  assert.equal(advanceProgress(route.progress, 'route', true).progress.xp, 225);
});

test('new progress starts independently of the existing crystal-run best', () => {
  assert.deepEqual(initialProgress(), { version: 1, zones: [], relics: [], destinations: [], route: false, speed: false, completed: [], xp: 0 });
});

test('collectibles, speed and destinations grant their own rewards only once', () => {
  let progress = initialProgress();
  for (let i = 0; i < 5; i += 1) progress = advanceProgress(progress, 'relics', String(i)).progress;
  progress = advanceProgress(progress, 'speed', true).progress;
  for (const id of ['about', 'experience', 'projects', 'skills', 'contact']) progress = advanceProgress(progress, 'destinations', id).progress;
  assert.equal(progress.xp, 450);
  assert.deepEqual(progress.completed, ['relics', 'speed', 'destinations']);
  assert.equal(advanceProgress(progress, 'speed', true).progress.xp, 450);
  assert.equal(advanceProgress(progress, 'relics', '0').progress.xp, 450);
});
