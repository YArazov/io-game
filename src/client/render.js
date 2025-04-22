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
const camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 1, 10000);
camera.position.z = 500;
const loader = new GLTFLoader();

//---------------------------
// === Lighting ===
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10);
scene.add(light);


//---------------------------
//load models using promises and then run animate function
let shipModel, asteroidModel, bulletModel;
let playerGroup, otherPlayersGroups, bulletsGroups, asteroidsGroups;


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
    loadGLB('/assets/asteroid.glb'),
    // loadGLB('/assets/bullet.glb')
  ]).then(([ship, asteroid, bullet]) => { //get the resolved values and assign them to the models
    shipModel = ship;
    asteroidModel = asteroid;
    // bulletModel = bullet;
  
    //---------------------------
    //initialize groups
    playerGroup = initGroup(shipModel, PLAYER_RADIUS);
    console.log(playerGroup);

    //---------------------------
    //NOW it's safe to start the animation loop
    window.addEventListener('resize', debounce(40, setCanvasDimensions));
    setCanvasDimensions();
    animationFrameRequestId = requestAnimationFrame(animate);
  });
}

// Replaces game rendering with main menu rendering.
function stopRendering() {
  cancelAnimationFrame(animationFrameRequestId);
  animationFrameRequestId = requestAnimationFrame(renderMainMenu);
}

function setCanvasDimensions() {
  // On small screens (e.g. phones), we want to "zoom out" so players can still see at least
  // 800 in-game units of width.
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

//loader
// const loadGLB = (url) => new Promise(resolve => {
//   loader.load(url, glb => resolve(glb.scene));
// });
function loadGLB(url) {
  return new Promise(resolve => {
    loader.load(url, glb => resolve(glb.scene));
  });
}

function initGroup(model, x, y=x, z=x) {
    const group = new THREE.Group();
    scene.add(group);
    const modelClone = model.clone();
    modelClone.scale.set(x, y, z);
    group.add(modelClone);
    return group;
}

function animate() {
  animationFrameRequestId = requestAnimationFrame(animate); // schedule the next frame
  updateSceneObjects();           // update positions, animations, game logic, etc.
  updateCamera();
  renderer.render(scene, camera); // draw current frame
}

function updateSceneObjects() {
  const { me, others, bullets, asteroids } = getCurrentState();
  updatePlayer(me.x, me.y, me.direction);
  // updateOtherPlayers();
  // updateBullets();
  // updateAsteroids();
}

function updatePlayer(x, y, direction) {
  playerGroup.position.set(x, y, 0);
  playerGroup.rotation.z = direction;
}

function updateCamera() {
  camera.position.x = playerGroup.position.x;
  camera.position.y = playerGroup.position.y;
  camera.lookAt(playerGroup.position); // Optional but helps in some setups
}

// function render() {
//   const { me, others, bullets, asteroids } = getCurrentState();
//   if (me) {
//     const screenOriginWorldXY = {
//       x:  me.x - canvas.width/2,
//       y: me.y - canvas.height/2,
//     };

//     // Draw background
//     const backgroundXY = transformXY({x: Constants.MAP_SIZE/2, y: Constants.MAP_SIZE/2}, screenOriginWorldXY);
//     renderBackground(backgroundXY.x, backgroundXY.y);

//     // Draw all bullets
//     bullets.forEach(b => {
//       renderBullet(b, screenOriginWorldXY);
//     });

//     // Draw asteroids
//     asteroids.forEach(o => {
//       renderAsteroid(o, screenOriginWorldXY);
//     }); 

//     // Draw all players
//     renderPlayer(me);
//     others.forEach(o => {
//       renderOther(o, screenOriginWorldXY);
//     });
//   }

//   // Rerun this render function on the next frame
//   animationFrameRequestId = requestAnimationFrame(render);
// }

// function renderBackground(x, y) {
//   const backgroundGradient = context.createRadialGradient(
//     x,
//     y,
//     MAP_SIZE / 10,
//     x,
//     y,
//     MAP_SIZE / 2,
//   );
//   backgroundGradient.addColorStop(0, 'black');
//   backgroundGradient.addColorStop(1, 'gray');
//   context.fillStyle = backgroundGradient;
//   context.fillRect(0, 0, canvas.width, canvas.height);

//   // Draw boundaries
//   context.strokeStyle = 'black';
//   context.lineWidth = 1;
//   context.strokeRect(x - MAP_SIZE/2, y - MAP_SIZE/2, MAP_SIZE, MAP_SIZE);
// }

// function renderPlayer(player) {
//   const x = canvas.width / 2, 
//       y = canvas.height / 2,
//       direction = player.direction;
//   drawShip(x, y, direction, player.accelerating);
//   renderHealthBar(x, y, PLAYER_RADIUS, player.hp, PLAYER_MAX_HP);  
// }

// function renderOther(other, origin) {
//   const { x, y } = transformXY(other, origin);
//   const direction = other.direction;
//   drawShip(x, y, direction, other.accelerating);
//   renderHealthBar(x, y, PLAYER_RADIUS, other.hp, PLAYER_MAX_HP);
// }

// function drawShip(x, y, direction, accelerating) {
//   context.save();
//   context.translate(x, y);
//   context.rotate(direction+Math.PI/2);
//   context.drawImage(
//     getAsset('ship.svg'),
//     -PLAYER_RADIUS,
//     -PLAYER_RADIUS,
//     PLAYER_RADIUS * 2,
//     PLAYER_RADIUS * 2,
//   );
//   context.restore();

//   if(accelerating) {
//     //thruster animation
//   }
// }



// function renderBullet(bullet, origin) {
//   const { x, y } = transformXY(bullet, origin);
//   context.drawImage(
//     getAsset('bullet.svg'),
//     x - BULLET_RADIUS,
//     y - BULLET_RADIUS,
//     BULLET_RADIUS * 2,
//     BULLET_RADIUS * 2,
//   );
// }

// function renderAsteroid(asteroid, origin) { //draws the asteroid at the correct position on the screen compared to the player
//   const { x, y } = transformXY(asteroid, origin);
//   const r = asteroid.r;
//   context.drawImage(
//     getAsset('asteroid.svg'),
//     x - r,
//     y - r,
//     r * 2,
//     r * 2,
//   );
//   renderHealthBar(x, y, r, asteroid.hp, Constants.ASTEROID_HP);
// }



//health bar function
// function renderHealthBar (canvasX, canvasY, radius, currentHP, maxHP) {
//   context.fillStyle = 'white';
//   context.fillRect(
//     canvasX - radius,
//     canvasY + radius + 8,
//     radius * 2,
//     2,
//   );
//   context.fillStyle = 'red';
//   context.fillRect(
//     canvasX - radius + radius * 2 * currentHP / maxHP,
//     canvasY + radius + 8,
//     radius * 2 * (1 - currentHP / maxHP),
//     2,
//   );
// }


export {startRendering, stopRendering};
