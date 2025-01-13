import kaplay from "kaplay";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { makeBackground } from "./utils";
import { SCALE_FACTOR } from "./constants";
import { makePlayer } from "./player";
import { saveSystem } from "./save";
import { makeScoreBox } from "./scoreBox";
import { makeNoobOverlay } from "./noob";

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
k.loadSprite("noob", "./noob.png");
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
k.scene("start", async () => {
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
      speed: 10,
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

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(k.center().x - 350, k.center().y + 56);

  const playBtn = k.add([
    k.rect(200, 50, { radius: 3 }),
    k.color(k.Color.fromHex("#14638e")),
    k.area(),
    k.anchor("center"),
    k.pos(k.center().x + 30, k.center().y + 60),
  ]);

  playBtn.add([
    k.text("Play", { size: 24 }),
    k.color(k.Color.fromHex("#d7f2f7")),
    k.area(),
    k.anchor("center"),
  ]);

  const goToGame = () => {
    k.play("confirm");
    k.go("main");
  };

  playBtn.onClick(goToGame);

  k.onKeyPress("space", goToGame);

  k.onGamepadButtonPress("south", goToGame);
  try {
    await saveSystem.load();
    if (!saveSystem.data.maxScore) {
      saveSystem.data.maxScore = 0;
      await saveSystem.save();
      await saveSystem.load();
    }
  } catch (error) {
    console.log(error);
  }
});

k.scene("main", async () => {
  makeBackground(k);

  let score = 0;

  const colliders = await (await fetch("./collidersData.json")).json();
  const collidersData = colliders.data;

  k.setGravity(2500);

  const map = k.add([k.pos(0, -50), k.scale(SCALE_FACTOR)]);

  map.add([k.sprite("background"), k.pos()]);

  const clouds = map.add([k.sprite("clouds"), k.pos(), { speed: 5 }]);
  clouds.onUpdate(() => {
    clouds.move(clouds.speed, 0);
    if (clouds.pos.x > 700) {
      clouds.pos.x = -500; // put the clouds far back so it scrolls again through the level
    }
  });

  const platforms = map.add([
    k.sprite("obstacles"),
    k.pos(),
    k.area(),
    { speed: 100 },
  ]);
  platforms.onUpdate(() => {
    platforms.move(-platforms.speed, 0);
    if (platforms.pos.x < -490) {
      platforms.pos.x = 300; // put the platforms far back so it scrolls again through the level
      platforms.speed += 30; // progressively increase speed
    }
  });

  k.loop(1, () => {
    score += 1;
  });

  for (const collider of collidersData) {
    platforms.add([
      k.area({
        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
      }),
      k.body({ isStatic: true }),
      k.pos(collider.x, collider.y),
      "obstacle",
    ]);
  }

  k.add([k.rect(k.width(), 50), k.pos(0, -100), k.area(), "obstacle"]);

  k.add([k.rect(k.width(), 50), k.pos(0, 1000), k.area(), "obstacle"]);

  const player = k.add(makePlayer(k));
  player.pos = k.vec2(600, 250);
  player.setControls();
  player.onCollide("obstacle", async () => {
    if (player.isDead) return;
    k.play("hurt");
    platforms.speed = 0;
    k.shake(50);
    console.log("Adding Noob Overlay...");
    const noobOverlay = makeNoobOverlay(k);
    console.log("Noob Overlay Added: ", noobOverlay);
    player.disableControls();
    setTimeout(async () => {
      try {
        k.destroy(noobOverlay);
        k.add(await makeScoreBox(k, k.center(), score));
        player.isDead = true;
      } catch (error) {
        console.log(error);
      }
    }, 2000);
  });
});

// Start the game
k.go("start");
