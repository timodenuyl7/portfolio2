import { MenuScene } from "./scenes/MenuScene.js";
import { PubScene } from "./scenes/PubScene.js";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 1120,
  height: 720,
  parent: "game-container",
  backgroundColor: "#26392e",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: true, pixelArt: false },
  scene: [MenuScene, PubScene]
});

window.addEventListener("beforeunload", () => game.destroy(true));