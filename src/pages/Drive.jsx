import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { about, experience, profile, projects, skills } from '../data/portfolio';

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
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState(1);
  const [collected, setCollected] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [destinationMeters, setDestinationMeters] = useState(null);
  const [toast, setToast] = useState('');
  const [challenge, setChallenge] = useState({ active: false, seconds: 0, score: 0, best: 0 });
  const challengeRef = useRef({ active: false, elapsed: 0, score: 0, best: 0 });
  const [paused, setPaused] = useState(false);
  const [handling, setHandling] = useState('arcade');
  const [quality, setQuality] = useState('high');
  const [muted, setMuted] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const audioRef = useRef(null);
  const engineRef = useRef(null);
  const settingsRef = useRef({ paused, handling, quality, muted });
  settingsRef.current = { paused, handling, quality, muted };

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
      audioRef.current = audio;
      engineRef.current = { voices, filter, gain };
    }
    try { await audioRef.current.resume(); setMuted((value) => !value); }
    catch { setToast('Could not start sound. Please try again.'); }
  };

  useEffect(() => () => {
    engineRef.current?.voices.forEach(({ oscillator }) => oscillator.stop());
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
    const world = new THREE.Group();
    scene.add(world);
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
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x30332d, roughness: 0.9 });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 10000), roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.035;
    world.add(road);
    const crossRoad = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10), roadMaterial);
    crossRoad.rotation.x = -Math.PI / 2;
    crossRoad.position.y = -0.034;
    world.add(crossRoad);
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
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.48, 0.92), new THREE.MeshStandardMaterial({ color: 0x243027, metalness: 0.2, roughness: 0.22 }));
    cabin.position.set(0, 0.97, -0.12);
    car.add(cabin);
    const wheelGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.18, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x151715, roughness: 0.8 });
    const wheels = [];
    for (const x of [-0.72, 0.72]) for (const z of [-0.65, 0.65]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.3, z);
      car.add(wheel);
      wheels.push(wheel);
    }
    const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2bc });
    for (const x of [-0.43, 0.43]) {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.12, 0.06), lampMaterial);
      lamp.position.set(x, 0.59, -1.05);
      car.add(lamp);
    }
    car.position.set(0, 0, 8);
    world.add(car);

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
      const palettes = [[0x343b30, 0x454a3a, 0x29392e], [0x263c35, 0x315044, 0x26372f], [0x42332d, 0x514038, 0x382d29]];
      const material = new THREE.MeshStandardMaterial({ color: palettes[district][i % 3], roughness: 0.8 });
      const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), material);
      building.position.set(x, height / 2 - 0.06, z);
      world.add(building);
      const windows = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.08, width * 0.72), new THREE.MeshBasicMaterial({ color: [0xc6f36a, 0x77c6b3, 0xffb878][district], transparent: true, opacity: 0.58 }));
      windows.position.set(x, height * 0.64, z - width / 2 - 0.012);
      world.add(windows);
      obstacles.push({ x, z, baseX, baseZ, width, height, radius: width * 0.55, building, windows });
    }

    const streetLamps = [];
    const lampPoleMaterial = new THREE.MeshStandardMaterial({ color: 0x717666, metalness: 0.65, roughness: 0.35 });
    const lampGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xd8ff9a });
    for (let i = 0; i < 48; i += 1) {
      const z = -i * 18;
      const x = i % 2 ? -7 : 7;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 4.2, 8), lampPoleMaterial);
      pole.position.set(x, 2.1, z);
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

    const keys = new Set();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { down: false, x: 0 };
    let touchSteer = 0;
    let velocity = 0;
    let jumpHeight = 0;
    let jumpSpeed = 0;
    let currentGear = 1;
    const gearLimits = [0, 5, 7, 9, 11, 14];
    let steer = 0;
    let yaw = 0;
    let crashCooldown = 0;
    let rampCooldown = 0;
    const discovered = new Set();
    const nearbyGates = new Set();
    let speedUpdateAt = 0;
    let frame;
    let visible = true;
    let previous = 0;
    const shift = (amount) => { currentGear = THREE.MathUtils.clamp(currentGear + amount, 1, 5); setGear(currentGear); };
    const onShift = (event) => shift(event.detail);
    const keydown = (event) => { const key = event.key.toLowerCase(); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); if (!event.repeat && (key === 'q' || key === 'e')) shift(key === 'e' ? 1 : -1); if (!event.repeat && key === 'j' && jumpHeight === 0 && !settingsRef.current.paused) jumpSpeed = 7; keys.add(key); if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) targetStop = null; };
    const keyup = (event) => keys.delete(event.key.toLowerCase());
    const clearControls = () => { keys.clear(); pointer.down = false; touchSteer = 0; };
    const pointerdown = (event) => { pointer.down = true; pointer.x = event.clientX; canvas.setPointerCapture(event.pointerId); };
    const pointermove = (event) => { if (pointer.down) { touchSteer = THREE.MathUtils.clamp((event.clientX - canvas.getBoundingClientRect().left) / canvas.clientWidth * 2 - 1, -1, 1); pointer.x = event.clientX; } };
    const pointerup = () => { pointer.down = false; };
    let targetStop = null;
    const onDestination = (event) => {
      const index = stops.findIndex((item) => item.id === event.detail.id);
      const gate = gateObjects[index];
      if (gate) targetStop = { ...event.detail, x: gate.position.x, z: gate.position.z };
    };
    const startChallenge = () => { challengeRef.current = { active: true, elapsed: 0, score: 0, best: challengeRef.current.best }; setChallenge({ active: true, seconds: 0, score: 0, best: challengeRef.current.best }); };
    const resetCar = () => { car.position.set(0, 0, 8); yaw = 0; velocity = 0; steer = 0; jumpHeight = 0; jumpSpeed = 0; keys.clear(); targetStop = null; currentGear = 1; setGear(1); };
    const onQualityChange = () => resize();
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
    window.addEventListener('drive-destination', onDestination);
    window.addEventListener('drive-challenge', startChallenge);
    window.addEventListener('drive-reset', resetCar);
    window.addEventListener('drive-shift', onShift);
    window.addEventListener('drive-quality-change', onQualityChange);
    canvas.addEventListener('pointerdown', pointerdown);
    canvas.addEventListener('pointermove', pointermove);
    canvas.addEventListener('pointerup', pointerup);
    canvas.addEventListener('pointercancel', pointerup);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(settingsRef.current.quality === 'low' ? 1 : Math.min(window.devicePixelRatio || 1, 1.6));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = width < 700 ? 68 : 55;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(animate);
    });
    intersection.observe(canvas);

    function animate(now = 0) {
      frame = undefined;
      if (!visible) return;
      const delta = Math.min((now - previous) / 1000 || 0, 0.04);
      previous = now;
      if (settingsRef.current.paused) {
        if (engineRef.current && audioRef.current) engineRef.current.gain.gain.setTargetAtTime(0, audioRef.current.currentTime, 0.08);
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
        return;
      }
      if (challengeRef.current.active) {
        challengeRef.current.elapsed += delta;
        if (challengeRef.current.elapsed >= 60) {
          const game = challengeRef.current;
          game.active = false;
          game.best = Math.max(game.best, game.score);
          setChallenge({ active: false, seconds: 60, score: game.score, best: game.best });
          setToast(`TIME UP! ${game.score} CRYSTALS`);
        }
      }
      const accelerating = keys.has('w') || keys.has('arrowup');
      const reversing = keys.has('s') || keys.has('arrowdown');
      const braking = keys.has(' ');
      const left = keys.has('a') || keys.has('arrowleft');
      const right = keys.has('d') || keys.has('arrowright');
      const direction = pointer.down ? touchSteer : Number(right) - Number(left);
      if (!targetStop) {
        const gearLimit = gearLimits[currentGear];
        const targetVelocity = braking ? 0 : accelerating ? gearLimit * (settingsRef.current.handling === 'relaxed' ? 0.75 : 1) * (keys.has('shift') ? 1.35 : 1) : reversing ? -3.5 : 0;
        const response = braking ? 12 : (accelerating || reversing ? 1.6 : 0.8);
        velocity = THREE.MathUtils.damp(velocity, targetVelocity, response, delta);
      }
      const offRoad = Math.abs(car.position.x) > 4.35 && Math.abs(car.position.z) > 4.35;
      if (offRoad) velocity = THREE.MathUtils.clamp(velocity, -3.5, 7);
      steer = THREE.MathUtils.damp(steer, direction, pointer.down ? 10 : 12, delta);
      if (targetStop) {
        const dx = targetStop.x - car.position.x;
        const dz = targetStop.z - car.position.z;
        const desiredYaw = Math.atan2(dx, -dz);
        const yawError = THREE.MathUtils.euclideanModulo(desiredYaw - yaw + Math.PI, Math.PI * 2) - Math.PI;
        steer = THREE.MathUtils.clamp(yawError * 1.8, -1, 1);
        velocity = THREE.MathUtils.damp(velocity, Math.min(8, Math.hypot(dx, dz) * 0.55), 2.8, delta);
        if (Math.hypot(dx, dz) < 3) { setActiveStop(targetStop.id); targetStop = null; velocity = 0; }
      }
      const grip = settingsRef.current.handling === 'relaxed' ? 1.4 : THREE.MathUtils.lerp(0.95, 0.53, Math.min(Math.abs(velocity) / 10, 1));
      yaw += steer * velocity * delta * grip;
      yaw = THREE.MathUtils.euclideanModulo(yaw + Math.PI, Math.PI * 2) - Math.PI;
      const previousPosition = car.position.clone();
      car.position.x += Math.sin(yaw) * velocity * delta;
      car.position.z -= Math.cos(yaw) * velocity * delta;
      car.position.x = THREE.MathUtils.clamp(car.position.x, -5990, 5990);
      car.rotation.y = -yaw;
      car.rotation.z = -steer * Math.min(Math.abs(velocity) / 12, 1) * 0.055;
      if (jumpSpeed !== 0 || jumpHeight > 0) { jumpSpeed -= 18 * delta; jumpHeight += jumpSpeed * delta; if (jumpHeight <= 0) { jumpHeight = 0; jumpSpeed = 0; } }
      car.position.y = jumpHeight + (jumpHeight === 0 && Math.abs(velocity) > 0.5 ? Math.sin(now * 0.012) * 0.025 : 0);
      wheels.forEach((wheel) => { wheel.rotation.x -= velocity * delta * 1.7; });
      ramp.position.z += Math.round((car.position.z - ramp.position.z) / 240) * 240;
      ramp.position.x += Math.round((car.position.x - ramp.position.x) / 240) * 240;
      rampCooldown = Math.max(0, rampCooldown - delta);
      if (rampCooldown === 0 && jumpHeight === 0 && Math.abs(velocity) > 2 && Math.abs(car.position.x - ramp.position.x) < 2 && Math.abs(car.position.z - ramp.position.z) < 2) {
        jumpSpeed = 8;
        rampCooldown = 2;
        setToast('RAMP JUMP!');
        window.setTimeout(() => setToast(''), 1400);
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
        if (crashCooldown <= 0 && Math.abs(car.position.x - item.x) < item.radius + 0.7 && Math.abs(car.position.z - item.z) < item.radius + 0.9) {
          car.position.copy(previousPosition);
          velocity *= -0.24;
          crashCooldown = 0.7;
          playImpact();
          setToast('BONK! Keep it between the curbs.');
          window.setTimeout(() => setToast(''), 1500);
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
        if (index % 2 === 0) mark.position.z = car.position.z + (index / 2 - 10) * 5;
        else mark.position.x = car.position.x + (Math.floor(index / 2) - 10) * 5;
      });
      crashCooldown -= delta;
      gateObjects.forEach((gate, index) => {
        const laps = Math.round((car.position.z - stops[index].z) / 300);
        gate.position.x = stops[index].x + Math.round((car.position.x - stops[index].x) / 300) * 300;
        gate.position.z = stops[index].z + laps * 300;
        const nearby = Math.abs(car.position.z - gate.position.z) < 2 && Math.abs(car.position.x - gate.position.x) < 3;
        if (nearby && !nearbyGates.has(index)) {
          nearbyGates.add(index);
          discovered.add(index);
          setUnlocked(discovered.size);
          setActiveStop(stops[index].id);
          setToast(`${stops[index].label} DISCOVERED`);
          window.setTimeout(() => setToast(''), 2200);
        }
        if (!nearby) nearbyGates.delete(index);
      });
      pickups.forEach((pickup) => {
        if (!pickup.found) {
          const lap = Math.round((car.position.z - pickup.mesh.position.z) / 220) * 220;
          pickup.mesh.position.z += lap;
          pickup.mesh.position.x += Math.round((car.position.x - pickup.mesh.position.x) / 220) * 220;
          pickup.mesh.rotation.y += delta * 1.8;
          pickup.mesh.position.y = 0.65 + Math.sin(now * 0.003 + pickup.mesh.position.z) * 0.12;
          if (Math.hypot(car.position.x - pickup.mesh.position.x, car.position.z - pickup.mesh.position.z) < 1.1) {
          pickup.found = true;
          pickup.mesh.visible = false;
          const resetAt = car.position.z - 70 - Math.random() * 100;
          pickup.mesh.position.set(car.position.x + (Math.random() - 0.5) * 8, 0.65, resetAt);
          window.setTimeout(() => { pickup.found = false; pickup.mesh.visible = true; }, 1800);
            setCollected((count) => count + 1);
            if (challengeRef.current.active) challengeRef.current.score += 1;
            playPickup();
            setToast('NICE PICKUP!');
            window.setTimeout(() => setToast(''), 1000);
          }
        }
      });
      if (targetStop) {
        const dx = targetStop.x - car.position.x;
        const dz = targetStop.z - car.position.z;
        if (Math.hypot(dx, dz) < 2) { setActiveStop(targetStop.id); targetStop = null; }
      }
      obstacles.forEach((item) => {
        const lapX = Math.round((car.position.x - item.x) / 360) * 360;
        const lapZ = Math.round((car.position.z - item.z) / 360) * 360;
        item.x += lapX;
        item.z += lapZ;
        item.building.position.set(item.x, item.height / 2 - 0.06, item.z);
        item.windows.position.set(item.x, item.height * 0.64, item.z - item.width / 2 - 0.012);
      });
      const mobileView = window.innerWidth < 700;
      const lookAhead = mobileView ? 3.5 : 5;
      const followDistance = mobileView ? 7 : 10;
      const cameraTarget = new THREE.Vector3(car.position.x + Math.sin(yaw) * lookAhead, mobileView ? 0.55 : 0.7, car.position.z - Math.cos(yaw) * lookAhead);
      camera.position.lerp(new THREE.Vector3(car.position.x - Math.sin(yaw) * followDistance, mobileView ? 3.8 : 5.2, car.position.z + Math.cos(yaw) * followDistance), 1 - Math.exp(-delta * 3.5));
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
      if (engineRef.current && audioRef.current) {
        const revs = Math.min(Math.abs(velocity) / gearLimits[currentGear], 1);
        const frequency = 48 + revs * 72;
        engineRef.current.voices.forEach(({ oscillator, ratio }) => oscillator.frequency.setTargetAtTime(frequency * ratio, audioRef.current.currentTime, 0.15));
        engineRef.current.filter.frequency.setTargetAtTime(320 + revs * 430, audioRef.current.currentTime, 0.15);
        engineRef.current.gain.gain.setTargetAtTime(settingsRef.current.muted ? 0 : 0.055 + revs * 0.035, audioRef.current.currentTime, 0.15);
      }
      if (now - speedUpdateAt > 120) {
        speedUpdateAt = now;
        setSpeed(Math.round(Math.abs(velocity) * 9));
        setDestinationMeters(targetStop ? Math.round(Math.hypot(targetStop.x - car.position.x, targetStop.z - car.position.z)) : null);
        if (challengeRef.current.active) { const game = challengeRef.current; setChallenge({ active: true, seconds: Math.floor(game.elapsed), score: game.score, best: game.best }); }
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
      window.removeEventListener('drive-destination', onDestination);
      window.removeEventListener('drive-challenge', startChallenge);
      window.removeEventListener('drive-reset', resetCar);
      window.removeEventListener('drive-shift', onShift);
      window.removeEventListener('drive-quality-change', onQualityChange);
      canvas.removeEventListener('pointerdown', pointerdown);
      canvas.removeEventListener('pointermove', pointermove);
      canvas.removeEventListener('pointerup', pointerup);
      canvas.removeEventListener('pointercancel', pointerup);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => { material.map?.dispose(); material.dispose(); });
        else { object.material?.map?.dispose(); object.material?.dispose(); }
      });
      renderer.dispose();
    };
  }, []);

  const stop = stops.find((item) => item.id === activeStop);
  const touchControl = (key) => ({
    onPointerDown: (event) => { event.currentTarget.setPointerCapture(event.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key })); },
    onPointerUp: () => window.dispatchEvent(new KeyboardEvent('keyup', { key })),
    onPointerCancel: () => window.dispatchEvent(new KeyboardEvent('keyup', { key })),
    onLostPointerCapture: () => window.dispatchEvent(new KeyboardEvent('keyup', { key })),
  });
  return <main className="drive-page">
    {webglError && <div className="drive-error"><h1>3D mode is unavailable</h1><p>Your browser could not start WebGL. You can still use the regular portfolio.</p><a href="/">Back to portfolio</a></div>}
    <canvas ref={canvasRef} className="drive-canvas" aria-label="Three dimensional portfolio driving playground. Use arrow keys or WASD to drive." />
    <a className="drive-back" href="/">IM<span>.</span> <small>BACK TO PORTFOLIO</small></a>
    <div className="drive-heading"><span>INKERSAL MAHENDRAN</span><h1>DRIVE TO<br/><em>EXPLORE.</em></h1><p>Full-stack engineer · Chennai, India</p></div>
    <div className="drive-hud"><span className="drive-live"/> OPEN WORLD <span>{String(unlocked).padStart(2, '0')} / {String(stops.length).padStart(2, '0')} STOPS</span><span>CRYSTALS {String(collected).padStart(2, '0')}</span>{destinationMeters !== null && <span>NEXT {destinationMeters}M</span>}</div>
    {stop && <section className="drive-card"><button onClick={() => setActiveStop(null)} aria-label="Close destination">×</button><small>{stop.label}</small><h2>{stop.title}</h2>
      {stop.id === 'about' && about.map((text) => <p key={text}>{text}</p>)}
      {stop.id === 'experience' && experience.map((item) => <p key={item.id}><strong>{item.role} · {item.company}</strong><br/>{item.duration}<br/>{item.contribution}</p>)}
      {stop.id === 'projects' && projects.map((item) => <p key={item.id}><a href={item.link} target="_blank" rel="noreferrer"><strong>{item.title} ↗</strong></a><br/>{item.tech}</p>)}
      {stop.id === 'skills' && skills.map((item) => <p key={item.id}><strong>{item.category}</strong><br/>{item.skills}</p>)}
      {stop.id === 'contact' && <p>Have a project in mind? <a href={`mailto:${profile.email}`}>{profile.email} ↗</a><br/><a href={profile.linkedin} target="_blank" rel="noreferrer">Connect on LinkedIn ↗</a></p>}
      {stop.id === 'about' && <p><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a> · <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a> · <a href={profile.leetcode} target="_blank" rel="noreferrer">LeetCode ↗</a></p>}
    </section>}
    <div className="drive-controls"><strong>DRIVE</strong><span>W A S D</span><span>↑ ← ↓ →</span><span>SPACE BRAKE</span><span>Q / E SHIFT</span><span>SHIFT BOOST · J JUMP</span><i>Collect the glowing crystals</i><a href={profile.resume} target="_blank" rel="noreferrer">RESUME ↗</a></div>
    <div className="drive-speed"><strong>{speed}</strong><span>KM/H</span><span>GEAR {gear}</span></div>
    <div className="drive-challenge"><button onClick={() => window.dispatchEvent(new Event('drive-challenge'))}>{challenge.active ? 'RESTART RUN' : '60-SECOND CRYSTAL RUN'}</button><span>{challenge.active ? `${60 - challenge.seconds}s · ${challenge.score} collected` : `Best: ${challenge.best} crystals`}</span></div>
    <div className="drive-gears" aria-label="Gear controls"><button aria-label="Shift down" disabled={gear === 1} onClick={() => window.dispatchEvent(new CustomEvent('drive-shift', { detail: -1 }))}>−</button><span>GEAR {gear}</span><button aria-label="Shift up" disabled={gear === 5} onClick={() => window.dispatchEvent(new CustomEvent('drive-shift', { detail: 1 }))}>+</button></div>
    <div className="drive-settings"><label>HANDLING <select value={handling} onChange={(event) => setHandling(event.target.value)}><option value="arcade">Arcade</option><option value="relaxed">Relaxed</option></select></label><label>QUALITY <select value={quality} onChange={(event) => { setQuality(event.target.value); requestAnimationFrame(() => window.dispatchEvent(new Event('drive-quality-change'))); }}><option value="high">High</option><option value="low">Low</option></select></label><button onClick={() => setPaused((value) => !value)}>{paused ? 'RESUME' : 'PAUSE'}</button><button onClick={() => window.dispatchEvent(new CustomEvent('drive-reset'))}>RESET CAR</button><button onClick={toggleSound}>{muted ? 'ENABLE SOUND' : 'MUTE SOUND'}</button></div>
    {toast && <div className="drive-toast" role="status">{toast}</div>}
    <div className="drive-touch" aria-label="Touch driving controls">
      <button aria-label="Steer left" {...touchControl('ArrowLeft')}>LEFT</button>
      <button aria-label="Accelerate" {...touchControl('ArrowUp')}>GO</button>
      <button aria-label="Steer right" {...touchControl('ArrowRight')}>RIGHT</button>
      <button aria-label="Reverse" {...touchControl('ArrowDown')}>BACK</button>
      <button aria-label="Brake" {...touchControl(' ')}>BRAKE</button>
      <button aria-label="Boost" {...touchControl('Shift')}>BOOST</button>
      <button aria-label="Jump" {...touchControl('j')}>JUMP</button>
    </div>
    <nav className="drive-destinations" aria-label="Portfolio destinations">{stops.map((item) => <button key={item.id} onClick={() => { const event = new CustomEvent('drive-destination', { detail: item }); window.dispatchEvent(event); }}>{item.label}</button>)}</nav>
  </main>;
}
