const setSize = (container, camera, renderer, loop) => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  loop.setAspectRatio(container.clientWidth / container.clientHeight);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
};

class Resizer {
  constructor(container, camera, renderer, loop) {
    setSize(container, camera, renderer, loop);
    window.addEventListener('resize', () => {
      setSize(container, camera, renderer, loop);
      this.onResize();
    });
  }

  onResize() {}
}

export { Resizer };
