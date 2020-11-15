import { Color, Scene } from 'https://unpkg.com/three@0.117.0/build/three.module.js';

function createScene() {
  const scene = new Scene();

  scene.background = new Color('#282828');

  return scene;
}

export { createScene };
