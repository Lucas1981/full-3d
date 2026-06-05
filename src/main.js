import { Mesh } from "./scene/mesh.js";
import { Renderer } from "./rendering/renderer.js";
import { Camera } from "./scene/camera.js";
import squareData from "./assets/square.json";
import { preloadTextures } from "./textures/texture-cache.js";

const DEGREES_PER_SECOND = 36;
const ROCK_AMPLITUDE = 5;

const canvas = document.getElementById("canvas");
const renderer = new Renderer(canvas);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

const square = new Mesh(squareData);
const meshes = [square];

const camera = new Camera();
camera.position = [0, 0, -8];
camera.target = [0, 0, -4];

const lights = [];

const animationStart = performance.now();

function frame(timestamp) {
  const elapsedSeconds = (timestamp - animationStart) / 1000;
  const angleRadians = elapsedSeconds * ((DEGREES_PER_SECOND * Math.PI) / 180);

  square.position.z = -4 + ROCK_AMPLITUDE * Math.sin(angleRadians);

  renderer.clear();
  renderer.render(meshes, camera, lights);
  requestAnimationFrame(frame);
}

const textureNames = [...new Set(meshes.flatMap((m) => m.getTextureNames()))];

preloadTextures(textureNames).then(() => {
  requestAnimationFrame(frame);
});
