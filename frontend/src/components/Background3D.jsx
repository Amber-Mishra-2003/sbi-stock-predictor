import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Animated 3D backdrop:
 *   • Wireframe terrain (smoothly undulating)
 *   • Drifting star field (BufferGeometry points)
 *   • Glowing accent orbs tinted by prediction direction
 *   • Mouse parallax + scroll-driven camera dolly
 *
 * Purely decorative — pointer events are disabled in CSS.
 */
function Background3D({ direction }) {
    const canvasRef = useRef(null);
    const directionRef = useRef(direction);

    useEffect(() => {
        directionRef.current = direction;
    }, [direction]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x070a10, 0.013);

        const camera = new THREE.PerspectiveCamera(
            55,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 10, 30);
        camera.lookAt(0, -2, -6);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);

        // -----------------------------------------------------------
        // Wireframe terrain
        // -----------------------------------------------------------
        const gridSize = 80;
        const segX = 72, segZ = 52;
        const geo = new THREE.PlaneGeometry(gridSize, 50, segX, segZ);
        geo.rotateX(-Math.PI / 2);
        const posAttr = geo.attributes.position;

        const colors = new Float32Array(posAttr.count * 3);
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const cAccent = new THREE.Color(0x00d9ff);
        const cPositive = new THREE.Color(0x00ffa3);
        const cNegative = new THREE.Color(0xff4463);
        const cAmber = new THREE.Color(0xffb020);
        const cDim = new THREE.Color(0x0f1620);

        const tmp = new THREE.Color();
        function paintVertices() {
            for (let i = 0; i < posAttr.count; i++) {
                const x = posAttr.getX(i);
                const z = posAttr.getZ(i);
                const t = THREE.MathUtils.clamp(
                    (x + gridSize / 2) / gridSize,
                    0,
                    1
                );
                const band = z / 20;

                if (x < 0.5) {
                    tmp.copy(cDim).lerp(cAccent, 0.18 + 0.32 * t);
                } else if (band < -0.2) {
                    tmp.copy(cDim).lerp(cPositive, t * 0.75);
                } else if (band > 0.2) {
                    tmp.copy(cDim).lerp(cNegative, t * 0.75);
                } else {
                    tmp.copy(cDim).lerp(cAmber, t * 0.6);
                }

                colors[i * 3] = tmp.r;
                colors[i * 3 + 1] = tmp.g;
                colors[i * 3 + 2] = tmp.b;
            }
            geo.attributes.color.needsUpdate = true;
        }
        paintVertices();

        const mat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            wireframe: true,
            transparent: true,
            opacity: 0.22
        });
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);

        // -----------------------------------------------------------
        // Star field
        // -----------------------------------------------------------
        const starCount = 700;
        const starPositions = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            starPositions[i * 3] = (Math.random() - 0.5) * 120;
            starPositions[i * 3 + 1] = Math.random() * 60 - 10;
            starPositions[i * 3 + 2] = -Math.random() * 80 - 5;
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute(
            "position",
            new THREE.BufferAttribute(starPositions, 3)
        );
        const starMat = new THREE.PointsMaterial({
            color: 0x9fc6ff,
            size: 0.06,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.85
        });
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);

        // -----------------------------------------------------------
        // Glowing accent orbs — three of them, drift along x/z
        // -----------------------------------------------------------
        const orbs = [];
        function makeOrb(color, baseY) {
            const g = new THREE.SphereGeometry(0.35, 24, 24);
            const m = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.65
            });
            const orb = new THREE.Mesh(g, m);
            orb.userData = {
                baseY,
                phase: Math.random() * Math.PI * 2,
                speed: 0.4 + Math.random() * 0.3
            };
            // soft halo
            const haloGeo = new THREE.SphereGeometry(0.9, 16, 16);
            const haloMat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.12
            });
            const halo = new THREE.Mesh(haloGeo, haloMat);
            orb.add(halo);
            scene.add(orb);
            orbs.push(orb);
            return orb;
        }
        makeOrb(0x00d9ff, 3);
        makeOrb(0x00ffa3, 5);
        makeOrb(0xff4463, 2);

        // -----------------------------------------------------------
        // History + forecast lines
        // -----------------------------------------------------------
        function makeLine(points, color, opacity) {
            const g = new THREE.BufferGeometry().setFromPoints(points);
            const m = new THREE.LineBasicMaterial({
                color,
                transparent: true,
                opacity
            });
            return new THREE.Line(g, m);
        }

        const histPts = [];
        for (let i = 0; i <= 28; i++) {
            const t = i / 28;
            const x = -gridSize / 2 + t * (gridSize / 2);
            const yv =
                Math.sin(t * 6) * 0.7 +
                Math.sin(t * 2.1) * 1.2 +
                2.5;
            histPts.push(new THREE.Vector3(x, yv, 0));
        }
        const histLine = makeLine(histPts, 0x00d9ff, 0.55);
        scene.add(histLine);

        function fanConfigForDirection(dir) {
            if (dir === "UP") {
                return [
                    { z: -8, color: 0x00ffa3, amp: 4.5 },
                    { z: 0, color: 0x00ffa3, amp: 2.6 },
                    { z: 8, color: 0xffb020, amp: 0.6 }
                ];
            }
            if (dir === "DOWN") {
                return [
                    { z: -8, color: 0xffb020, amp: -0.6 },
                    { z: 0, color: 0xff4463, amp: -2.6 },
                    { z: 8, color: 0xff4463, amp: -4.5 }
                ];
            }
            return [
                { z: -8, color: 0x00ffa3, amp: 2.8 },
                { z: 0, color: 0xffb020, amp: 0.4 },
                { z: 8, color: 0xff4463, amp: -2.8 }
            ];
        }

        let fanLines = [];
        function buildFan(dir) {
            fanLines.forEach((l) => scene.remove(l));
            fanLines = [];
            const start = histPts[histPts.length - 1];
            fanConfigForDirection(dir).forEach((cfg) => {
                const pts = [];
                for (let i = 0; i <= 24; i++) {
                    const t = i / 24;
                    const x = start.x + t * (gridSize / 2);
                    const z = start.z + t * cfg.z;
                    const yv =
                        start.y +
                        t * cfg.amp +
                        Math.sin(t * 8) * 0.25;
                    pts.push(new THREE.Vector3(x, yv, z));
                }
                const line = makeLine(pts, cfg.color, 0.45);
                fanLines.push(line);
                scene.add(line);
            });
        }
        buildFan(directionRef.current);

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
        function onScroll() {
            scrollY = window.scrollY;
        }
        if (!reduceMotion) {
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("scroll", onScroll, { passive: true });
        }

        let rafId;
        const clock = new THREE.Clock();
        let lastDir = directionRef.current;

        function animate() {
            rafId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            if (directionRef.current !== lastDir) {
                lastDir = directionRef.current;
                buildFan(lastDir);
            }

            if (!reduceMotion) {
                // terrain wave
                for (let i = 0; i < posAttr.count; i++) {
                    const x = posAttr.getX(i);
                    const z = posAttr.getZ(i);
                    const base =
                        Math.sin(x * 0.15 + t * 0.4) * 0.4 +
                        Math.cos(z * 0.2 + t * 0.25) * 0.32;
                    posAttr.setY(i, base);
                }
                posAttr.needsUpdate = true;

                // stars slow drift
                stars.rotation.y = t * 0.01;
                const starPos = starGeo.attributes.position.array;
                for (let i = 0; i < starCount; i++) {
                    starPos[i * 3 + 1] -= 0.0035;
                    if (starPos[i * 3 + 1] < -12) {
                        starPos[i * 3 + 1] = 48;
                    }
                }
                starGeo.attributes.position.needsUpdate = true;

                // orbs float
                orbs.forEach((orb, idx) => {
                    orb.position.x =
                        Math.sin(t * 0.3 + idx) * 14;
                    orb.position.y =
                        orb.userData.baseY +
                        Math.sin(t * 0.6 + orb.userData.phase) * 1.2;
                    orb.position.z =
                        Math.cos(t * 0.25 + idx * 1.3) * 6 - 4;
                    orb.rotation.y = t * 0.4;
                    orb.children[0].rotation.y = -t * 0.4;
                });

                // camera parallax + scroll dolly
                camera.position.x = mouseX * 2.8;
                camera.position.y = 10 - mouseY * 1.2 + scrollY * 0.005;
                camera.lookAt(1.5, -2, -6);
            }

            renderer.render(scene, camera);
        }
        animate();

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("scroll", onScroll);

            geo.dispose();
            mat.dispose();
            starGeo.dispose();
            starMat.dispose();
            orbs.forEach((o) => {
                o.geometry.dispose();
                o.material.dispose();
                o.children.forEach((c) => {
                    c.geometry.dispose();
                    c.material.dispose();
                });
            });
            histLine.geometry.dispose();
            histLine.material.dispose();
            fanLines.forEach((l) => {
                l.geometry.dispose();
                l.material.dispose();
            });
            renderer.dispose();
        };
    }, []);

    return <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />;
}

export default Background3D;
