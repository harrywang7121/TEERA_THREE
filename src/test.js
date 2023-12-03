import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ParticleSystem {
    constructor(maxParticleCount, yOffset, zOffset, r, group) {
        this.maxParticleCount = maxParticleCount;
        this.particlesData = [];
        this.particlePositions = new Float32Array(maxParticleCount * 3);
        this.r = r;
        this.rHalf = r / 2;
        this.yOffset = yOffset;
        this.zOffset = zOffset;
        this.group = group;
        this.initParticles();
        this.createParticles();
        this.createBoxMesh();
    }

    initParticles() {
        for (let i = 0; i < this.maxParticleCount; i++) {
            const x = Math.random() * this.r - this.rHalf;
            const y = this.yOffset + (Math.random() * 0.5 * this.r - 0.25 * this.r);
            const z = this.zOffset + (Math.random() * this.r - this.rHalf);

            this.particlePositions[i * 3] = x;
            this.particlePositions[i * 3 + 1] = y;
            this.particlePositions[i * 3 + 2] = z;

            this.particlesData.push({
                velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
                numConnections: 0
            });
        }
    }

    createParticles() {
        const pMaterial = new THREE.PointsMaterial({
            color: 0xFF09E6,
            size: 4,
            transparent: false,
            sizeAttenuation: false
        });

        this.particles = new THREE.BufferGeometry();
        this.particles.setDrawRange(0, this.maxParticleCount);
        this.particles.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3).setUsage(THREE.DynamicDrawUsage));

        this.pointCloud = new THREE.Points(this.particles, pMaterial);
        this.group.add(this.pointCloud);
    }

    createBoxMesh() {
        const boxGeometry = new THREE.BoxGeometry(this.r, 0.5 * this.r, this.r);
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xEAEAEA });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        lineSegments.position.y = this.yOffset;
        lineSegments.position.z = this.zOffset;
        this.group.add(lineSegments);
    }

    update() {
        for (let i = 0; i < this.maxParticleCount; i++) {
            const particleData = this.particlesData[i];

            // Update particle position
            this.particlePositions[i * 3] += particleData.velocity.x;
            this.particlePositions[i * 3 + 1] += particleData.velocity.y;
            this.particlePositions[i * 3 + 2] += particleData.velocity.z;

            // Boundary detection and handling
            if (this.particlePositions[i * 3] < -this.rHalf || this.particlePositions[i * 3] > this.rHalf) {
                particleData.velocity.x = -particleData.velocity.x;
            }
            if (this.particlePositions[i * 3 + 1] < -0.25 * this.r || this.particlePositions[i * 3 + 1] > 0.25 * this.r) {
                particleData.velocity.y = -particleData.velocity.y;
            }
            if (this.particlePositions[i * 3 + 2] < -this.rHalf || this.particlePositions[i * 3 + 2] > this.rHalf) {
                particleData.velocity.z = -particleData.velocity.z;
            }
        }

        this.particles.attributes.position.needsUpdate = true;
    }
}

let container, stats;
let camera, scene, renderer;
let group;
let particleSystems = [];

function init() {
    const offsets = [-60, -120, -180, -240];
    const maxParticleCount = 20;
    const r = 80;

    container = document.getElementById('container');
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 500;
    const controls = new OrbitControls(camera, container);
    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add(group);

    offsets.forEach(offset => {
        particleSystems.push(new ParticleSystem(maxParticleCount, offset, 0, r, group));
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x364F3D, 1);
    container.appendChild(renderer.domElement);

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);

    particleSystems.forEach(system => system.update());

    render();

    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
