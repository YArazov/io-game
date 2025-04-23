// Learn more about this file at:
// https://victorzhou.com/blog/build-an-io-game-part-1/#5-client-rendering
import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState } from './state';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const Constants = require('../shared/constants');

const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE } = Constants;

//start rendering the menu
let animationFrameRequestId;
animationFrameRequestId = requestAnimationFrame(renderMainMenu);

//---------------------------
//Get the canvas graphics context and initialize scene and renderer
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const scene = new THREE.Scene();
addMapBorder();

const frustumHeight = 800;
let aspect = window.innerWidth / window.innerHeight;
let camera = new THREE.OrthographicCamera(
  -aspect * frustumHeight / 2,   // left
  aspect * frustumHeight / 2,   // right
  frustumHeight / 2,            // top
  -frustumHeight / 2,            // bottom
  0.1,                           // near
  1000                           // far
);
camera.position.z = 500;
const loader = new GLTFLoader();

//---------------------------
// === Lighting ===
// const light = new THREE.DirectionalLight(0xffffff, 1);
// light.position.set(10, 20, 10);
// scene.add(light);
const playerLight = new THREE.PointLight(0xffffff, 10000, 800); // white light, 800 units range
const light = new THREE.SpotLight(0xffffff, 2, 400, Math.PI / 6, 0.5);
light.position.set(0, 0, 100);
light.target.position.set(0, 0, 0);

//---------------------------
//load models using promises and then run animate function
let shipModel, asteroidModel, bulletModel;
let playerGroup, otherPlayersGroups =[], bulletsGroups =[], asteroidsGroups =[];
const plasmaShot = createPlasmaShot();

//---------------------------
//functions
function renderMainMenu() {
  
  // const t = Date.now() / 7500;
  // const x = MAP_SIZE / 2 + 800 * Math.cos(t);
  // const y = MAP_SIZE / 2 + 800 * Math.sin(t);
  // renderBackground(x, y);

  // Rerun this render function on the next frame
  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

// Replaces menu rendering with game rendering
function startRendering() {
  cancelAnimationFrame(animationFrameRequestId);

  Promise.all([
    loadGLB('/assets/space-ship.glb'),  //run the load function for each asset
    loadGLB('/assets/asteroid1.glb'),
  ]).then(([ship, asteroid]) => { //get the resolved values and assign them to the models
    shipModel = ship;
    shipModel.scale.setScalar(0.05);
    shipModel.rotation.x = -Math.PI/2;
    shipModel.rotation.z = Math.PI;
    shipModel.add(playerLight);
    // shipModel.add(light);
    // shipModel.add(light.target);
    asteroidModel = asteroid;
    asteroidModel.scale.setScalar(0.3);

    //---------------------------
    //initialize groups
    playerGroup = initGroup(shipModel);
    playerGroup.add(light);
    playerGroup.add(light.target);
    //---------------------------
    //NOW it's safe to start the animation loop
    window.addEventListener('resize', debounce(40, setCanvasDimensions));
    setCanvasDimensions();
    animationFrameRequestId = requestAnimationFrame(animate);
  });
}

// Replaces game rendering with main menu rendering.
function stopRendering() {
  clearGroups();
  scene.remove(playerGroup);
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

function setCanvasDimensions() {
  // On small screens (e.g. phones), we want to "zoom out" so players can still see at least
  // 800 in-game units of width.
  aspect = window.innerWidth / window.innerHeight;
  camera.left = -aspect * frustumHeight / 2;
  camera.right = aspect * frustumHeight / 2;
  camera.top = frustumHeight / 2;
  camera.bottom = -frustumHeight / 2;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function loadGLB(url) {
  return new Promise(resolve => {
    loader.load(url, glb => resolve(glb.scene));
  });
}

function addMapBorder(size = MAP_SIZE) {
  // Create the map border box
  const mapBoxGeometry = new THREE.BoxGeometry(size, size, 1);
  const mapBoxMaterial = new THREE.LineBasicMaterial({ color: 0x808080 });
  const mapBox = new THREE.LineSegments(new THREE.EdgesGeometry(mapBoxGeometry), mapBoxMaterial);

  // Make sure it is centered at 0,0,0
  mapBox.position.set(size/2, size/2, 0);

  // Add the map box to the scene
  scene.add(mapBox);
}

function createPlasmaShot() {
  const geometry = new THREE.SphereGeometry(5, 16, 16);
  const material = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x00ffff,
  emissiveIntensity: 100,
  });
  const plasmaShot = new THREE.Mesh(geometry, material);

  // Optional: glow effect
  const light = new THREE.PointLight(0x00ffff, 10000, 1000);
  plasmaShot.add(light);

  return plasmaShot;
}

function initGroup(model) {
    const group = new THREE.Group();
    scene.add(group);
    const modelClone = model.clone();
    group.add(modelClone);
    return group;
}

function updateGroupList(stateList, targetList, model) {
  for (let i=0; i<stateList.length; i++) {
    const stateObject = stateList[i];
    const group = initGroup(model);
    targetList.push(group);
    //update the x, y, direction
    updateObject(group, stateObject.x, stateObject.y, stateObject.direction);
  }
}

function animate() {
  animationFrameRequestId = requestAnimationFrame(animate); // schedule the next frame
  updateSceneObjects();           // update positions, animations, game logic, etc.
  updateCamera();
  renderer.render(scene, camera); // draw current frame
}

function updateSceneObjects() {
  const { me, others, bullets, asteroids } = getCurrentState();
  clearGroups();
  updateGroupList(others, otherPlayersGroups, shipModel);
  updateGroupList(asteroids, asteroidsGroups, asteroidModel);
  updateGroupList(bullets, bulletsGroups, plasmaShot);
  updateObject(playerGroup, me.x, me.y, me.direction);
  // console.log(scene.children);
}

function clearGroups() {
  otherPlayersGroups.forEach(group => scene.remove(group));
  bulletsGroups.forEach(group => scene.remove(group));
  asteroidsGroups.forEach(group => scene.remove(group));

  otherPlayersGroups = [];
  bulletsGroups = [];
  asteroidsGroups = [];
}

function updateObject(group, x, y, direction) {
  group.position.set(x, y, 0);
  group.rotation.z = -direction;
}

function updateCamera() {
  camera.position.x = playerGroup.position.x;
  camera.position.y = playerGroup.position.y;
  // camera.lookAt(playerGroup.position); // Optional but helps in some setups
  // camera.lookAt(0, 0, 0);
}

export {startRendering, stopRendering};
