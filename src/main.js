import {
  World
} from './World/World.js';

const parameter = (location.search.split('object=')[1] || '').split('&')[0]
const objectID = parameter ? parameter : 0;
const parameter2 = (location.search.split('controls=')[1] || '').split('&')[0]
const displayControls = parameter2 ? parameter2 : 1;

async function main() {

  const selector = document.querySelector('#object');
  selector.value = objectID;

  if (displayControls != 0) {
    document.querySelector('#controls').style.visibility = "visible";
  }

  document.onkeypress = function (e) {
    var evt = window.event || e;
    switch (evt.keyCode) {
      case 99:
        if (document.querySelector('#controls').style.visibility == "visible") {
          document.querySelector('#controls').style.visibility = "hidden";
        } else {
          document.querySelector('#controls').style.visibility = "visible";
        }
        break;
    }
  }
  // Get a reference to the container element 
  const container = document.querySelector('#scene-container');

  // create a new world
  let world = new World(container);

  // complete async tasks
  await world.init();

  //await world.getAngle();

  // start the animation loop
  world.start();

  selector.addEventListener('change', async (event) => {
    world.stop();
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    world = new World(container);
    await world.init();
    world.start();
    console.log("new object");
  });
}

main().catch((err) => {
  console.error(err);
});