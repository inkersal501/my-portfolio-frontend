import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guidanceDirection, routePoint } from './driveLogic.js';

test('route checkpoints progress ahead from the car in the selected heading', () => {
  assert.deepEqual(routePoint({ x: 3, z: 8 }, 0, 0), { x: 3, z: -8 });
  assert.deepEqual(routePoint({ x: 3, z: 8 }, 0, 4), { x: 3, z: -80 });
  const east = routePoint({ x: 0, z: 0 }, Math.PI / 2, 0);
  assert.ok(Math.abs(east.x - 16) < 1e-9 && Math.abs(east.z) < 1e-9);
});

test('guidance reports direction relative to the car heading, including angle wrapping', () => {
  assert.equal(guidanceDirection(0, 0, 0, { x: 0, z: -10 }), 'STRAIGHT AHEAD');
  assert.equal(guidanceDirection(0, 0, 0, { x: 10, z: 0 }), 'TURN RIGHT');
  assert.equal(guidanceDirection(0, 0, 0, { x: -10, z: 0 }), 'TURN LEFT');
  assert.equal(guidanceDirection(0, 0, 0, { x: 0, z: 10 }), 'TURN AROUND');
  assert.equal(guidanceDirection(0, 0, Math.PI - 0.01, { x: 0, z: 10 }), 'STRAIGHT AHEAD');
});
