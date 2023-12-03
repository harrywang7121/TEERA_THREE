import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let group;
let container;
let camera, scene, renderer;

const r = 80;

function init() {
    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 500;

    new OrbitControls(camera, container);

    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add(group);

    createBoxMesh(r, 0, true);
    createBoxMesh(r, 60, false);
    createBoxMesh(r, -60, true);
    createBoxMesh(r, 120, true);
    createBoxMesh(r, -120, true);
    createBoxMesh(r, 180, true);
    createBoxMesh(r, -180, true);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x364F3D, 1);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
animate();
