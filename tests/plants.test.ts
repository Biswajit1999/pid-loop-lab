import { describe, expect, it } from "vitest";
import { createPlant, defaultPlant, rk4Step, validateTransferFunction } from "../lib/plants";

describe("plant integration", () => {
  it("matches the first-order analytical unit-step response", () => {
    const plant = createPlant({ ...defaultPlant, kind: "first-order", gain: 1, tau: 2 });
    const dt = .01;
    for (let i = 0; i < 200; i += 1) rk4Step(plant, 1, dt);
    expect(plant.output()).toBeCloseTo(1 - Math.exp(-1), 7);
  });
  it("produces a finite second-order response", () => {
    const plant = createPlant({ ...defaultPlant, kind: "second-order", omegaN: 2, zeta: .7 });
    for (let i = 0; i < 500; i += 1) rk4Step(plant, 1, .01);
    expect(plant.output()).toBeGreaterThan(.9);
    expect(Number.isFinite(plant.output())).toBe(true);
  });
  it("rejects improper and invalid transfer functions", () => {
    expect(validateTransferFunction([1, 1], [1, 2])).toMatch(/strictly proper/);
    expect(validateTransferFunction([1], [0, 1])).toMatch(/leading denominator/);
    expect(validateTransferFunction([1], [1, 2, 1])).toBeNull();
  });
});
