import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * AIStockVideo3D — a cinematic, AI-themed animated background for the
 * SBI stock predictor. Purely decorative (pointer-events disabled in CSS).
 *
 * Layers (back → front):
 *   1. Star/dust field        (parallax depth)
 *   2. Neural network lattice (nodes + animated edges)
 *   3. Data streams           (particles flowing along arcs)
 *   4. Holographic price wave (a ribbon that rises/falls with direction)
 *   5. Pulsing AI core        (glowing sphere, the "brain")
 *   6. Prediction ray fans    (3 colored rays tinted by direction)
 *   7. Lens dust              (close-up drifting specks for depth)
 *
 * Direction prop:
 *   "UP"     → green rising wave + green ray fan
 *   "DOWN"   → red falling wave + red ray fan
 *   "NEUTRAL"/undefined → cyan balanced wave
 *
 * Scene prop:
 *   "hero"      → most cinematic, faster motion (use on landing)
 *   "dashboard" → calmer, more particles (use behind the dashboard)
 */
function AIStockVideo3D({ direction, scene = "dashboard" }) {
    const canvasRef = useRef(null);
    const directionRef = useRef(direction);
    const sceneRef = useRef(scene);

    useEffect(() => {
        directionRef.current = direction;
        sceneRef.current = scene;
    }, [direction, scene]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        // ---------------- scene / camera / renderer ----------------
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x050810, 0.012);

        const camera = new THREE.PerspectiveCamera(
            58,
            window.innerWidth / window.innerHeight,
            0.1,
            400
        );
        camera.position.set(0, 0, 24);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        // ============================================================
        // LAYER 1 — Star/dust field
        // ============================================================
        const starCount = 1400;
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3]     = (Math.random() - 0.5) * 200;
            starPositions[i * 3 + 1] = (Math.random() - 0.5) * 120;
            starPositions[i * 3 + 2] = -Math.random() * 200 - 5;

            // gentle warm tint
            const tint = Math.random();
            starColors[i * 3]     = 0.6 + tint * 0.4;
            starColors[i * 3 + 1] = 0.7 + tint * 0.3;
            starColors[i * 3 + 2] = 0.9 + Math.random() * 0.1;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
        starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 0.08,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.75,
            vertexColors: true
        });
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);

        // ============================================================
        // LAYER 2 — Neural network lattice
        // ============================================================
        const NN_SIZE = 16;              // nodes per side
        const NN_SPACING = 4.5;
        const nnGroup = new THREE.Group();
        const nodes = [];

        const nodeGeo = new THREE.SphereGeometry(0.08, 8, 8);
        for (let x = 0; x < NN_SIZE; x++) {
            for (let y = 0; y < NN_SIZE; y++) {
                const px = (x - NN_SIZE / 2 + 0.5) * NN_SPACING;
                const py = (y - NN_SIZE / 2 + 0.5) * NN_SPACING;
                const pz = -20;

                const mat = new THREE.MeshBasicMaterial({
                    color: 0x00d9ff,
                    transparent: true,
                    opacity: 0.7
                });
                const node = new THREE.Mesh(nodeGeo, mat);
                node.position.set(px, py, pz);
                node.userData = {
                    baseX: px,
                    baseY: py,
                    baseZ: pz,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.6
                };
                nodes.push(node);
                nnGroup.add(node);
            }
        }

        // Edges — connect each node to its right + bottom neighbor
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.18
        });
        for (let x = 0; x < NN_SIZE - 1; x++) {
            for (let y = 0; y < NN_SIZE; y++) {
                const a = nodes[x * NN_SIZE + y];
                const b = nodes[(x + 1) * NN_SIZE + y];
                const geo = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
                nnGroup.add(new THREE.Line(geo, lineMat));
            }
        }
        for (let x = 0; x < NN_SIZE; x++) {
            for (let y = 0; y < NN_SIZE - 1; y++) {
                const a = nodes[x * NN_SIZE + y];
                const b = nodes[x * NN_SIZE + y + 1];
                const geo = new THREE.BufferGeometry().setFromPoints([a.position, b.position]);
                nnGroup.add(new THREE.Line(geo, lineMat));
            }
        }
        scene.add(nnGroup);

        // ============================================================
        // LAYER 3 — Data stream particles
        // ============================================================
        const PARTICLE_COUNT = 220;
        const particleGeo = new THREE.BufferGeometry();
        const partPositions = new Float32Array(PARTICLE_COUNT * 3);
        const partMeta = []; // { phase, speed, radius, yOffset, color }
        const cUp = new THREE.Color(0x00ffa3);
        const cDown = new THREE.Color(0xff4463);
        const cMid = new THREE.Color(0x00d9ff);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            partPositions[i * 3]     = 0;
            partPositions[i * 3 + 1] = 0;
            partPositions[i * 3 + 2] = 0;
            partMeta.push({
                phase: Math.random() * Math.PI * 2,
                speed: 0.15 + Math.random() * 0.35,
                radius: 10 + Math.random() * 14,
                yOffset: (Math.random() - 0.5) * 14,
                color: Math.random() < 0.5 ? cUp : (Math.random() < 0.5 ? cDown : cMid)
            });
        }
        particleGeo.setAttribute("position", new THREE.BufferAttribute(partPositions, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.16,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.9
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // ============================================================
        // LAYER 4 — Holographic price wave (ribbon)
        // ============================================================
        const WAVE_SEGMENTS = 140;
        const waveGeo = new THREE.PlaneGeometry(60, 6, WAVE_SEGMENTS, 1);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.position.set(0, -2, -8);
        scene.add(wave);

        // Wave outline — a glowing line drawn from the wave vertices
        const waveLineGeo = new THREE.BufferGeometry();
        const waveLinePts = new Float32Array((WAVE_SEGMENTS + 1) * 3);
        waveLineGeo.setAttribute("position", new THREE.BufferAttribute(waveLinePts, 3));
        const waveLineMat = new THREE.LineBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending
        });
        const waveLine = new THREE.Line(waveLineGeo, waveLineMat);
        scene.add(waveLine);

        // ============================================================
        // LAYER 5 — Pulsing AI core
        // ============================================================
        const coreGeo = new THREE.IcosahedronGeometry(1.3, 1);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            wireframe: true,
            transparent: true,
            opacity: 0.85
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.set(0, 0, -2);
        scene.add(core);

        // inner glow sphere
        const coreGlowGeo = new THREE.SphereGeometry(0.9, 24, 24);
        const coreGlowMat = new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending
        });
        const coreGlow = new THREE.Mesh(coreGlowGeo, coreGlowMat);
        scene.add(coreGlow);

        // outer halo
        const haloGeo = new THREE.SphereGeometry(2.2, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x00d9ff,
            transparent: true,
            opacity: 0.07,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        scene.add(halo);

        // ============================================================
        // LAYER 6 — Direction ray fans (rebuilt when direction changes)
        // ============================================================
        const rayGroup = new THREE.Group();
        scene.add(rayGroup);

        function fanFor(dir) {
            // returns [{ x, y, color, length }] for 5 rays
            if (dir === "UP") {
                return [
                    { x: -28, y: -2, color: 0x00ffa3, length: 36 },
                    { x: -14, y: -1, color: 0x00ffa3, length: 40 },
                    { x:   0, y:  0, color: 0x00d9ff, length: 42 },
                    { x:  14, y:  1, color: 0xffb020, length: 38 },
                    { x:  28, y:  2, color: 0xffb020, length: 34 }
                ];
            }
            if (dir === "DOWN") {
                return [
                    { x: -28, y:  2, color: 0xffb020, length: 34 },
                    { x: -14, y:  1, color: 0xffb020, length: 38 },
                    { x:   0, y:  0, color: 0x00d9ff, length: 42 },
                    { x:  14, y: -1, color: 0xff4463, length: 40 },
                    { x:  28, y: -2, color: 0xff4463, length: 36 }
                ];
            }
            return [
                { x: -28, y:  0, color: 0x00d9ff, length: 34 },
                { x: -14, y:  0, color: 0x00d9ff, length: 38 },
                { x:   0, y:  0, color: 0xffb020, length: 42 },
                { x:  14, y:  0, color: 0x00d9ff, length: 38 },
                { x:  28, y:  0, color: 0x00d9ff, length: 34 }
            ];
        }

        let rays = [];
        function buildRays(dir) {
            rays.forEach((r) => {
                rayGroup.remove(r.line);
                r.line.geometry.dispose();
                r.line.material.dispose();
            });
            rays = [];

            const fan = fanFor(dir);
            fan.forEach((cfg, i) => {
                const pts = [
                    new THREE.Vector3(cfg.x - 4, cfg.y, -6),
                    new THREE.Vector3(cfg.x + 4, cfg.y, -6 + cfg.length * 0.05)
                ];
                const g = new THREE.BufferGeometry().setFromPoints(pts);
                const m = new THREE.LineBasicMaterial({
                    color: cfg.color,
                    transparent: true,
                    opacity: 0,
                    blending: THREE.AdditiveBlending
                });
                const line = new THREE.Line(g, m);
                rayGroup.add(line);
                rays.push({ line, cfg, index: i });
            });
        }
        buildRays(directionRef.current);

        function applyDirectionColors(dir) {
            const color = dir === "UP" ? 0x00ffa3 : dir === "DOWN" ? 0xff4463 : 0x00d9ff;
            waveMat.color.setHex(color);
            waveLineMat.color.setHex(color);
            coreMat.color.setHex(color);
            coreGlowMat.color.setHex(color);
            haloMat.color.setHex(color);
            buildRays(dir);
        }

        // ============================================================
        // LAYER 7 — Lens dust (close-up drifting specks)
        // ============================================================
        const DUST_COUNT = 80;
        const dustGeo = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(DUST_COUNT * 3);
        for (let i = 0; i < DUST_COUNT; i++) {
            dustPositions[i * 3]     = (Math.random() - 0.5) * 60;
            dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            dustPositions[i * 3 + 2] = Math.random() * 8 + 2;
        }
        dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
        const dustMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.4
        });
        const dust = new THREE.Points(dustGeo, dustMat);
        scene.add(dust);

        // ---------------- interaction ----------------
        function resize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener("resize", resize);

        let mouseX = 0, mouseY = 0, scrollY = 0;
        function onMouseMove(e) {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        }
        function onScroll() { scrollY = window.scrollY; }
        if (!reduceMotion) {
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("scroll", onScroll, { passive: true });
        }

        // ---------------- animation loop ----------------
        let rafId;
        const clock = new THREE.Clock();
        let lastDir = directionRef.current;
        let dirColorT = 0; // 0..1 — used to lerp on direction change
        let dirColorFrom = new THREE.Color(0x00d9ff);
        let dirColorTo = new THREE.Color(0x00d9ff);
        const wavePosAttr = waveGeo.attributes.position;
        const waveLinePosAttr = waveLineGeo.attributes.position;

        function animate() {
            rafId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();
            const isHero = sceneRef.current === "hero";
            const motionScale = reduceMotion ? 0 : (isHero ? 1.0 : 0.6);

            // direction transition
            if (directionRef.current !== lastDir) {
                dirColorFrom = waveMat.color.clone();
                dirColorTo.setHex(
                    directionRef.current === "UP" ? 0x00ffa3
                    : directionRef.current === "DOWN" ? 0xff4463
                    : 0x00d9ff
                );
                dirColorT = 0;
                applyDirectionColors(directionRef.current);
                lastDir = directionRef.current;
            }

            // smooth color blend
            if (dirColorT < 1) {
                dirColorT = Math.min(1, dirColorT + 0.04);
                const blended = dirColorFrom.clone().lerp(dirColorTo, dirColorT);
                waveMat.color.copy(blended);
                waveLineMat.color.copy(blended);
                coreMat.color.copy(blended);
                coreGlowMat.color.copy(blended);
                haloMat.color.copy(blended);
            }

            // ----- stars -----
            stars.rotation.y = t * 0.008;
            const starPos = starGeo.attributes.position.array;
            for (let i = 0; i < starCount; i++) {
                starPos[i * 3 + 1] -= 0.005 * motionScale;
                if (starPos[i * 3 + 1] < -60) starPos[i * 3 + 1] = 60;
            }
            starGeo.attributes.position.needsUpdate = true;

            // ----- neural network: breathe + wave displacement -----
            for (let i = 0; i < nodes.length; i++) {
                const n = nodes[i];
                const u = n.userData;
                const z = Math.sin(t * u.speed + u.phase) * 1.8 * motionScale
                        + Math.cos(n.position.x * 0.3 + t * 0.5) * 0.6;
                n.position.z = u.baseZ + z;
                const pulse = 0.5 + 0.5 * Math.sin(t * 2 + u.phase);
                n.material.opacity = 0.4 + pulse * 0.5;
            }
            nnGroup.rotation.z = Math.sin(t * 0.1) * 0.04;

            // ----- data particles: orbit around center -----
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const meta = partMeta[i];
                const angle = t * meta.speed + meta.phase;
                partPositions[i * 3]     = Math.cos(angle) * meta.radius;
                partPositions[i * 3 + 1] = meta.yOffset + Math.sin(angle * 2) * 2;
                partPositions[i * 3 + 2] = Math.sin(angle) * meta.radius - 10;
            }
            particleGeo.attributes.position.needsUpdate = true;

            // ----- holographic price wave -----
            const dirSign = directionRef.current === "UP" ? 1
                          : directionRef.current === "DOWN" ? -1 : 0;
            const dirAmp = directionRef.current === "NEUTRAL" || !directionRef.current ? 0.4 : 1.4;
            const trend = dirSign * dirAmp * motionScale;

            for (let i = 0; i <= WAVE_SEGMENTS; i++) {
                const u = i / WAVE_SEGMENTS;
                const x = (u - 0.5) * 60;
                // multi-frequency wave with a directional tilt
                const wave =
                    Math.sin(u * 6 + t * 0.8) * 0.6 +
                    Math.sin(u * 12 + t * 0.5) * 0.25 +
                    trend * (u - 0.5) * 2.4;
                wavePosAttr.setY(i, wave);
                waveLinePts[i * 3]     = x;
                waveLinePts[i * 3 + 1] = wave;
                waveLinePts[i * 3 + 2] = 0;
            }
            wavePosAttr.needsUpdate = true;
            waveLinePosAttr.needsUpdate = true;

            // ----- pulsing AI core -----
            const corePulse = 0.85 + 0.15 * Math.sin(t * 1.4);
            core.scale.setScalar(corePulse);
            core.rotation.x = t * 0.25;
            core.rotation.y = t * 0.35;
            coreGlow.scale.setScalar(1.0 + 0.12 * Math.sin(t * 1.4));
            coreGlow.material.opacity = 0.25 + 0.12 * Math.sin(t * 1.4);
            halo.scale.setScalar(1.0 + 0.18 * Math.sin(t * 0.8));
            halo.material.opacity = 0.05 + 0.05 * Math.sin(t * 0.8);

            // ----- direction rays (sweep + reveal) -----
            rays.forEach((r, i) => {
                const sweep = (t * 0.6 + i * 0.15) % 1;
                r.line.material.opacity = sweep < 0.6 ? sweep / 0.6 * 0.7 : (1 - sweep) / 0.4 * 0.7;
            });

            // ----- dust drift -----
            const dustPos = dustGeo.attributes.position.array;
            for (let i = 0; i < DUST_COUNT; i++) {
                dustPos[i * 3]     += 0.02 * motionScale;
                if (dustPos[i * 3] > 30) dustPos[i * 3] = -30;
            }
            dustGeo.attributes.position.needsUpdate = true;

            // ----- camera parallax + scroll dolly -----
            camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.04;
            camera.position.y += (-mouseY * 1.2 - camera.position.y) * 0.04;
            camera.position.z = 24 - scrollY * 0.005;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }
        animate();

        // ---------------- cleanup ----------------
        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("scroll", onScroll);

            starGeo.dispose(); starMat.dispose();
            nodeGeo.dispose();
            nodes.forEach((n) => n.material.dispose());
            lineMat.dispose();
            particleGeo.dispose(); particleMat.dispose();
            waveGeo.dispose(); waveMat.dispose();
            waveLineGeo.dispose(); waveLineMat.dispose();
            coreGeo.dispose(); coreMat.dispose();
            coreGlowGeo.dispose(); coreGlowMat.dispose();
            haloGeo.dispose(); haloMat.dispose();
            rays.forEach((r) => {
                r.line.geometry.dispose();
                r.line.material.dispose();
            });
            dustGeo.dispose(); dustMat.dispose();
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} className="ai-bg-canvas" aria-hidden="true" />;
}

export default AIStockVideo3D;
