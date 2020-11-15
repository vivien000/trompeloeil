import {
  loadObjects
} from './components/objects/objects.js';
import {
  createCamera
} from './components/camera.js';
import {
  createLights
} from './components/lights.js';
import {
  createScene
} from './components/scene.js';

import {
  FaceTracker
} from './components/geometry/geometry.js';

import {
  createRenderer
} from './systems/renderer.js';
import {
  Resizer
} from './systems/Resizer.js';
import {
  Loop
} from './systems/Loop.js';

let camera;
let renderer;
let scene;
let loop;

class World {
  constructor(container) {
    camera = createCamera(0, 1);
    renderer = createRenderer();
    scene = createScene();
    container.append(renderer.domElement);

    const {
      ambientLight,
      mainLight
    } = createLights();

    scene.add(ambientLight, mainLight);
    loop = new Loop(camera, scene, renderer, new FaceTracker());
    const resizer = new Resizer(container, camera, renderer, loop);
  }

  async init() {
    const object = await loadObjects();

    if (typeof (object.tick) == "function") {
      loop.updatables.push(object);
    }
    scene.add(object);
    await loop.init();
  }

  render() {
    renderer.render(scene, camera);
  }

  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export {
  World
};