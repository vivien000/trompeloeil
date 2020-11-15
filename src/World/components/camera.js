import { PerspectiveCamera } from 'https://unpkg.com/three@0.117.0/build/three.module.js';

function createCamera(cameraPosition, fov, aspectRatio) {
  const camera = new PerspectiveCamera(fov, aspectRatio, 0.1, 100);
  camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
  camera.lookAt(0, 0, 0);
  return camera;
}

export { createCamera };
