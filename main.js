import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. SCENE & CAMERA SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f111a);
scene.fog = new THREE.FogExp2(0x0f111a, 0.03);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 2, 5);

// 2. RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 3. CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.01;

// 4. LIGHTING SYSTEM
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 3);
mainLight.position.set(5, 8, 5);
mainLight.castShadow = true;
scene.add(mainLight);

// Lampu Sorot Depan Mobil (Headlights)
const headlightLeft = new THREE.SpotLight(0xffffff, 0, 15, Math.PI / 8, 0.5);
headlightLeft.position.set(-0.6, 0.6, 1.8);
const headlightRight = headlightLeft.clone();
headlightRight.position.x = 0.6;

const headlightTarget = new THREE.Object3D();
headlightTarget.position.set(0, 0, 10);
scene.add(headlightTarget);

headlightLeft.target = headlightTarget;
headlightRight.target = headlightTarget;
scene.add(headlightLeft, headlightRight);

// 5. ENVIRONMENT & FLOOR
const gridHelper = new THREE.GridHelper(30, 30, 0x00f0ff, 0x222233);
gridHelper.position.y = -0.01;
scene.add(gridHelper);

const floorGeo = new THREE.PlaneGeometry(50, 50);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0c14, roughness: 0.2, metalness: 0.5 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// 6. MODEL LOADING & CAR COLOR CONTROL
let carModel = null;
let carBodyMaterials = [];
const carContainer = new THREE.Group();
scene.add(carContainer);

const loader = new GLTFLoader();
loader.load(
    '/mclaren_spider.glb',
    (gltf) => {
        carModel = gltf.scene;

        carModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material && child.material.name.toLowerCase().includes('body')) {
                    carBodyMaterials.push(child.material);
                }
            }
        });

        const box = new THREE.Box3().setFromObject(carModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 3 / Math.max(size.x, size.y, size.z);

        carModel.scale.setScalar(scale);
        carModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        carContainer.add(carModel);
    },
    undefined,
    (error) => console.error('Gagal memuat model:', error)
);

// 7. INTERACTIVE UI & CONTROLS
let isRotating = false;
let headlightsOn = false;

const style = document.createElement('style');
style.innerHTML = `
  .ui-container { position: absolute; top: 20px; left: 20px; z-index: 10; display: flex; flex-direction: column; gap: 10px; font-family: sans-serif; }
  .btn-group { display: flex; gap: 8px; }
  .ui-btn { background: rgba(15, 17, 26, 0.8); color: white; border: 1px solid #00f0ff; padding: 8px 12px; border-radius: 6px; cursor: pointer; backdrop-filter: blur(5px); }
  .ui-btn:hover { background: #00f0ff; color: #000; }
  .color-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; cursor: pointer; }
`;
document.head.appendChild(style);

const ui = document.createElement('div');
ui.className = 'ui-container';
ui.innerHTML = `
  <div class="btn-group">
    <button class="ui-btn" id="btn-rotate">Toggle Auto-Rotate</button>
    <button class="ui-btn" id="btn-light">Lampu Depan</button>
  </div>
  <div class="btn-group">
    <button class="color-btn" style="background:#ff0000" data-color="0xff0000"></button>
    <button class="color-btn" style="background:#00f0ff" data-color="0x00f0ff"></button>
    <button class="color-btn" style="background:#ffaa00" data-color="0xffaa00"></button>
    <button class="color-btn" style="background:#ffffff" data-color="0xffffff"></button>
  </div>
`;
document.body.appendChild(ui);

document.getElementById('btn-rotate').addEventListener('click', () => { isRotating = !isRotating; });

document.getElementById('btn-light').addEventListener('click', () => {
    headlightsOn = !headlightsOn;
    const intensity = headlightsOn ? 10 : 0;
    headlightLeft.intensity = intensity;
    headlightRight.intensity = intensity;
});

document.querySelectorAll('.color-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
        const hexColor = parseInt(e.target.dataset.color);
        carBodyMaterials.forEach((mat) => mat.color.setHex(hexColor));
    });
});

// 8. ANIMATION LOOP
function animate() {
    requestAnimationFrame(animate);

    if (isRotating && carContainer) {
        carContainer.rotation.y += 0.005;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

// 9. RESPONSIVE WINDOW
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});