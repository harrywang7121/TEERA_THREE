//For Animation

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';


class ParticleSystem {
    constructor(maxParticleCount, xOffset, yOffset, zOffset, r, group, text) {
        this.maxParticleCount = maxParticleCount;
        this.particlesData = [];
        this.particlePositions = new Float32Array(maxParticleCount * 3);
        this.r = r;
        this.rHalf = r / 2;
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.zOffset = zOffset;
        this.group = group;
        this.text = text;
        this.initParticles();
        this.createParticles();
        this.createBoxMesh();
        this.createText();
        this.initLines();
    }

    initParticles() {
        for (let i = 0; i < this.maxParticleCount; i++) {
            // 计算每个粒子的活动范围
            const segmentWidth = this.r / this.maxParticleCount;
            const xMin = this.xOffset - this.rHalf + i * segmentWidth;
            const xMax = xMin + segmentWidth;
            const x = xMin + Math.random() * segmentWidth;
            const y = this.yOffset + (Math.random() * this.r - this.rHalf);
            const z = this.zOffset + (Math.random() * this.r - this.rHalf);

            this.particlePositions[i * 3] = x;
            this.particlePositions[i * 3 + 1] = y;
            this.particlePositions[i * 3 + 2] = z;

            this.particlesData.push({
                velocity: new THREE.Vector3(-0.05 + Math.random() * 0.1, -0.05 + Math.random() * 0.1, -0.05 + Math.random() * 0.1),
                numConnections: 0,
                xMin: xMin,
                xMax: xMax
            });
        }
    }

    createParticles() {
        const textureLoader = new THREE.TextureLoader();
        const circleTexture = textureLoader.load('./circle.png');

        const pMaterial = new THREE.PointsMaterial({
            color: 0x0500E3,
            size: 10,
            transparent: true,
            sizeAttenuation: true,
            map: circleTexture
        });

        this.particles = new THREE.BufferGeometry();
        this.particles.setDrawRange(0, this.maxParticleCount);
        this.particles.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.pointCloud = new THREE.Points(this.particles, pMaterial);
        this.group.add(this.pointCloud);
    }

