import { Mesh }     from './mesh.js';
import { Renderer } from './renderer.js';
import { Camera }   from './camera.js';
import { DirectionalLight } from './lights/directional-light.js';
import cubeData     from './assets/cube.json';

const canvas   = document.getElementById('canvas');
const renderer = new Renderer(canvas);

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);

const cube = new Mesh(cubeData);
cube.position.z = -4;

const cubeCenter = [cube.position.x, cube.position.y, cube.position.z];

const viewDistance = 4;
const orbitY = Math.PI / 4;
const camera = new Camera();
camera.position = [
  cubeCenter[0] + viewDistance * Math.sin(orbitY),
  cubeCenter[1],
  cubeCenter[2] + viewDistance * Math.cos(orbitY),
];
camera.target = [...cubeCenter];

// Light at origin, shining toward the cube (−Z)
const lights = [
  new DirectionalLight({
    direction: [0, 0, -1],
    color: [255, 255, 255],
    intensity: 0.85,
  }),
];

const ROTATION_SPEED = 0.8; // radians per second around Y
let lastTime = performance.now();

function frame(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  cube.rotation.y += ROTATION_SPEED * dt;

  renderer.clear();
  renderer.render(cube, camera, lights);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
