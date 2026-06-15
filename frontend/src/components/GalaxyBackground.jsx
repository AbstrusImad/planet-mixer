import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// A vibrant animated galaxy: layered starfields with parallax depth, a drifting
// nebula gradient, and slow rotation. Device pixel ratio aware, paused when the
// tab is hidden, and static when prefers-reduced-motion is set.
export default function GalaxyBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ---- nebula backdrop (full screen gradient driven by a shader) --------
    const nebulaGeo = new THREE.PlaneGeometry(2, 2);
    const nebulaMat = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: window.innerWidth / window.innerHeight },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uAspect;

        // smooth value noise
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){
          vec2 i = floor(p); vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0,0.0));
          float c = hash(i + vec2(0.0,1.0));
          float d = hash(i + vec2(1.0,1.0));
          vec2 u = f*f*(3.0-2.0*f);
          return mix(a,b,u.x)+ (c-a)*u.y*(1.0-u.x)+ (d-b)*u.x*u.y;
        }
        float fbm(vec2 p){
          float v = 0.0; float amp = 0.5;
          for(int i=0;i<5;i++){ v += amp*noise(p); p*=2.0; amp*=0.5; }
          return v;
        }
        void main(){
          vec2 uv = vUv;
          vec2 p = (uv - 0.5);
          p.x *= uAspect;
          float t = uTime * 0.03;
          float n = fbm(p*2.4 + vec2(t, -t*0.6));
          float n2 = fbm(p*4.0 - vec2(t*0.4, t*0.7));

          vec3 deep = vec3(0.04, 0.03, 0.12);
          vec3 violet = vec3(0.32, 0.12, 0.55);
          vec3 teal = vec3(0.05, 0.45, 0.6);
          vec3 magenta = vec3(0.7, 0.18, 0.5);

          vec3 col = deep;
          col = mix(col, violet, smoothstep(0.2, 0.9, n));
          col = mix(col, teal, smoothstep(0.4, 1.0, n2) * 0.6);
          col = mix(col, magenta, smoothstep(0.55, 1.0, n*n2) * 0.5);

          // soft central glow
          float r = length(p);
          col += vec3(0.12, 0.10, 0.22) * smoothstep(0.9, 0.0, r);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    scene.add(nebula);

    // ---- star layers ------------------------------------------------------
    const layers = [];
    const layerSpecs = [
      { count: 1200, size: 0.7, radius: 6, speed: 0.006, color: 0xbfdcff },
      { count: 800, size: 1.1, radius: 4, speed: 0.012, color: 0xffe9b0 },
      { count: 400, size: 1.8, radius: 2.6, speed: 0.02, color: 0xffc0f0 },
    ];

    for (const spec of layerSpecs) {
      const positions = new Float32Array(spec.count * 3);
      for (let i = 0; i < spec.count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spec.radius * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spec.radius * 2;
        positions[i * 3 + 2] = -Math.random() * spec.radius;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        size: spec.size * 0.01,
        color: spec.color,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      layers.push({ points, speed: spec.speed });
    }

    let pointer = { x: 0, y: 0 };
    const onPointer = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      pointer = { x, y };
    };
    window.addEventListener('pointermove', onPointer);

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      nebulaMat.uniforms.uAspect.value = w / h;
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let raf = 0;
    let running = true;

    const renderOnce = () => {
      nebulaMat.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    const animate = () => {
      if (!running) return;
      const t = clock.getElapsedTime();
      nebulaMat.uniforms.uTime.value = t;
      for (let i = 0; i < layers.length; i++) {
        const l = layers[i];
        l.points.rotation.z = t * l.speed;
        l.points.position.x += (pointer.x * (i + 1) * 0.04 - l.points.position.x) * 0.04;
        l.points.position.y += (-pointer.y * (i + 1) * 0.04 - l.points.position.y) * 0.04;
      }
      camera.position.x += (pointer.x * 0.06 - camera.position.x) * 0.03;
      camera.position.y += (-pointer.y * 0.06 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, -2);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    if (reduceMotion) {
      renderOnce();
    } else {
      raf = requestAnimationFrame(animate);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
        clock.getDelta();
        raf = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const l of layers) {
        l.points.geometry.dispose();
        l.points.material.dispose();
      }
      nebulaGeo.dispose();
      nebulaMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="galaxy-bg" aria-hidden="true" />;
}
