import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';  //性能监控
// import { GUI } from 'three/addons/libs/lil-gui.module.min.js';  //实时调参
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';  //实时拖动


let group;
let container, stats;
const particlesData = [];
let camera, scene, renderer;
let positions, colors;
let particles;
let pointCloud;
let particlePositions;
let linesMesh;

const maxParticleCount = 20;
let particleCount = 4;
const r = 80;
const rHalf = r / 2;

const effectController = {
    showDots: true,
    showLines: true,
    minDistance: 150,
    limitConnections: false,
    maxConnections: 20,
    particleCount: 500
};


// function initGUI() {

//     const gui = new GUI();

//     gui.add(effectController, 'showDots').onChange(function (value) {

//         pointCloud.visible = value;

//     });
//     gui.add(effectController, 'showLines').onChange(function (value) {

//         linesMesh.visible = value;

//     });
//     gui.add(effectController, 'minDistance', 10, 300);
//     gui.add(effectController, 'limitConnections');
//     gui.add(effectController, 'maxConnections', 0, 30, 1);
//     gui.add(effectController, 'particleCount', 0, maxParticleCount, 1).onChange(function (value) {

//         particleCount = value;
//         particles.setDrawRange(0, particleCount);

//     });

// }


function init() {

    //设置offset
    let offset1 = -60;
    let offset2 = -120;
    let offset3 = -180;
    let offset4 = -240;

    // initGUI();

    container = document.getElementById('container');

    //摄像机位置及orbit控制
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 500;
    console.log(camera.position);

    const controls = new OrbitControls(camera, container);
    controls.minDistance = 200;
    controls.maxDistance = 1000;

    scene = new THREE.Scene();

    group = new THREE.Group();
    scene.add(group);

    //正方形边框显示
    createBoxMesh(r, 0, 0, true);
    createBoxMesh(r, offset1, 0, true);
    createBoxMesh(r, offset2, 0, true);
    createBoxMesh(r, offset3, 0, true);
    createBoxMesh(r, offset4, 0, true);
    createBoxMesh(r, 0, offset2, true);

    const segments = maxParticleCount * maxParticleCount;

    positions = new Float32Array(segments * 3);
    colors = new Float32Array(segments * 3);

    //单个粒子性质
    const pMaterial = new THREE.PointsMaterial({
        color: 0xFF09E6,
        size: 4,
        //blending: THREE.AdditiveBlending,
        transparent: false,
        sizeAttenuation: false
    });

    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array(maxParticleCount * 3);


    //粒子初识位置，范围内随机生成
    initParticles(offset4, 0);
    initParticles(offset3, 0);

    particles.setDrawRange(0, particleCount);
    particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));

    // create the particle system
    pointCloud = new THREE.Points(particles, pMaterial);
    group.add(pointCloud);

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));


    //连线材质属性
    const material = new THREE.LineBasicMaterial({
        //vertexColors: true,
        //blending: THREE.AdditiveBlending,
        color: 0xFF75F1,
        transparent: false
    });
    linesMesh = new THREE.LineSegments(geometry, material);
    group.add(linesMesh);


    //renderer设置
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x364F3D, 1);

    container.appendChild(renderer.domElement);


    //性能监视
    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

}


function initParticles(yOffset, zOffset) {
    for (let i = 0; i < maxParticleCount; i++) {
        // Generate initial coordinates with offsets
        const x = Math.random() * r - r / 2;
        const y = yOffset + (Math.random() * 0.5 * r - 0.5 * r / 2);
        const z = zOffset + (Math.random() * r - r / 2);

        // Store in the array
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        // Set initial velocity and numConnections, update particlesData
        particlesData.push({
            velocity: new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2, -1 + Math.random() * 2),
            numConnections: 0
        });
    }
}


function createBoxMesh(R, yOffset, zOffset, withEdge) {

    let r = R;

    const boxGeometry = new THREE.BoxGeometry(r, 0.5 * r, r);
    const boxMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
    const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);

    boxMesh.position.y = yOffset;
    group.add(boxMesh);

    if (withEdge) {
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xEAEAEA });
        const lineSegments = new THREE.LineSegments(edges, lineMaterial);
        lineSegments.position.y = yOffset;
        lineSegments.position.z = zOffset;
        group.add(lineSegments);
    }
}


function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}


function animate() {

    let vertexpos = 0;
    let colorpos = 0;
    let numConnected = 0;

    for (let i = 0; i < particleCount; i++)
        particlesData[i].numConnections = 0;

    for (let i = 0; i < particleCount; i++) {

        // get the particle
        const particleData = particlesData[i];
        //分配初始速度
        particlePositions[i * 3] += particleData.velocity.x;
        particlePositions[i * 3 + 1] += particleData.velocity.y;
        particlePositions[i * 3 + 2] += particleData.velocity.z;

        // Update boundary checks to match the box dimensions
        if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf) {
            particleData.velocity.x = -particleData.velocity.x;
        }
        if (particlePositions[i * 3 + 1] < -0.25 * r || particlePositions[i * 3 + 1] > 0.25 * r) {
            particleData.velocity.y = -particleData.velocity.y;
        }
        if (particlePositions[i * 3 + 2] < -rHalf || particlePositions[i * 3 + 2] > rHalf) {
            particleData.velocity.z = -particleData.velocity.z;
        }

        // Check collision
        for (let j = i + 1; j < particleCount; j++) {

            const particleDataB = particlesData[j];
            if (effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections)
                continue;

            const dx = particlePositions[i * 3] - particlePositions[j * 3];
            const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
            const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < effectController.minDistance) {

                particleData.numConnections++;
                particleDataB.numConnections++;

                const alpha = 1.0 - dist / effectController.minDistance;

                positions[vertexpos++] = particlePositions[i * 3];
                positions[vertexpos++] = particlePositions[i * 3 + 1];
                positions[vertexpos++] = particlePositions[i * 3 + 2];

                positions[vertexpos++] = particlePositions[j * 3];
                positions[vertexpos++] = particlePositions[j * 3 + 1];
                positions[vertexpos++] = particlePositions[j * 3 + 2];

                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;

                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;
                colors[colorpos++] = alpha;

                numConnected++;

            }

        }

    }


    linesMesh.geometry.setDrawRange(0, numConnected * 2);
    linesMesh.geometry.attributes.position.needsUpdate = true;
    linesMesh.geometry.attributes.color.needsUpdate = true;

    pointCloud.geometry.attributes.position.needsUpdate = true;

    requestAnimationFrame(animate);

    stats.update();
    render();

}

function render() {

    const time = Date.now() * 0.001;

    group.rotation.y = time * 0.1;
    renderer.render(scene, camera);

}

init();
animate();