import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ParticleSystem {

    constructor(maxParticleCount, xOffset, yOffset, zOffset, r, group) {
        this.maxParticleCount = maxParticleCount;
        this.particlesData = [];
        this.particlePositions = new Float32Array(maxParticleCount * 3);
        this.r = r;
        this.rHalf = r / 2;
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.zOffset = zOffset;
        this.group = group;
        this.initParticles();
        this.createParticles();
        this.createBoxMesh();
    }

    //初始坐标，初速度，偏移
    initParticles() {
        for (let i = 0; i < this.maxParticleCount; i++) {
            const x = this.xOffset + (Math.random() * this.r - this.rHalf);
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
        //粒子性质
        const pMaterial = new THREE.PointsMaterial({
            color: 0xFF09E6,
            size: 3,
            transparent: false,
            sizeAttenuation: false
        });

        //renderer相关
        this.particles = new THREE.BufferGeometry();
        this.particles.setDrawRange(0, this.maxParticleCount);
        this.particles.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3).setUsage(THREE.DynamicDrawUsage));
        this.pointCloud = new THREE.Points(this.particles, pMaterial);
        this.group.add(this.pointCloud);
    }

    createBoxMesh() {
        const boxGeometry = new THREE.BoxGeometry(this.r, 0.5 * this.r, this.r);
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xEAEAEA,
        });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        lineSegments.position.x = this.xOffset
        lineSegments.position.y = this.yOffset;
        lineSegments.position.z = this.zOffset;
        this.group.add(lineSegments);
    }

    update() {
        for (let i = 0; i < this.maxParticleCount; i++) {
            const particleData = this.particlesData[i];

            this.particlePositions[i * 3] += particleData.velocity.x;
            this.particlePositions[i * 3 + 1] += particleData.velocity.y;
            this.particlePositions[i * 3 + 2] += particleData.velocity.z;

            // 碰撞检测
            if (this.particlePositions[i * 3] < this.xOffset - this.rHalf || this.particlePositions[i * 3] > this.xOffset + this.rHalf) {
                particleData.velocity.x = -particleData.velocity.x;
            }
            if (this.particlePositions[i * 3 + 1] < this.yOffset - 0.25 * this.r || this.particlePositions[i * 3 + 1] > this.yOffset + 0.25 * this.r) {
                particleData.velocity.y = -particleData.velocity.y;
            }
            if (this.particlePositions[i * 3 + 2] < this.zOffset - this.rHalf || this.particlePositions[i * 3 + 2] > this.zOffset + this.rHalf) {
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
    const maxParticleCount = 4;
    const r = 80;
    const xOffsets = [0, -80, -160, -240, -320];
    const yOffsets = [0, -40, -80, -120, -160, -200, -240, -280];
    const zOffsets = [0, -80, -160, -240, -320];

    container = document.getElementById('container');

    //相机设置
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 9000);
    camera.position.z = 500;
    const controls = new OrbitControls(camera, container);

    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add(group);

    xOffsets.forEach(xOffset => {
        yOffsets.forEach(yOffset => {
            zOffsets.forEach(zOffset => {
                particleSystems.push(new ParticleSystem(maxParticleCount, xOffset, yOffset, zOffset, r, group));
            });
        });
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
