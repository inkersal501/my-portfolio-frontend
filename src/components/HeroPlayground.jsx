import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function HeroPlayground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      return undefined;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 8;
    const group = new THREE.Group();
    scene.add(group);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.18, 2), new THREE.MeshStandardMaterial({ color: 0x9fc84d, roughness: 0.28, metalness: 0.18, flatShading: true, emissive: 0x263512, emissiveIntensity: 0.28 }));
    group.add(core);
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.28, 1), new THREE.MeshBasicMaterial({ color: 0xd8ffa0, wireframe: true, transparent: true, opacity: 0.28 }));
    group.add(wire);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.012, 8, 160), new THREE.MeshBasicMaterial({ color: 0xb8e96b, transparent: true, opacity: 0.8 }));
    orbit.rotation.set(0.85, 0.28, -0.42);
    group.add(orbit);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.007, 6, 128), new THREE.MeshBasicMaterial({ color: 0xeaffc6, transparent: true, opacity: 0.3 }));
    ring.rotation.set(1.15, -0.3, 0.2);
    group.add(ring);

    const positions = new Float32Array(110 * 3);
    for (let i = 0; i < 110; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.15 + Math.random() * 1.25;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    scene.add(new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xd4f59b, size: 0.025, transparent: true, opacity: 0.72 })));
    scene.add(new THREE.AmbientLight(0xc9ef91, 1.6));
    const light = new THREE.PointLight(0xe6ffbe, 38, 18);
    light.position.set(-3, 3, 5);
    scene.add(light);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0, y: 0 };
    let frame;
    let visible = true;
    let elapsed = 0;
    let previous = 0;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 500 ? 9 : 8;
      camera.updateProjectionMatrix();
    };
    const move = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const leave = () => { pointer.x = 0; pointer.y = 0; };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(animate);
    });
    visibilityObserver.observe(canvas);
    canvas.addEventListener('pointermove', move, { passive: true });
    canvas.addEventListener('pointerleave', leave, { passive: true });
    function animate(now = 0) {
      frame = undefined;
      if (!visible) return;
      const delta = Math.min((now - previous) / 1000 || 0, 0.05);
      previous = now;
      if (!reduced.matches) elapsed += delta;
      group.rotation.y += ((reduced.matches ? 0 : elapsed * 0.17 + pointer.x * 0.18) - group.rotation.y) * 0.035;
      group.rotation.x += ((reduced.matches ? 0 : pointer.y * 0.13 + Math.sin(elapsed * 0.45) * 0.06) - group.rotation.x) * 0.035;
      group.position.y = reduced.matches ? 0 : Math.sin(elapsed * 0.8) * 0.09;
      wire.rotation.y = -group.rotation.y * 0.55;
      wire.rotation.x = group.rotation.x * 0.65;
      orbit.rotation.z += reduced.matches ? 0 : delta * 0.11;
      ring.rotation.y += reduced.matches ? 0 : delta * 0.06;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return <canvas className="hero-playground" ref={canvasRef} aria-hidden="true" />;
}
