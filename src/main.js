import { Mesh }     from './mesh.js';
import { Renderer } from './renderer.js';
import { Camera }   from './camera.js';
import cubeData     from './assets/cube.json';

const canvas   = document.getElementById('canvas');
const renderer = new Renderer(canvas);

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', () => { resize(); draw(); });

const cube = new Mesh(cubeData);
cube.position.z = -4;

const cubeCenter = [cube.position.x, cube.position.y, cube.position.z];

// 45° orbit around Y: corner view — two faces visible with backface culling
const viewDistance = 4;
const orbitY = Math.PI / 4;
const camera = new Camera();
camera.position = [
  cubeCenter[0] + viewDistance * Math.sin(orbitY),
  cubeCenter[1],
  cubeCenter[2] + viewDistance * Math.cos(orbitY),
];
camera.target = [...cubeCenter];

function draw() {
  renderer.clear();
  renderer.drawMesh(cube, camera);
}

draw();