    createBoxMesh() {
        const boxGeometry = new THREE.BoxGeometry(this.r, this.r, this.r);
        const edges = new THREE.EdgesGeometry(boxGeometry);
        this.boxMeshMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: effectController.meshOpacity
        });
        const lineSegments = new THREE.LineSegments(edges, this.boxMeshMaterial);
        lineSegments.position.x = this.xOffset;
        lineSegments.position.y = this.yOffset;
        lineSegments.position.z = this.zOffset;
        this.group.add(lineSegments);

        //edge
        const planeGeometry = new THREE.PlaneGeometry(this.r, this.r);
        const planeEdges = new THREE.EdgesGeometry(planeGeometry);
        const glassMaterial = new THREE.LineBasicMaterial({
            color: 0x757575,
            transparent: true,
            opacity: 1,
            linewidth: 5
        });
        const glassPaneFrame = new THREE.LineSegments(planeEdges, glassMaterial);
        glassPaneFrame.position.set(this.xOffset, this.yOffset, this.zOffset + this.r / 2);
        glassPaneFrame.rotation.x = 0;
        this.group.add(glassPaneFrame);
    }

    createText() {
        const fontLoader = new FontLoader();
        fontLoader.load('./Roboto.json', (font) => {
            const textGeometry = new TextGeometry(this.text, {
                font: font,
                size: 5,
                height: 0.2,
            });
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0x757575, transparent: true, opacity: 1 });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(this.xOffset - 4 * this.r / 9, this.yOffset - 2 * this.r / 5, this.zOffset + this.r / 2);
            textMesh.rotation.x = 0;
            this.group.add(textMesh);
        });
    }

    updateMeshOpacity(opacity) {
        console.log("Updating mesh opacity to:", opacity);
        if (this.boxMeshMaterial) {
            this.boxMeshMaterial.opacity = opacity;
            this.boxMeshMaterial.needsUpdate = true;
        }
    }

    initLines() {
        const segments = this.maxParticleCount * this.maxParticleCount;
        this.positions = new Float32Array(segments * 3);
        this.colors = new Float32Array(segments * 3);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage));

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: false
        });

        this.linesMesh = new THREE.LineSegments(geometry, material);
        this.group.add(this.linesMesh);
    }

    updateLineOpacity(LineOpacity) {
        if (this.linesMesh) {
            const newMaterial = new THREE.LineBasicMaterial({
                vertexColors: true,
                transparent: true,
                opacity: LineOpacity
            });
            this.linesMesh.material.dispose();
            this.linesMesh.material = newMaterial;
        }
    }

    update(minDistance) {
        let vertexpos = 0;
        let colorpos = 0;
        let numConnected = 0;

        for (let i = 0; i < this.maxParticleCount; i++) {
            const particleData = this.particlesData[i];

            // 更新粒子位置
            this.particlePositions[i * 3] += particleData.velocity.x;
            this.particlePositions[i * 3 + 1] += particleData.velocity.y;
            this.particlePositions[i * 3 + 2] += particleData.velocity.z;

            // 边界检测和反转方向
            if (this.particlePositions[i * 3] < particleData.xMin || this.particlePositions[i * 3] > particleData.xMax) {
                particleData.velocity.x = -particleData.velocity.x;
            }
            if (this.particlePositions[i * 3 + 1] < this.yOffset - this.rHalf || this.particlePositions[i * 3 + 1] > this.yOffset + this.rHalf) {
                particleData.velocity.y = -particleData.velocity.y;
            }
            if (this.particlePositions[i * 3 + 2] < this.zOffset - this.rHalf || this.particlePositions[i * 3 + 2] > this.zOffset + this.rHalf) {
                particleData.velocity.z = -particleData.velocity.z;
            }

            particleData.numConnections = 0;

            for (let j = i + 1; j < this.maxParticleCount; j++) {
                const particleDataB = this.particlesData[j];
                if (particleData.numConnections >= 20 || particleDataB.numConnections >= 20)
                    continue;

                const dx = this.particlePositions[i * 3] - this.particlePositions[j * 3];
                const dy = this.particlePositions[i * 3 + 1] - this.particlePositions[j * 3 + 1];
                const dz = this.particlePositions[i * 3 + 2] - this.particlePositions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < minDistance) {
                    particleData.numConnections++;
                    particleDataB.numConnections++;

                    const alpha = 1.0 - dist / minDistance;

                    this.positions[vertexpos++] = this.particlePositions[i * 3];
                    this.positions[vertexpos++] = this.particlePositions[i * 3 + 1];
                    this.positions[vertexpos++] = this.particlePositions[i * 3 + 2];

                    this.positions[vertexpos++] = this.particlePositions[j * 3];
                    this.positions[vertexpos++] = this.particlePositions[j * 3 + 1];
                    this.positions[vertexpos++] = this.particlePositions[j * 3 + 2];

                    this.colors[colorpos++] = alpha;
                    this.colors[colorpos++] = alpha;
                    this.colors[colorpos++] = alpha;

                    this.colors[colorpos++] = alpha;
                    this.colors[colorpos++] = alpha;
                    this.colors[colorpos++] = alpha;

                    numConnected++;
                }
            }
        }
        this.particles.attributes.position.needsUpdate = true;
        this.linesMesh.geometry.setDrawRange(0, numConnected * 2);
        this.linesMesh.geometry.attributes.position.needsUpdate = true;
        this.linesMesh.geometry.attributes.color.needsUpdate = true;
    }

}

let container, stats;
let camera, scene, renderer;
let group;
let particleSystems = [];
let effectController = {
    minDistance: 80,
    lineOpacity: 0.5,
    meshOpacity: 0.1,
    distanceThreshold: 0
};

//储存位置
let boxMeshPositions = [];

