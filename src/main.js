import { Mesh } from "./scene/mesh.js";
import { Renderer } from "./rendering/renderer.js";
import { Camera } from "./scene/camera.js";
import { PointLight } from "./lights/point-light.js";
import { DirectionalLight } from "./lights/directional-light.js";
import { SpotLight } from "./lights/spot-light.js";
import * as vec3 from "./math/vec3.js";
import cubeData from "./assets/cube.json";
import { preloadTextures } from "./textures/texture-cache.js";

const CUBE_ROTATION_SPEED = 0.8;
const LIGHT_ORBIT_RADIUS = 3.5;
const LIGHT_ORBIT_HEIGHT = 2.5;
const LIGHT_ORBIT_SPEED = CUBE_ROTATION_SPEED * 3;
const SPOT_SWING_SPEED = 0.5;
const SPOT_SWING_ANGLE = 0.45;

const canvas = document.getElementById("canvas");
const renderer = new Renderer(canvas);

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

const cubeFront = new Mesh(cubeData);
cubeFront.position.z = -4;
const cubeBack = new Mesh(cubeData);
cubeBack.position.z = -4;

const meshes = [cubeFront, cubeBack];

const sceneCenter = [
  cubeFront.position.x,
  cubeFront.position.y,
  cubeFront.position.z,
];

// const viewDistance = 4;
// const orbitY = Math.PI / 4;
const camera = new Camera();
camera.position = [sceneCenter[0], sceneCenter[1], sceneCenter[2] - 4];
camera.target = [...sceneCenter];

const directionalLight = new DirectionalLight({
  direction: [0, 0, -1],
  color: [255, 255, 255],
  intensity: 0.85,
});

const pointLight = new PointLight({
  position: [3, sceneCenter[1] + 2.5, sceneCenter[2]],
  color: [255, 240, 220],
  intensity: 1.4,
});

const spotPosition = [3.5, -2.2, -2.8];
const spotBaseDirection = vec3.normalize(vec3.sub(sceneCenter, spotPosition));

const spotLight = new SpotLight({
  position: spotPosition,
  direction: [...spotBaseDirection],
  color: [160, 200, 255],
  intensity: 1.6,
  angle: Math.PI / 8,
  penumbra: 0.4,
});

const lights = []; // [directionalLight, pointLight, spotLight];

let orbitAngle = 0;
let spotSwingPhase = 0;
let lastTime = performance.now();
let angle = 0;

function frame(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  angle += dt;

  // cubeFront.rotation.y += CUBE_ROTATION_SPEED * dt;
  // orbitAngle += LIGHT_ORBIT_SPEED * dt;
  spotSwingPhase += SPOT_SWING_SPEED * dt;

  // pointLight.position[0] =
  //   sceneCenter[0] + LIGHT_ORBIT_RADIUS * Math.sin(orbitAngle);
  // pointLight.position[1] = sceneCenter[1] + LIGHT_ORBIT_HEIGHT;
  // pointLight.position[2] =
  //   sceneCenter[2] + LIGHT_ORBIT_RADIUS * Math.cos(orbitAngle);

  // const swing = Math.sin(spotSwingPhase) * SPOT_SWING_ANGLE;
  // const cos = Math.cos(swing);
  // const sin = Math.sin(swing);
  // spotLight.direction = vec3.normalize([
  //   spotBaseDirection[0] * cos - spotBaseDirection[2] * sin,
  //   spotBaseDirection[1],
  //   spotBaseDirection[0] * sin + spotBaseDirection[2] * cos,
  // ]);

  cubeFront.position.x = 8 * Math.sin(spotSwingPhase);
  cubeBack.position.y = 8 * Math.sin(spotSwingPhase);

  renderer.clear();
  renderer.render(meshes, camera, lights);

  requestAnimationFrame(frame);
}

const textureNames = [...new Set(meshes.flatMap((m) => m.getTextureNames()))];

preloadTextures(textureNames).then(() => {
  requestAnimationFrame(frame);
});
