import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ParticleSystem 类
class ParticleSystem {
    constructor(maxParticleCount, yOffset, zOffset, r, scene, group) {
        this.maxParticleCount = maxParticleCount;
        this.particlesData = [];
        this.particlePositions = new Float32Array(maxParticleCount * 3);
        this.r = r;
        this.rHalf = r / 2;
        this.scene = scene;
        this.group = group;
        this.initParticles(yOffset, zOffset);
        this.createParticles();
    }

    initParticles(yOffset, zOffset) {
        for (let i = 0; i < this.maxParticleCount; i++) {
            const x = Math.random() * this.r - this.rHalf;
            const y = yOffset + (Math.random() * 0.5 * this.r - 0.25 * this.r);
            const z = zOffset + (Math.random() * this.r - this.rHalf);

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

    update() {
        for (let i = 0; i < this.maxParticleCount; i++) {
            const particleData = this.particlesData[i];

            // 更新粒子位置
            this.particlePositions[i * 3] += particleData.velocity.x;
            this.particlePositions[i * 3 + 1] += particleData.velocity.y;
            this.particlePositions[i * 3 + 2] += particleData.velocity.z;

            // 碰撞检测和边界处理
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

        // 更新粒子几何体的位置信息
        this.particles.attributes.position.needsUpdate = true;
    }
}

// 主程序
let container, stats;
let camera, scene, renderer;
let group;
let effectController;
let particleSystems = [];

function init() {
    // 设置 offset
    const offsets = [-60, -120, -180, -240];
    const maxParticleCount = 20;
    const r = 80;

    // 初始化摄像机、控制器、场景、组
    container = document.getElementById('container');
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 500;
    const controls = new OrbitControls(camera, container);
    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add(group);

    // 创建粒子系统
    offsets.forEach(offset => {
        particleSystems.push(new ParticleSystem(maxParticleCount, offset, 0, r, scene, group));
    });

    // 初始化渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x364F3D, 1);
    container.appendChild(renderer.domElement);

    // 性能监视
    stats = new Stats();
    container.appendChild(stats.dom);

    // 窗口尺寸调整事件
    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);

    // 更新每个粒子系统
    particleSystems.forEach(system => system.update(effectController));

    // 渲染
    render();

    // 更新性能监视器
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

// 初始化并开始动画循环
init();
animate();
