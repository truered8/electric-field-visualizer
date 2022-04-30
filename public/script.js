import { PointCharge, EM } from "./physics.js";
import { Graphics } from "./graphics.js";

const canvas = document.querySelector(".myCanvas");
const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);

const ctx = canvas.getContext("2d");
ctx.lineWidth = 2;
const potentialRes = 5;
const fieldRes = 35;

const maxCharge = 3;

const graphics = new Graphics(ctx, width, height);
let maxV = 0;
let maxE = 0;
let V = new Array(width);
let E = new Array(width);
let oldCanvas = new Array(width);

const isMobile = window.matchMedia(
  "only screen and (max-width: 760px)"
).matches;
console.log(isMobile);

const charges = isMobile
  ? [new PointCharge(width / 2, height / 2, 1)]
  : [
      new PointCharge(width / 2 - 200, height / 2, 4),
      new PointCharge(width / 2 + 200, height / 2, -5),
    ];

/** Compute the electric potential at every point. */
const computePotential = () => {
  // Compute the potential at every point using superposition
  for (let x = 0; x < width; x += potentialRes) {
    for (let y = 0; y < height; y += potentialRes) {
      let v = charges.length
        ? charges
            .map((charge) => EM.electric_potential(charge, { x, y }))
            .reduce((prev, cur) => prev + cur)
        : 0;

      // Take the square root so it there is more variation
      v = v > 0 ? Math.pow(v, 0.5) : -1 * Math.pow(-1 * v, 0.5);
      if (isFinite(v)) {
        V[x][y] = v;
        if (Math.abs(v) > maxV) maxV = Math.abs(v);
      } else {
        charges.pop();
        x = y = 0;
      }
    }
  }
  console.log(`Maximum electric potential magnitude: ${maxV}`);
};

/** Compute the electric field at every point. */
const computeField = () => {
  // Compute the electric field at every point using superposition
  for (let x = 0; x < width; x += fieldRes) {
    for (let y = 0; y < height; y += fieldRes) {
      let electric_field = charges
        .map((charge) => EM.electric_field(charge, { x, y }))
        .reduce((prev, cur) => {
          return { x: prev.x + cur.x, y: prev.y + cur.y };
        });

      electric_field = {
        x:
          electric_field.x > 0
            ? Math.sqrt(electric_field.x)
            : -1 * Math.sqrt(-1 * electric_field.x),
        y:
          electric_field.y > 0
            ? Math.sqrt(electric_field.y)
            : -1 * Math.sqrt(-1 * electric_field.y),
      };

      const ef_magnitude = Math.hypot(electric_field.x, electric_field.y);
      if (ef_magnitude > maxE) maxE = ef_magnitude;

      E[x][y] = electric_field;
    }
  }

  console.log(`Maximum electic field magnitude: ${maxE}`);
};

/** Visualize the electric potential and field. */
const render = () => {
  graphics.clearCanvas(1);

  // Draw heat map of electric potential
  for (let x = 0; x < width; x += potentialRes) {
    for (let y = 0; y < height; y += potentialRes) {
      const scaleFactor = isMobile ? 5 : 10;
      const targetBrightness = Math.abs(V[x][y] / maxV) * scaleFactor;

      ctx.fillStyle =
        V[x][y] > 0
          ? `rgba(255, 0, 0, ${targetBrightness})`
          : `rgba(0, 0, 255, ${targetBrightness})`;
      ctx.fillRect(x, y, potentialRes, potentialRes);
      oldCanvas[x][y] = ctx.fillStyle;
    }
  }

  // Draw arrows pointing in the direction of the electric field
  for (let x = 0; x < width; x += fieldRes) {
    for (let y = 0; y < height; y += fieldRes) {
      const ef_magnitude = Math.hypot(E[x][y].x, E[x][y].y);

      const scaleFactor = isMobile ? 5 : 10;
      const brightness = Math.abs(ef_magnitude / maxE) * scaleFactor;
      const [dx, dy] = [E[x][y].x / ef_magnitude, E[x][y].y / ef_magnitude];
      const [fromx, fromy, tox, toy] = [
        x + fieldRes / 2 - dx,
        y + fieldRes / 2 - dy,
        x + fieldRes / 2 + dx,
        y + fieldRes / 2 + dy,
      ];

      ctx.strokeStyle = `rgba(255, 255, 255, ${brightness})`;
      graphics.arrow(fromx, fromy, tox, toy, fieldRes / 6);
      ctx.stroke();
    }
  }
};

const init = () => {
  for (let x = 0; x < width; x++) V[x] = new Array(height);
  for (let x = 0; x < width; x++) E[x] = new Array(height);
  for (let x = 0; x < width; x++) oldCanvas[x] = new Array(height);
  graphics.clearCanvas(1);
  update();
};

const update = () => {
  computePotential();
  computeField();
  render();
};

canvas.addEventListener(
  "click",
  (e) => {
    let newCharge = Math.random() * maxCharge;
    if (isMobile) newCharge = (newCharge * 2 - maxCharge) * 0.4;
    charges.push(new PointCharge(e.clientX, e.clientY, newCharge));
    update();
  },
  false
);

canvas.addEventListener(
  "contextmenu",
  (e) => {
    e.preventDefault();
    const newCharge = -1 * Math.random() * maxCharge;
    charges.push(new PointCharge(e.clientX, e.clientY, newCharge));
    update();
  },
  false
);

init();
