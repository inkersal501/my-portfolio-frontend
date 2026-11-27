import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { about, experience, profile, projects, skills } from '../data/portfolio';

const stops = [
  { id: 'about', label: 'ABOUT', title: 'A little about me', x: -7, z: -20, color: 0xc6f36a },
  { id: 'experience', label: 'EXPERIENCE', title: 'The path so far', x: 12, z: -75, color: 0x77c6b3 },
  { id: 'projects', label: 'PROJECTS', title: 'Things I have made', x: -16, z: -145, color: 0xf0b76d },
  { id: 'skills', label: 'SKILLS', title: 'Tools of the trade', x: 8, z: -230, color: 0xb69cff },
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
  const [collected, setCollected] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [destinationMeters, setDestinationMeters] = useState(null);
  const [toast, setToast] = useState('');
  const [paused, setPaused] = useState(false);
  const [handling, setHandling] = useState('arcade');
  const [quality, setQuality] = useState('high');
  const [muted, setMuted] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const [position, setPosition] = useState({ x: 0, z: 0, heading: 0 });
  const minimapRef = useRef(null);
  const settingsRef = useRef({ paused, handling, quality });
  settingsRef.current = { paused, handling, quality };

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
      const material = new THREE.MeshStandardMaterial({ color: [0x343b30, 0x454a3a, 0x29392e][i % 3], roughness: 0.8 });
      const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), material);
      building.position.set(x, height / 2 - 0.06, z);
      world.add(building);
      const windows = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.08, width * 0.72), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xc6f36a : 0x8b9878, transparent: true, opacity: 0.55 }));
      windows.position.set(x, height * 0.64, z - width / 2 - 0.012);
      world.add(windows);
      obstacles.push({ x, z, baseX, baseZ, width, height, radius: width * 0.55, building, windows });
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
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: makeTextTexture(stop.label), transparent: true, side: THREE.DoubleSide }));
      sign.position.set(0, 2.8, 0.1);
      gate.add(sign);
      gate.position.set(stop.x, 0, stop.z);
      world.add(gate);
      return gate;
    });

    const pickups = [];
    const pickupMaterial = new THREE.MeshStandardMaterial({ color: 0xe1ff9e, emissive: 0x8bbb43, emissiveIntensity: 1.5, metalness: 0.35, roughness: 0.25 });
    for (let i = 0; i < 12; i += 1) {
      const pickup = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), pickupMaterial);
      pickup.position.set(i % 2 ? 2.6 : -2.6, 0.65, -3 - i * 5.8);
      world.add(pickup);
      pickups.push({ mesh: pickup, found: false });
    }

    const keys = new Set();
    const pointer = { down: false, x: 0 };
    let touchSteer = 0;
    let velocity = 0;
    let steer = 0;
    let yaw = 0;
    let crashCooldown = 0;
    let lastUnlocked = -1;
    let speedUpdateAt = 0;
    let frame;
    let visible = true;
    let previous = 0;
    const keydown = (event) => { if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault(); keys.add(event.key.toLowerCase()); };
    const keyup = (event) => keys.delete(event.key.toLowerCase());
    const pointerdown = (event) => { pointer.down = true; pointer.x = event.clientX; canvas.setPointerCapture(event.pointerId); };
    const pointermove = (event) => { if (pointer.down) { touchSteer = THREE.MathUtils.clamp((event.clientX - canvas.getBoundingClientRect().left) / canvas.clientWidth * 2 - 1, -1, 1); pointer.x = event.clientX; } };
    const pointerup = () => { pointer.down = false; };
    let targetStop = null;
    const onDestination = (event) => { targetStop = event.detail; };
    const resetCar = () => { car.position.set(0, 0, 8); yaw = 0; velocity = 0; steer = 0; targetStop = null; };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('drive-destination', onDestination);
    window.addEventListener('drive-reset', resetCar);
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
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
        return;
      }
      const accelerating = keys.has('w') || keys.has('arrowup');
      const reversing = keys.has('s') || keys.has('arrowdown');
      const braking = keys.has(' ');
      const left = keys.has('a') || keys.has('arrowleft');
      const right = keys.has('d') || keys.has('arrowright');
      const direction = pointer.down ? touchSteer : Number(right) - Number(left);
      if (!targetStop) {
      const targetVelocity = accelerating ? (settingsRef.current.handling === 'relaxed' ? 7 : 10) : reversing ? -3.5 : 0;
        const response = braking ? 20 : (accelerating || reversing ? 7 : 3.1);
        velocity = THREE.MathUtils.damp(velocity, targetVelocity, response, delta);
      }
      const offRoad = Math.abs(car.position.x) > 4.35;
      if (offRoad) velocity = THREE.MathUtils.damp(velocity, 2.2, 1.8, delta);
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
      car.rotation.y = yaw;
      car.rotation.z = -steer * Math.min(Math.abs(velocity) / 12, 1) * 0.055;
      car.position.y = Math.abs(velocity) > 0.5 ? Math.sin(now * 0.012) * 0.025 : 0;
      wheels.forEach((wheel) => { wheel.rotation.x -= velocity * delta * 1.7; });
      obstacles.forEach((item) => {
        if (crashCooldown <= 0 && Math.abs(car.position.x - item.x) < item.radius + 0.7 && Math.abs(car.position.z - item.z) < item.radius + 0.9) {
          car.position.copy(previousPosition);
          velocity *= -0.24;
          crashCooldown = 0.7;
          setToast('BONK! Keep it between the curbs.');
          window.setTimeout(() => setToast(''), 1500);
        }
      });
      laneMarks.forEach((mark, index) => {
        if (index % 2 === 0) mark.position.z = car.position.z + (index / 2 - 10) * 5;
        else mark.position.x = car.position.x + (Math.floor(index / 2) - 10) * 5;
      });
      crashCooldown -= delta;
      gateObjects.forEach((gate, index) => {
        const laps = Math.round((car.position.z - stops[index].z) / 300);
        gate.position.x = stops[index].x + Math.round((car.position.x - stops[index].x) / 300) * 300;
        gate.position.z = stops[index].z + laps * 300;
        if (Math.abs(car.position.z - gate.position.z) < 2 && Math.abs(car.position.x - gate.position.x) < 3) {
          if (lastUnlocked < index) { lastUnlocked = index; setUnlocked(index + 1); }
          setActiveStop(stops[index].id);
          setToast(`${stops[index].label} DISCOVERED`);
          window.setTimeout(() => setToast(''), 2200);
        }
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
      const cameraTarget = new THREE.Vector3(car.position.x, 0.7, car.position.z - 5);
      camera.position.lerp(new THREE.Vector3(car.position.x - Math.sin(yaw) * 2.2, 5.2, car.position.z + 10), 1 - Math.exp(-delta * 3.5));
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
      if (now - speedUpdateAt > 120) {
        speedUpdateAt = now;
        setSpeed(Math.round(Math.abs(velocity) * 9));
        setDestinationMeters(targetStop ? Math.round(Math.hypot(targetStop.x - car.position.x, targetStop.z - car.position.z)) : null);
        setPosition({ x: car.position.x, z: car.position.z, heading: yaw });
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
      window.removeEventListener('drive-destination', onDestination);
      window.removeEventListener('drive-reset', resetCar);
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
  useEffect(() => {
    const map = minimapRef.current;
    const context = map?.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, 140, 140);
    context.fillStyle = '#182017'; context.fillRect(0, 0, 140, 140);
    context.strokeStyle = '#555d4b'; context.lineWidth = 8;
    context.beginPath(); context.moveTo(70, 0); context.lineTo(70, 140); context.moveTo(0, 70); context.lineTo(140, 70); context.stroke();
    const scale = 2.2;
    stops.forEach((item) => { context.fillStyle = `#${item.color.toString(16).padStart(6, '0')}`; context.beginPath(); context.arc(70 + (item.x - position.x) * scale, 70 + (item.z - position.z) * scale, 4, 0, Math.PI * 2); context.fill(); });
    context.save(); context.translate(70, 70); context.rotate(-position.heading); context.fillStyle = '#fff'; context.beginPath(); context.moveTo(0, -8); context.lineTo(5, 6); context.lineTo(-5, 6); context.fill(); context.restore();
  }, [position]);
  return <main className="drive-page">
    {webglError && <div className="drive-error"><h1>3D mode is unavailable</h1><p>Your browser could not start WebGL. You can still use the regular portfolio.</p><a href="/">Back to portfolio</a></div>}
    <canvas ref={canvasRef} className="drive-canvas" aria-label="Three dimensional portfolio driving playground. Use arrow keys or WASD to drive." />
    <a className="drive-back" href="/">IM<span>.</span> <small>BACK TO PORTFOLIO</small></a>
    <div className="drive-heading"><span>INKERSAL MAHENDRAN</span><h1>DRIVE TO<br/><em>EXPLORE.</em></h1><p>Full-stack engineer · Chennai, India</p></div>
    <div className="drive-hud"><span className="drive-live"/> OPEN WORLD <span>{String(unlocked).padStart(2, '0')} / 04 STOPS</span><span>CRYSTALS {String(collected).padStart(2, '0')}</span>{destinationMeters !== null && <span>NEXT {destinationMeters}M</span>}</div>
    {stop && <section className="drive-card"><button onClick={() => setActiveStop(null)} aria-label="Close destination">×</button><small>{stop.label}</small><h2>{stop.title}</h2>
      {stop.id === 'about' && about.map((text) => <p key={text}>{text}</p>)}
      {stop.id === 'experience' && experience.map((item) => <p key={item.id}><strong>{item.role} · {item.company}</strong><br/>{item.duration}<br/>{item.contribution}</p>)}
      {stop.id === 'projects' && projects.map((item) => <p key={item.id}><a href={item.link} target="_blank" rel="noreferrer"><strong>{item.title} ↗</strong></a><br/>{item.tech}</p>)}
      {stop.id === 'skills' && skills.map((item) => <p key={item.id}><strong>{item.category}</strong><br/>{item.skills}</p>)}
      {stop.id === 'about' && <p><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a> · <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a> · <a href={profile.leetcode} target="_blank" rel="noreferrer">LeetCode ↗</a></p>}
    </section>}
    <div className="drive-controls"><strong>DRIVE</strong><span>W A S D</span><span>↑ ← ↓ →</span><span>SPACE BRAKE</span><i>Swipe to steer · collect the glowing crystals</i><a href={profile.resume} target="_blank" rel="noreferrer">RESUME ↗</a></div>
    <div className="drive-speed"><strong>{speed}</strong><span>KM/H</span></div>
    <canvas className="drive-minimap" ref={minimapRef} width="140" height="140" aria-label="Nearby map" />
    <div className="drive-settings"><label>HANDLING <select value={handling} onChange={(event) => setHandling(event.target.value)}><option value="arcade">Arcade</option><option value="relaxed">Relaxed</option></select></label><label>QUALITY <select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="high">High</option><option value="low">Low</option></select></label><button onClick={() => setPaused((value) => !value)}>{paused ? 'RESUME' : 'PAUSE'}</button><button onClick={() => window.dispatchEvent(new CustomEvent('drive-reset'))}>RESET CAR</button><button onClick={() => setMuted((value) => !value)}>{muted ? 'SOUND OFF' : 'SOUND ON'}</button></div>
    {toast && <div className="drive-toast" role="status">{toast}</div>}
    <div className="drive-touch" aria-label="Touch driving controls">
      <button aria-label="Steer left" onPointerDown={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })); }} onPointerUp={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' })); }} onPointerLeave={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' })); }}>LEFT</button>
      <button aria-label="Accelerate" onPointerDown={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }} onPointerUp={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }} onPointerLeave={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }}>GO</button>
      <button aria-label="Steer right" onPointerDown={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); }} onPointerUp={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' })); }} onPointerLeave={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' })); }}>RIGHT</button>
      <button aria-label="Brake" onPointerDown={() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })); }} onPointerUp={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })); }} onPointerLeave={() => { window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })); }}>BRAKE</button>
    </div>
    <nav className="drive-destinations" aria-label="Portfolio destinations">{stops.map((item) => <button key={item.id} onClick={() => { const event = new CustomEvent('drive-destination', { detail: item }); window.dispatchEvent(event); }}>{item.label}</button>)}</nav>
  </main>;
}
