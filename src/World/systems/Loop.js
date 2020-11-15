import {
  Clock
} from 'https://unpkg.com/three@0.117.0/build/three.module.js';
import {
  createCamera
} from '../components/camera.js';

const clock = new Clock();

class Loop {
  constructor(camera, scene, renderer, faceTracker) {
    this.camera = camera;
    this.cameraPosition = [0, 0, 0.5];
    this.fov = 43.6;
    this.aspectRatio = 1;
    this.scene = scene;
    this.lastUpdate = 0;
    this.renderer = renderer;
    this.faceTracker = faceTracker;
    this.canvas = document.createElement('canvas')
    this.updatables = [];
  }

  async init() {
    await this.faceTracker.init();
  }

  async updateCameraParameters() {
    const timestamp = Date.now();
    if (timestamp - this.lastUpdate > 30) {
      const result = await this.faceTracker.getCameraParameters();
      if (result !== null) {
        const [cameraPosition, fov] = result;
        this.cameraPosition = cameraPosition;
        this.fov = fov;
        this.lastUpdate = Date.now();
      }
    }
  }

  setAspectRatio(ar) {
    this.aspectRatio = ar;
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      this.updateCameraParameters().then(() => {
        this.camera = createCamera(this.cameraPosition, this.fov, this.aspectRatio);
        this.tick();
        this.renderer.render(this.scene, this.camera);
      });
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }

  tick() {
    const delta = clock.getDelta();
    for (const object of this.updatables) {
      object.tick(delta);
    }
  }
}

export {
  Loop
};