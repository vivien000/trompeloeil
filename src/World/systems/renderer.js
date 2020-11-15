import { WebGLRenderer } from 'https://unpkg.com/three@0.117.0/build/three.module.js';

function createRenderer() {
  const renderer = new WebGLRenderer({ antialias: true });

  renderer.physicallyCorrectLights = true;

  return renderer;
}

export { createRenderer };
