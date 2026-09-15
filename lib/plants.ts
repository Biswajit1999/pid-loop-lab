import type { PlantConfig } from "./types";

export const defaultPlant: PlantConfig = {
  kind: "fopdt",
  gain: 1,
  tau: 2,
  deadTime: 0.35,
  omegaN: 1.5,
  zeta: 0.55,
  mass: 1,
  damping: 0.6,
  spring: 1.8,
  resistance: 2,
  inductance: 0.5,
  motorConstant: 0.12,
  inertia: 0.02,
  numerator: [1],
  denominator: [1, 2, 1],
};

export interface PlantModel {
  readonly state: number[];
  output(): number;
  derivative(state: number[], input: number): number[];
  setState(next: number[]): void;
}

class StatePlant implements PlantModel {
  state: number[];
  constructor(initial: number[], private readonly outputFn: (state: number[]) => number, private readonly derivativeFn: (state: number[], input: number) => number[]) {
    this.state = initial;
  }
  output(): number { return this.outputFn(this.state); }
  derivative(state: number[], input: number): number[] { return this.derivativeFn(state, input); }
  setState(next: number[]): void { this.state = next; }
}

export function validateTransferFunction(numerator: number[], denominator: number[]): string | null {
  if (!numerator.length || !denominator.length) return "Numerator and denominator cannot be empty.";
  if (![...numerator, ...denominator].every(Number.isFinite)) return "All coefficients must be finite numbers.";
  if (denominator[0] === 0) return "The leading denominator coefficient cannot be zero.";
  const trim = (values: number[]) => values.slice(values.findIndex((v) => v !== 0));
  const n = trim(numerator);
  const d = trim(denominator);
  if (!n.length) return "The numerator cannot be identically zero.";
  if (n.length >= d.length) return "Only strictly proper transfer functions are supported (numerator degree < denominator degree).";
  if (d.length < 2) return "A dynamic denominator of order one or higher is required.";
  return null;
}

function transferFunctionPlant(config: PlantConfig): PlantModel {
  const error = validateTransferFunction(config.numerator, config.denominator);
  if (error) throw new Error(error);
  const lead = config.denominator[0];
  const denominator = config.denominator.map((v) => v / lead);
  const order = denominator.length - 1;
  const numerator = Array(order - config.numerator.length).fill(0).concat(config.numerator.map((v) => v / lead));
  const c = [...numerator].reverse();
  return new StatePlant(Array(order).fill(0), (x) => x.reduce((sum, value, i) => sum + c[i] * value, 0), (x, u) => {
    const dx = Array(order).fill(0) as number[];
    for (let i = 0; i < order - 1; i += 1) dx[i] = x[i + 1];
    dx[order - 1] = u - denominator.slice(1).reverse().reduce((sum, a, i) => sum + a * x[i], 0);
    return dx;
  });
}

export function createPlant(config: PlantConfig): PlantModel {
  const positive = (value: number, name: string) => {
    if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be positive and finite.`);
  };
  switch (config.kind) {
    case "first-order":
    case "fopdt":
    case "thermal":
      positive(config.tau, "Time constant");
      return new StatePlant([0], (x) => x[0], (x, u) => [(config.gain * u - x[0]) / config.tau]);
    case "second-order":
      positive(config.omegaN, "Natural frequency");
      if (!Number.isFinite(config.zeta) || config.zeta < 0) throw new Error("Damping ratio must be finite and non-negative.");
      return new StatePlant([0, 0], (x) => x[0], (x, u) => [x[1], config.gain * config.omegaN ** 2 * u - 2 * config.zeta * config.omegaN * x[1] - config.omegaN ** 2 * x[0]]);
    case "integrator":
      return new StatePlant([0], (x) => x[0], (_x, u) => [config.gain * u]);
    case "mass-spring-damper":
      positive(config.mass, "Mass");
      positive(config.spring, "Spring constant");
      return new StatePlant([0, 0], (x) => x[0], (x, u) => [x[1], (u - config.damping * x[1] - config.spring * x[0]) / config.mass]);
    case "dc-motor":
      positive(config.resistance, "Resistance");
      positive(config.inductance, "Inductance");
      positive(config.inertia, "Inertia");
      return new StatePlant([0, 0], (x) => x[1], (x, voltage) => [
        (voltage - config.resistance * x[0] - config.motorConstant * x[1]) / config.inductance,
        (config.motorConstant * x[0] - config.damping * x[1]) / config.inertia,
      ]);
    case "transfer-function":
      return transferFunctionPlant(config);
  }
}

export function rk4Step(plant: PlantModel, input: number, dt: number): void {
  const x = plant.state;
  const add = (base: number[], slope: number[], scale: number) => base.map((v, i) => v + slope[i] * scale);
  const k1 = plant.derivative(x, input);
  const k2 = plant.derivative(add(x, k1, dt / 2), input);
  const k3 = plant.derivative(add(x, k2, dt / 2), input);
  const k4 = plant.derivative(add(x, k3, dt), input);
  plant.setState(x.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])));
}