function initGUI() {
    const gui = new GUI();

    gui.add(effectController, 'lineOpacity', 0, 1).onChange(function (value) {
        particleSystems.forEach(system => {
            system.updateLineOpacity(value);
        });
    });

    gui.add(effectController, 'meshOpacity', 0, 1).onChange(function (value) {
        particleSystems.forEach(system => {
            system.updateMeshOpacity(value);
        });
    });

    gui.add(effectController, 'distanceThreshold', 0, 500).onChange(function (value) {
        checkDistanceAndCreateLine(value);
    });
}




function init() {

    initGUI();

    const maxParticleCount = 4;
    const r = 80;

    //新办法
    const positions = [
        // { x: -980, z: 20, maxParticleCounts: 5, yCount: 8, texts: ["Verified 3 days ago", "Verified 3 days ago", "Verified 2 days ago", "Verified 2 days ago", "Verified 2 days ago", "Verified at 11:05", "Verified at 15:28", "Verified Now"] },
        // { x: -540, z: 600, maxParticleCounts: 4, yCount: 7, texts: ["Verified a week ago", "Verified 5 days ago", "Verified 4 days ago", "Verified 1 days ago", "Verified 1 days ago", "Verified 1 days ago", "Verified at 14:21",] },
        // { x: -400, z: -600, maxParticleCounts: 2, yCount: 2, texts: ["Verified a week ago", "Verified 3 days ago"] },
        // { x: -40, z: 500, maxParticleCounts: 3, yCount: 4, texts: ["Verified 5 days ago", "Verified 5 days ago", "Verified 3 days ago", "Verified 1 days ago"] },
        { x: 0, z: 0, maxParticleCounts: 4, yCount: 8, texts: ["Verified 6 days ago", "Verified 5 days ago", "Verified 2 days ago", "Verified 2 days ago", "Verified 1 days ago", "Verified 1 days ago", "Verified at 11:05", "Verified Now"] },
        // { x: 520, z: -360, maxParticleCounts: 5, yCount: 6, texts: ["Verified 6 days ago", "Verified 5 days ago", "Verified 2 days ago", "verified", "Verified 1 days ago", "Verified 1 days ago"] },
        // { x: 500, z: 800, maxParticleCounts: 2, yCount: 5, texts: ["Verified 6 days ago", "Verified 5 days ago", "Verified 2 days ago", "Verified 2 days ago", "Verified Now"] },
        // { x: 1000, z: 100, maxParticleCounts: 3, yCount: 7, texts: ["Verified 5 days ago", "Verified 5 days ago", "Verified 4 days ago", "Verified 4 days ago", "verified", "Verified at 12:10", "Verified Now"] }
    ];

    const yValues = [0, 80, 160, 240, 320, 400, 480];

    const baseTexts = ["Keystroke Motion", "Heart Beat", "Browing History", "Hand Motion", " Touch Gesture", "Linguistic Style", "Walking Style", "Speaking Rythm"];

    container = document.getElementById('container');

    // //OrthographicCamera
    // const aspect = window.innerWidth / window.innerHeight;
    // const d = 45;
    // camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 100000);

    //PerspectiveCamera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

    camera.position.z = 400;
    const controls = new OrbitControls(camera, container);

    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add(group);


    //     // 平面几何体作为背景
    //     const planeGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    //     const vertexShader = `
    //     varying vec2 vUv;
    //     void main() {
    //         vUv = uv;
    //         gl_Position = vec4(position, 1.0);
    //     }
    // `;
    //     const fragmentShader = `
    //     varying vec2 vUv;
    //     void main() {
    //         vec3 color1 = vec3(1, 1, 1); 
    //         vec3 color2 = vec3(1, 1, 1); 
    //         vec3 color3 = vec3(1, 1, 1); 
    //         float mixRatio = smoothstep(0.0, 1.0, vUv.y);
    //         vec3 color = mix(color1, color3, mixRatio);
    //         color = mix(color, color2, smoothstep(0.25, 0.75, vUv.y));
    //         gl_FragColor = vec4(color, 1.0);
    //     }
    // `;
    //     const material = new THREE.ShaderMaterial({
    //         vertexShader,
    //         fragmentShader
    //     });
    //     const plane = new THREE.Mesh(planeGeometry, material);
    //     plane.position.z = -10;
    //     scene.add(plane);
    //     plane.material.depthTest = false;


    positions.forEach((pos, index) => {
        const xOffset = pos.x;
        const zOffset = pos.z;
        const yCount = pos.yCount;
        const texts = pos.texts; // 文本的text
        const text = baseTexts[index] || ""; //base的text

        createBase(xOffset, -60, zOffset, group, text);

        for (let i = 0; i < yCount; i++) {
            const yOffset = i * r;
            const maxParticleCount = pos.maxParticleCounts;
            particleSystems.push(new ParticleSystem(maxParticleCount, xOffset, yOffset, zOffset, r, group, texts[i]));
            boxMeshPositions.push({ xOffset, yOffset, zOffset });
        }
    });

    checkDistanceAndCreateLine();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //背景颜色
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    // stats = new Stats();
    // container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);
}

