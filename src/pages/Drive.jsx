import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { about, experience, profile, projects, skills } from '../data/portfolio';
import { guidanceDirection, routePoint } from './driveLogic';
import { ZONES, MISSIONS, zoneAt, initialProgress, advanceProgress } from './driveProgress';

const stops = [
  { id: 'about', label: 'ABOUT', title: 'A little about me', x: -7, z: -20, color: 0xc6f36a },
  { id: 'experience', label: 'EXPERIENCE', title: 'The path so far', x: 12, z: -75, color: 0x77c6b3 },
  { id: 'projects', label: 'PROJECTS', title: 'Things I have made', x: -16, z: -145, color: 0xf0b76d },
  { id: 'skills', label: 'SKILLS', title: 'Tools of the trade', x: 8, z: -230, color: 0xb69cff },
  { id: 'contact', label: 'CONTACT', title: 'Let’s make something', x: -8, z: -270, color: 0xc6f36a },
];

function makeTextTexture(text, color = '#f0f1e9') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, 512, 128);
  context.font = '700 40px Arial';
  context.fillStyle = color;
  context.textAlign = 'center';
  context.fillText(text, 256, 78);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Drive() {
  const canvasRef = useRef(null);
  const [activeStop, setActiveStop] = useState(null);
  const [nearbyStop, setNearbyStop] = useState(null);
  const [nearHeadquarters, setNearHeadquarters] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [transmission, setTransmission] = useState('D1');
  const [collected, setCollected] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [destinationMeters, setDestinationMeters] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [toast, setToast] = useState('');
  const [challenge, setChallenge] = useState(() => {
    let best = 0;
    try { best = Math.max(0, Number(window.localStorage.getItem('portfolio-drive-best')) || 0); } catch { /* Play without saved scores. */ }
    return { active: false, seconds: 0, score: 0, best, finished: false };
  });
  const challengeRef = useRef({ active: false, elapsed: 0, score: 0, best: challenge.best });
  const [showAchievements, setShowAchievements] = useState(false);
  const [routeRun, setRouteRun] = useState({ active: false, index: 0, elapsed: 0, finished: false });
  const [routeBest, setRouteBest] = useState(() => { try { const value = Number(window.localStorage.getItem('portfolio-drive-route-best-v1')); return Number.isFinite(value) && value > 0 ? value : null; } catch { return null; } });
  const routeBestRef = useRef(routeBest);
  const [stuntBest, setStuntBest] = useState(() => { try { const value = Number(window.localStorage.getItem('portfolio-drive-stunt-best-v1')); return Number.isFinite(value) && value > 0 ? value : 0; } catch { return 0; } });
  const stuntBestRef = useRef(stuntBest);
  const [speedZoneMessage, setSpeedZoneMessage] = useState('');
  const [paused, setPaused] = useState(false);
  const [handling, setHandling] = useState('arcade');
  const [quality, setQuality] = useState('high');
  const [muted, setMuted] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const [zoneName, setZoneName] = useState('City Center');
  const [showMissions, setShowMissions] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [storyStep, setStoryStep] = useState(0);
  const [storyVisited, setStoryVisited] = useState(() => {
    try { const value = JSON.parse(window.localStorage.getItem('portfolio-drive-story-v1') || '[]'); return Array.isArray(value) ? [...new Set(value.filter((item) => Number.isInteger(item) && item >= 0 && item < 6))] : []; } catch { return []; }
  });
  const [showGarage, setShowGarage] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => { try { return window.localStorage.getItem('portfolio-drive-tutorial-v1') !== 'done'; } catch { return true; } });
  const [timeOfDay, setTimeOfDay] = useState('night');
  const [weather, setWeather] = useState('clear');
  const [photoMode, setPhotoMode] = useState(false);
  const [photoCamera, setPhotoCamera] = useState({ angle: 0, distance: 9, height: 5 });
  const [garage, setGarage] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('portfolio-drive-garage-v2') || window.localStorage.getItem('portfolio-drive-garage-v1') || '{}');
      return { vehicle: saved.version === 2 && ['xuv700', 'sport', 'suv', 'supercar', 'trail'].includes(saved.vehicle) ? saved.vehicle : 'xuv700', paint: ['#c6f36a', '#e9e8e4', '#789876', '#343f35'].includes(saved.paint) ? saved.paint : '#c6f36a', wheels: ['#9ba893', '#202620', '#c6f36a'].includes(saved.wheels) ? saved.wheels : '#9ba893' };
    } catch { return { vehicle: 'xuv700', paint: '#c6f36a', wheels: '#9ba893' }; }
  });
  const [progress, setProgress] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('portfolio-drive-progress-v1') || window.localStorage.getItem('portfolio-drive-progress') || '{}');
      if (saved.version !== undefined && saved.version !== 1) return initialProgress();
      const base = initialProgress();
      for (const key of ['zones', 'relics', 'destinations', 'completed']) if (Array.isArray(saved[key])) base[key] = saved[key].filter((item) => typeof item === 'string');
      base.route = saved.route === true;
      base.speed = saved.speed === true;
      base.drift = saved.drift === true;
      base.xp = Number.isFinite(saved.xp) ? Math.max(0, saved.xp) : 0;
      return base;
    } catch { return initialProgress(); }
  });
  const progressRef = useRef(progress);
  const audioRef = useRef(null);
  const engineRef = useRef(null);
  const settingsRef = useRef({ paused, handling, quality, muted, garage, timeOfDay, weather, photoMode, photoCamera });
  settingsRef.current = { paused: paused || showGarage || showTutorial || photoMode || showStory, handling, quality, muted, garage, timeOfDay, weather, photoMode, photoCamera, showGarage };

  useEffect(() => { try { window.localStorage.setItem('portfolio-drive-garage-v2', JSON.stringify({ version: 2, ...garage })); } catch { /* Keep settings for this visit. */ } }, [garage]);
  useEffect(() => { try { window.localStorage.setItem('portfolio-drive-story-v1', JSON.stringify(storyVisited)); } catch { /* Story remains available for this visit. */ } }, [storyVisited]);

  const toggleSound = async () => {
    if (!audioRef.current) {
      const AudioContextType = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextType) { setToast('Audio is unavailable in this browser.'); return; }
      const audio = new AudioContextType();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();
      filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 0.7;
      gain.gain.value = 0;
      filter.connect(gain); gain.connect(audio.destination);
      const voices = [1, 2, 3].map((ratio, index) => {
        const oscillator = audio.createOscillator();
        const voiceGain = audio.createGain();
        oscillator.type = index === 0 ? 'triangle' : 'sawtooth';
        oscillator.frequency.value = 48 * ratio;
        voiceGain.gain.value = [0.8, 0.22, 0.08][index];
        oscillator.connect(voiceGain); voiceGain.connect(filter); oscillator.start();
        return { oscillator, ratio };
      });
      // Create rain only after a user enables audio, as required by browser autoplay rules.
      const rainBuffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      const rainSamples = rainBuffer.getChannelData(0);
      for (let i = 0; i < rainSamples.length; i += 1) rainSamples[i] = Math.random() * 2 - 1;
      const rainSource = audio.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;
      const rainFilter = audio.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = 1200;
      const rainGain = audio.createGain();
      rainGain.gain.value = 0;
      rainSource.connect(rainFilter); rainFilter.connect(rainGain); rainGain.connect(audio.destination);
      rainSource.start();
      audioRef.current = audio;
      engineRef.current = { voices, filter, gain, rainSource, rainGain };
    }
    try { await audioRef.current.resume(); setMuted((value) => !value); }
    catch { setToast('Could not start sound. Please try again.'); }
  };

  useEffect(() => () => {
    engineRef.current?.voices.forEach(({ oscillator }) => oscillator.stop());
    engineRef.current?.rainSource.stop();
    audioRef.current?.close();
    engineRef.current = null;
    audioRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false }); } catch { setWebglError(true); return undefined; }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x10130f);
    scene.fog = new THREE.Fog(0x10130f, 24, 65);
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 5.2, 18);
    camera.lookAt(0, 0.7, 3);
    const world = new THREE.Group();
    scene.add(world);
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(360 * 3);
    for (let i = 0; i < rainPositions.length; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 44;
      rainPositions[i + 1] = Math.random() * 18;
      rainPositions[i + 2] = (Math.random() - 0.5) * 44;
    }
    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xc8dec6, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false }));
    rain.visible = false;
    scene.add(rain);
    scene.add(new THREE.HemisphereLight(0xe7f6ce, 0x252a20, 2.1));
    const sun = new THREE.DirectionalLight(0xd7f59c, 3.3);
    sun.position.set(-8, 15, 8);
    scene.add(sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({ color: 0x20261d, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    world.add(ground);
    const groundGrid = new THREE.GridHelper(12000, 80, 0x3b4435, 0x293128);
    groundGrid.position.y = -0.065;
    world.add(groundGrid);

    // Reused low-poly terrain patches form gentle hills away from the main road.
    const hillGeometry = new THREE.PlaneGeometry(2, 2, 24, 24);
    const hillVertices = hillGeometry.attributes.position;
    for (let i = 0; i < hillVertices.count; i += 1) {
      const x = hillVertices.getX(i);
      const y = hillVertices.getY(i);
      const shape = Math.max(0, 1 - x * x - y * y);
      hillVertices.setZ(i, shape * shape);
    }
    hillGeometry.computeVertexNormals();
    const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x43583a, roughness: 1, side: THREE.DoubleSide });
    const hills = [
      { x: -32, z: -120, radius: 15, height: 3 },
      { x: 34, z: -150, radius: 17, height: 4 },
      { x: -48, z: -165, radius: 16, height: 3.5 },
      { x: 48, z: -195, radius: 18, height: 4.5 },
      { x: -30, z: -210, radius: 14, height: 2.8 },
    ].map((hill) => {
      const mesh = new THREE.Mesh(hillGeometry, hillMaterial);
      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.set(hill.radius, hill.radius, hill.height);
      mesh.position.set(hill.x, -0.075, hill.z);
      world.add(mesh);
      return { ...hill, mesh };
    });
    const terrainHeightAt = (x, z) => {
      let height = 0;
      for (const hill of hills) {
        const dx = (x - hill.mesh.position.x) / hill.radius;
        const dz = (z - hill.mesh.position.z) / hill.radius;
        const shape = Math.max(0, 1 - dx * dx - dz * dz);
        height = Math.max(height, hill.height * shape * shape - 0.075);
      }
      return height;
    };
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x30332d, roughness: 0.9 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 10000), roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.035;
    world.add(road);
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10), roadMaterial);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.y = -0.034;
    world.add(crossRoad);
    const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0x41483a, roughness: 1 });
    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(3, 10000), sidewalkMaterial);
      sidewalk.rotation.x = -Math.PI / 2;
      sidewalk.position.set(side * 6.5, -0.025, 0);
      world.add(sidewalk);
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 10000), new THREE.MeshBasicMaterial({ color: 0x858f70 }));
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * 5, -0.015, 0);
      world.add(edge);
    }
    const dashMaterial = new THREE.MeshBasicMaterial({ color: 0xc6f36a });
    const laneMarks = [];
    for (let i = -10; i <= 10; i += 1) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.1), dashMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.01, i * 5);
      world.add(dash);
      laneMarks.push(dash);
      const sideDash = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.1), dashMaterial);
      sideDash.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
      sideDash.position.set(i * 5, 0.01, 0);
      world.add(sideDash);
      laneMarks.push(sideDash);
    }

    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 2.05), new THREE.MeshStandardMaterial({ color: 0xc6f36a, metalness: 0.28, roughness: 0.3 }));
    body.position.y = 0.55;
    car.add(body);
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.12, 0.72), new THREE.MeshStandardMaterial({ color: 0xaad755, metalness: 0.35, roughness: 0.3 }));
    hood.position.set(0, 0.79, -0.66);
    car.add(hood);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.48, 0.92), new THREE.MeshStandardMaterial({ color: 0x243027, metalness: 0.2, roughness: 0.22 }));
    cabin.position.set(0, 0.97, -0.12);
    car.add(cabin);
    // The supercar uses a separate wedge-shaped body rather than stretching the SUV.
    const supercarDetails = new THREE.Group();
    const wedgeGeometry = new THREE.BufferGeometry();
    wedgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -0.78, 0.34, -1.2, 0.78, 0.34, -1.2, -0.78, 0.34, 1.12, 0.78, 0.34, 1.12,
      -0.68, 0.52, -1.2, 0.68, 0.52, -1.2, -0.72, 0.78, 1.12, 0.72, 0.78, 1.12,
    ], 3));
    wedgeGeometry.setIndex([0, 2, 1, 1, 2, 3, 4, 5, 6, 5, 7, 6, 0, 1, 4, 1, 5, 4, 2, 6, 3, 3, 6, 7, 0, 4, 2, 2, 4, 6, 1, 3, 5, 3, 7, 5]);
    wedgeGeometry.computeVertexNormals();
    const supercarBody = new THREE.Mesh(wedgeGeometry, body.material);
    supercarDetails.add(supercarBody);
    const supercarGlass = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.28, 0.9), cabin.material);
    supercarGlass.position.set(0, 0.86, 0.12);
    supercarDetails.add(supercarGlass);
    const supercarTrim = new THREE.MeshStandardMaterial({ color: 0x111811, roughness: 0.45, metalness: 0.3 });
    const intakeGeometry = new THREE.BoxGeometry(0.035, 0.19, 0.45);
    const headlightGeometry = new THREE.BoxGeometry(0.32, 0.055, 0.025);
    const supercarLights = new THREE.MeshBasicMaterial({ color: 0xeaffde });
    for (const side of [-1, 1]) {
      const intake = new THREE.Mesh(intakeGeometry, supercarTrim);
      intake.position.set(side * 0.76, 0.55, 0.53);
      const light = new THREE.Mesh(headlightGeometry, supercarLights);
      light.position.set(side * 0.47, 0.54, -1.21);
      light.rotation.z = side * 0.12;
      supercarDetails.add(intake, light);
    }
    supercarDetails.visible = false;
    car.add(supercarDetails);
    const wheelGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x151715, roughness: 0.8 });
    const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x9ba893, metalness: 0.7, roughness: 0.35 });
    const wheels = [];
    for (const x of [-0.72, 0.72]) for (const z of [-0.65, 0.65]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.3, z);
      car.add(wheel);
      wheels.push(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.19, 12), hubMaterial);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      car.add(hub);
      wheels.push(hub);
    }
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2bc });
    for (const x of [-0.43, 0.43]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.12, 0.06), lampMaterial);
      lamp.position.set(x, 0.59, -1.05);
      car.add(lamp);
    }
    const headlights = new THREE.SpotLight(0xe8ffd0, 0, 18, Math.PI / 6, 0.6, 1.5);
    headlights.position.set(0, 0.8, -0.85);
    headlights.target.position.set(0, 0, -8);
    car.add(headlights, headlights.target);
    const tailMaterial = new THREE.MeshBasicMaterial({ color: 0xd9664d });
    for (const x of [-0.43, 0.43]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.06), tailMaterial);
      tail.position.set(x, 0.59, 1.05);
      car.add(tail);
    }
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.08, 0.28), new THREE.MeshStandardMaterial({ color: 0x252d21, metalness: 0.25, roughness: 0.5 }));
    spoiler.position.set(0, 0.92, 0.95);
    car.add(spoiler);
    const roofRack = new THREE.Group();
    const rackMaterial = new THREE.MeshStandardMaterial({ color: 0x202820, metalness: 0.4, roughness: 0.5 });
    for (const z of [-0.38, 0.25]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 0.1), rackMaterial);
      rail.position.set(0, 1.26, z);
      roofRack.add(rail);
    }
    car.add(roofRack);
    const suvDetails = new THREE.Group();
    const suvBumper = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 0.22), rackMaterial);
    suvBumper.position.set(0, 0.43, -1.03);
    const spare = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.09, 8, 16), wheelMaterial);
    spare.position.set(0, 0.82, 1.08);
    suvDetails.add(suvBumper, spare);
    car.add(suvDetails);
    // Low-poly XUV700-inspired exterior: upright grille, DRLs, roof rails and side glazing.
    const xuvDetails = new THREE.Group();
    const xuvDark = new THREE.MeshStandardMaterial({ color: 0x171e19, metalness: 0.3, roughness: 0.48 });
    const xuvTrim = new THREE.MeshStandardMaterial({ color: 0x9da99b, metalness: 0.65, roughness: 0.35 });
    const xuvLights = new THREE.MeshBasicMaterial({ color: 0xe9ffdf });
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.28, 0.08), xuvDark);
    grille.position.set(0, 0.58, -1.065);
    xuvDetails.add(grille);
    const slatGeometry = new THREE.BoxGeometry(0.035, 0.22, 0.015);
    for (let i = -3; i <= 3; i += 1) {
      const slat = new THREE.Mesh(slatGeometry, xuvTrim);
      slat.position.set(i * 0.105, 0.58, -1.115);
      xuvDetails.add(slat);
    }
    for (const side of [-1, 1]) {
      const drl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.035), xuvLights);
      drl.position.set(side * 0.59, 0.64, -1.08);
      const upperLight = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.055, 0.035), xuvLights);
      upperLight.position.set(side * 0.45, 0.77, -1.08);
      const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.27, 1.05), xuvDark);
      sideWindow.position.set(side * 0.53, 1.09, 0);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 1.15), xuvTrim);
      rail.position.set(side * 0.45, 1.42, 0);
      xuvDetails.add(drl, upperLight, sideWindow, rail);
    }
    car.add(xuvDetails);
    const boostGlow = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xc6f36a, transparent: true, opacity: 0.8 }));
    boostGlow.rotation.x = Math.PI / 2;
    boostGlow.position.set(0, 0.48, 1.48);
    boostGlow.visible = false;
    car.add(boostGlow);
    const carShadow = new THREE.Mesh(new THREE.CircleGeometry(1.35, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
    carShadow.rotation.x = -Math.PI / 2;
    carShadow.scale.set(0.7, 1.2, 1);
    carShadow.position.y = 0.055;
    world.add(carShadow);
    car.position.set(0, 0, 8);
    world.add(car);

    // A few lightweight cars travel along the main road and slow near the player.
    const traffic = [];
    const trafficBodyGeometry = new THREE.BoxGeometry(1.25, 0.45, 2.1);
    const trafficCabinGeometry = new THREE.BoxGeometry(0.9, 0.45, 0.9);
    const trafficBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x788b69, roughness: 0.65 });
    const trafficGlassMaterial = new THREE.MeshStandardMaterial({ color: 0x202b24, roughness: 0.4 });
    for (let i = 0; i < 4; i += 1) {
      const vehicle = new THREE.Group();
      const shell = new THREE.Mesh(trafficBodyGeometry, trafficBodyMaterial);
      shell.position.y = 0.55;
      const glass = new THREE.Mesh(trafficCabinGeometry, trafficGlassMaterial);
      glass.position.y = 0.98;
      vehicle.add(shell, glass);
      const direction = i % 2 ? 1 : -1;
      vehicle.position.set(direction * 2.5, 0, -35 - i * 40);
      vehicle.rotation.y = direction > 0 ? Math.PI : 0;
      world.add(vehicle);
      traffic.push({ vehicle, direction });
    }
    const signal = new THREE.Group();
    const signalPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.5, 8), new THREE.MeshStandardMaterial({ color: 0x66715e, roughness: 0.8 }));
    signalPole.position.y = 1.75;
    const signalHousing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.35), new THREE.MeshStandardMaterial({ color: 0x1b231b }));
    signalHousing.position.y = 3.15;
    const signalRed = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef7562 }));
    signalRed.position.set(0, 3.43, 0.2);
    const signalGreen = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xc6f36a }));
    signalGreen.position.set(0, 2.87, 0.2);
    signal.add(signalPole, signalHousing, signalRed, signalGreen);
    signal.position.set(5.8, 0, -30);
    world.add(signal);

    // A fixed starting plaza gives the player a recognizable place to return to.
    const plaza = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0x353c30, roughness: 0.9 });
    const darkStone = new THREE.MeshStandardMaterial({ color: 0x242b23, roughness: 0.9 });
    const lime = new THREE.MeshStandardMaterial({ color: 0xc6f36a, emissive: 0x526d24, emissiveIntensity: 0.45 });
    const plazaBase = new THREE.Mesh(new THREE.CylinderGeometry(13, 14, 0.2, 64), darkStone);
    plazaBase.position.y = -0.06;
    plaza.add(plazaBase);
    const plazaRing = new THREE.Mesh(new THREE.TorusGeometry(12.2, 0.08, 8, 96), lime);
    plazaRing.rotation.x = -Math.PI / 2;
    plazaRing.position.y = 0.06;
    plaza.add(plazaRing);
    const monument = new THREE.Group();
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 0.6, 8), stone);
    pedestal.position.y = 0.3;
    monument.add(pedestal);
    const sculpture = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), lime);
    sculpture.position.y = 2.4;
    monument.add(sculpture);
    monument.position.set(-8, 0, 3);
    plaza.add(monument);
    const welcome = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: makeTextTexture('WELCOME TO MY WORLD'), transparent: true, side: THREE.DoubleSide }));
    welcome.position.set(0, 3.7, -10);
    plaza.add(welcome);
    for (let i = 0; i < 12; i += 1) {
      const angle = i / 12 * Math.PI * 2;
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), lime);
      marker.position.set(Math.cos(angle) * 11.2, 0.18, Math.sin(angle) * 11.2);
      plaza.add(marker);
    }
    world.add(plaza);

    // A small parking area and approach markings make the plaza read as a place.
    const parking = new THREE.Group();
    const paintMaterial = new THREE.MeshBasicMaterial({ color: 0x9cae81, transparent: true, opacity: 0.72 });
    const lineGeometry = new THREE.PlaneGeometry(0.1, 3.2);
    for (let i = 0; i < 5; i += 1) {
      const line = new THREE.Mesh(lineGeometry, paintMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(13 + i * 2.5, 0.025, 5);
      parking.add(line);
    }
    const parkingSign = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.6), new THREE.MeshBasicMaterial({ map: makeTextTexture('PARKING'), transparent: true, side: THREE.DoubleSide }));
    parkingSign.position.set(18, 2.1, 7);
    parking.add(parkingSign);
    world.add(parking);

    // Distinct low-poly district entrances form a legible route along the main road.
    const zonePillarGeometry = new THREE.BoxGeometry(1.1, 4, 1.1);
    const districtRoadGeometry = new THREE.PlaneGeometry(16, 6);
    const zonePillarMaterial = new THREE.MeshStandardMaterial({ color: 0x495940, roughness: 0.8 });
    const zoneAccentMaterial = new THREE.MeshStandardMaterial({ color: 0xc6f36a, emissive: 0x3b501c, emissiveIntensity: 0.35 });
    const districtBlockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const districtDarkMaterial = new THREE.MeshStandardMaterial({ color: 0x283328, roughness: 0.9 });
    const districtTrimMaterial = new THREE.MeshStandardMaterial({ color: 0x879b6e, roughness: 0.75 });
    const districtLandmarks = [];
    ZONES.forEach((zone, index) => {
      const district = new THREE.Group();
      district.position.set(index % 2 ? 14 : -14, 0, zone.z - 12);
      const sideRoad = new THREE.Mesh(districtRoadGeometry, roadMaterial);
      sideRoad.rotation.x = -Math.PI / 2;
      sideRoad.position.set(index % 2 ? -7 : 7, -0.03, 12);
      district.add(sideRoad);
      for (const x of [-3.3, 3.3]) {
        const pillar = new THREE.Mesh(zonePillarGeometry, zonePillarMaterial);
        pillar.position.set(x, 2, 0);
        district.add(pillar);
      }
      const arch = new THREE.Mesh(new THREE.BoxGeometry(7.7, 0.3, 1.1), zoneAccentMaterial);
      arch.position.y = 4;
      district.add(arch);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.1), new THREE.MeshBasicMaterial({ map: makeTextTexture(zone.name.toUpperCase()), transparent: true, side: THREE.DoubleSide }));
      sign.position.set(0, 3.1, 0.6);
      district.add(sign);
      if (zone.id === 'industrial') {
        for (let i = 0; i < 3; i += 1) {
          const container = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 3), zonePillarMaterial);
          container.position.set(-2.6 + i * 2.6, 0.75, -4);
          district.add(container);
        }
        const warehouse = new THREE.Mesh(districtBlockGeometry, districtDarkMaterial);
        warehouse.scale.set(10, 5, 4);
        warehouse.position.set(0, 2.5, -10);
        district.add(warehouse);
        for (let bay = -1; bay <= 1; bay += 1) {
          const door = new THREE.Mesh(districtBlockGeometry, districtTrimMaterial);
          door.scale.set(2.2, 2.7, 0.08);
          door.position.set(bay * 2.8, 1.4, -7.96);
          district.add(door);
        }
      } else if (zone.id === 'nature') {
        const hill = new THREE.Mesh(new THREE.ConeGeometry(3.5, 3, 6), new THREE.MeshStandardMaterial({ color: 0x566e42, roughness: 1 }));
        hill.position.set(0, 1.5, -5);
        district.add(hill);
        const pond = new THREE.Mesh(new THREE.CircleGeometry(3, 24), new THREE.MeshStandardMaterial({ color: 0x394e43, metalness: 0.18, roughness: 0.3 }));
        pond.rotation.x = -Math.PI / 2;
        pond.position.set(5.5, -0.02, -7);
        district.add(pond);
        for (let i = 0; i < 3; i += 1) {
          const pine = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.7, 6), districtTrimMaterial);
          pine.position.set(-5 + i * 2, 1.35, -7);
          district.add(pine);
        }
      } else if (zone.id === 'portfolio') {
        const sculpture = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.22, 64, 8), zoneAccentMaterial);
        sculpture.position.set(0, 2, -4);
        district.add(sculpture);
        const headquarters = new THREE.Mesh(new THREE.BoxGeometry(9, 6, 3), zonePillarMaterial);
        headquarters.position.set(0, 3, -10);
        district.add(headquarters);
        const identity = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.4), new THREE.MeshBasicMaterial({ map: makeTextTexture(profile.name.toUpperCase()), transparent: true, side: THREE.DoubleSide }));
        identity.position.set(0, 5, -8.45);
        district.add(identity);
        const entrance = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3), new THREE.MeshStandardMaterial({ color: 0x202920 }));
        entrance.position.set(0, 1.5, -8.44);
        district.add(entrance);
      } else if (zone.id === 'racing') {
        const marker = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.18, 8, 32), zoneAccentMaterial);
        marker.position.set(0, 2.5, -4);
        district.add(marker);
        const track = new THREE.Mesh(new THREE.RingGeometry(5.5, 8, 48), roadMaterial);
        track.rotation.x = -Math.PI / 2;
        track.position.set(0, -0.02, -9);
        district.add(track);
        for (let i = 0; i < 8; i += 1) {
          const angle = i * Math.PI / 4;
          const barrier = new THREE.Mesh(districtBlockGeometry, i % 2 ? zoneAccentMaterial : districtTrimMaterial);
          barrier.scale.set(1.2, 0.35, 0.35);
          barrier.position.set(Math.sin(angle) * 8, 0.2, -9 + Math.cos(angle) * 8);
          barrier.rotation.y = angle;
          district.add(barrier);
        }
      } else {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(2.5, 5, 2.5), zonePillarMaterial);
        tower.position.set(0, 2.5, -4);
        district.add(tower);
        const shop = new THREE.Mesh(districtBlockGeometry, districtDarkMaterial);
        shop.scale.set(5, 3, 3);
        shop.position.set(5, 1.5, -6);
        district.add(shop);
        const awning = new THREE.Mesh(districtBlockGeometry, districtTrimMaterial);
        awning.scale.set(5.3, 0.2, 1);
        awning.position.set(5, 2.5, -4);
        district.add(awning);
      }
      world.add(district);
      districtLandmarks.push({ mesh: district, baseZ: zone.z - 12, id: zone.id });
    });

    const trees = [];
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x59604b, roughness: 1 });
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x647e43, roughness: 0.85 });
    const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.25, 2, 7);
    const leafGeometry = new THREE.IcosahedronGeometry(1.3, 0);
    for (let i = 0; i < 40; i += 1) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 1;
      const canopy = new THREE.Mesh(leafGeometry, leafMaterial);
      canopy.position.y = 2.8;
      tree.add(trunk, canopy);
      tree.position.set((i % 2 ? -1 : 1) * (14 + (i % 5) * 4), 0, 20 - Math.floor(i / 2) * 14);
      trees.push(tree);
      world.add(tree);
    }

    const obstacles = [];
    const buildingMaterials = [0x343b30, 0x454a3a, 0x29392e, 0x263c35, 0x315044, 0x26372f, 0x42332d, 0x514038, 0x382d29].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
    const windowMaterials = [0xc6f36a, 0x77c6b3, 0xffb878].map((color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.58 }));
    const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    const windowGeometry = new THREE.BoxGeometry(1, 1, 1);
    const entranceMaterial = new THREE.MeshStandardMaterial({ color: 0x1b241b, roughness: 0.85 });
    const entranceGeometry = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 160; i += 1) {
      const cellX = (i % 10) * 36 - 162;
      const cellZ = Math.floor(i / 10) * 36 - 270;
      let x = cellX + (Math.random() - 0.5) * 18;
      const z = cellZ + (Math.random() - 0.5) * 18;
      if (Math.abs(x) < 12 || Math.abs(z) < 12) x += x < 0 ? -12 : 12;
      const baseX = x;
      const baseZ = z;
      const height = 1.5 + Math.random() * 5;
      const width = 1.5 + Math.random() * 3;
      const district = Math.floor(Math.abs(cellZ) / 90) % 3;
      const material = buildingMaterials[district * 3 + i % 3];
      const building = new THREE.Mesh(buildingGeometry, material);
      building.scale.set(width, height, width);
      if (i % 4 === 0) {
        const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
        entrance.scale.set(0.32, Math.min(0.5, 1.5 / height), 1);
        entrance.position.set(0, -0.5 + entrance.scale.y / 2, 0.501);
        building.add(entrance);
      }
      building.position.set(x, height / 2 - 0.06, z);
      world.add(building);
      const windows = new THREE.Mesh(windowGeometry, windowMaterials[district]);
      windows.scale.set(width * 0.72, 0.08, width * 0.72);
      windows.position.set(x, height * 0.64, z - width / 2 - 0.012);
      world.add(windows);
      obstacles.push({ x, z, baseX, baseZ, width, height, radius: width * 0.55, building, windows });
    }

    const streetLamps = [];
    const lampPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x717666, metalness: 0.65, roughness: 0.35 });
    const lampGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xd8ff9a });
    const signGeometry = new THREE.BoxGeometry(0.9, 0.65, 0.08);
    const signMaterial = new THREE.MeshStandardMaterial({ color: 0x526447, roughness: 0.8 });
    for (let i = 0; i < 48; i += 1) {
      const z = -i * 18;
      const x = i % 2 ? -7 : 7;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 4.2, 8), lampPoleMaterial);
      pole.position.set(x, 2.1, z);
      if (i % 4 === 0) {
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 0.35, 0);
        pole.add(sign);
      }
      world.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), lampPoleMaterial);
      arm.position.set(x + (x < 0 ? 0.35 : -0.35), 4.1, z);
      world.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), lampGlowMaterial);
      bulb.position.set(x + (x < 0 ? 0.65 : -0.65), 4, z);
      world.add(bulb);
      streetLamps.push({ pole, arm, bulb, x, z });
    }

    const gateObjects = stops.map((stop) => {
      const gate = new THREE.Group();
      const postMaterial = new THREE.MeshStandardMaterial({ color: stop.color, emissive: stop.color, emissiveIntensity: 0.65 });
      for (const x of [-2.2, 2.2]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.6, 0.14), postMaterial);
        post.position.set(x, 1.8, 0);
        gate.add(post);
      }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.14, 0.14), postMaterial);
      bar.position.y = 3.6;
      gate.add(bar);
      const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.6, 0), postMaterial);
      beacon.position.y = 4.5;
      gate.add(beacon);
      const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.12, 32), new THREE.MeshStandardMaterial({ color: 0x353c30, roughness: 0.9 }));
      platform.position.y = -0.01;
      gate.add(platform);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: makeTextTexture(stop.label), transparent: true, side: THREE.DoubleSide }));
      sign.position.set(0, 2.8, 0.1);
      gate.add(sign);

      // Each destination has a different silhouette that can be recognized from the road.
      const landmarkMaterial = new THREE.MeshStandardMaterial({ color: 0x495440, roughness: 0.8, metalness: 0.1 });
      const detailMaterial = new THREE.MeshStandardMaterial({ color: 0xc6f36a, emissive: 0x384b1c, emissiveIntensity: 0.35 });
      const landmark = new THREE.Group();
      landmark.position.set(0, 0, -6);
      if (stop.id === 'about') {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.5, 8), landmarkMaterial);
        base.position.y = 0.25;
        const portrait = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), detailMaterial);
        portrait.position.y = 2;
        landmark.add(base, portrait);
      } else if (stop.id === 'experience') {
        for (let i = 0; i < 4; i += 1) {
          const height = 1 + i * 0.8;
          const column = new THREE.Mesh(new THREE.BoxGeometry(0.85, height, 1.2), landmarkMaterial);
          column.position.set((i - 1.5) * 1.1, height / 2, 0);
          landmark.add(column);
          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 1.25), detailMaterial);
          cap.position.set(column.position.x, height, 0);
          landmark.add(cap);
        }
      } else if (stop.id === 'projects') {
        for (let i = 0; i < 3; i += 1) {
          const panel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.2), landmarkMaterial);
          panel.position.set((i - 1) * 2, 1.5, 0);
          panel.rotation.y = (1 - i) * 0.18;
          const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.8), detailMaterial);
          screen.position.z = 0.11;
          panel.add(screen);
          landmark.add(panel);
        }
      } else if (stop.id === 'skills') {
        for (let i = 0; i < 5; i += 1) {
          const block = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), i % 2 ? detailMaterial : landmarkMaterial);
          block.position.set((i % 2 - 0.5) * 1.15, 0.55 + Math.floor(i / 2) * 1.12, 0);
          block.rotation.y = i * 0.16;
          landmark.add(block);
        }
      } else {
        const envelope = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.35), landmarkMaterial);
        envelope.position.y = 1.5;
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.1), detailMaterial);
        stripe.position.set(0, 1.6, 0.22);
        landmark.add(envelope, stripe);
      }
      gate.add(landmark);
      gate.position.set(stop.x, 0, stop.z);
      world.add(gate);
      return gate;
    });

    const pickups = [];
    const crates = [];
    const crateGeometry = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const crateMaterial = new THREE.MeshStandardMaterial({ color: 0x899b67, roughness: 0.82 });
    for (let i = 0; i < 12; i += 1) {
      const crate = new THREE.Mesh(crateGeometry, crateMaterial);
      crate.position.set((i % 2 ? 1 : -1) * (3 + (i % 3)), 0.55, -14 - i * 17);
      world.add(crate);
      crates.push({ mesh: crate, vx: 0, vz: 0, spin: 0 });
    }
    const ramp = new THREE.Group();
    const rampSurface = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.35, 5), new THREE.MeshStandardMaterial({ color: 0x6d8053, roughness: 0.9 }));
    rampSurface.rotation.x = -0.16;
    rampSurface.position.y = 0.4;
    ramp.add(rampSurface);
    const rampMark = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.28), new THREE.MeshBasicMaterial({ color: 0xc6f36a, side: THREE.DoubleSide }));
    rampMark.rotation.x = -Math.PI / 2 - 0.16;
    rampMark.position.set(0, 0.63, 0);
    ramp.add(rampMark);
    ramp.position.set(0, 0, -48);
    world.add(ramp);
    const pickupMaterial = new THREE.MeshStandardMaterial({ color: 0xe1ff9e, emissive: 0x8bbb43, emissiveIntensity: 1.5, metalness: 0.35, roughness: 0.25 });
    for (let i = 0; i < 12; i += 1) {
      const pickup = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), pickupMaterial);
      pickup.position.set(i % 2 ? 2.6 : -2.6, 0.65, -3 - i * 5.8);
      world.add(pickup);
      pickups.push({ mesh: pickup, found: false });
    }

    // A single reusable beacon marks the next point in a five-gate route.
    const checkpoint = new THREE.Group();
    const checkpointMaterial = new THREE.MeshBasicMaterial({ color: 0xc6f36a, transparent: true, opacity: 0.9 });
    const checkpointRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.1, 8, 48), checkpointMaterial);
    checkpointRing.position.y = 2.7;
    checkpoint.add(checkpointRing);
    const checkpointLabel = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), new THREE.MeshBasicMaterial({ map: makeTextTexture('CHECKPOINT'), transparent: true, side: THREE.DoubleSide }));
    checkpointLabel.position.set(0, 5.4, 0);
    checkpoint.add(checkpointLabel);
    checkpoint.visible = false;
    world.add(checkpoint);

    const speedZone = new THREE.Group();
    const speedZoneLine = new THREE.Mesh(new THREE.PlaneGeometry(9, 25), new THREE.MeshBasicMaterial({ color: 0xc6f36a, transparent: true, opacity: 0.12, depthWrite: false }));
    speedZoneLine.rotation.x = -Math.PI / 2;
    speedZoneLine.position.y = 0.025;
    speedZone.add(speedZoneLine);
    const speedZoneSign = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.1), new THREE.MeshBasicMaterial({ map: makeTextTexture('SPEED ZONE'), transparent: true, side: THREE.DoubleSide }));
    speedZoneSign.position.set(0, 4, 11);
    speedZone.add(speedZoneSign);
    speedZone.position.set(0, 0, -115);
    world.add(speedZone);

    const hiddenRelics = [];
    const relicGeometry = new THREE.IcosahedronGeometry(0.7, 0);
    const relicMaterial = new THREE.MeshStandardMaterial({ color: 0xc6f36a, emissive: 0x779e34, emissiveIntensity: 1.4, metalness: 0.45, roughness: 0.25 });
    for (let i = 0; i < 6; i += 1) {
      const mesh = new THREE.Mesh(relicGeometry, relicMaterial);
      mesh.position.set((i % 2 ? -1 : 1) * (18 + (i % 3) * 7), 1.1, -18 - i * 24);
      world.add(mesh);
      hiddenRelics.push({ mesh, found: false });
    }

    const keys = new Set();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { down: false, x: 0 };
    let touchSteer = 0;
    let velocity = 0;
    let automaticGear = 1;
    let shiftDip = 0;
    const regularShiftPoints = [3, 5.5, 8, 10.5];
    // HUD speed is measured as world units per second multiplied by nine.
    const supercarShiftPoints = [125 / 9, 250 / 9, 310 / 9, 380 / 9];
    let jumpHeight = 0;
    let jumpSpeed = 0;
    let jumpStart = null;
    let steer = 0;
    let yaw = 0;
    let crashCooldown = 0;
    let rampCooldown = 0;
    let speedZoneTime = 0;
    let speedZoneRewarded = false;
    let lastSpeedZoneSecond = -1;
    let fastTurnTime = 0;
    const discovered = new Set();
    const nearbyGates = new Set();
    let nearbyDestination = null;
    let headquartersInRange = false;
    let speedUpdateAt = 0;
    let route = null;
    let toastTimer;
    const timers = new Set();
    const later = (callback, delay) => {
      const timer = window.setTimeout(() => { timers.delete(timer); callback(); }, delay);
      timers.add(timer);
      return timer;
    };
    const announce = (message, duration = 1800) => {
      window.clearTimeout(toastTimer);
      timers.delete(toastTimer);
      setToast(message);
      toastTimer = later(() => setToast(''), duration);
    };
    const recordProgress = (type, value) => {
      const result = advanceProgress(progressRef.current, type, value);
      if (JSON.stringify(result.progress) === JSON.stringify(progressRef.current)) return;
      progressRef.current = result.progress;
      setProgress(result.progress);
      try { window.localStorage.setItem('portfolio-drive-progress-v1', JSON.stringify(result.progress)); } catch { /* Continue without persistence. */ }
      if (result.earned.length) announce(`MISSION COMPLETE · +${result.earned.reduce((sum, mission) => sum + mission.reward, 0)} XP`, 3500);
    };
    let lastZone = '';
    let appliedGarage = '';
    let appliedTime = '';
    let dayCycleElapsed = 0;
    const skyColors = { day: 0x71886b, sunset: 0x5d4b3c, night: 0x10130f };
    const targetSky = new THREE.Color(skyColors.night);
    let targetSunIntensity = 1.4;
    let targetWindowOpacity = 0.7;
    let frame;
    let visible = true;
    let previous = 0;
    const previousPosition = new THREE.Vector3();
    const cameraTarget = new THREE.Vector3();
    const desiredCamera = new THREE.Vector3();
    const keydown = (event) => { const key = event.key.toLowerCase(); if (event.target instanceof HTMLElement && (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName) || event.target.isContentEditable || (event.target.tagName === 'BUTTON' && [' ', 'enter'].includes(key)))) return; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); if (!event.repeat && key === 'escape') { setMenuOpen(false); setActiveStop(null); setShowGarage(false); setShowStory(false); setShowMissions(false); setShowAchievements(false); setPhotoMode(false); clearControls(); return; } if (!event.repeat && key === 'j' && jumpHeight === 0 && !settingsRef.current.paused) jumpSpeed = 7; if (!event.repeat && key === 'shift' && !keys.has('shift') && !settingsRef.current.paused) playEffect(180, 360, 0.16); if (!event.repeat && key === 'enter' && nearbyDestination) setActiveStop(nearbyDestination.id); else if (!event.repeat && key === 'enter' && headquartersInRange) { setStoryStep(0); setStoryVisited((visited) => visited.includes(0) ? visited : [...visited, 0]); setShowStory(true); } keys.add(key); };
    const keyup = (event) => keys.delete(event.key.toLowerCase());
    const clearControls = () => { keys.clear(); pointer.down = false; touchSteer = 0; };
    const onVisibilityChange = () => {
      if (document.hidden) {
        clearControls();
        velocity = 0;
        if (engineRef.current && audioRef.current) engineRef.current.gain.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.05);
        if (engineRef.current && audioRef.current) engineRef.current.rainGain.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.05);
      } else {
        previous = 0;
      }
    };
    const pointerdown = (event) => { pointer.down = true; pointer.x = event.clientX; touchSteer = 0; canvas.setPointerCapture(event.pointerId); };
    const pointermove = (event) => { if (pointer.down) touchSteer = THREE.MathUtils.clamp((event.clientX - pointer.x) / Math.max(canvas.clientWidth * 0.2, 40), -1, 1); };
    const pointerup = () => { pointer.down = false; touchSteer = 0; };
    let targetStop = null;
    const onDestination = (event) => {
      if (!event.detail) { targetStop = null; setGuidance(null); return; }
      const index = stops.findIndex((item) => item.id === event.detail.id);
      const gate = gateObjects[index];
      if (gate) targetStop = { ...event.detail, gate };
    };
    const startChallenge = () => { challengeRef.current = { active: true, elapsed: 0, score: 0, best: challengeRef.current.best }; setChallenge({ active: true, seconds: 0, score: 0, best: challengeRef.current.best, finished: false }); };
    const startRoute = () => {
      const start = { x: car.position.x, z: car.position.z };
      route = { index: 0, elapsed: 0, points: Array.from({ length: 5 }, (_, i) => { const point = routePoint(start, yaw, i); return new THREE.Vector3(point.x, 0, point.z); }) };
      checkpoint.position.copy(route.points[0]);
      checkpoint.position.y = 0;
      checkpoint.rotation.y = -yaw;
      checkpoint.visible = true;
      setRouteRun({ active: true, index: 0, elapsed: 0, finished: false });
      announce('DRIVE THROUGH THE LIME RINGS IN ORDER');
    };
    const resetCar = () => { car.position.set(0, 0, 8); yaw = 0; velocity = 0; automaticGear = 1; shiftDip = 0; setTransmission('D1'); steer = 0; jumpHeight = 0; jumpSpeed = 0; jumpStart = null; keys.clear(); targetStop = null; setGuidance(null); route = null; checkpoint.visible = false; setRouteRun({ active: false, index: 0, elapsed: 0, finished: false }); };
    const resetProgressObjects = () => { discovered.clear(); nearbyGates.clear(); setUnlocked(0); lastZone = ''; hiddenRelics.forEach((relic) => { relic.found = false; relic.mesh.visible = true; }); };
    const onQualityChange = () => resize();
    const capturePhoto = () => {
      if (!settingsRef.current.photoMode) return;
      try {
        renderer.render(scene, camera);
        canvas.toBlob((blob) => {
          if (!blob) { announce('COULD NOT CAPTURE PHOTO'); return; }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'portfolio-drive.png';
          link.click();
          later(() => URL.revokeObjectURL(url), 10000);
        }, 'image/png');
      } catch { announce('PHOTO CAPTURE IS UNAVAILABLE'); }
    };
    const playPickup = () => {
      if (settingsRef.current.muted || !audioRef.current) return;
      const audio = audioRef.current;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(740, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1180, audio.currentTime + 0.11);
      gain.gain.setValueAtTime(0.12, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + 0.18);
    };
    const playEffect = (from, to, duration) => {
      if (settingsRef.current.muted || !audioRef.current) return;
      const audio = audioRef.current;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(from, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(to, audio.currentTime + duration);
      gain.gain.setValueAtTime(0.08, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + duration);
    };
    const playImpact = () => {
      if (settingsRef.current.muted || !audioRef.current) return;
      const audio = audioRef.current;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(140, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(45, audio.currentTime + 0.13);
      gain.gain.setValueAtTime(0.13, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + 0.18);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', clearControls);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('drive-destination', onDestination);
    window.addEventListener('drive-challenge', startChallenge);
    window.addEventListener('drive-route', startRoute);
    window.addEventListener('drive-reset', resetCar);
    window.addEventListener('drive-reset-progress', resetProgressObjects);
    window.addEventListener('drive-quality-change', onQualityChange);
    window.addEventListener('drive-photo', capturePhoto);
    canvas.addEventListener('pointerdown', pointerdown);
    canvas.addEventListener('pointermove', pointermove);
    canvas.addEventListener('pointerup', pointerup);
    canvas.addEventListener('pointercancel', pointerup);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(settingsRef.current.quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, settingsRef.current.quality === 'medium' ? 1.2 : 1.6));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 700 ? 68 : 55;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) { previous = 0; frame = requestAnimationFrame(animate); }
      if (!visible) {
        clearControls();
        velocity = 0;
        if (engineRef.current && audioRef.current) engineRef.current.gain.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.05);
        if (engineRef.current && audioRef.current) engineRef.current.rainGain.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.05);
      }
    });
    intersection.observe(canvas);

    function animate(now = 0) {
      frame = undefined;
      if (!visible) return;
      const delta = Math.min((now - previous) / 1000 || 0, 0.04);
      previous = now;
      const chosenGarage = settingsRef.current.garage;
      const garageKey = `${chosenGarage.vehicle}:${chosenGarage.paint}:${chosenGarage.wheels}`;
      if (garageKey !== appliedGarage) {
        appliedGarage = garageKey;
        body.material.color.set(chosenGarage.paint);
        hood.material.color.set(chosenGarage.paint);
        hubMaterial.color.set(chosenGarage.wheels);
        const xuv = chosenGarage.vehicle === 'xuv700';
        const trail = chosenGarage.vehicle === 'trail';
        const suv = chosenGarage.vehicle === 'suv' || xuv || trail;
        const supercar = chosenGarage.vehicle === 'supercar';
        body.visible = !supercar;
        hood.visible = !supercar;
        cabin.visible = !supercar;
        supercarDetails.visible = supercar;
        body.scale.set(suv ? 1.1 : supercar ? 1.2 : 1, suv ? 1.45 : supercar ? 0.72 : 1, suv ? 0.9 : supercar ? 1.15 : 1);
        cabin.scale.set(suv ? 1.1 : supercar ? 0.92 : 1, suv ? 1.3 : supercar ? 0.72 : 1, suv ? 1.25 : supercar ? 0.9 : 1);
        cabin.position.y = suv ? 1.08 : supercar ? 0.88 : 0.97;
        roofRack.position.y = suv ? 0.2 : 0;
        roofRack.visible = suv;
        suvDetails.visible = suv && !xuv;
        xuvDetails.visible = xuv;
        spoiler.visible = !suv;
        spoiler.scale.set(supercar ? 1.15 : 1, 1, supercar ? 1.5 : 1);
        wheels.forEach((wheel) => wheel.scale.setScalar(trail ? 1.35 : suv ? 1.2 : 1));
      }
      if (settingsRef.current.paused) {
        clearControls();
        if (engineRef.current && audioRef.current) engineRef.current.gain.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.08);
        if (engineRef.current && audioRef.current) engineRef.current.rainGain.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.08);
        if (settingsRef.current.photoMode) {
          const photo = settingsRef.current.photoCamera;
          camera.position.set(car.position.x + Math.sin(photo.angle) * photo.distance, car.position.y + photo.height, car.position.z + Math.cos(photo.angle) * photo.distance);
          camera.lookAt(car.position.x, car.position.y + 0.7, car.position.z);
        } else if (settingsRef.current.showGarage) {
          const angle = reducedMotion.matches ? 0.7 : 0.7 + now * 0.0002;
          camera.position.set(car.position.x + Math.sin(angle) * 6, car.position.y + 3.2, car.position.z + Math.cos(angle) * 6);
          camera.lookAt(car.position.x, car.position.y + 0.65, car.position.z);
        }
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
        return;
      }
      const weatherMode = settingsRef.current.weather;
      rain.visible = weatherMode === 'rain' && !reducedMotion.matches;
      rainGeometry.setDrawRange(0, settingsRef.current.quality === 'low' ? 140 : 360);
      scene.fog.near = THREE.MathUtils.damp(scene.fog.near, weatherMode === 'fog' ? 10 : 24, 1.2, delta);
      scene.fog.far = THREE.MathUtils.damp(scene.fog.far, weatherMode === 'fog' ? 38 : 65, 1.2, delta);
      roadMaterial.roughness = weatherMode === 'rain' ? 0.32 : 0.9;
      if (rain.visible) {
        const positions = rainGeometry.attributes.position;
        for (let i = 0; i < positions.count; i += 1) {
          const y = positions.getY(i) - delta * 14;
          positions.setY(i, y < 0 ? y + 18 : y);
        }
        positions.needsUpdate = true;
        rain.position.set(car.position.x, 0, car.position.z);
      }
      if (route) route.elapsed += delta;
      const zone = zoneAt(car.position.z);
      if (zone.id !== lastZone) {
        lastZone = zone.id;
        setZoneName(zone.name);
        if (!progressRef.current.zones.includes(zone.id)) announce(`${zone.name.toUpperCase()} · ${zone.description}`, 3000);
        recordProgress('zones', zone.id);
      }
      if (settingsRef.current.timeOfDay === 'auto') dayCycleElapsed += delta;
      const selectedTime = settingsRef.current.timeOfDay === 'auto' ? ['day', 'sunset', 'night'][Math.floor(dayCycleElapsed / 45) % 3] : settingsRef.current.timeOfDay;
      if (selectedTime !== appliedTime) {
        appliedTime = selectedTime;
        targetSky.setHex(skyColors[appliedTime]);
        targetSunIntensity = appliedTime === 'day' ? 4 : appliedTime === 'sunset' ? 2.5 : 1.4;
        targetWindowOpacity = appliedTime === 'day' ? 0.2 : 0.7;
        sun.color.setHex(appliedTime === 'sunset' ? 0xffc98c : 0xd7f59c);
        lampGlowMaterial.color.setHex(appliedTime === 'day' ? 0x859878 : 0xd8ff9a);
      }
      scene.background.lerp(targetSky, 1 - Math.exp(-delta * 0.8));
      scene.fog.color.copy(scene.background);
      sun.intensity = THREE.MathUtils.damp(sun.intensity, targetSunIntensity, 0.8, delta);
      headlights.intensity = THREE.MathUtils.damp(headlights.intensity, appliedTime === 'night' && settingsRef.current.quality !== 'low' ? 18 : 0, 0.8, delta);
      windowMaterials.forEach((material) => { material.opacity = THREE.MathUtils.damp(material.opacity, targetWindowOpacity, 0.8, delta); });
      if (challengeRef.current.active) {
        challengeRef.current.elapsed += delta;
        if (challengeRef.current.elapsed >= 60) {
          const game = challengeRef.current;
          game.active = false;
          game.best = Math.max(game.best, game.score);
          try { window.localStorage.setItem('portfolio-drive-best', String(game.best)); } catch { /* Score remains available for this session. */ }
          setChallenge({ active: false, seconds: 60, score: game.score, best: game.best, finished: true });
          setToast(`TIME UP! ${game.score} CRYSTALS`);
        }
      }
      const accelerating = keys.has('w') || keys.has('arrowup');
      if (!progressRef.current.speed && Math.abs(velocity) * 9 >= 90) recordProgress('speed', true);
      const reversing = keys.has('s') || keys.has('arrowdown');
      const braking = keys.has(' ');
      const left = keys.has('a') || keys.has('arrowleft');
      const right = keys.has('d') || keys.has('arrowright');
      const direction = pointer.down ? touchSteer : Number(right) - Number(left);
      const signalRedPhase = Math.floor(now / 8000) % 2 === 0;
      signal.position.z = -30 + Math.round((car.position.z + 30) / 300) * 300;
      signalRed.material.color.setHex(signalRedPhase ? 0xef7562 : 0x492821);
      signalGreen.material.color.setHex(signalRedPhase ? 0x35452e : 0xc6f36a);
      traffic.forEach(({ vehicle, direction: travel }) => {
        const distance = Math.hypot(car.position.x - vehicle.position.x, car.position.z - vehicle.position.z);
        const approachingSignal = signalRedPhase && travel < 0 && vehicle.position.z > signal.position.z && vehicle.position.z - signal.position.z < 5;
        if (distance > 8 && !approachingSignal) vehicle.position.z += travel * 3.5 * delta;
        if (Math.abs(vehicle.position.z - car.position.z) > 125) vehicle.position.z = car.position.z - travel * 110;
      });
        const isSupercar = settingsRef.current.garage.vehicle === 'supercar';
        const shiftPoints = isSupercar ? supercarShiftPoints : regularShiftPoints;
        const vehicleSpeed = ['suv', 'xuv700', 'trail'].includes(settingsRef.current.garage.vehicle) ? 0.82 : 1;
        const topSpeed = isSupercar ? 40 : 12 * vehicleSpeed;
        const targetVelocity = braking ? 0 : accelerating ? topSpeed * (settingsRef.current.handling === 'relaxed' ? 0.75 : 1) * (keys.has('shift') ? 1.35 : 1) : reversing ? -3.5 : 0;
        const response = braking ? 12 : accelerating ? (isSupercar ? 0.45 : Math.max(0.7, 1.7 - (automaticGear - 1) * 0.16)) : reversing ? 1.6 : 0.8;
        velocity = THREE.MathUtils.damp(velocity, targetVelocity, response, delta);
      const oldGear = automaticGear;
      if (velocity > 0) {
        while (automaticGear < 5 && velocity >= shiftPoints[automaticGear - 1]) automaticGear += 1;
        while (automaticGear > 1 && velocity < shiftPoints[automaticGear - 2] - 0.35) automaticGear -= 1;
      } else if (velocity < -0.2) automaticGear = 1;
      if (oldGear !== automaticGear) shiftDip = 0.28;
      shiftDip = Math.max(0, shiftDip - delta);
      const onDistrictRoad = districtLandmarks.some(({ mesh }, index) => Math.abs(car.position.x - (mesh.position.x + (index % 2 ? -7 : 7))) < 8 && Math.abs(car.position.z - (mesh.position.z + 12)) < 3);
      const offRoad = Math.abs(car.position.x) > 4.35 && Math.abs(car.position.z) > 4.35 && !onDistrictRoad;
      if (offRoad) velocity = THREE.MathUtils.clamp(velocity, -3.5, settingsRef.current.garage.vehicle === 'trail' ? 10.5 : ['suv', 'xuv700'].includes(settingsRef.current.garage.vehicle) ? 9 : 7);
      steer = THREE.MathUtils.damp(steer, direction, pointer.down ? 10 : 12, delta);
      if (!progressRef.current.drift) {
        fastTurnTime = velocity > 4 && Math.abs(steer) > 0.6 && jumpHeight === 0 ? fastTurnTime + delta : 0;
        if (fastTurnTime >= 4) recordProgress('drift', true);
      }
      const grip = settingsRef.current.handling === 'relaxed' ? 1.4 : THREE.MathUtils.lerp(0.95, 0.53, Math.min(Math.abs(velocity) / 10, 1));
      // Keep high-speed steering controllable as supercar speeds increase.
      yaw += steer * Math.sign(velocity) * Math.min(Math.abs(velocity) * grip, 2.4) * delta;
      yaw = THREE.MathUtils.euclideanModulo(yaw + Math.PI, Math.PI * 2) - Math.PI;
      previousPosition.copy(car.position);
      car.position.x += Math.sin(yaw) * velocity * delta;
      car.position.z -= Math.cos(yaw) * velocity * delta;
      hills.forEach((hill) => {
        hill.mesh.position.x = hill.x + Math.round((car.position.x - hill.x) / 240) * 240;
        hill.mesh.position.z = hill.z + Math.round((car.position.z - hill.z) / 300) * 300;
      });
      const terrainHeight = terrainHeightAt(car.position.x, car.position.z);
      speedZone.position.z = -115 + Math.round((car.position.z + 115) / 300) * 300;
      const inSpeedZone = Math.abs(car.position.x) < 4.5 && Math.abs(car.position.z - speedZone.position.z) < 12.5;
      if (inSpeedZone && !speedZoneRewarded) {
        speedZoneTime = Math.abs(velocity) * 9 >= 45 ? speedZoneTime + delta : 0;
        const seconds = Math.min(3, Math.floor(speedZoneTime));
        if (seconds !== lastSpeedZoneSecond) { lastSpeedZoneSecond = seconds; setSpeedZoneMessage(`SPEED ZONE · HOLD 45 KM/H · ${seconds}/3s`); }
        if (speedZoneTime >= 3) {
          speedZoneRewarded = true;
          setCollected((count) => count + 3);
          setSpeedZoneMessage('SPEED ZONE COMPLETE · +3 CRYSTALS');
          playEffect(400, 800, 0.25);
        }
      } else if (!inSpeedZone && (lastSpeedZoneSecond !== -1 || speedZoneRewarded)) {
        speedZoneTime = 0; speedZoneRewarded = false; lastSpeedZoneSecond = -1; setSpeedZoneMessage('');
      }
      ground.position.x = Math.round(car.position.x / 150) * 150;
      ground.position.z = Math.round(car.position.z / 150) * 150;
      groundGrid.position.x = ground.position.x;
      groundGrid.position.z = ground.position.z;
      road.position.z = Math.round(car.position.z / 1000) * 1000;
      crossRoad.position.x = Math.round(car.position.x / 1000) * 1000;
      car.rotation.y = -yaw;
      car.rotation.z = -steer * Math.min(Math.abs(velocity) / 12, 1) * 0.055;
      const uphillHeight = terrainHeightAt(car.position.x + Math.sin(yaw), car.position.z - Math.cos(yaw));
      car.rotation.x = THREE.MathUtils.damp(car.rotation.x, Math.atan(uphillHeight - terrainHeight), 6, delta);
      tailMaterial.color.setHex(braking || (reversing && velocity > 0.5) ? 0xff3922 : 0x9a392c);
      boostGlow.visible = accelerating && keys.has('shift') && !reducedMotion.matches;
      boostGlow.scale.y = 0.8 + Math.abs(velocity) * 0.05;
      if (jumpSpeed !== 0 || jumpHeight > 0) {
        if (!jumpStart) jumpStart = { x: previousPosition.x, z: previousPosition.z };
        jumpSpeed -= 18 * delta;
        jumpHeight += jumpSpeed * delta;
        if (jumpHeight <= 0) {
          jumpHeight = 0;
          jumpSpeed = 0;
          const distance = Math.hypot(car.position.x - jumpStart.x, car.position.z - jumpStart.z);
          jumpStart = null;
          if (distance >= 2) {
            const rounded = Math.round(distance * 10) / 10;
            if (rounded > stuntBestRef.current) {
              stuntBestRef.current = rounded;
              setStuntBest(rounded);
              try { window.localStorage.setItem('portfolio-drive-stunt-best-v1', String(rounded)); } catch { /* Keep the best for this session. */ }
            }
            announce(`JUMP ${rounded.toFixed(1)} M · +1 CRYSTAL`, 2200);
            setCollected((count) => count + 1);
            playEffect(350, 700, 0.2);
          }
        }
      }
      car.position.y = terrainHeight + jumpHeight + (!reducedMotion.matches && jumpHeight === 0 && Math.abs(velocity) > 0.5 ? Math.sin(now * 0.012) * 0.025 : 0);
      carShadow.position.x = car.position.x;
      carShadow.position.z = car.position.z;
      carShadow.position.y = terrainHeight + 0.055;
      carShadow.rotation.z = yaw;
      carShadow.material.opacity = Math.max(0.08, 0.3 - jumpHeight * 0.08);
      wheels.forEach((wheel) => { wheel.rotation.x -= velocity * delta * 1.7; });
      if (route) {
        const point = route.points[route.index];
        if (Math.hypot(car.position.x - point.x, car.position.z - point.z) < 3) {
          route.index += 1;
          playPickup();
          if (route.index === route.points.length) {
            setRouteRun({ active: false, index: 5, elapsed: route.elapsed, finished: true });
            if (routeBestRef.current === null || route.elapsed < routeBestRef.current) {
              routeBestRef.current = route.elapsed;
              setRouteBest(route.elapsed);
              try { window.localStorage.setItem('portfolio-drive-route-best-v1', String(route.elapsed)); } catch { /* Keep the best for this session. */ }
            }
            announce(`ROUTE COMPLETE · ${route.elapsed.toFixed(1)} SECONDS`, 3500);
            playEffect(440, 880, 0.3);
            setCollected((count) => count + 5);
            recordProgress('route', true);
            checkpoint.visible = false;
            route = null;
          } else {
            checkpoint.position.copy(route.points[route.index]); checkpoint.position.y = 0;
            announce(`CHECKPOINT ${route.index} / 5`);
          }
        }
      }
      ramp.position.z += Math.round((car.position.z - ramp.position.z) / 240) * 240;
      ramp.position.x += Math.round((car.position.x - ramp.position.x) / 240) * 240;
      rampCooldown = Math.max(0, rampCooldown - delta);
      if (rampCooldown === 0 && jumpHeight === 0 && Math.abs(velocity) > 2 && Math.abs(car.position.x - ramp.position.x) < 2 && Math.abs(car.position.z - ramp.position.z) < 2) {
        jumpSpeed = 8;
        rampCooldown = 2;
        announce('RAMP JUMP!', 1400);
        playPickup();
      }
      crates.forEach((crate) => {
        const item = crate.mesh;
        item.position.x += crate.vx * delta;
        item.position.z += crate.vz * delta;
        item.rotation.y += crate.spin * delta;
        crate.vx *= Math.exp(-2 * delta);
        crate.vz *= Math.exp(-2 * delta);
        crate.spin *= Math.exp(-2 * delta);
        item.position.x += Math.round((car.position.x - item.position.x) / 240) * 240;
        item.position.z += Math.round((car.position.z - item.position.z) / 240) * 240;
        const dx = item.position.x - car.position.x;
        const dz = item.position.z - car.position.z;
        const distance = Math.hypot(dx, dz);
        if (distance < 1.35 && jumpHeight < 1 && Math.abs(velocity) > 1) {
          const impulse = Math.max(3, Math.abs(velocity) * 0.75);
          crate.vx = Math.sin(yaw) * impulse;
          crate.vz = -Math.cos(yaw) * impulse;
          crate.spin = velocity * 0.5;
          item.position.x += (dx / (distance || 1)) * 0.3;
          item.position.z += (dz / (distance || 1)) * 0.3;
          velocity *= 0.85;
          if (crashCooldown <= 0) { playImpact(); crashCooldown = 0.3; }
        }
      });
      obstacles.forEach((item) => {
        const hit = Math.abs(car.position.x - item.x) < item.radius + 0.7 && Math.abs(car.position.z - item.z) < item.radius + 0.9;
        const wasInside = Math.abs(previousPosition.x - item.x) < item.radius + 0.7 && Math.abs(previousPosition.z - item.z) < item.radius + 0.9;
        const movingOut = Math.hypot(car.position.x - item.x, car.position.z - item.z) > Math.hypot(previousPosition.x - item.x, previousPosition.z - item.z);
        if (hit && (!wasInside || !movingOut)) {
          car.position.copy(previousPosition);
          velocity = 0;
          if (crashCooldown <= 0) {
            crashCooldown = 0.7;
            playImpact();
            announce('BONK! Reverse to move away.', 1500);
          }
        }
      });
      streetLamps.forEach((lamp) => {
        const shift = Math.round((car.position.z - lamp.z) / 864) * 864;
        lamp.z += shift;
        lamp.pole.position.z = lamp.z;
        lamp.arm.position.z = lamp.z;
        lamp.bulb.position.z = lamp.z;
      });
      trees.forEach((tree) => {
        tree.position.z += Math.round((car.position.z - tree.position.z) / 280) * 280;
        tree.position.x += Math.round((car.position.x - tree.position.x) / 280) * 280;
      });
      if (!reducedMotion.matches) sculpture.rotation.y += delta * 0.35;
      laneMarks.forEach((mark, index) => {
        if (index % 2 === 0) mark.position.z = Math.round(car.position.z / 5) * 5 + (index / 2 - 10) * 5;
        else mark.position.x = Math.round(car.position.x / 5) * 5 + (Math.floor(index / 2) - 10) * 5;
      });
      crashCooldown -= delta;
      nearbyDestination = null;
      let nearestGateDistance = 9;
      gateObjects.forEach((gate, index) => {
        const laps = Math.round((car.position.z - stops[index].z) / 300);
        gate.position.x = stops[index].x;
        gate.position.z = stops[index].z + laps * 300;
        const gateDistance = Math.hypot(car.position.z - gate.position.z, car.position.x - gate.position.x);
        if (gateDistance < nearestGateDistance) { nearestGateDistance = gateDistance; nearbyDestination = stops[index]; }
        const nearby = Math.abs(car.position.z - gate.position.z) < 2 && Math.abs(car.position.x - gate.position.x) < 3;
        if (nearby && !nearbyGates.has(index)) {
          nearbyGates.add(index);
          discovered.add(index);
          setUnlocked(discovered.size);
          setActiveStop(stops[index].id);
          announce(`${stops[index].label} DISCOVERED`, 2200);
          recordProgress('destinations', stops[index].id);
        }
        if (!nearby) nearbyGates.delete(index);
      });
      pickups.forEach((pickup) => {
        if (!pickup.found) {
          const lap = Math.round((car.position.z - pickup.mesh.position.z) / 220) * 220;
          pickup.mesh.position.z += lap;
          pickup.mesh.position.x += Math.round((car.position.x - pickup.mesh.position.x) / 220) * 220;
          if (!reducedMotion.matches) pickup.mesh.rotation.y += delta * 1.8;
          pickup.mesh.position.y = reducedMotion.matches ? 0.65 : 0.65 + Math.sin(now * 0.003 + pickup.mesh.position.z) * 0.12;
          if (Math.hypot(car.position.x - pickup.mesh.position.x, car.position.z - pickup.mesh.position.z) < 1.1) {
          pickup.found = true;
          pickup.mesh.visible = false;
          const resetAt = car.position.z - 70 - Math.random() * 100;
          pickup.mesh.position.set(car.position.x + (Math.random() - 0.5) * 8, 0.65, resetAt);
          later(() => { pickup.found = false; pickup.mesh.visible = true; }, 1800);
            setCollected((count) => count + 1);
            if (challengeRef.current.active) challengeRef.current.score += 1;
            playPickup();
            announce('NICE PICKUP!', 1000);
          }
        }
      });
      hiddenRelics.forEach((relic, index) => {
        if (relic.found) return;
        if (!reducedMotion.matches) relic.mesh.rotation.y += delta * 0.6;
        if (Math.hypot(car.position.x - relic.mesh.position.x, car.position.z - relic.mesh.position.z) < 1.7) {
          relic.found = true;
          relic.mesh.visible = false;
          setCollected((count) => count + 3);
          playPickup();
          announce('HIDDEN RELIC FOUND · +3 CRYSTALS', 2600);
          recordProgress('relics', String(index));
        }
      });
      if (targetStop) {
        const dx = targetStop.gate.position.x - car.position.x;
        const dz = targetStop.gate.position.z - car.position.z;
        if (Math.hypot(dx, dz) < 3) { setActiveStop(targetStop.id); targetStop = null; setGuidance(null); }
      }
      obstacles.forEach((item) => {
        const lapX = Math.round((car.position.x - item.x) / 360) * 360;
        const lapZ = Math.round((car.position.z - item.z) / 360) * 360;
        item.x += lapX;
        item.z += lapZ;
        item.building.position.set(item.x, item.height / 2 - 0.06, item.z);
        item.windows.position.set(item.x, item.height * 0.64, item.z - item.width / 2 - 0.012);
      });
      headquartersInRange = false;
      districtLandmarks.forEach(({ mesh, baseZ, id }) => {
        mesh.position.z = baseZ + Math.round((car.position.z - baseZ) / 300) * 300;
        if (id === 'portfolio') headquartersInRange = Math.hypot(car.position.x - mesh.position.x, car.position.z - (mesh.position.z - 8)) < 7;
      });
      const mobileView = window.innerWidth < 700;
      const lookAhead = (mobileView ? 2.5 : 3.5) + Math.min(Math.abs(velocity) * 0.25, 3);
      const followDistance = mobileView ? 7 : 10;
      const travelDirection = velocity < -0.5 ? -1 : 1;
      cameraTarget.set(car.position.x + Math.sin(yaw) * lookAhead * travelDirection, terrainHeight + 0.7 + jumpHeight * 0.3, car.position.z - Math.cos(yaw) * lookAhead * travelDirection);
      desiredCamera.set(car.position.x - Math.sin(yaw) * followDistance * travelDirection, terrainHeight + (mobileView ? 3.8 : 5.2) + jumpHeight * 0.35, car.position.z + Math.cos(yaw) * followDistance * travelDirection);
      camera.position.lerp(desiredCamera, 1 - Math.exp(-delta * (reducedMotion.matches ? 1.8 : 3.5)));
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
      if (engineRef.current && audioRef.current) {
        const gearStart = automaticGear === 1 ? 0 : shiftPoints[automaticGear - 2];
        const gearEnd = automaticGear === 5 ? (isSupercar ? 54 : 14) : shiftPoints[automaticGear - 1];
        const gearPosition = velocity < 0 ? Math.abs(velocity) / 3.5 : (velocity - gearStart) / (gearEnd - gearStart);
        const revs = THREE.MathUtils.clamp(0.25 + gearPosition * 0.65 - shiftDip * 0.6, 0.2, 1);
        const frequency = 48 + revs * 72;
        engineRef.current.voices.forEach(({ oscillator, ratio }) => oscillator.frequency.setTargetAtTime(frequency * ratio, audioRef.current.currentTime, 0.15));
        engineRef.current.filter.frequency.setTargetAtTime(320 + revs * 430, audioRef.current.currentTime, 0.15);
        engineRef.current.gain.gain.setTargetAtTime(settingsRef.current.muted ? 0 : 0.055 + revs * 0.035, audioRef.current.currentTime, 0.15);
        engineRef.current.rainGain.gain.setTargetAtTime(!settingsRef.current.muted && weatherMode === 'rain' ? 0.035 : 0, audioRef.current.currentTime, 0.3);
      }
      if (now - speedUpdateAt > 120) {
        speedUpdateAt = now;
        setSpeed(Math.round(Math.abs(velocity) * 9));
        setTransmission(velocity < -0.2 ? 'R' : `D${automaticGear}`);
        setNearbyStop(nearbyDestination);
        setNearHeadquarters(headquartersInRange);
        setDestinationMeters(targetStop ? Math.round(Math.hypot(targetStop.gate.position.x - car.position.x, targetStop.gate.position.z - car.position.z)) : null);
        if (targetStop) {
          setGuidance({ label: targetStop.label, direction: guidanceDirection(car.position.x, car.position.z, yaw, targetStop.gate.position) });
        }
        if (challengeRef.current.active) { const game = challengeRef.current; setChallenge({ active: true, seconds: Math.floor(game.elapsed), score: game.score, best: game.best, finished: false }); }
        if (route) setRouteRun({ active: true, index: route.index, elapsed: route.elapsed, finished: false });
      }
      frame = requestAnimationFrame(animate);
    }
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', clearControls);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('drive-destination', onDestination);
      window.removeEventListener('drive-challenge', startChallenge);
      window.removeEventListener('drive-route', startRoute);
      window.removeEventListener('drive-reset', resetCar);
      window.removeEventListener('drive-reset-progress', resetProgressObjects);
      window.removeEventListener('drive-quality-change', onQualityChange);
      window.removeEventListener('drive-photo', capturePhoto);
      canvas.removeEventListener('pointerdown', pointerdown);
      canvas.removeEventListener('pointermove', pointermove);
      canvas.removeEventListener('pointerup', pointerup);
      canvas.removeEventListener('pointercancel', pointerup);
      timers.forEach((timer) => window.clearTimeout(timer));
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => { material.map?.dispose(); material.dispose(); });
        else { object.material?.map?.dispose(); object.material?.dispose(); }
      });
      renderer.dispose();
    };
  }, []);

  const stop = stops.find((item) => item.id === activeStop);
  const storyPages = [
    { title: 'About', text: about[0] },
    { title: 'Frontend', text: skills.find((item) => item.id === 'frontend')?.skills },
    { title: 'Backend', text: skills.find((item) => item.id === 'backend')?.skills },
    { title: 'Projects', text: 'Explore a selection of projects and the technologies behind them.' },
    { title: 'Experience', text: about[1] },
    { title: 'Contact', text: `Get in touch with ${profile.name}.` },
  ];
  const openStoryStep = (index) => { setStoryStep(index); setStoryVisited((visited) => visited.includes(index) ? visited : [...visited, index]); };
  const touchControl = (key) => ({
    onPointerDown: (event) => { event.currentTarget.setPointerCapture(event.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key })); },
    onPointerUp: () => window.dispatchEvent(new KeyboardEvent('keyup', { key })),
    onPointerCancel: () => window.dispatchEvent(new KeyboardEvent('keyup', { key })),
    onLostPointerCapture: () => window.dispatchEvent(new KeyboardEvent('keyup', { key })),
  });
  return <main className={`drive-page${photoMode ? ' is-photo-mode' : ''}${menuOpen ? ' is-menu-open' : ''}`}>
    {showTutorial && !webglError && <section className="drive-world-panel drive-tutorial" aria-label="Driving controls"><small>WELCOME TO THE WORLD</small><h2>Ready to explore?</h2><p>Drive with <strong>WASD or arrow keys</strong>. Hold Space to brake, Shift to boost, and press J to jump.</p><p>Choose a destination for directions, press Enter near it to open it, and press Escape to close panels. Explore freely and collect crystals.</p><p>On a phone, use the buttons on screen. Open the garage to change your vehicle.</p><button className="drive-garage-done" onClick={() => { try { window.localStorage.setItem('portfolio-drive-tutorial-v1', 'done'); } catch { /* Continue for this visit. */ } setShowTutorial(false); }}>START DRIVING</button></section>}
    {webglError && <div className="drive-error"><h1>3D mode is unavailable</h1><p>Your browser could not start WebGL. You can still use the regular portfolio.</p><a href="/">Back to portfolio</a></div>}
    <canvas ref={canvasRef} className="drive-canvas" aria-label="Three dimensional portfolio driving playground. Use arrow keys or WASD to drive." />
    <a className="drive-back" href="/">IM<span>.</span> <small>BACK TO PORTFOLIO</small></a>
    <button className="drive-menu-toggle" aria-expanded={menuOpen} aria-controls="drive-menu-actions" onClick={() => { setMenuOpen((value) => !value); if (menuOpen) { setShowMissions(false); setShowAchievements(false); } }}>{menuOpen ? 'CLOSE' : 'MENU'}</button>
    <div className="drive-heading"><span>INKERSAL MAHENDRAN</span><h1>DRIVE TO<br/><em>EXPLORE.</em></h1><p>Full-stack engineer · Chennai, India</p></div>
    <div className="drive-hud"><span className="drive-live"/> {zoneName.toUpperCase()} <span>LVL {Math.floor(progress.xp / 150) + 1} · {progress.xp} XP</span><span>CRYSTALS {String(collected).padStart(2, '0')}</span>{destinationMeters !== null && <span>NEXT {destinationMeters}M</span>}</div>
    {guidance && <div className="drive-guidance" role="status"><span>{guidance.label} · {destinationMeters} M</span><strong>{guidance.direction}</strong><button onClick={() => window.dispatchEvent(new CustomEvent('drive-destination', { detail: null }))}>CLEAR</button></div>}
    {nearbyStop && !stop && <button className="drive-interact" onClick={() => setActiveStop(nearbyStop.id)}>OPEN {nearbyStop.label} <span>· ENTER</span></button>}
    {nearHeadquarters && !nearbyStop && !stop && !showStory && <button className="drive-interact" onClick={() => { setShowStory(true); openStoryStep(0); }}>OPEN DEVELOPER JOURNEY <span>· ENTER</span></button>}
    {stop && <section className="drive-card"><button onClick={() => setActiveStop(null)} aria-label="Close destination">×</button><small>{stop.label}</small><h2>{stop.title}</h2>
      {stop.id === 'about' && about.map((text) => <p key={text}>{text}</p>)}
      {stop.id === 'experience' && experience.map((item) => <p key={item.id}><strong>{item.role} · {item.company}</strong><br/>{item.duration}<br/>{item.contribution}</p>)}
      {stop.id === 'projects' && projects.map((item) => <p key={item.id}><a href={item.link} target="_blank" rel="noreferrer"><strong>{item.title} ↗</strong></a><br/>{item.tech}</p>)}
      {stop.id === 'skills' && skills.map((item) => <p key={item.id}><strong>{item.category}</strong><br/>{item.skills}</p>)}
      {stop.id === 'contact' && <p>Have a project in mind? <a href={`mailto:${profile.email}`}>{profile.email} ↗</a><br/><a href={profile.linkedin} target="_blank" rel="noreferrer">Connect on LinkedIn ↗</a></p>}
      {stop.id === 'about' && <p><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a> · <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a> · <a href={profile.leetcode} target="_blank" rel="noreferrer">LeetCode ↗</a></p>}
    </section>}
    <div className="drive-controls"><strong>DRIVE</strong><span>W A S D</span><span>↑ ← ↓ →</span><span>SPACE BRAKE</span><span>SHIFT BOOST · J JUMP</span><i>Collect the glowing crystals</i><a href={profile.resume} target="_blank" rel="noreferrer">RESUME ↗</a></div>
    <div className="drive-speed"><strong>{speed}</strong><span>KM/H</span><span className="drive-transmission" aria-label={`Automatic transmission ${transmission}`}>{transmission}</span></div>
    <div className={`drive-challenge${challenge.active ? ' is-running' : ''}`}><button onClick={() => window.dispatchEvent(new Event('drive-challenge'))}>{challenge.active ? 'RESTART RUN' : '60-SECOND CRYSTAL RUN'}</button><span aria-live="polite">{challenge.active ? `${60 - challenge.seconds}s · ${challenge.score} collected` : challenge.finished ? `Run: ${challenge.score} · Best: ${challenge.best}` : `Best: ${challenge.best} crystals`}</span><button onClick={() => setShowAchievements((value) => !value)} aria-expanded={showAchievements}>ACHIEVEMENTS</button></div>
    <div className={`drive-route${routeRun.active ? ' is-running' : ''}`}><button onClick={() => window.dispatchEvent(new Event('drive-route'))}>{routeRun.active ? 'RESTART ROUTE' : 'START CHECKPOINT ROUTE'}</button><span>{routeRun.active ? `GATE ${routeRun.index + 1} / 5 · ${routeRun.elapsed.toFixed(1)}s` : routeRun.finished ? `COMPLETE · ${routeRun.elapsed.toFixed(1)}s · +5 CRYSTALS` : '5 GATES · +5 CRYSTALS'}{routeBest !== null ? ` · BEST ${routeBest.toFixed(1)}s` : ''}</span></div>
    <div className="drive-world-menu" id="drive-menu-actions"><button onClick={() => setShowMissions((value) => !value)} aria-expanded={showMissions}>MISSIONS</button><button onClick={() => setShowGarage(true)}>GARAGE</button><button onClick={() => { setShowStory(true); openStoryStep(0); }}>JOURNEY</button><button onClick={() => setPhotoMode(true)}>PHOTO</button></div>
    {showStory && <section className="drive-world-panel drive-story" aria-label="Developer journey"><button className="drive-panel-close" onClick={() => setShowStory(false)} aria-label="Close developer journey">×</button><small>DEVELOPER JOURNEY · {Math.round(storyVisited.length / storyPages.length * 100)}% EXPLORED</small><h2>{storyPages[storyStep].title}</h2><p>{storyPages[storyStep].text}</p>{storyStep === 3 && projects.map((project) => <p key={project.id}><a href={project.link} target="_blank" rel="noreferrer"><strong>{project.title} ↗</strong></a><span>{project.tech}</span></p>)}{storyStep === 4 && experience.map((item) => <p key={item.id}><strong>{item.role} · {item.company}</strong><span>{item.duration}</span></p>)}{storyStep === 5 && <p><a href={`mailto:${profile.email}`}>{profile.email} ↗</a><br/><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a><br/><a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a></p>}<div className="drive-story-actions"><button disabled={storyStep === 0} onClick={() => openStoryStep(storyStep - 1)}>PREVIOUS</button><span>{storyStep + 1} / {storyPages.length}</span><button disabled={storyStep === storyPages.length - 1} onClick={() => openStoryStep(storyStep + 1)}>NEXT</button></div></section>}
    {photoMode && <section className="drive-photo-panel" aria-label="Photo mode controls"><strong>PHOTO MODE</strong><label>ANGLE <input type="range" min={-3.14} max={3.14} step={0.05} value={photoCamera.angle} onChange={(event) => setPhotoCamera((value) => ({ ...value, angle: Number(event.target.value) }))} /></label><label>DISTANCE <input type="range" min={4} max={20} step={0.5} value={photoCamera.distance} onChange={(event) => setPhotoCamera((value) => ({ ...value, distance: Number(event.target.value) }))} /></label><label>HEIGHT <input type="range" min={1.5} max={14} step={0.5} value={photoCamera.height} onChange={(event) => setPhotoCamera((value) => ({ ...value, height: Number(event.target.value) }))} /></label><div><button onClick={() => window.dispatchEvent(new Event('drive-photo'))}>SAVE IMAGE</button><button onClick={() => setPhotoCamera({ angle: 0, distance: 9, height: 5 })}>RESET CAMERA</button><button onClick={() => setPhotoMode(false)}>BACK TO DRIVE</button></div></section>}
    {showMissions && <section className="drive-world-panel drive-missions" aria-label="Missions"><button className="drive-panel-close" onClick={() => setShowMissions(false)} aria-label="Close missions">×</button><small>EXPLORER LEVEL {Math.floor(progress.xp / 150) + 1} · {progress.xp} XP</small><h2>Your missions</h2>{MISSIONS.map((mission) => { const count = ['route', 'speed', 'drift'].includes(mission.id) ? Number(progress[mission.id]) : progress[mission.id].length; const complete = progress.completed.includes(mission.id); return <p key={mission.id}><strong>{complete ? '✓ ' : ''}{mission.label}</strong><span>{Math.min(count, mission.target)} / {mission.target} · {complete ? 'COMPLETE' : `+${mission.reward} XP`}</span></p>; })}<small>Progress is saved in this browser.</small><button className="drive-reset-progress" onClick={() => { if (!window.confirm("Reset mission progress and XP? Your crystal run best will be kept.")) return; const fresh = initialProgress(); progressRef.current = fresh; setProgress(fresh); window.dispatchEvent(new Event("drive-reset-progress")); try { window.localStorage.setItem("portfolio-drive-progress-v1", JSON.stringify(fresh)); } catch { /* Continue without persistence. */ } }}>RESET MISSION PROGRESS</button></section>}
    {showGarage && <section className="drive-world-panel drive-garage" aria-label="Garage"><button className="drive-panel-close" onClick={() => setShowGarage(false)} aria-label="Close garage">×</button><small>YOUR GARAGE · GAME PAUSED</small><h2>Choose your ride</h2><div className="drive-garage-options"><button aria-pressed={garage.vehicle === 'xuv700'} onClick={() => setGarage((value) => ({ ...value, vehicle: 'xuv700' }))}>XUV700 <small>SUV-inspired</small></button><button aria-pressed={garage.vehicle === 'sport'} onClick={() => setGarage((value) => ({ ...value, vehicle: 'sport' }))}>SPORT <small>Faster on roads</small></button><button aria-pressed={garage.vehicle === 'suv'} onClick={() => setGarage((value) => ({ ...value, vehicle: 'suv' }))}>SUV <small>Better off-road</small></button><button aria-pressed={garage.vehicle === 'trail'} onClick={() => setGarage((value) => ({ ...value, vehicle: 'trail' }))}>TRAIL SUV <small>Made for hills</small></button><button aria-pressed={garage.vehicle === 'supercar'} onClick={() => setGarage((value) => ({ ...value, vehicle: 'supercar' }))}>SUPERCAR <small>Higher road speed</small></button></div><label>PAINT <select value={garage.paint} onChange={(event) => setGarage((value) => ({ ...value, paint: event.target.value }))}><option value="#c6f36a">Lime</option><option value="#e9e8e4">Ivory</option><option value="#789876">Sage</option><option value="#343f35">Graphite</option></select></label><label>WHEELS <select value={garage.wheels} onChange={(event) => setGarage((value) => ({ ...value, wheels: event.target.value }))}><option value="#9ba893">Silver</option><option value="#202620">Black</option><option value="#c6f36a">Lime</option></select></label><button className="drive-garage-done" onClick={() => setShowGarage(false)}>BACK TO DRIVING</button></section>}
    {showAchievements && <section className="drive-achievements" aria-label="Achievements"><button onClick={() => setShowAchievements(false)} aria-label="Close achievements">×</button><h2>Milestones</h2><p>{collected >= 1 ? '✓' : '○'} First crystal <small>Collect a crystal</small></p><p>{collected >= 10 ? '✓' : '○'} Crystal hunter <small>Collect 10 crystals this visit</small></p><p>{unlocked >= stops.length ? '✓' : '○'} Explorer <small>Visit all {stops.length} destinations</small></p><p>{challenge.best >= 5 ? '✓' : '○'} Fast collector <small>Collect 5 crystals in one run</small></p><p>{stuntBest >= 2 ? '✓' : '○'} Air time <small>Best jump: {stuntBest.toFixed(1)} m</small></p><small>Run and jump bests are saved in this browser. Visit achievements reset when the page reloads.</small></section>}
    <div className="drive-settings"><label>HANDLING <select value={handling} onChange={(event) => setHandling(event.target.value)}><option value="arcade">Arcade</option><option value="relaxed">Relaxed</option></select></label><label>QUALITY <select value={quality} onChange={(event) => { setQuality(event.target.value); requestAnimationFrame(() => window.dispatchEvent(new Event('drive-quality-change'))); }}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>TIME <select value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value)}><option value="day">Day</option><option value="sunset">Sunset</option><option value="night">Night</option><option value="auto">Cycle</option></select></label><label>WEATHER <select value={weather} onChange={(event) => setWeather(event.target.value)}><option value="clear">Clear</option><option value="rain">Rain</option><option value="fog">Fog</option></select></label><button onClick={() => setPaused((value) => !value)}>{paused ? 'RESUME' : 'PAUSE'}</button><button onClick={() => window.dispatchEvent(new CustomEvent('drive-reset'))}>RESET CAR</button><button onClick={() => setShowTutorial(true)}>CONTROLS</button><button onClick={toggleSound}>{muted ? 'ENABLE SOUND' : 'MUTE SOUND'}</button></div>
    {toast && <div className="drive-toast" role="status">{toast}</div>}
    {speedZoneMessage && <div className="drive-speed-zone" role="status">{speedZoneMessage}</div>}
    <div className="drive-touch" aria-label="Touch driving controls">
      <button aria-label="Steer left" {...touchControl('ArrowLeft')}>LEFT</button>
      <button aria-label="Accelerate" {...touchControl('ArrowUp')}>GO</button>
      <button aria-label="Steer right" {...touchControl('ArrowRight')}>RIGHT</button>
      <button aria-label="Reverse" {...touchControl('ArrowDown')}>BACK</button>
      <button aria-label="Brake" {...touchControl(' ')}>BRAKE</button>
      <button aria-label="Boost" {...touchControl('Shift')}>BOOST</button>
      <button aria-label="Jump" {...touchControl('j')}>JUMP</button>
    </div>
    <nav className="drive-destinations" aria-label="Choose a destination for driving directions">{stops.map((item) => <button key={item.id} aria-pressed={guidance?.label === item.label} onClick={() => { const event = new CustomEvent('drive-destination', { detail: item }); window.dispatchEvent(event); }}>{item.label}</button>)}</nav>
  </main>;
}
