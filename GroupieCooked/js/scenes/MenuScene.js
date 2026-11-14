import { LEVELS } from "../data/products.js";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
    this.level = 0;
  }

  create() {
    const { width, height } = this.scale;
    const g = this.add.graphics();
    g.fillGradientStyle(0x263c32, 0x263c32, 0x17241e, 0x17241e, 1);
    g.fillRect(0, 0, width, height);
    for (let i = 0; i < 12; i += 1) {
      g.fillStyle(i % 2 ? 0x30463a : 0x2a4035, 0.65);
      g.fillRect(i * 96, 0, 3, height);
    }
    g.fillStyle(0xe84f3b);
    g.fillCircle(90, 92, 7);
    g.fillCircle(width - 90, 92, 7);
    this.add.text(width / 2, 98, "GROUPIEBAR", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "18px", fontStyle: "bold", color: "#f4c655", letterSpacing: 5
    }).setOrigin(0.5);
    this.add.text(width / 2, 174, "De GroupieBar", {
      fontFamily: "Georgia, serif", fontSize: "62px", color: "#f7eedc"
    }).setOrigin(0.5);
    this.add.text(width / 2, 229, "Jij tapt. Jij serveert. Jij redt de avond.", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "17px", color: "#c1cbbd"
    }).setOrigin(0.5);
    const unlocked = this.getUnlockedLevel();
    this.add.text(width / 2, 300, "KIES JE DIENST", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#e9ad67", letterSpacing: 3
    }).setOrigin(0.5);
    const buttonWidth = 56;
    const gap = 14;
    const firstX = width / 2 - (LEVELS.length * buttonWidth + (LEVELS.length - 1) * gap) / 2;
    LEVELS.forEach((level, index) => {
      const x = firstX + index * (buttonWidth + gap);
      const y = 352;
      const available = index <= unlocked;
      const bg = this.add.rectangle(x + buttonWidth / 2, y, buttonWidth, 48, available ? 0x405444 : 0x28362e)
        .setStrokeStyle(1, available ? 0x87956a : 0x3a4940)
        .setInteractive({ useHandCursor: available });
      const number = this.add.text(x + buttonWidth / 2, y, String(index + 1), {
        fontFamily: "Trebuchet MS, sans-serif", fontSize: "20px", fontStyle: "bold", color: available ? "#f7eedc" : "#647066"
      }).setOrigin(0.5);
      if (index === this.level) bg.setStrokeStyle(2, 0xf4c655);
      if (available) {
        bg.on("pointerdown", () => { this.level = index; this.scene.restart(); });
        number.setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.level = index; this.scene.restart(); });
      }
    });
    this.add.text(width / 2, 397, LEVELS[this.level].title, {
      fontFamily: "Georgia, serif", fontSize: "18px", fontStyle: "italic", color: "#f4c655"
    }).setOrigin(0.5);
    const play = this.add.rectangle(width / 2, 482, 250, 58, 0xe84f3b).setInteractive({ useHandCursor: true });
    this.add.text(width / 2, 482, "OPEN DE KROEG", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "15px", fontStyle: "bold", color: "#fff8e9", letterSpacing: 2
    }).setOrigin(0.5);
    play.on("pointerdown", () => this.scene.start("pub", { level: this.level }));
    const help = this.add.rectangle(width / 2 + 205, 482, 150, 58, 0x405444)
      .setStrokeStyle(1, 0x9ca981).setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 205, 482, "UITLEG", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#f7eedc", letterSpacing: 2
    }).setOrigin(0.5);
    help.on("pointerdown", () => this.showHelp());
    this.add.text(width / 2, 564, "WASD / PIJLTJES  ·  E INTERACTIE  ·  ESC PAUZE", {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "11px", color: "#9ba99b", letterSpacing: 1
    }).setOrigin(0.5);
    this.add.text(width / 2, height - 33, "Een studentenkroeg op een drukke avond", {
      fontFamily: "Georgia, serif", fontSize: "14px", fontStyle: "italic", color: "#7f9182"
    }).setOrigin(0.5);
  }

  showHelp() {
    const { width, height } = this.scale;
    const panel = this.add.container(0, 0).setDepth(10);
    panel.add(this.add.rectangle(width / 2, height / 2, width, height, 0x101a15, 0.96));
    panel.add(this.add.rectangle(width / 2, height / 2, 640, 430, 0x293d32).setStrokeStyle(2, 0xf4c655));
    panel.add(this.add.text(width / 2, height / 2 - 135, "ZO WERKT DE BAR", {
      fontFamily: "Georgia, serif", fontSize: "32px", color: "#f7eedc"
    }).setOrigin(0.5));
    panel.add(this.add.text(width / 2, height / 2 - 10,
      "WASD / pijltjestoetsen   Lopen\nE   Bestelling opnemen en werkplek gebruiken\n\nPak het juiste glas bij de bon.\nTap tot het glas vol is en serveer aan het Lid.\n\nEsc   Pauzeren",
      { fontFamily: "Trebuchet MS, sans-serif", fontSize: "16px", color: "#e4e6d9", align: "center", lineSpacing: 10 }
    ).setOrigin(0.5));
    const close = this.add.rectangle(width / 2, height / 2 + 150, 190, 48, 0xe84f3b)
      .setInteractive({ useHandCursor: true });
    panel.add(close);
    panel.add(this.add.text(width / 2, height / 2 + 150, "BEGREPEN", {
      fontSize: "14px", fontStyle: "bold", color: "#fff8e9", letterSpacing: 2
    }).setOrigin(0.5));
    close.on("pointerdown", () => panel.destroy(true));
  }

  getUnlockedLevel() {
    try {
      return Math.max(0, Math.min(LEVELS.length - 1, Number(localStorage.getItem("groupieCookedUnlocked") || 0)));
    } catch {
      return 0;
    }
  }
}