function checkDistanceAndCreateLine() {
    let threshold = effectController.distanceThreshold;

    // 清除旧的连线
    let toRemove = [];
    scene.traverse((child) => {
        if (child instanceof THREE.Line) {
            toRemove.push(child);
        }
    });
    toRemove.forEach((child) => {
        scene.remove(child);
    });

    boxMeshPositions.forEach((positionA, i) => {
        boxMeshPositions.forEach((positionB, j) => {
            if (i !== j) {
                const dx = positionA.xOffset - positionB.xOffset;
                const dy = positionA.yOffset - positionB.yOffset;
                const dz = positionA.zOffset - positionB.zOffset;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (distance < threshold) {
                    createLine(positionA, positionB);
                }
            }
        });
    });
}


function createLine(positionA, positionB) {
    const material = new THREE.LineBasicMaterial({ color: 0xE30000, transparent: true, opacity: 0.6 });
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(positionA.xOffset, positionA.yOffset, positionA.zOffset),
        new THREE.Vector3(positionB.xOffset, positionB.yOffset, positionB.zOffset)
    ]);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
}

const vertexShader = `
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float time;
    void main() {
        vec3 color = vec3(sin(time) * 0.5 + 0.5, cos(time) * 0.5 + 0.5, 1.0);
        gl_FragColor = vec4(color, 1.0);
    }
`;

function createBase(x, y, z, group, text) {
    // 环形体
    const radius = 100;  // 圆环的主半径
    const tube = 0.1;    // 圆环的管半径
    const radialSegments = 32; // 圆环的段数
    const tubularSegments = 100; // 管的段数

    const torusGeometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    // const material = new THREE.ShaderMaterial({
    //     uniforms: {
    //         time: { value: 0 }
    //     },
    //     vertexShader: vertexShader,
    //     fragmentShader: fragmentShader
    // });
    const material = new THREE.MeshStandardMaterial({ color: 0x797979 });
    const torusMesh = new THREE.Mesh(torusGeometry, material);
    torusMesh.position.set(x, y, z);
    torusMesh.rotation.x = Math.PI / 2;
    group.add(torusMesh);

    const fontLoader = new FontLoader();
    fontLoader.load('./Open Sans_Regular.json', function (font) {
        const textGeometry = new TextGeometry(text, {
            font: font,
            size: 24,
            height: 0.6,
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x797979 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);

        textMesh.position.set(x + 60, y + 20, z);
        textMesh.rotation.x = -0.5 * Math.PI;
        group.add(textMesh);
    });
}


function animate() {
    requestAnimationFrame(animate);
    particleSystems.forEach(system => system.update(effectController.minDistance));

    render();
    stats.update();
}


function render() {
    renderer.render(scene, camera);
    //直接一步设置白色，不用plane
    renderer.setClearColor(0xffffff);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    checkDistanceAndCreateLine();
    renderer.setSize(0.5 * window.innerWidth, window.innerHeight);
}


init();
animate();