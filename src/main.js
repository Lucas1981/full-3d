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
cube.position.z = -4; // 4 units in front of the camera

const camera = new Camera();
camera.position = [0, 0, 0];
camera.target   = [0, 0, -1]; // looking straight down −Z

function draw() {
  renderer.clear();
  renderer.drawMesh(cube, camera);
}

draw();
