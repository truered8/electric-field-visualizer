import { PointCharge, Physics } from "./util.js";

const canvas = document.querySelector(".myCanvas");
const width = (canvas.width = window.innerWidth);
const height = (canvas.height = window.innerHeight);

const ctx = canvas.getContext("2d");
ctx.lineWidth = 2;

const maxCharge = 3;

const isMobile = window.matchMedia(
  "only screen and (max-width: 760px)"
).matches;
console.log(isMobile);

const charges = isMobile
  ? []
  : [
      new PointCharge(width / 2 - 200, height / 2, 4),
      new PointCharge(width / 2 + 200, height / 2, -5),
      new PointCharge(width / 2 + 200, height / 2 - 100, 2),
    ];

/** Draw a heat map of the electric potential at every point. */
const visualizePotential = (res = 5) => {
  let maxV = 0;
  let V = new Array(width);
  for (let x = 0; x < width; x++) V[x] = new Array(height);

  // Calculate the potential at every point using superposition
  for (let x = 0; x < width; x += res) {
    for (let y = 0; y < height; y += res) {
      let v = charges.length
        ? charges
            .map((charge) => Physics.electric_potential(charge, { x, y }))
            .reduce((prev, cur) => prev + cur)
        : 1;

      // Take the square root so it there is more variation
      v = v > 0 ? Math.pow(v, 0.5) : -1 * Math.pow(-1 * v, 0.5);
      if (Math.abs(v) > maxV) maxV = Math.abs(v);
      V[x][y] = v;
      if (!isFinite(v)) charges.pop();
    }
  }

  // Draw the potential, scaling based on the max potential
  for (let x = 0; x < width; x += res) {
    for (let y = 0; y < height; y += res) {
      const scaleFactor = isMobile ? 5 : 15;
      const brightness = isFinite(V[x][y])
        ? Math.abs(V[x][y] / (maxV / scaleFactor))
        : 1;
      ctx.fillStyle =
        V[x][y] > 0
          ? `rgba(255, 0, 0, ${brightness})`
          : `rgba(0, 0, 255, ${brightness})`;
      ctx.fillRect(x, y, res, res);
    }
  }
  console.log(`Maximum electric potential magnitude: ${maxV}`);
};

/** Visualize the electric field at every point. */
const visualizeField = (res = 35) => {
  let maxE = 0;
  let E = new Array(width);
  for (let x = 0; x < width; x++) E[x] = new Array(height);

  // Calculate the electric field at every point using superposition
  for (let x = 0; x < width; x += res) {
    for (let y = 0; y < height; y += res) {
      let electric_field = charges
        .map((charge) => Physics.electric_field(charge, { x, y }))
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

  // Draw arrows pointing in the direction of the electric field
  for (let x = 0; x < width; x += res) {
    for (let y = 0; y < height; y += res) {
      const ef_magnitude = Math.hypot(E[x][y].x, E[x][y].y);

      const brightness = Math.abs(ef_magnitude / (maxE / 10));
      const [dx, dy] = [E[x][y].x / ef_magnitude, E[x][y].y / ef_magnitude];
      const [fromx, fromy, tox, toy] = [
        x + res / 2 - dx,
        y + res / 2 - dy,
        x + res / 2 + dx,
        y + res / 2 + dy,
      ];

      ctx.strokeStyle = `rgba(255, 255, 255, ${brightness})`;
      canvas_arrow(fromx, fromy, tox, toy, res / 6);
      ctx.stroke();
    }
  }
  console.log(`Maximum electic field magnitude: ${maxE}`);
};

// From https://stackoverflow.com/a/6333775
const canvas_arrow = (fromx, fromy, tox, toy, headlen = 10) => {
  var dx = tox - fromx;
  var dy = toy - fromy;
  var angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 6),
    toy - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 6),
    toy - headlen * Math.sin(angle + Math.PI / 6)
  );
};

const clearCanvas = () => {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
};

canvas.addEventListener(
  "click",
  (e) => {
    let newCharge = Math.random() * maxCharge;
    if (isMobile) newCharge = (newCharge * 2 - maxCharge) * 0.4;
    charges.push(new PointCharge(e.clientX, e.clientY, newCharge));

    clearCanvas();
    visualizePotential();
    visualizeField();
  },
  false
);

canvas.addEventListener(
  "contextmenu",
  (e) => {
    e.preventDefault();
    const newCharge = -1 * Math.random() * maxCharge;
    charges.push(new PointCharge(e.clientX, e.clientY, newCharge));

    clearCanvas();
    visualizePotential();
    visualizeField();
  },
  false
);

clearCanvas();
visualizePotential();
visualizeField();
