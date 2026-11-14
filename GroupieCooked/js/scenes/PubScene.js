import { Character } from "../entities/Character.js";
import { LEVELS, PRODUCTS, PUZZLE_GOAL } from "../data/products.js";

const GRID = { columns: 12, rows: 9, tileWidth: 76, tileHeight: 38, originX: 560, originY: 148 };
const CUSTOMER_SPOTS = [
  { col: 0.5, row: 6.7 }, { col: 2.3, row: 5.2 }, { col: 4.1, row: 6.7 },
  { col: 6.4, row: 7.6 }, { col: 8.8, row: 5.3 }, { col: 10.9, row: 6.5 },
  { col: 11.2, row: 4.0 }, { col: 9.3, row: 7.5 }, { col: 4.5, row: 4.2 },
  { col: 6.4, row: 5.0 }, { col: 3.0, row: 4.5 }, { col: 0.5, row: 8.3 }
];
const ENTRY_SPOT = { col: 11.25, row: 4.15 };
const CUSTOMER_LOOKS = [
  { hair: 0x38241e, skin: 0xe2a47d }, { hair: 0x181b1a, skin: 0xf1c6a0 },
  { hair: 0x684a35, skin: 0xb97555 }, { hair: 0xb77b3f, skin: 0xe6bc96 }
];
const ANGER_LINES = [
  "Groupie schiet op", "2 woorden 9 letters", "Waar zijn je hardloopschoenen?", "DORST!"
];
const CHAT_LINES = ["Proost!", "Wat een avond.", "Lekker biertje!", "Zing je mee?"];

export class PubScene extends Phaser.Scene {
  constructor() { super("pub"); }

  init(data) {
    this.levelIndex = data.level ?? 0;
    this.level = LEVELS[this.levelIndex];
    this.pieces = 0;
    this.pendingPieces = 0;
    this.elapsed = 0;
    this.handItem = null;
    this.trayEquipped = false;
    this.trayItems = [];
    this.activeCustomer = null;
    this.fryer = null;
    this.paused = false;
    this.completed = false;
    this.feedback = "Loop naar een Lid en druk op E om de bestelling op te nemen.";
    this.feedbackTime = 5;
    this.cheersCooldown = Phaser.Math.FloatBetween(35, 55);
    this.activeCheers = null;
    this.solid = new Set();
  }

