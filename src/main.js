import kaplay from "kaplay";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { makeBackground } from "./utils";
import { SCALE_FACTOR } from "./constants";

const k = kaplay({
  width: 1280,
  height: 720,
  letterbox: true,
  global: true,
  scale: 2,
});

k.loadSprite("kriby", "./kriby.png");
k.loadSprite("obstacles", "./obstacles.png");
k.loadSprite("background", "./background.png");
k.loadSprite("clouds", "./clouds.png");
k.loadSound("jump", "./jump.wav");
k.loadSound("hurt", "./hurt.wav");
k.loadSound("confirm", "./confirm.wav");

const appWindow = getCurrentWindow();

async function getWindowSize() {
  const size = await appWindow.innerSize();
  return size;
}

// Call the async function to fetch the window size
let windowSize = { width: 0 };
getWindowSize().then((size) => {
  windowSize = size;
  console.log("Window Size:", windowSize); // Logs the width and height
});

addEventListener("keydown", async (e) => {
  if (e.code === "F11") {
    e.preventDefault();
    const isFullscreen = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFullscreen);
  }
});

// Define the scene
k.scene("start", () => {
  makeBackground(k);
  const map = k.add([
    k.sprite("background"),
    k.pos(0, 0),
    k.scale(SCALE_FACTOR),
  ]);

  const clouds = map.add([
    k.sprite("clouds"),
    k.pos(),
    {
      speed: 100,
    },
  ]);

clouds.onUpdate(() => {
  // Move the cloud to the right
  clouds.move(clouds.speed, 0);

  // Check if the cloud goes out of bounds (right side of the screen)
  if (clouds.pos.x > windowSize.width) {
    console.log("Cloud out of bounds. Speeding back...");
    // Reset position to the left
    console.log(`Before reset: ${clouds.pos.x}`);
    clouds.pos.x = -clouds.width;
    console.log(`After reset: ${clouds.pos.x}`);
  }
});


  map.add([k.sprite("obstacles"), k.pos()]);
});

k.scene("main", async () => {});

// Start the game
k.go("start");
