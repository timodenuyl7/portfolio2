export class Character {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.isPlayer = Boolean(options.isPlayer);
    this.hair = options.hair ?? 0x33231e;
    this.skin = options.skin ?? 0xe5ae83;
    this.seed = options.seed ?? 0;
    this.container = scene.add.container(0, 0);
    this.art = scene.add.graphics();
    this.container.add(this.art);
    this.direction = "front";
    this.draw();
  }

  setDirection(direction) {
    if (this.direction === direction) return;
    this.direction = direction;
    this.draw();
  }

  draw() {
    const g = this.art;
    g.clear();
    g.fillStyle(0x101b16, 0.28);
    g.fillEllipse(0, -2, 36, 12);
    g.fillStyle(0x272b27);
    g.fillRoundedRect(-10, -13, 8, 15, 3);
    g.fillRoundedRect(2, -13, 8, 15, 3);
    if (this.isPlayer) {
      g.fillStyle(0x111312);
      g.fillRoundedRect(-15, -43, 30, 34, 7);
      g.fillRoundedRect(-21, -37, 7, 18, 3);
      g.fillRoundedRect(14, -37, 7, 18, 3);
      g.fillStyle(this.skin);
      g.fillCircle(-17.5, -18, 3);
      g.fillCircle(17.5, -18, 3);
      if (this.direction === "back") {
        g.fillStyle(0xd90000, 1);
        g.fillPoints([
          { x: -15, y: -9 }, { x: -7, y: -9 }, { x: 2, y: -43 }, { x: -2, y: -43 }
        ], true);
        g.fillPoints([
          { x: -2, y: -43 }, { x: 5, y: -43 }, { x: 15, y: -9 }, { x: 7, y: -9 }
        ], true);
        g.fillPoints([
          { x: -8, y: -27 }, { x: -4, y: -32 }, { x: 9, y: -17 }, { x: 12, y: -11 }, { x: 4, y: -16 }
        ], true);
      } else {
        g.fillStyle(0xe7493a);
        g.fillCircle(-6, -34, 3);
        g.fillCircle(-2, -34, 3);
        g.fillTriangle(-9, -33, 1, -33, -4, -26);
        this.drawStar(g, 7, -33, 5, 2.4, 0xe7493a);
      }
    } else {
      g.fillStyle(0x111312);
      g.fillRoundedRect(-15, -43, 30, 34, 6);
      g.fillStyle(0xd94037);
      g.fillRect(-14, -33, 28, 12);
      g.fillStyle(0xf3eddf);
      g.fillTriangle(-6, -43, 6, -43, 0, -36);
      g.fillStyle(0x111312);
      g.fillRoundedRect(-21, -37, 7, 18, 3);
      g.fillRoundedRect(14, -37, 7, 18, 3);
      g.fillStyle(this.skin);
      g.fillCircle(-17.5, -18, 3);
      g.fillCircle(17.5, -18, 3);
    }
    g.fillStyle(this.skin);
    g.fillCircle(0, -50, 12);
    g.fillStyle(this.hair);
    if (this.seed % 3 === 0) {
      g.fillEllipse(0, -57, 27, 13);
    } else if (this.seed % 3 === 1) {
      g.fillRoundedRect(-13, -62, 26, 10, 5);
      g.fillRect(-12, -57, 5, 12);
    } else {
      g.fillEllipse(-1, -59, 22, 14);
      g.fillCircle(9, -54, 6);
    }
    if (this.direction !== "back") {
      g.fillStyle(0x34251f);
      g.fillCircle(-4, -50, 1.4);
      g.fillCircle(4, -50, 1.4);
      g.lineStyle(1.5, 0x9a5147, 1);
      g.lineBetween(-2, -44, 2, -44);
    }
  }

  drawStar(g, cx, cy, outer, inner, color) {
    const points = [];
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    g.fillStyle(color);
    g.fillPoints(points, true);
  }
}