import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';


const urlParams = new URLSearchParams(window.location.search);
const selectedDishId = urlParams.get('dish');

const menuScreen = document.getElementById('menu-screen');
const viewerScreen = document.getElementById('viewer-screen');

if (!selectedDishId) {
    
    menuScreen.classList.remove('hidden');
    viewerScreen.classList.add('hidden');

    fetch('./assets/dishes.json')
        .then(response => response.json())
        .then(dishes => {
            const grid = document.getElementById('dish-grid');
            dishes.forEach(dish => {
                const card = document.createElement('div');
                card.className = 'dish-card';
                card.innerHTML = `
                    <div class="card-image-container">
                        <img src="${dish.image}" alt="${dish.name}" class="dish-photo" loading="lazy">
                    </div>
                    <h2>${dish.name}</h2>
                    <div class="card-price">${dish.price}</div>
                    <div class="card-desc">${dish.description}</div>
                    <div class="btn-preview">View in real life</div>
                `;
                card.addEventListener('click', () => {

                    window.location.href = '?dish=' + dish.id;
                });
                grid.appendChild(card);
            });
        })
        .catch(err => {
            console.error("Failed to fetch menu list:", err);
            document.getElementById('dish-grid').innerHTML = `
                <p style="color:var(--primary); grid-column: 1/-1; text-align: center;">
                    Failed to load menu capabilities. Ensure assets/dishes.json is available via your web server.
                </p>`;
        });

} else {

    menuScreen.classList.add('hidden');
    viewerScreen.classList.remove('hidden');

    document.getElementById('back-to-menu-btn').addEventListener('click', () => {
        window.location.href = window.location.pathname;
    });

    fetch('./assets/dishes.json')
        .then(response => response.json())
        .then(dishes => {
            const currentDish = dishes.find(d => d.id === selectedDishId);
            if (!currentDish) {
                throw new Error("Specified Dish ID not found.");
            }
            populateAndLaunch3D(currentDish);
        }).catch(err => {
            console.error(err);
            document.getElementById('loading-overlay').innerHTML = `
            <p style='color: var(--primary); text-align: center; padding: 20px;'>
                Error starting visualization.<br>
                <span style='font-size: 0.8em; color: var(--text-dim)'>Failed to locate item parameters or JSON missing.</span>
            </p>`;
        });



    function populateAndLaunch3D(dishData) {
        document.getElementById('dish-name').innerText = dishData.name;
        document.getElementById('dish-price').innerText = dishData.price;
        document.getElementById('dish-calories').innerText = dishData.calories;
        document.getElementById('dish-description').innerText = dishData.description;

        const container = document.getElementById('canvas-container');

        const arAnchorGroup = new THREE.Group();
        const scene = new THREE.Scene();
        scene.add(arAnchorGroup);

        const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 1.5, 3.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 0, 0);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
        hemiLight.position.set(0, 2, 0);
        scene.add(hemiLight);

        document.getElementById('viewer-screen').appendChild(
            ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] })
        );

        const reticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const reticleMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add(reticle);

        let hitTestSource = null;
        let hitTestSourceRequested = false;


        const viewer = new GaussianSplats3D.DropInViewer({
            'dynamicScene': false,
            'sharedMemoryForWorkers': false, 
            'gpuAcceleratedSort': false
        });
        arAnchorGroup.add(viewer);

        let interactionMesh;
        const instructionOverlay = document.getElementById('instruction-overlay');
        const loadingOverlay = document.getElementById('loading-overlay');

        viewer.addSplatScene(`./assets/${dishData.file}`).then(() => {
            loadingOverlay.classList.remove('active');

            instructionOverlay.classList.add('visible');
            setTimeout(() => {
                instructionOverlay.classList.remove('visible');
            }, 4500);

            const geometry = new THREE.SphereGeometry(0.8, 32, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 0.0,
                depthWrite: false
            });
            interactionMesh = new THREE.Mesh(geometry, material);
            arAnchorGroup.add(interactionMesh);

        }).catch((error) => {
            console.error(error);
            loadingOverlay.innerHTML = `
                <p style='color: var(--primary); text-align: center; padding: 20px;'>
                    Failed to load splat.<br>
                    <span style='font-size: 0.8em; color: var(--text-dim)'>Ensure assets/${dishData.file} exists!</span>
                </p>`;
        });


        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const foodInfoPanel = document.getElementById('food-info-panel');

        function onPointerDown(event) {
            if (!interactionMesh) return;

            if (event.target.closest('.back-btn') || event.target.closest('#food-info-panel')) return;

            let clientX, clientY;
            if (event.changedTouches && event.changedTouches.length > 0) {
                clientX = event.changedTouches[0].clientX;
                clientY = event.changedTouches[0].clientY;
            } else {
                clientX = event.clientX;
                clientY = event.clientY;
            }

            pointer.x = (clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObject(interactionMesh);

            if (intersects.length > 0) {
                foodInfoPanel.classList.add('visible');
                instructionOverlay.classList.remove('visible');
            }
        }

        renderer.domElement.addEventListener('pointerdown', onPointerDown);

        document.getElementById('close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            foodInfoPanel.classList.remove('visible');
        });


        // --- AR Environment Controller Anchoring --- //
        function createARController() {
            const controller = renderer.xr.getController(0);
            controller.addEventListener('select', onSelectAR);
            scene.add(controller);
        }
        createARController();

        function onSelectAR() {
            if (reticle.visible) {
                arAnchorGroup.position.setFromMatrixPosition(reticle.matrix);
                arAnchorGroup.scale.set(0.6, 0.6, 0.6);
            }
        }


        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);


        renderer.setAnimationLoop((timestamp, frame) => {
            controls.update();

            if (renderer.xr.isPresenting && frame) {
                const referenceSpace = renderer.xr.getReferenceSpace();
                const session = renderer.xr.getSession();

                if (hitTestSourceRequested === false) {
                    session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                        session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                            hitTestSource = source;
                        });
                    });
                    session.addEventListener('end', function () {
                        hitTestSourceRequested = false;
                        hitTestSource = null;

                        arAnchorGroup.position.set(0, 0, 0);
                        arAnchorGroup.scale.set(1, 1, 1);
                    });
                    hitTestSourceRequested = true;
                }

                if (hitTestSource) {
                    const hitTestResults = frame.getHitTestResults(hitTestSource);
                    if (hitTestResults.length > 0) {
                        const hit = hitTestResults[0];
                        reticle.visible = true;
                        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                    } else {
                        reticle.visible = false;
                    }
                }
            } else {
                reticle.visible = false;
            }

            renderer.render(scene, camera);
        });
    }
}
