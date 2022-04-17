export class PointCharge {
  constructor(x, y, charge = 1) {
    this.x = x;
    this.y = y;
    this.charge = charge;
  }
}

export class Physics {
  /** Relative permittivity of free space. */
  static epsilon_0 = 8.8541878128e-12;

  /** Calculates the electric field from `pointCharge` at `pos`. */
  static electric_field = (pointCharge, pos) => {
    const { x, y } = pos;
    const r = Math.sqrt(
      Math.pow(pointCharge.x - x, 2) + Math.pow(pointCharge.y - y, 2)
    );
    const E = pointCharge.charge / (4 * Math.PI * this.epsilon_0 * r * r);
    return {
      x: (E * (x - pointCharge.x)) / r,
      y: (E * (y - pointCharge.y)) / r,
    };
  };

  /** Calculates the electric potential from `pointCharge` at `pos`. */
  static electric_potential = (pointCharge, pos) => {
    const { x, y } = pos;
    const r = Math.sqrt(
      Math.pow(pointCharge.x - x, 2) + Math.pow(pointCharge.y - y, 2)
    );
    return pointCharge.charge / (4 * Math.PI * this.epsilon_0 * r);
  };
}
