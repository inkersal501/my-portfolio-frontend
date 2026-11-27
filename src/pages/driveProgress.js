export const ZONES = [
  { id: 'center', name: 'City Center', z: 0, description: 'The starting plaza and parking area.' },
  { id: 'industrial', name: 'Industrial Works', z: -70, description: 'Warehouses and stacked containers.' },
  { id: 'nature', name: 'Garden Way', z: -145, description: 'Trees and a quiet hillside.' },
  { id: 'racing', name: 'Racing Loop', z: -185, description: 'Find the checkpoint route and test your time.' },
  { id: 'portfolio', name: 'Portfolio District', z: -230, description: 'Explore projects, skills and contact.' },
];

export const MISSIONS = [
  { id: 'zones', label: 'Explore three districts', target: 3, reward: 100 },
  { id: 'relics', label: 'Find five hidden crystals', target: 5, reward: 150 },
  { id: 'route', label: 'Complete a checkpoint route', target: 1, reward: 125 },
  { id: 'speed', label: 'Reach 90 km/h', target: 1, reward: 100 },
  { id: 'destinations', label: 'Visit every portfolio destination', target: 5, reward: 200 },
];

export function zoneAt(z) {
  const distance = (center) => Math.abs(((z - center + 150) % 300 + 300) % 300 - 150);
  return ZONES.reduce((closest, zone) => distance(zone.z) < distance(closest.z) ? zone : closest);
}

export function initialProgress() {
  return { version: 1, zones: [], relics: [], destinations: [], route: false, speed: false, completed: [], xp: 0 };
}

export function advanceProgress(current, type, value) {
  const next = { ...current, zones: [...current.zones], relics: [...current.relics], destinations: [...current.destinations], completed: [...current.completed] };
  if (type === 'route' || type === 'speed') next[type] = true;
  else if (['zones', 'relics', 'destinations'].includes(type) && !next[type].includes(value)) next[type].push(value);
  const counts = { zones: next.zones.length, relics: next.relics.length, route: Number(next.route), speed: Number(next.speed), destinations: next.destinations.length };
  const earned = [];
  MISSIONS.forEach((mission) => {
    if (counts[mission.id] >= mission.target && !next.completed.includes(mission.id)) {
      next.completed.push(mission.id);
      next.xp += mission.reward;
      earned.push(mission);
    }
  });
  return { progress: next, earned };
}