  create() {
    this.drawPub();
    this.createStations();
    this.createFurniture();
    this.createPlayer();
    this.createCustomers();
    this.createHud();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,E,ESC");
    this.cursors = this.input.keyboard.createCursorKeys();
    this.eKey = this.keys.E;
    this.escapeHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.togglePause();
      }
    };
    document.addEventListener("keydown", this.escapeHandler);
    this.trayDropHandler = (event) => {
      if (event.key.toLowerCase() !== "q" || !this.trayEquipped) return;
      event.preventDefault();
      const target = this.getTarget();
      if (target?.targetType === "station" && target.type === "tray") this.interactTray();
      else this.say("KUT GROUPIE je laat het blad toch niet in de kroeg achter, je bent alleen dus leg hem achter de bar of hou hem vast");
    };
    document.addEventListener("keydown", this.trayDropHandler);
    this.events.once("shutdown", () => {
      document.removeEventListener("keydown", this.escapeHandler);
      document.removeEventListener("keydown", this.trayDropHandler);
    });
    this.interactionGraphic = this.add.graphics().setDepth(900);
    this.fryerGraphic = this.add.graphics().setDepth(900);
    this.scene.bringToTop();
  }

  project(col, row) {
    return {
      x: GRID.originX + (col - row) * GRID.tileWidth / 2,
      y: GRID.originY + (col + row) * GRID.tileHeight / 2
    };
  }

  drawDiamond(g, x, y, fill, stroke = 0x6a664a) {
    const points = [
      { x, y: y - GRID.tileHeight / 2 }, { x: x + GRID.tileWidth / 2, y },
      { x, y: y + GRID.tileHeight / 2 }, { x: x - GRID.tileWidth / 2, y }
    ];
    g.fillStyle(fill, 1);
    g.fillPoints(points, true);
    g.lineStyle(1, stroke, 0.34);
    g.strokePoints(points, true);
  }

  drawPub() {
    const g = this.add.graphics();
    g.fillStyle(0x17251e);
    g.fillRect(0, 0, 1120, 720);
    for (let i = 0; i < GRID.columns; i += 1) {
      for (let j = 0; j < GRID.rows; j += 1) {
        const { x, y } = this.project(i, j);
        const tone = (i + j) % 2 ? 0x8c704a : 0x987b52;
        this.drawDiamond(g, x, y, tone, 0x594a35);
      }
    }
    this.drawCounter(g);
    this.drawSideEntry(g);
  }

  drawWallDecor(g) {
    const leftWall = [
      { x: 70, y: 95 }, { x: 560, y: 142 }, { x: 560, y: 268 }, { x: 70, y: 238 }
    ];
    const rightWall = [
      { x: 560, y: 142 }, { x: 1050, y: 95 }, { x: 1050, y: 238 }, { x: 560, y: 268 }
    ];
    g.fillStyle(0x35463a);
    g.fillPoints(leftWall, true);
    g.fillStyle(0x293c32);
    g.fillPoints(rightWall, true);
    g.lineStyle(3, 0x795b3b, 1);
    g.strokePoints(leftWall, true);
    g.strokePoints(rightWall, true);
    for (let i = 0; i < 6; i += 1) {
      const x = 115 + i * 82;
      const t = (x - 70) / 490;
      g.lineStyle(2, 0x765d3d, 0.72);
      g.lineBetween(x, 95 + t * 47, x, 238 + t * 30);
    }
    for (let i = 0; i < 6; i += 1) {
      const x = 600 + i * 82;
      const t = (x - 560) / 490;
      g.lineStyle(2, 0x765d3d, 0.72);
      g.lineBetween(x, 142 - t * 47, x, 268 - t * 30);
    }
    [
      { start: 108, end: 526, side: "left" },
      { start: 594, end: 1012, side: "right" }
    ].forEach((wall, wallIndex) => {
      g.lineStyle(2, 0xf4c655, 0.55);
      const points = [];
      for (let i = 0; i <= 5; i += 1) {
        const x = wall.start + (wall.end - wall.start) * i / 5;
        const t = wall.side === "left" ? (x - 70) / 490 : (x - 560) / 490;
        const top = wall.side === "left" ? 95 + t * 47 : 142 - t * 47;
        points.push({ x, y: top + 24 + (i % 2) * 5 });
      }
      g.strokePoints(points, false);
      points.slice(1, -1).forEach((point, index) => {
        g.fillStyle((index + wallIndex) % 2 ? 0xf4c655 : 0xe84f3b, 1);
        g.fillCircle(point.x, point.y, 4);
        g.fillStyle(0xf4c655, 0.13);
        g.fillCircle(point.x, point.y + 10, 17);
      });
    });
    [
      { x: 230, y: 190 }, { x: 890, y: 190 }
    ].forEach(({ x, y }) => {
      g.fillStyle(0x9d342c);
      g.fillCircle(x, y, 31);
      g.fillStyle(0xe6d7bd);
      g.fillCircle(x, y, 25);
      g.lineStyle(2, 0x3a2c25, 1);
      g.lineBetween(x - 19, y, x + 19, y);
      g.lineBetween(x, y - 19, x, y + 19);
      g.lineBetween(x - 14, y - 14, x + 14, y + 14);
      g.lineBetween(x + 14, y - 14, x - 14, y + 14);
      g.fillStyle(0x293d32);
      g.fillCircle(x, y, 4);
    });
    this.add.rectangle(290, 126, 190, 38, 0x19342c).setStrokeStyle(2, 0xe6b54d);
    this.add.text(290, 126, "GROUPIEBAR", {
      fontFamily: "Georgia, serif", fontSize: "17px", fontStyle: "bold", color: "#f4c655", letterSpacing: 3
    }).setOrigin(0.5);
  }

  drawCounter(g) {
    const { startCol, endCol } = this.getBarLayout();
    for (let col = startCol; col <= endCol; col += 1) this.drawCounterTile(g, col, 3);
    for (let row = 1; row <= 2; row += 1) {
      this.drawCounterTile(g, startCol, row);
      this.drawCounterTile(g, endCol, row);
    }
  }

  drawCounterTile(g, col, row) {
    const p = this.project(col, row);
    this.drawDiamond(g, p.x, p.y - 20, 0x5e3d29, 0x30271e);
    g.fillStyle(0x765034);
    g.fillRoundedRect(p.x - 26, p.y - 27, 52, 18, 3);
    g.lineStyle(2, 0xb0824b, 0.85);
    g.lineBetween(p.x - 21, p.y - 22, p.x + 21, p.y - 22);
    this.solid.add(`${col},${row}`);
  }

  getBarLayout() {
    const tileCount = Math.min(GRID.columns, this.level.drinks.length * 2 + 4);
    const startCol = Math.floor((GRID.columns - tileCount) / 2);
    return { startCol, endCol: startCol + tileCount - 1 };
  }

  drawSideEntry(g) {
    const point = this.project(ENTRY_SPOT.col, ENTRY_SPOT.row);
    const x = point.x + 25;
    const y = point.y - 69;
    g.fillStyle(0x102018, 0.96);
    g.fillRoundedRect(x, y, 42, 69, 18);
    g.lineStyle(4, 0xc28b46, 1);
    g.strokeRoundedRect(x, y, 42, 69, 18);
    g.fillStyle(0xf4c655);
    g.fillCircle(x + 32, y + 38, 3);
    this.add.text(x + 21, y - 11, "IN", { fontSize: "10px", fontStyle: "bold", color: "#f4c655" }).setOrigin(0.5);
  }

  createStations() {
    const { startCol } = this.getBarLayout();
    this.stations = [];
    this.level.drinks.forEach((productId, index) => {
      const glassCol = startCol + 1 + index * 2;
      const tapCol = glassCol + 1;
      const product = PRODUCTS[productId];
      const glassLabel = productId === "pils" ? "GLAS: BIER" : `GLAS: ${product.short}`;
      const tapLabel = productId === "pils" ? "TAP: BIER" : `TAP: ${product.short}`;
      this.stations.push({ id: `glass-${productId}`, name: glassLabel, col: glassCol, row: 2, type: "glass", productId });
      this.stations.push({
        id: `tap-${productId}`, name: productId === "stroh" ? "FLES: STROH" : tapLabel,
        col: tapCol, row: 2, type: productId === "stroh" ? "bottle" : "tap", productId
      });
    });
    const { endCol } = this.getBarLayout();
    this.stations.push({ id: "beer-tray", name: "BIERBLAD", col: endCol - 1, row: 0, type: "tray" });
    this.stations.push({ id: "bin", name: "AFVALBAK", col: 0, row: 0, type: "bin" });
    this.stations.forEach((station) => this.drawStation(station));
  }

  drawStation(station) {
    const { x, y } = this.project(station.col, station.row);
    const g = this.add.graphics().setDepth(y - 12);
    g.fillStyle(0x15221c, 0.35);
    g.fillEllipse(x, y + 3, 72, 24);
    g.fillStyle(0x60432f);
    g.fillRoundedRect(x - 32, y - 18, 64, 30, 5);
    g.fillStyle(0x956b42);
    g.fillRoundedRect(x - 34, y - 22, 68, 10, 4);
    g.lineStyle(2, 0xc2955a, 0.9);
    g.strokeRoundedRect(x - 34, y - 22, 68, 10, 4);
    if (station.type === "glass") {
      this.drawGlass(g, x, y - 36, station.productId, 0, 1.35);
    } else if (station.type === "tap") {
      g.fillStyle(0xc3b99e);
      g.fillRoundedRect(x - 9, y - 48, 18, 26, 4);
      g.lineStyle(3, 0xd8c9a7, 1);
      g.lineBetween(x, y - 47, x, y - 58);
      g.lineBetween(x, y - 58, x + 12, y - 58);
      g.lineBetween(x + 12, y - 58, x + 12, y - 50);
      g.fillStyle(PRODUCTS[station.productId].color);
      g.fillCircle(x - 15, y - 33, 4);
    } else if (station.type === "bottle") {
      g.fillStyle(0x956335);
      g.fillRoundedRect(x - 10, y - 46, 20, 23, 4);
      g.fillRect(x - 5, y - 53, 10, 8);
      g.fillStyle(0xf4c655);
      g.fillRect(x - 8, y - 38, 16, 8);
    } else if (station.type === "tray") {
      this.trayStationPosition = { x, y: y - 40 };
    } else if (station.type === "snacks") {
      g.fillStyle(0xd7b36a);
      g.fillEllipse(x, y - 31, 30, 13);
      g.fillStyle(0xba6138);
      g.fillRoundedRect(x - 10, y - 43, 20, 9, 4);
    } else if (station.type === "fryer") {
      g.fillStyle(0x303a36);
      g.fillRoundedRect(x - 20, y - 46, 40, 28, 5);
      g.lineStyle(2, 0xd7a849, 1);
      g.strokeRoundedRect(x - 15, y - 40, 30, 17, 3);
      g.lineBetween(x - 11, y - 37, x + 11, y - 37);
    } else if (station.type === "plate") {
      g.fillStyle(0xe6ded0);
      g.fillEllipse(x, y - 31, 30, 12);
      g.lineStyle(1, 0x8e8779, 1);
      g.strokeEllipse(x, y - 31, 25, 8);
    } else {
      g.fillStyle(0x405a4b);
      g.fillRoundedRect(x - 13, y - 43, 26, 25, 4);
      g.lineStyle(2, 0xacc09d, 1);
      g.lineBetween(x - 10, y - 41, x + 10, y - 41);
    }
    this.add.text(x, y + 24, station.name, {
      fontFamily: "Trebuchet MS, sans-serif", fontSize: "10px", fontStyle: "bold", color: "#f5ebd6", backgroundColor: "#24372c", padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(800);
    if (station.type === "tray") {
      this.trayStationPosition = { x, y: y - 40 };
      this.trayStationGraphics = this.add.graphics().setDepth(y + 2);
      this.trayCountText = this.add.text(x, y + 38, "0/12 BIER", {
        fontSize: "12px", fontStyle: "bold", color: "#fff0d4", backgroundColor: "#35251b", padding: { x: 5, y: 3 }
      }).setOrigin(0.5).setDepth(801);
      this.updateTrayVisuals();
    }
    if (station.type !== "tray") this.solid.add(`${station.col},${station.row}`);
  }

  drawGlass(g, x, y, productId, fillAmount = 0, scale = 1) {
    const shape = {
      pils: { height: 15, top: 5, bottom: 4, outline: [[-5, -15], [5, -15], [4, 0], [-4, 0]] },
      tulip: { height: 15, top: 7, bottom: 4, outline: [[-6, -15], [6, -15], [5, -11], [3, -8], [5, 0], [-5, 0], [-3, -8], [-5, -11]] },
      weizen: { height: 21, top: 5, bottom: 8, outline: [[-5, -21], [5, -21], [8, 0], [-8, 0]] },
      chalice: { height: 14, top: 8, bottom: 3, outline: [[-8, -14], [8, -14], [5, -6], [3, -3], [3, 0], [-3, 0], [-3, -3], [-5, -6]] },
      shot: { height: 9, top: 5, bottom: 4, outline: [[-5, -9], [5, -9], [4, 0], [-4, 0]] }
    }[PRODUCTS[productId].glassShape];
    const points = shape.outline.map(([dx, dy]) => ({ x: x + dx * scale, y: y + dy * scale }));
    g.fillStyle(0xe4eee0, 0.22);
    g.fillPoints(points, true);
    if (fillAmount > 0) {
      const amount = Phaser.Math.Clamp(fillAmount, 0, 1);
      const liquidY = y - shape.height * amount * scale;
      const liquidHalf = (shape.bottom + (shape.top - shape.bottom) * amount) * scale;
      const baseHalf = shape.bottom * scale;
      g.fillStyle(PRODUCTS[productId].color, 0.98);
      g.fillPoints([
        { x: x - liquidHalf, y: liquidY }, { x: x + liquidHalf, y: liquidY },
        { x: x + baseHalf, y }, { x: x - baseHalf, y }
      ], true);
      if (amount > 0.93) {
        g.fillStyle(0xfff6df, 0.98);
        g.fillEllipse(x, liquidY, shape.top * 1.7 * scale, 4 * scale);
      }
    }
    g.lineStyle(1.5 * scale, 0xe8edda, 0.95);
    g.strokePoints(points, true);
  }

  heartPoints(x, y, width, height) {
    const points = [];
    for (let index = 0; index <= 48; index += 1) {
      const angle = index / 48 * Math.PI * 2;
      const sin = Math.sin(angle);
      const heartX = 16 * sin * sin * sin;
      const heartY = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
      points.push({ x: x + heartX / 32 * width, y: y - heartY / 30 * height });
    }
    return points;
  }

  clipHeartBand(points, minY, maxY) {
    const clip = (polygon, boundary, keepGreater) => {
      const result = [];
      for (let index = 0; index < polygon.length; index += 1) {
        const current = polygon[index];
        const previous = polygon[(index + polygon.length - 1) % polygon.length];
        const currentInside = keepGreater ? current.y >= boundary : current.y <= boundary;
        const previousInside = keepGreater ? previous.y >= boundary : previous.y <= boundary;
        if (currentInside !== previousInside) {
          const ratio = (boundary - previous.y) / (current.y - previous.y);
          result.push({ x: previous.x + (current.x - previous.x) * ratio, y: boundary });
        }
        if (currentInside) result.push(current);
      }
      return result;
    };
    return clip(clip(points, minY, true), maxY, false);
  }

  drawBeerTray(g, x, y, items = [], scale = 1) {
    const width = 70 * scale;
    const height = 48 * scale;
    const top = this.heartPoints(x, y, width, height);
    const lower = this.heartPoints(x, y + 7 * scale, width * 0.94, height * 0.92);
    g.fillStyle(0x513824, 1);
    g.fillPoints(lower, true);
    g.lineStyle(2 * scale, 0x291e17, 1);
    g.strokePoints(lower, true);
    [-0.27, -0.08, 0.15, 0.34].forEach((offset, index) => {
      const postX = x + offset * width;
      const postY = y + (index % 2 ? 2 : 1) * scale;
      g.fillStyle(index === 1 || index === 2 ? 0xd90000 : 0x171719, 1);
      g.fillRoundedRect(postX - 2.2 * scale, postY, 4.4 * scale, 7 * scale, 1.2 * scale);
    });
    g.fillStyle(0x151517, 1);
    g.fillPoints(top, true);
    const minY = y - height * 0.53;
    const maxY = y + height * 0.53;
    const redBand = this.clipHeartBand(top, minY + (maxY - minY) / 3, minY + 2 * (maxY - minY) / 3);
    g.fillStyle(0xd90000, 1);
    g.fillPoints(redBand, true);
    g.lineStyle(2 * scale, 0x6a462d, 1);
    g.strokePoints(top, true);

    const holes = [
      [-0.18, -0.27], [0.18, -0.27],
      [-0.37, -0.08], [-0.12, -0.08], [0.12, -0.08], [0.37, -0.08],
      [-0.37, 0.16], [-0.12, 0.16], [0.12, 0.16], [0.37, 0.16],
      [-0.18, 0.39], [0.18, 0.39]
    ];
    holes.forEach(([offsetX, offsetY], slot) => {
      const holeX = x + offsetX * width;
      const holeY = y + offsetY * height;
      g.fillStyle(0x100f10, 0.95);
      g.fillEllipse(holeX, holeY, 8 * scale, 6 * scale);
      g.lineStyle(1 * scale, 0xc9a477, 0.95);
      g.strokeEllipse(holeX, holeY, 8 * scale, 6 * scale);
      if (items[slot]) this.drawGlass(g, holeX, holeY + 1 * scale, items[slot].productId, 1, 0.34 * scale);
    });
  }

  updateTrayVisuals() {
    if (this.trayStationGraphics && this.trayStationPosition) {
      this.trayStationGraphics.clear();
      if (!this.trayEquipped) this.drawBeerTray(this.trayStationGraphics, this.trayStationPosition.x, this.trayStationPosition.y, this.trayItems, 0.64);
    }
    this.trayCountText?.setText(`${this.trayItems.length}/12 BIER`);
    this.trayCountText?.setVisible(!this.trayEquipped);
    this.hudHand?.setText(this.trayEquipped ? `BLAD ${this.trayItems.length}/12${this.handItem ? ` + ${this.handLabel(this.handItem)}` : ""}` : `HAND: ${this.handItem ? this.handLabel(this.handItem) : "LEEG"}`);
  }

  createFurniture() {
    const g = this.add.graphics();
    const tables = [{ col: 1, row: 6 }, { col: 8, row: 6 }, { col: 10, row: 5 }];
    tables.forEach(({ col, row }, index) => {
      const { x, y } = this.project(col, row);
      g.fillStyle(0x17231d, 0.35);
      g.fillEllipse(x, y + 9, 106, 35);
      g.fillStyle(0x533926);
      g.fillRect(x - 5, y - 4, 10, 30);
      g.fillStyle(index % 2 ? 0x9a6841 : 0x7d5236);
      g.fillEllipse(x, y - 4, 84, 25);
      g.lineStyle(2, 0xc18a4d, 0.9);
      g.strokeEllipse(x, y - 4, 84, 25);
      this.solid.add(`${col},${row}`);
    });
    g.lineStyle(5, 0x603e2a, 1);
    g.lineBetween(50, 555, 1070, 555);
    g.fillStyle(0x304b3b);
    g.fillRoundedRect(44, 533, 1032, 34, 8);
    g.lineStyle(2, 0xb17b43, 0.8);
    g.strokeRoundedRect(44, 533, 1032, 34, 8);
    this.add.text(560, 550, "DANSVLOER", { fontSize: "10px", color: "#d8c49e", letterSpacing: 3 }).setOrigin(0.5);
  }

  createPlayer() {
    this.player = new Character(this, { isPlayer: true });
    const { startCol, endCol } = this.getBarLayout();
    this.playerGrid = { col: endCol - 1.5, row: 0.5 };
    this.player.container.setDepth(500);
    this.placeCharacter(this.player, this.playerGrid);
    this.heldItemGraphic = this.add.graphics().setDepth(501);
  }

  createCustomers() {
    this.customers = [];
    const looks = CUSTOMER_LOOKS;
    for (let i = 0; i < this.level.customers; i += 1) {
      const spot = CUSTOMER_SPOTS[i];
      const look = looks[i % looks.length];
      const character = new Character(this, { ...look, seed: i + 1 });
      character.container.setDepth(490);
      const customer = {
        character,
        grid: { ...spot },
        index: i,
        arrived: false,
        arriving: false,
        accepted: false,
        wait: 0,
        angryLine: ANGER_LINES[i % ANGER_LINES.length],
        angerSpoken: false,
        chatLine: "",
        chatRemaining: 0,
        chatCooldown: Phaser.Math.FloatBetween(9, 18),
        orderAtBar: false,
        barApproach: false,
        drinksServed: 0,
        dancing: false,
        cheersInProgress: false,
        drinkQueue: [],
        currentDrink: null,
        walkPath: [],
        wanderCooldown: Phaser.Math.FloatBetween(12, 24),
        drinkGraphic: this.add.graphics().setDepth(491),
        order: i < this.level.startingOrders ? this.makeOrder() : null,
        nextOrderIn: i < this.level.startingOrders
          ? 0
          : Phaser.Math.FloatBetween(this.level.orderDelay[0], this.level.orderDelay[1]),
        iconBubble: this.add.graphics().setDepth(849),
        bubble: this.add.text(0, 0, "", {
          fontFamily: "Trebuchet MS, sans-serif", fontSize: "10px", fontStyle: "bold", color: "#263126",
          backgroundColor: "#fff1d2", padding: { x: 7, y: 5 }, align: "center", wordWrap: { width: 190 }
        }).setOrigin(0.5).setDepth(850)
      };
      this.placeCharacter(character, ENTRY_SPOT);
      character.container.setVisible(false);
      this.customers.push(customer);
      this.refreshBubble(customer);
      this.time.delayedCall(i * 180, () => {
        const start = this.project(ENTRY_SPOT.col, ENTRY_SPOT.row);
        const destination = this.project(spot.col, spot.row);
        customer.arriving = true;
        character.container.setVisible(true);
        character.container.setPosition(start.x, start.y);
        this.tweens.add({
          targets: character.container,
          x: destination.x,
          y: destination.y,
          duration: 900 + (i % 3) * 170,
          ease: "Sine.easeInOut",
          onComplete: () => {
            customer.arriving = false;
            customer.arrived = true;
            this.refreshBubble(customer);
          }
        });
      });
    }
  }

  makeOrder() {
    const pool = [...this.level.drinks, ...this.level.snacks];
    const count = Phaser.Math.Between(1, this.level.orderSize);
    return { items: Array.from({ length: count }, () => ({ productId: Phaser.Utils.Array.GetRandom(pool), prepared: false, delivered: false })) };
  }

  refreshBubble(customer) {
    if (!customer.arrived || !customer.order) {
      customer.bubble.setVisible(false);
      customer.iconBubble.setVisible(false);
      customer.iconSignature = null;
      return;
    }
    const names = customer.order.items.map((item) => PRODUCTS[item.productId].short).join(" + ");
    const signature = `${names}:${customer.accepted}`;
    if (customer.iconSignature !== signature) {
      this.drawThoughtIcons(customer);
      customer.iconSignature = signature;
    }
    const angry = customer.wait > 35;
    const speaking = angry || customer.chatRemaining > 0;
    customer.bubble.setText(angry ? customer.angryLine : customer.chatLine);
    customer.bubble.setColor(angry ? "#fff3e0" : "#263126");
    customer.bubble.setBackgroundColor(angry ? "#8a3028" : "#fff1d2");
    customer.bubble.setVisible(speaking);
    customer.iconBubble.setVisible(!customer.currentDrink && !customer.drinkQueue.length);
    const { x, y } = this.project(customer.grid.col, customer.grid.row);
    const outward = x < GRID.originX ? -1 : 1;
    customer.bubble.setPosition(Phaser.Math.Clamp(x + outward * 82, 115, 1005), Phaser.Math.Clamp(y - 42, 92, 580));
    customer.iconBubble.setPosition(x, y - 112);
  }

  drawThoughtIcons(customer) {
    const g = customer.iconBubble;
    const items = customer.order.items;
    const width = items.length * 25 + 14;
    g.clear();
    g.fillStyle(0x18251f, 0.22);
    g.fillRoundedRect(-width / 2 + 2, -12, width, 29, 10);
    g.fillStyle(0xfff3d9, 1);
    g.fillRoundedRect(-width / 2, -15, width, 28, 10);
    g.lineStyle(1.5, 0x574b3a, 0.9);
    g.strokeRoundedRect(-width / 2, -15, width, 28, 10);
    g.fillStyle(0xfff3d9, 1);
    g.fillCircle(-width / 2 + 8, 16, 4);
    g.fillCircle(-width / 2 + 3, 23, 2.5);
    items.forEach((item, index) => {
      const x = -((items.length - 1) * 25) / 2 + index * 25;
      const y = -1;
      const product = PRODUCTS[item.productId];
      if (product.kind === "snack") {
        g.fillStyle(0xe4c078);
        g.fillEllipse(x, y + 2, 19, 11);
        g.fillStyle(product.color);
        g.fillRoundedRect(x - 7, y - 2, 14, 5, 3);
        g.fillStyle(0x7d4230);
        g.fillRect(x - 6, y + 1, 12, 2);
        return;
      }
      g.fillStyle(product.color);
      if (item.productId === "weizen") {
        g.fillPoints([{ x: x - 5, y: y - 8 }, { x: x + 5, y: y - 8 }, { x: x + 7, y: y + 7 }, { x: x - 7, y: y + 7 }], true);
      } else if (item.productId === "tripel") {
        g.fillPoints([{ x: x - 7, y: y - 7 }, { x: x + 7, y: y - 7 }, { x: x + 4, y: y + 2 }, { x: x + 2, y: y + 4 }, { x: x + 2, y: y + 7 }, { x: x - 2, y: y + 7 }, { x: x - 2, y: y + 4 }, { x: x - 4, y: y + 2 }], true);
      } else {
        g.fillRoundedRect(x - 5, y - 7, 10, 15, 2);
      }
      g.fillStyle(0xfff7df, 0.95);
      g.fillEllipse(x, y - 6, 9, 4);
      g.lineStyle(1, 0x7f725d, 0.9);
      g.strokeRect(x - 6, y - 8, 12, 17);
    });
  }

  placeCharacter(character, grid) {
    const { x, y } = this.project(grid.col, grid.row);
    character.container.setPosition(x, y);
  }

  createHud() {
    const g = this.add.graphics().setDepth(1000);
    g.fillStyle(0x1b2b23, 0.96);
    g.fillRect(0, 0, 1120, 72);
    g.lineStyle(2, 0xd5a64b, 0.85);
    g.lineBetween(0, 71, 1120, 71);
    this.hudLevel = this.add.text(22, 14, `LEVEL ${this.levelIndex + 1}  /  ${this.level.title.toUpperCase()}`, {
      fontSize: "13px", fontStyle: "bold", color: "#f5d477", letterSpacing: 1
    }).setDepth(1001);
    this.hudPieces = this.add.text(22, 42, "PUZZEL  0 / 20", { fontSize: "12px", color: "#f7eedc" }).setDepth(1001);
    this.hudClock = this.add.text(390, 25, "DIENST  00:00", { fontSize: "13px", fontStyle: "bold", color: "#f7eedc" }).setDepth(1001);
    this.hudHand = this.add.text(620, 25, "HAND: LEEG", { fontSize: "12px", color: "#cbd2c3" }).setDepth(1001);
    this.hudMood = this.add.text(850, 25, "GROUPIEBAR: GEZELLIG", { fontSize: "11px", color: "#b7d28c" }).setDepth(1001);
    this.pauseButton = this.add.text(1094, 25, "II", {
      fontSize: "16px", fontStyle: "bold", color: "#f4c655", backgroundColor: "#304438", padding: { x: 9, y: 5 }
    }).setOrigin(1, 0.5).setDepth(1001).setInteractive({ useHandCursor: true });
    this.pauseButton.on("pointerdown", () => this.togglePause());
    this.ticketText = this.add.text(24, 88, "", {
      fontSize: "11px", color: "#fff2d6", backgroundColor: "#24382d", padding: { x: 8, y: 5 }, lineSpacing: 3
    }).setDepth(1001);
    this.puzzleGraphics = this.add.graphics().setDepth(1001);
    this.prompt = this.add.text(560, 678, "", {
      fontSize: "14px", fontStyle: "bold", color: "#fff6dc", backgroundColor: "#21352a", padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setDepth(1001);
    this.feedbackText = this.add.text(560, 632, "", {
      fontSize: "12px", color: "#f5d477", backgroundColor: "#203229", padding: { x: 8, y: 5 }
    }).setOrigin(0.5).setDepth(1001).setVisible(false);
    this.drawPuzzle();
  }

  drawPuzzle() {
    const g = this.puzzleGraphics;
    g.clear();
    g.fillStyle(0x19271f, 0.93);
    g.fillRoundedRect(920, 88, 178, 89, 6);
    g.lineStyle(1, 0xd3a74d, 0.85);
    g.strokeRoundedRect(920, 88, 178, 89, 6);
    for (let i = 0; i < PUZZLE_GOAL; i += 1) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = 938 + col * 29;
      const y = 116 + row * 14;
      const filled = i < this.pieces;
      const pieceColor = filled ? (i % 2 ? 0xe84f3b : 0x202322) : 0x536052;
      this.drawJigsawPiece(g, x + 12, y + 6, pieceColor, filled ? 1 : 0.55, (col + row) % 2 === 0, 0.9);
    }
    const pending = this.pendingPieces ? ` (+${this.pendingPieces})` : "";
    this.hudPieces?.setText(`PUZZEL  ${this.pieces}${pending} / ${this.level.goal}`);
  }

  drawJigsawPiece(g, x, y, color, alpha = 1, protrudesTop = true, scale = 1) {
    g.fillStyle(color, alpha);
    g.fillRoundedRect(x - 9 * scale, y - 4 * scale, 18 * scale, 8 * scale, 2 * scale);
    g.fillCircle(x, y + (protrudesTop ? -4 : 4) * scale, 3.5 * scale);
    g.fillStyle(0x19271f, 0.98);
    g.fillCircle(x, y + (protrudesTop ? 4 : -4) * scale, 2.7 * scale);
    g.lineStyle(1, alpha > 0.8 ? 0xe7d5bb : 0x879184, alpha > 0.8 ? 0.9 : 0.6);
    g.strokeRoundedRect(x - 9 * scale, y - 4 * scale, 18 * scale, 8 * scale, 2 * scale);
    g.strokeCircle(x, y + (protrudesTop ? -4 : 4) * scale, 3.5 * scale);
  }

  getPuzzleSlot(index) {
    const col = index % 5;
    const row = Math.floor(index / 5);
    return { x: 938 + col * 29 + 12, y: 116 + row * 14 + 6 };
  }

  launchPuzzlePieces(customer, amount) {
    for (let i = 0; i < amount; i += 1) {
      const index = this.pieces + this.pendingPieces;
      const destination = this.getPuzzleSlot(index);
      const source = { x: customer.character.container.x, y: customer.character.container.y - 48 };
      const token = this.add.graphics().setPosition(source.x, source.y).setDepth(1300);
      this.drawJigsawPiece(token, 0, 0, index % 2 ? 0xe84f3b : 0x202322, 1, index % 2 === 0, 1.05);
      this.pendingPieces += 1;
      this.tweens.add({
        targets: token,
        x: destination.x,
        y: destination.y,
        scaleX: 0.82,
        scaleY: 0.82,
        rotation: Math.PI * 2,
        alpha: 0.75,
        duration: 720,
        delay: i * 140,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          token.destroy();
          this.pieces += 1;
          this.pendingPieces -= 1;
          this.drawPuzzle();
          if (this.pieces >= this.level.goal && this.pendingPieces === 0) this.completeLevel();
        }
      });
    }
  }

  updatePuzzleFlights() {
    this.drawPuzzle();
  }

  getBlocked(col, row) {
    return this.solid.has(`${Math.round(col)},${Math.round(row)}`);
  }

  update(_time, delta) {
    if (this.completed) return;
    const seconds = delta / 1000;
    if (!this.paused) {
      this.elapsed += seconds;
      this.updateMovement(seconds);
      this.updateOrders(seconds);
      this.updateCheers(seconds);
      this.updateFryer(seconds);
      this.updatePour(seconds);
      this.updatePuzzleFlights();
      this.updateHud(seconds);
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.interact();
      this.drawHeldItem();
    }
    this.updatePrompt();
  }

  updateMovement(seconds) {
    let dc = 0;
    let dr = 0;
    if (this.keys.A.isDown || this.cursors.left.isDown) dc -= 1;
    if (this.keys.D.isDown || this.cursors.right.isDown) dc += 1;
    if (this.keys.W.isDown || this.cursors.up.isDown) dr -= 1;
    if (this.keys.S.isDown || this.cursors.down.isDown) dr += 1;
    if (!dc && !dr) return;
    const magnitude = Math.hypot(dc, dr);
    dc = dc / magnitude * 3.3 * seconds;
    dr = dr / magnitude * 3.3 * seconds;
    const nextCol = Phaser.Math.Clamp(this.playerGrid.col + dc, 0.45, GRID.columns - 0.45);
    const nextRow = Phaser.Math.Clamp(this.playerGrid.row + dr, 0.45, GRID.rows - 0.45);
    if (!this.getBlocked(nextCol, this.playerGrid.row)) this.playerGrid.col = nextCol;
    if (!this.getBlocked(this.playerGrid.col, nextRow)) this.playerGrid.row = nextRow;
    if (Math.abs(dc) > Math.abs(dr)) this.player.setDirection(dc < 0 ? "left" : "right");
    else this.player.setDirection(dr < 0 ? "back" : "front");
    this.placeCharacter(this.player, this.playerGrid);
    this.player.container.y += Math.sin(this.elapsed * 16) * 1.4;
    this.player.container.setDepth(500 + this.player.container.y);
  }

  updateOrders(seconds) {
    this.customers.forEach((customer) => {
      if (!customer.arrived) return;
      this.updateMemberDrink(customer, seconds);
      this.updateCustomerChatter(customer, seconds);
      if (!customer.order) {
        if (customer.currentDrink || customer.drinkQueue.length) return;
        if (customer.barApproach) {
          this.moveCustomerAlongPath(customer, seconds);
          if (!customer.walkPath.length) {
            customer.barApproach = false;
            customer.orderAtBar = true;
            customer.order = this.makeOrder();
            customer.nextOrderIn = 0;
            customer.chatLine = "Ik bestel aan de bar.";
            customer.chatRemaining = 3;
          }
          this.refreshBubble(customer);
          return;
        }
        customer.wanderCooldown -= seconds;
        if (customer.wanderCooldown <= 0) {
          customer.wanderCooldown = Phaser.Math.FloatBetween(14, 28);
          if (Phaser.Math.Between(0, 2) === 0) this.startCustomerWander(customer);
        }
        if (customer.walkPath.length) this.moveCustomerAlongPath(customer, seconds);
        const activeOrders = this.customers.filter((member) => member.arrived && member.order).length;
        if (activeOrders >= this.level.maxActiveOrders) {
          this.refreshBubble(customer);
          return;
        }
        customer.nextOrderIn -= seconds;
        if (customer.nextOrderIn <= 0) {
          if (Phaser.Math.Between(1, 100) <= 8 && this.startBarOrder(customer)) {
            this.refreshBubble(customer);
            return;
          }
          customer.order = this.makeOrder();
          customer.accepted = false;
          customer.wait = 0;
          customer.angerSpoken = false;
          customer.orderAtBar = false;
          customer.walkPath = [];
          this.refreshBubble(customer);
        }
        this.refreshBubble(customer);
        return;
      }
      customer.wait += seconds;
      if (customer.wait >= 35 && !customer.angerSpoken) {
        customer.angerSpoken = true;
        customer.chatLine = customer.angryLine;
        customer.chatRemaining = 4;
      }
      const base = this.project(customer.grid.col, customer.grid.row);
      const dance = customer.dancing ? Math.sin(this.elapsed * 12 + customer.index) * 7 : Math.sin(this.elapsed * 3 + customer.index) * 1.2;
      customer.character.container.y = base.y + dance;
      customer.character.container.setRotation(customer.dancing ? Math.sin(this.elapsed * 9 + customer.index) * 0.13 : 0);
      customer.character.container.setDepth(490 + customer.character.container.y);
      this.refreshBubble(customer);
    });
  }

  updateCustomerChatter(customer, seconds) {
    customer.chatRemaining = Math.max(0, customer.chatRemaining - seconds);
    if (customer.order || customer.currentDrink || customer.chatRemaining > 0) return;
    customer.chatCooldown -= seconds;
    if (customer.chatCooldown > 0) return;
    customer.chatCooldown = Phaser.Math.FloatBetween(16, 28);
    const nearby = this.customers.some((other) => other !== customer && other.arrived && !other.order
      && Math.abs(other.grid.col - customer.grid.col) + Math.abs(other.grid.row - customer.grid.row) < 3.2);
    if (nearby && Phaser.Math.Between(1, 100) <= 30) {
      customer.chatLine = Phaser.Utils.Array.GetRandom(CHAT_LINES);
      customer.chatRemaining = 2.8;
    }
  }

  startBarOrder(customer) {
    const { startCol, endCol } = this.getBarLayout();
    const barSpots = [{ col: startCol + 1, row: 4 }, { col: endCol - 1, row: 4 }];
    const start = { col: Math.round(customer.grid.col), row: Math.round(customer.grid.row) };
    const destination = barSpots.sort((a, b) =>
      Math.abs(a.col - start.col) + Math.abs(a.row - start.row) - Math.abs(b.col - start.col) - Math.abs(b.row - start.row)
    ).find((spot) => !this.isCustomerCellOccupied(spot.col, spot.row, customer));
    if (!destination) return false;
    const path = this.findCustomerPath(start, destination, customer);
    if (!path.length) return false;
    customer.walkPath = path;
    customer.barApproach = true;
    customer.nextOrderIn = Phaser.Math.FloatBetween(10, 18);
    return true;
  }

  startCustomerWander(customer) {
    const start = { col: Math.round(customer.grid.col), row: Math.round(customer.grid.row) };
    const destinations = [];
    for (let row = 4; row < GRID.rows; row += 1) {
      for (let col = 0; col < GRID.columns; col += 1) {
        if (!this.getBlocked(col, row) && !this.isCustomerCellOccupied(col, row, customer)
          && (col !== start.col || row !== start.row)) destinations.push({ col, row });
      }
    }
    Phaser.Utils.Array.Shuffle(destinations);
    for (const destination of destinations) {
      const path = this.findCustomerPath(start, destination, customer);
      if (path.length > 1 && path.length < 7) {
        customer.walkPath = path;
        return;
      }
    }
  }

  findCustomerPath(start, destination, movingCustomer = null) {
    const keyOf = (point) => `${point.col},${point.row}`;
    const startKey = keyOf(start);
    const destinationKey = keyOf(destination);
    const queue = [start];
    const previous = new Map([[startKey, null]]);
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      if (keyOf(current) === destinationKey) break;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const next = { col: current.col + dc, row: current.row + dr };
        const key = keyOf(next);
        if (next.col < 0 || next.col >= GRID.columns || next.row < 4 || next.row >= GRID.rows) continue;
        if (this.getBlocked(next.col, next.row) || this.isCustomerCellOccupied(next.col, next.row, movingCustomer) || previous.has(key)) continue;
        previous.set(key, keyOf(current));
        queue.push(next);
      }
    }
    if (!previous.has(destinationKey)) return [];
    const path = [];
    let key = destinationKey;
    while (key !== startKey) {
      const [col, row] = key.split(",").map(Number);
      path.unshift({ col, row });
      key = previous.get(key);
    }
    return path;
  }

  isCustomerCellOccupied(col, row, exceptCustomer) {
    return this.customers.some((customer) => {
      if (customer === exceptCustomer || !customer.arrived) return false;
      const current = Math.round(customer.grid.col) === col && Math.round(customer.grid.row) === row;
      const destination = customer.walkPath.at(-1);
      return current || (destination?.col === col && destination?.row === row);
    });
  }

  moveCustomerAlongPath(customer, seconds) {
    const target = customer.walkPath[0];
    if (this.isCustomerCellOccupied(target.col, target.row, customer)) return;
    const dc = target.col - customer.grid.col;
    const dr = target.row - customer.grid.row;
    const distance = Math.hypot(dc, dr);
    const step = 1.25 * seconds;
    if (distance <= step) {
      customer.grid.col = target.col;
      customer.grid.row = target.row;
      customer.walkPath.shift();
    } else {
      customer.grid.col += dc / distance * step;
      customer.grid.row += dr / distance * step;
    }
    const point = this.project(customer.grid.col, customer.grid.row);
    customer.character.container.setPosition(point.x, point.y);
    customer.character.container.setDepth(490 + point.y);
  }

  updateMemberDrink(customer, seconds) {
    if (!customer.currentDrink && customer.drinkQueue.length) {
      customer.currentDrink = customer.drinkQueue.shift();
    }
    if (customer.currentDrink) {
      if (customer.cheersInProgress) {
        customer.cheersElapsed += seconds;
        customer.currentDrink.fill = Math.max(0, 1 - customer.cheersElapsed / 2.4);
      } else {
        customer.currentDrink.elapsed += seconds;
        customer.currentDrink.fill = Math.max(0, 1 - customer.currentDrink.elapsed / customer.currentDrink.duration);
      }
      if (customer.currentDrink.fill <= 0) {
        customer.currentDrink = null;
      }
    }
    const g = customer.drinkGraphic;
    g.clear();
    if (!customer.currentDrink) return;
    const x = customer.character.container.x + 17;
    const y = customer.character.container.y - 18;
    this.drawGlass(g, x, y, customer.currentDrink.productId, customer.currentDrink.fill, 0.9);
    g.setDepth(customer.character.container.depth + 1);
  }

  updateCheers(seconds) {
    if (this.activeCheers) {
      this.activeCheers.remaining -= seconds;
      if (this.activeCheers.remaining <= 0) {
        this.activeCheers.members.forEach((customer) => {
          customer.currentDrink = null;
          customer.drinkQueue = [];
          customer.cheersInProgress = false;
          customer.chatRemaining = 0;
          customer.drinkGraphic.clear();
          if (!customer.order) customer.nextOrderIn = Phaser.Math.FloatBetween(this.level.orderDelay[0], this.level.orderDelay[1]);
        });
        this.activeCheers = null;
      }
      return;
    }
    this.cheersCooldown -= seconds;
    if (this.cheersCooldown > 0) return;
    const drinkers = Phaser.Utils.Array.Shuffle(this.customers.filter((customer) =>
      customer.arrived && !customer.order && customer.currentDrink && !customer.cheersInProgress && !customer.walkPath.length
    ));
    if (drinkers.length < 2 || Phaser.Math.Between(1, 100) > 30) {
      this.cheersCooldown = Phaser.Math.FloatBetween(12, 20);
      return;
    }
    const pair = drinkers.slice(0, 2);
    pair.forEach((customer) => {
      customer.cheersInProgress = true;
      customer.cheersElapsed = 0;
      customer.chatLine = "NIL NOBIS ABSURDUM, ERGO BIBAMUS";
      customer.chatRemaining = 2.4;
      customer.character.setDirection("front");
    });
    this.activeCheers = { members: pair, remaining: 2.4 };
    this.cheersCooldown = Phaser.Math.FloatBetween(45, 70);
  }

  updateFryer(seconds) {
    if (!this.fryer) return;
    this.fryer.elapsed += seconds;
    if (this.fryer.elapsed >= 7) this.fryer.state = "burnt";
    else if (this.fryer.elapsed >= 4) this.fryer.state = "ready";
    this.fryerGraphic.clear();
    const p = this.project(5, 1);
    this.fryerGraphic.fillStyle(0x18251f, 0.95);
    this.fryerGraphic.fillRoundedRect(p.x - 29, p.y - 72, 58, 12, 4);
    this.fryerGraphic.fillStyle(this.fryer.state === "burnt" ? 0xe84f3b : 0xf4c655);
    this.fryerGraphic.fillRoundedRect(p.x - 27, p.y - 70, 54 * Math.min(this.fryer.elapsed / 7, 1), 8, 3);
    this.fryerLabel?.setText(this.fryer.state === "burnt" ? "AANGEBAKKEN!" : this.fryer.state === "ready" ? "KLAAR!" : "FRITUREN");
  }

  updatePour(seconds) {
    if (this.handItem?.kind !== "pouring") return;
    this.handItem.elapsed += seconds;
    this.handItem.fill = Math.min(1, this.handItem.elapsed / 1.45);
    if (this.handItem.fill < 1) return;
    this.handItem.orderItem.prepared = true;
    const productId = this.handItem.productId;
    const customer = this.handItem.customer;
    const orderItem = this.handItem.orderItem;
    if (this.handItem.onTray) {
      this.trayItems.push({ productId, customer, orderItem });
      this.handItem = null;
      this.updateTrayVisuals();
      this.say(`${PRODUCTS[productId].name} staat op het bierblad.`);
      return;
    }
    this.handItem = { kind: "drink", productId, customer };
    this.say(`${PRODUCTS[productId].name} is vol. Breng het naar het Lid.`);
  }

  drawHeldItem() {
    const g = this.heldItemGraphic;
    g.clear();
    if (this.trayEquipped) {
      const trayX = this.player.container.x + (this.player.direction === "left" ? -5 : 5);
      this.drawBeerTray(g, trayX, this.player.container.y - 28, this.trayItems, 0.88);
    }
    if (!this.handItem) {
      g.setDepth(this.player.container.depth + 1);
      return;
    }
    const offset = this.trayEquipped ? (this.player.direction === "left" ? 28 : -28) : (this.player.direction === "left" ? -18 : 18);
    const x = this.player.container.x + offset;
    const y = this.player.container.y - 18;
    if (["glass", "pouring", "drink"].includes(this.handItem.kind)) {
      const fill = this.handItem.kind === "glass" ? 0 : this.handItem.kind === "pouring" ? this.handItem.fill : 1;
      this.drawGlass(g, x, y, this.handItem.productId, fill, 1.2);
    } else {
      const product = PRODUCTS[this.handItem.productId];
      g.fillStyle(product?.color ?? 0xc98b43);
      g.fillEllipse(x, y, 23, 12);
      g.fillStyle(0xf0d899);
      g.fillEllipse(x, y - 4, 21, 8);
      g.lineStyle(1.5, 0xfff0cc, 1);
      g.strokeEllipse(x, y, 23, 12);
    }
    g.setDepth(this.player.container.depth + 1);
  }

  updateHud(deltaSeconds) {
    const total = Math.floor(this.elapsed);
    const minutes = String(Math.floor(total / 60)).padStart(2, "0");
    const seconds = String(total % 60).padStart(2, "0");
    this.hudClock.setText(`DIENST  ${minutes}:${seconds}`);
    this.hudHand.setText(this.trayEquipped ? `BLAD ${this.trayItems.length}/12${this.handItem ? ` + ${this.handLabel(this.handItem)}` : ""}` : `HAND: ${this.handItem ? this.handLabel(this.handItem) : "LEEG"}`);
    const anger = Math.max(...this.customers.filter((c) => c.order).map((c) => c.wait), 0);
    this.hudMood.setText(anger > 58 ? "GROUPIEBAR: ONGEDULDIG" : "GROUPIEBAR: GEZELLIG");
    this.hudMood.setColor(anger > 58 ? "#f0785d" : "#b7d28c");
    if (this.activeCustomer?.order) {
      const names = this.activeCustomer.order.items.map((item) => `${item.delivered ? "[x]" : item.prepared ? "[>]" : "[ ]"} ${PRODUCTS[item.productId].name}`).join("\n");
      this.ticketText.setText(`BON - LID ${this.activeCustomer.index + 1}\n${names}`);
    } else {
      this.ticketText.setText("BON\nNeem een bestelling op bij een Lid.");
    }
    if (this.feedbackTime > 0) this.feedbackTime -= 1 / 60;
    this.feedbackText.setVisible(this.feedbackTime > 0);
    this.feedbackText.setText(this.feedbackTime > 0 ? this.feedback : "");
    this.drawPuzzle();
  }

  handLabel(item) {
    if (item.kind === "glass") return `${PRODUCTS[item.productId].glass.toUpperCase()}`;
    if (item.kind === "pouring") return `${PRODUCTS[item.productId].short} LOOPT VOL`;
    if (item.kind === "rawSnack") return `RAUW ${PRODUCTS[item.productId].short}`;
    if (item.kind === "cookedSnack") return `GEFRITUURD ${PRODUCTS[item.productId].short}`;
    if (item.kind === "burnt") return `AANGEBAKKEN`;
    return PRODUCTS[item.productId]?.short ?? "ITEM";
  }

  updatePrompt() {
    const target = this.getTarget();
    this.interactionGraphic.clear();
    if (this.handItem?.kind === "pouring" && !this.paused) {
      this.prompt.setText("GLAS LOOPT VOL...");
      return;
    }
    if (!target || this.paused) {
      this.prompt.setText(this.paused ? "" : this.trayEquipped ? "Q  BLAD TERUG NAAR DE BAR" : "WASD / PIJLTJES OM TE LOPEN");
      return;
    }
    const p = this.project(target.col, target.row);
    this.interactionGraphic.lineStyle(2, 0xf4c655, 0.95);
    this.interactionGraphic.strokeCircle(p.x, p.y - 14, 27 + Math.sin(this.elapsed * 5) * 2);
    this.prompt.setText(`E  ${this.getActionLabel(target)}`);
  }

  getTarget() {
    const availableStations = this.handItem?.kind === "glass"
      ? this.stations.filter((station) => ["tap", "bottle", "bin"].includes(station.type))
      : this.handItem
        ? this.stations.filter((station) => station.type === "bin")
        : this.stations;
    const targets = [
      ...availableStations.map((station) => ({ ...station, targetType: "station" })),
      ...this.customers.filter((c) => c.arrived && c.order).map((customer) => ({
        col: customer.grid.col, row: customer.grid.row, targetType: "customer", customer
      }))
    ];
    return targets
      .map((target) => ({ ...target, distance: Math.abs(target.col - this.playerGrid.col) + Math.abs(target.row - this.playerGrid.row) }))
      .filter((target) => target.distance < 1.55)
      .sort((a, b) => a.distance - b.distance)[0] ?? null;
  }

  getActionLabel(target) {
    if (target.targetType === "customer") {
      if (!target.customer.accepted) return `BESTELLING OPNEMEN - LID ${target.customer.index + 1}`;
      if (this.trayEquipped && this.trayItems.some((item) => item.customer === target.customer)) return `BIER VAN BLAD - LID ${target.customer.index + 1}`;
      if (this.handItem) return `SERVEREN AAN LID ${target.customer.index + 1}`;
      return `BON BEKIJKEN - LID ${target.customer.index + 1}`;
    }
    const labels = {
      glass: "GLAS PAKKEN", tap: "BIER TAPPEN", bottle: "STROH INSCHENKEN",
      tray: this.trayEquipped ? "BIERBLAD NEERZETTEN" : "BIERBLAD PAKKEN",
      snacks: "SNACK PAKKEN", fryer: this.fryer?.state === "ready" || this.fryer?.state === "burnt" ? "SNACK UIT DE FRITUUR HALEN" : "SNACK IN DE FRITUUR DOEN",
      plate: "SNACK OP BROODJE / BORDJE DOEN", bin: "ITEM WEGGOOIEN"
    };
    return `${target.name.toUpperCase()} - ${labels[target.type] ?? "GEBRUIKEN"}`;
  }

  interact() {
    const target = this.getTarget();
    if (!target) {
      if (this.trayEquipped) return this.say("KUT GROUPIE je laat het blad toch niet in de kroeg achter, je bent alleen dus leg hem achter de bar of hou hem vast");
      this.say("Ga dichter bij een Lid of werkplek staan.");
      return;
    }
    if (target.targetType === "customer") this.interactCustomer(target.customer);
    else this.interactStation(target);
  }

  interactCustomer(customer) {
    if (this.handItem?.kind === "pouring") return this.say("Wacht tot het glas vol is.");
    if (this.handItem?.customer && this.handItem.customer !== customer) return this.say("Maak eerst deze bestelling af.");
    if (!customer.accepted) {
      if (this.handItem && !this.trayEquipped) {
        this.say("Neem eerst de bestelling op.");
        return;
      }
      customer.accepted = true;
      customer.wait = 0;
      this.activeCustomer = customer;
      this.say(`Bestelling opgenomen voor Lid ${customer.index + 1}: ${customer.order.items.map((item) => PRODUCTS[item.productId].name).join(" + ")}.`);
      this.refreshBubble(customer);
      return;
    }
    this.activeCustomer = customer;
    let match;
    if (this.trayEquipped && !this.handItem) {
      const trayIndex = this.trayItems.findIndex((entry) => entry.customer === customer && entry.orderItem.prepared && !entry.orderItem.delivered);
      if (trayIndex < 0) {
        this.say("Er staat geen biertje voor dit Lid op het blad.");
        return;
      }
      match = this.trayItems[trayIndex].orderItem;
      this.trayItems.splice(trayIndex, 1);
      this.updateTrayVisuals();
    } else {
      if (!this.handItem) {
        this.say("Dit Lid wacht op de producten van de bon.");
        return;
      }
      match = customer.order.items.find((item) => item.productId === this.handItem.productId && item.prepared && !item.delivered);
    }
    if (!match) {
      this.say("Dat klopt niet met deze bestelling. Het item blijft in je hand.");
      return;
    }
    match.delivered = true;
    if (PRODUCTS[match.productId].kind === "drink") {
      customer.drinksServed += 1;
      customer.drinkQueue.push({ productId: match.productId, elapsed: 0, duration: Phaser.Math.FloatBetween(11, 18), fill: 1 });
      customer.iconBubble.setVisible(false);
      if (customer.drinksServed >= 2 && !customer.dancing) {
        customer.dancing = true;
        this.say(`Lid ${customer.index + 1} heeft er twee op en gaat dansen!`);
      }
    }
    if (!this.trayEquipped) this.handItem = null;
    if (!customer.dancing) this.say(`${PRODUCTS[match.productId].name} geserveerd!`);
    if (customer.order.items.every((item) => item.delivered)) this.finishOrder(customer);
  }

  interactStation(station) {
    if (station.type === "tray") return this.interactTray();
    if (station.type === "bin") {
      if (!this.handItem) return this.say("De afvalbak is leeg.");
      this.handItem = null;
      return this.say("Weggegooid. Je kunt opnieuw beginnen.");
    }
    if (!this.activeCustomer?.order) return this.say("Neem eerst een bestelling op bij een Lid.");
    if (station.type === "glass") return this.takeGlass(station.productId);
    if (station.type === "tap") return this.useTap(station.productId);
    if (station.type === "bottle") return this.useBottle(station.productId);
    if (station.type === "snacks") return this.takeSnack();
    if (station.type === "fryer") return this.useFryer();
    if (station.type === "plate") return this.plateSnack();
  }

  interactTray() {
    if (this.handItem) return this.say("Zet eerst het glas weg voordat je het bierblad pakt.");
    if (this.trayEquipped) {
      this.trayEquipped = false;
      this.say(`Het bierblad staat achter de bar (${this.trayItems.length}/12).`);
    } else {
      this.trayEquipped = true;
      this.say("Bierblad gepakt. Er passen 12 biertjes op.");
    }
    this.updateTrayVisuals();
  }

  nextPending(kind) {
    return this.activeCustomer?.order?.items.find((item) => PRODUCTS[item.productId].kind === kind && !item.prepared && !item.delivered);
  }

  takeGlass(productId) {
    if (this.handItem) return this.say("Je handen zijn vol.");
    if (this.trayEquipped && this.trayItems.length >= 12) return this.say("Het bierblad zit vol. Serveer eerst een paar biertjes.");
    this.handItem = { kind: "glass", productId, customer: this.activeCustomer, onTray: this.trayEquipped };
    this.say(`${PRODUCTS[productId].glass} gepakt. Zoek de tap voor ${PRODUCTS[productId].name}.`);
  }

  useTap(productId) {
    if (this.handItem?.kind !== "glass") return this.say("Pak eerst het juiste glas uit het glazenrek.");
    if (this.handItem.productId === "stroh") return this.say("Stroh 80 komt uit de fles, niet uit de biertap.");
    if (this.handItem.productId !== productId) return this.say(`Verkeerd glas. Pak een ${PRODUCTS[productId].glass}.`);
    const item = this.activeCustomer.order.items.find((entry) => entry.productId === productId && !entry.prepared && !entry.delivered);
    if (!item) return this.say("Dit drankje staat niet meer op de bon.");
    this.handItem = { kind: "pouring", productId, fill: 0, elapsed: 0, orderItem: item, customer: this.activeCustomer, onTray: this.trayEquipped };
    this.say(`${PRODUCTS[productId].name} wordt getapt...`);
  }

  useBottle(productId) {
    if (this.handItem?.kind !== "glass" || this.handItem.productId !== productId) return this.say(`Pak eerst het ${PRODUCTS[productId].glass}.`);
    if (productId !== "stroh") return this.say("Deze fles hoort niet bij dit drankje.");
    const item = this.activeCustomer.order.items.find((entry) => entry.productId === "stroh" && !entry.prepared && !entry.delivered);
    if (!item) return this.say("Geen Stroh meer op deze bon.");
    this.handItem = { kind: "pouring", productId, fill: 0, elapsed: 0, orderItem: item, customer: this.activeCustomer, onTray: this.trayEquipped };
    this.say("Stroh 80 wordt ingeschonken...");
  }

  takeSnack() {
    if (this.handItem) return this.say("Je handen zijn vol.");
    if (this.fryer) return this.say("De frituur is nog bezig. Houd de timer in de gaten.");
    const item = this.nextPending("snack");
    if (!item) return this.say("Deze bon heeft geen snack meer nodig.");
    this.handItem = { kind: "rawSnack", productId: item.productId };
    this.say(`${PRODUCTS[item.productId].name} gepakt. Leg hem in de frituur.`);
  }

  useFryer() {
    if (this.handItem?.kind === "rawSnack") {
      if (this.fryer) return this.say("De frituur is al bezet.");
      this.fryer = { productId: this.handItem.productId, state: "cooking", elapsed: 0 };
      this.handItem = null;
      this.fryerLabel = this.add.text(this.project(5, 1).x, this.project(5, 1).y - 59, "FRITUREN", {
        fontSize: "9px", fontStyle: "bold", color: "#fff2d6", backgroundColor: "#27392e", padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(901);
      this.say("De snack zit in de frituur. Haal hem er rond 4 seconden uit!");
      return;
    }
    if (!this.fryer) return this.say("Pak eerst een snack uit de voorraad.");
    if (this.fryer.state === "cooking") return this.say("Nog niet klaar. De timer loopt.");
    const fried = this.fryer;
    this.fryer = null;
    this.fryerGraphic.clear();
    this.fryerLabel?.destroy();
    this.fryerLabel = null;
    this.handItem = { kind: fried.state === "burnt" ? "burnt" : "cookedSnack", productId: fried.productId };
    this.say(fried.state === "burnt" ? "Aangebrand! Gooi hem weg en maak een nieuwe." : "Mooi goudbruin. Leg hem op een broodje of bordje.");
  }

  plateSnack() {
    if (this.handItem?.kind !== "cookedSnack") return this.say("Haal eerst een gare snack uit de frituur.");
    const item = this.activeCustomer.order.items.find((entry) => entry.productId === this.handItem.productId && !entry.prepared && !entry.delivered);
    if (!item) return this.say("Deze snack staat niet op de bon.");
    item.prepared = true;
    this.handItem = { kind: "snack", productId: item.productId };
    this.say(`${PRODUCTS[item.productId].name} opgemaakt. Serveer hem bij het juiste Lid.`);
  }

  finishOrder(customer) {
    const size = customer.order.items.length;
    const earned = Math.min(3, size, this.level.goal - this.pieces - this.pendingPieces);
    customer.order = null;
    customer.accepted = false;
    customer.wait = 0;
    customer.nextOrderIn = Phaser.Math.FloatBetween(this.level.orderDelay[0], this.level.orderDelay[1]);
    customer.orderAtBar = false;
    customer.bubble.setVisible(false);
    if (this.activeCustomer === customer) this.activeCustomer = null;
    this.launchPuzzlePieces(customer, earned);
    this.say(`Bon compleet: ${earned} puzzelstuk${earned === 1 ? "" : "ken"} verdiend!`);
  }

  completeLevel() {
    this.completed = true;
    try {
      const unlocked = Math.max(this.levelIndex + 1, Number(localStorage.getItem("groupieCookedUnlocked") || 0));
      localStorage.setItem("groupieCookedUnlocked", String(Math.min(LEVELS.length - 1, unlocked)));
    } catch { /* Progress still works for this session if storage is unavailable. */ }
    const g = this.add.graphics().setDepth(1200);
    g.fillStyle(0x122019, 0.86);
    g.fillRect(0, 0, 1120, 720);
    g.fillStyle(0xf4c655);
    g.fillRoundedRect(320, 220, 480, 280, 12);
    g.fillStyle(0x213329);
    g.fillRoundedRect(328, 228, 464, 264, 9);
    this.add.text(560, 286, "DIENST GESLAAGD", { fontSize: "16px", fontStyle: "bold", color: "#f4c655", letterSpacing: 3 }).setOrigin(0.5).setDepth(1201);
    this.add.text(560, 337, "De puzzel is compleet!", { fontFamily: "Georgia, serif", fontSize: "36px", color: "#f7eedc" }).setOrigin(0.5).setDepth(1201);
    const nextLabel = this.levelIndex < LEVELS.length - 1 ? "VOLGEND LEVEL" : "TERUG NAAR MENU";
    const button = this.add.rectangle(560, 427, 230, 52, 0xe84f3b).setDepth(1201).setInteractive({ useHandCursor: true });
    this.add.text(560, 427, nextLabel, { fontSize: "14px", fontStyle: "bold", color: "#fff5df", letterSpacing: 1 }).setOrigin(0.5).setDepth(1202);
    button.on("pointerdown", () => {
      if (this.levelIndex < LEVELS.length - 1) this.scene.restart({ level: this.levelIndex + 1 });
      else this.scene.start("menu");
    });
  }

  togglePause() {
    if (this.completed) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.pauseShade = this.add.rectangle(560, 360, 1120, 720, 0x101a15, 0.82).setDepth(1100);
      this.pauseText = this.add.text(560, 310, "EVEN OP ADEM KOMEN", {
        fontFamily: "Georgia, serif", fontSize: "38px", color: "#f7eedc"
      }).setOrigin(0.5).setDepth(1101);
      this.pauseHint = this.add.text(560, 376, "Druk op Esc om verder te gaan", {
        fontSize: "15px", color: "#f4c655"
      }).setOrigin(0.5).setDepth(1101);
      const menu = this.add.text(560, 440, "TERUG NAAR MENU", { fontSize: "13px", color: "#d8dfce" })
        .setOrigin(0.5).setDepth(1101).setInteractive({ useHandCursor: true });
      menu.on("pointerdown", () => this.scene.start("menu"));
    } else {
      this.pauseShade?.destroy();
      this.pauseText?.destroy();
      this.pauseHint?.destroy();
      this.children.list.filter((child) => child.text === "TERUG NAAR MENU").forEach((child) => child.destroy());
    }
  }

  say(message) {
    this.feedback = message;
    this.feedbackTime = 3.2;
  }
}