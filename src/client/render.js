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
// const light = new THREE.DirectionalLight(0xffffff, 0.3);
// light.position.set(10, 20, 10);
// scene.add(light);
const playerLight = new THREE.PointLight(0xffffff, 50000, 500); // white light, 500 units range
const spotlight = new THREE.SpotLight(0xffffff, 5000, 200, Math.PI /6, 1); // focused 30degrees narrow beam
spotlight.position.set(0, 0, 100); // Above the player
spotlight.target.position.set(0, 0, 0); // Point at player

//---------------------------
//load models using promises and then run animate function
let shipModel, asteroidModel;
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
    // shipModel.scale.setScalar(0.05);
    shipModel.rotation.x = -Math.PI/2;
    shipModel.rotation.z = Math.PI;
    shipModel.add(playerLight);
    asteroidModel = asteroid;
    // asteroidModel.scale.setScalar(0.3);

    //---------------------------
    //initialize groups
    const playerModel = shipModel.clone();
    playerGroup = initGroup(playerModel, Constants.PLAYER_RADIUS);
    playerGroup.add(spotlight);
    playerGroup.add(spotlight.target);

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
  emissive: 0x33ff33,
  emissiveIntensity: 1,
  });
  const plasmaShot = new THREE.Mesh(geometry, material);

  // Optional: glow effect
  const light = new THREE.PointLight(0x33ff33, 10000, 1000);
  plasmaShot.add(light);

  return plasmaShot;
}

// function scaledModel(model, radius) {
//   const boundingSphere = new THREE.Sphere();
//   const box = new THREE.Box3().setFromObject(model);
//   box.getBoundingSphere(boundingSphere);
//   const currentRadius = boundingSphere.radius;

//   const scaleFactor = radius / currentRadius;
//   model.scale.setScalar(scaleFactor);
//   return model;
// }

function scaledModel(model, targetRadius) {
    // Clone again to avoid modifying the original (optional)
    const modelClone = model.clone(true);

    // Compute bounding box
    const box = new THREE.Box3().setFromObject(modelClone);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Approximate radius: half of bounding box diagonal
    const currentRadius = size.length() / 2;

    // Avoid division by zero
    if (currentRadius === 0) {
        console.warn("Model has zero radius. Skipping scaling.");
        return modelClone;
    }

    // Center the model to origin based on its bounding box center
    const center = new THREE.Vector3();
    box.getCenter(center);
    modelClone.position.sub(center);  // recenters the model geometry to (0,0,0)

    // Uniform scale factor to match the target radius
    const scaleFactor = targetRadius / currentRadius;
    modelClone.scale.setScalar(scaleFactor);

    return modelClone;
}

function initGroup(model, radius) {
    const group = new THREE.Group();
    scene.add(group);
    const modelClone = model.clone();
    //scale the model
    const sModel = scaledModel(modelClone, radius);
    group.add(sModel);
    return group;
}

function updateGroupList(stateList, targetList, model) {
  for (let i=0; i<stateList.length; i++) {
    const stateObject = stateList[i];
    const group = initGroup(model, stateObject.r);
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
