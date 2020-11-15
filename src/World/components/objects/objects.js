import { GLTFLoader } from 'https://unpkg.com/three@0.117.0/examples/jsm/loaders/GLTFLoader.js';

import { setupModel } from './setupModel.js';

const parameter = (location.search.split('object=')[1]||'').split('&')[0]
const objectID = parameter ? parameter : 0;

async function loadObjects() {
  const loader = new GLTFLoader();
  let object;

  if (objectID == 0) {
    const data = await loader.loadAsync('https://vivien000.github.io/trompeloeil/models/tie.glb');
    object = setupModel(data);
    object.scale.set(0.00002, 0.00002, 0.00002);
    object.position.set(0, 0, -0.05);
  } else if (objectID == 1) {
    const data = await loader.loadAsync('https://vivien000.github.io/trompeloeil/models/parrot.glb');
    object = setupModel(data);
    object.scale.set(0.2, 0.2, 0.2);
    object.position.set(0, 0, -0.02);
  } else {
    const data = await loader.loadAsync('https://vivien000.github.io/trompeloeil/models/vangogh.glb');
    object = setupModel(data);
    object.scale.set(0.2, 0.2, 0.2);
    object.position.set(0, -0.3, -0.5);
  }

  return object;
}

export { loadObjects };
