export function makeNoobOverlay(k) {
  console.log("Creating Noob Overlay...");

  // Add the overlay sprite
  const noobOverlay = k.add([
    k.sprite("noob"), // Add the 'noob' sprite
    k.pos(0, 0), // Position it at the top-left corner
    k.scale(k.width() / 4096, k.height() / 4096), // Scale to fit the screen
    { z: 10 }, // Set a low z-index to keep it in the background
  ]);

  console.log("Noob Overlay and Background Added: ", noobOverlay);
  return noobOverlay;
}
