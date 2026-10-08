import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// 1. Scene, Camera, & Renderer Setup
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0d0e15, 0.03);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 2. OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 3. Lighting Setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x00f2fe, 2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

const pointLight = new THREE.PointLight(0xff007f, 3, 10);
pointLight.position.set(-3, 2, -2);
scene.add(pointLight);

// 4. Ground Plane (Lantai Berbayangan)
const floorGeo = new THREE.PlaneGeometry(20, 20);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x111522, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);

// 5. Background Particle System (Debu Melayang)
const particleGeo = new THREE.BufferGeometry();
const particleCount = 400;
const posArray = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particleMat = new THREE.PointsMaterial({
    size: 0.04,
    color: 0x4facfe,
    transparent: true,
    opacity: 0.8
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// 6. GLTF Model Loader
let loadedModel;
const loader = new GLTFLoader();
loader.load(
    '/model.glb', // Path file model 3D di folder public/
    (gltf) => {
        loadedModel = gltf.scene;
        loadedModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(loadedModel);
    },
    undefined,
    (error) => {
        console.warn('File model.glb belum ditemukan di folder public/. Menampilkan mesh pengganti...');
        // Cube placeholder jika model.glb belum ditaruh
        const cubeGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0x4facfe, roughness: 0.3 });
        loadedModel = new THREE.Mesh(cubeGeo, cubeMat);
        loadedModel.castShadow = true;
        scene.add(loadedModel);
    }
);

// 7. Raycaster (Hover Effect)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

// 8. Interaksi UI Button
document.getElementById('btn-front').addEventListener('click', () => {
    camera.position.set(0, 1, 5);
    controls.target.set(0, 0, 0);
});

document.getElementById('btn-top').addEventListener('click', () => {
    camera.position.set(0, 6, 0.1);
    controls.target.set(0, 0, 0);
});

document.getElementById('btn-side').addEventListener('click', () => {
    camera.position.set(5, 1, 0);
    controls.target.set(0, 0, 0);
});

let isAutoRotate = true;
document.getElementById('btn-rotate').addEventListener('click', () => {
    isAutoRotate = !isAutoRotate;
});

// 9. Window Resize Event
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 10. Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Auto Rotate Model
    if (loadedModel && isAutoRotate) {
        loadedModel.rotation.y += 0.005;
    }

    // Animasi Partikel
    particles.rotation.y += 0.0008;

    // Raycasting check
    raycaster.setFromCamera(mouse, camera);
    if (loadedModel) {
        const intersects = raycaster.intersectObject(loadedModel, true);
        if (intersects.length > 0) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();