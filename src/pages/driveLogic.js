// Small, renderer-independent helpers for route and guidance behavior.
export function routePoint(start, heading, index) {
  const distance = 16 + index * 18;
  return { x: start.x + Math.sin(heading) * distance, z: start.z - Math.cos(heading) * distance };
}

export function guidanceDirection(x, z, heading, destination) {
  const angle = Math.atan2(destination.x - x, -(destination.z - z));
  const turn = ((angle - heading + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return Math.abs(turn) > 2.5 ? 'TURN AROUND' : turn > 0.35 ? 'TURN RIGHT' : turn < -0.35 ? 'TURN LEFT' : 'STRAIGHT AHEAD';
}
