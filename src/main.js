import { Mesh }     from './mesh.js';
import { Renderer } from './renderer.js';
import { Camera }   from './camera.js';
import { PointLight } from './lights/point-light.js';
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

const directionalLight = new DirectionalLight({
  direction: [0, 0, -1],
  color: [255, 255, 255],
  intensity: 0.85,
});

const pointLight = new PointLight({
  position: [3, cubeCenter[1] + 2.5, cubeCenter[2]],
  color: [255, 240, 220],
  intensity: 1.4,
});

const lights = [directionalLight, pointLight];

const CUBE_ROTATION_SPEED = 0.8;
const LIGHT_ORBIT_RADIUS  = 3.5;
const LIGHT_ORBIT_HEIGHT  = 2.5; // above cube center (cube half-extent is 1)
const LIGHT_ORBIT_SPEED   = CUBE_ROTATION_SPEED * 3;

let orbitAngle = 0;
let lastTime = performance.now();

function frame(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  cube.rotation.y += CUBE_ROTATION_SPEED * dt;
  orbitAngle += LIGHT_ORBIT_SPEED * dt;

  pointLight.position[0] = cubeCenter[0] + LIGHT_ORBIT_RADIUS * Math.sin(orbitAngle);
  pointLight.position[1] = cubeCenter[1] + LIGHT_ORBIT_HEIGHT;
  pointLight.position[2] = cubeCenter[2] + LIGHT_ORBIT_RADIUS * Math.cos(orbitAngle);

  renderer.clear();
  renderer.render(cube, camera, lights);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
