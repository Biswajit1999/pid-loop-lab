import { describe, expect, it } from "vitest";
import { DiscretePID, parallelToStandard, standardToParallel } from "../lib/pid";
import type { PIDConfig } from "../lib/types";

const base: PIDConfig = {
  kp: 2, ki: 0, kd: 0, sampleTime: .1, derivativeMode: "error", tf: 0,
  outputMin: -100, outputMax: 100, integratorMin: -100, integratorMax: 100,
  antiWindup: "off", backCalculationGain: 1, beta: 1, gamma: 1,
};

describe("DiscretePID", () => {
  it("computes a P-only update", () => {
    expect(new DiscretePID(base).update(3, 1).output).toBeCloseTo(4);
  });
  it("accumulates integral action at the controller sample period", () => {
    const pid = new DiscretePID({ ...base, kp: 0, ki: 2 });
    expect(pid.update(1, 0).i).toBeCloseTo(.2);
    expect(pid.update(1, 0).i).toBeCloseTo(.4);
  });
  it("calculates derivative on measurement without a setpoint kick", () => {
    const pid = new DiscretePID({ ...base, kp: 0, kd: 1, derivativeMode: "measurement" });
    expect(pid.update(0, 0).d).toBe(0);
    expect(pid.update(5, 0).d).toBe(0);
    expect(pid.update(5, 1).d).toBeCloseTo(-10);
  });
  it("filters derivative action", () => {
    const raw = new DiscretePID({ ...base, kp: 0, kd: 1, derivativeMode: "measurement" });
    const filtered = new DiscretePID({ ...base, kp: 0, kd: 1, tf: .4, derivativeMode: "measurement" });
    raw.update(0, 0); filtered.update(0, 0);
    expect(Math.abs(filtered.update(0, 1).d)).toBeLessThan(Math.abs(raw.update(0, 1).d));
  });
  it("clamps output and prevents integral from driving farther into saturation", () => {
    const pid = new DiscretePID({ ...base, kp: 10, ki: 5, outputMin: -1, outputMax: 1, antiWindup: "clamp" });
    const output = pid.update(1, 0);
    expect(output.output).toBe(1);
    expect(output.saturated).toBe(true);
    expect(pid.snapshot().integral).toBe(0);
  });
  it("back-calculation unwinds the integrator", () => {
    const pid = new DiscretePID({ ...base, kp: 10, ki: 2, outputMin: -1, outputMax: 1, antiWindup: "back-calculation", backCalculationGain: 2 });
    pid.update(1, 0);
    expect(pid.snapshot().integral).toBeLessThan(0);
  });
});

describe("controller forms", () => {
  it("converts standard and parallel forms", () => {
    const parallel = standardToParallel(3, 2, .5);
    expect(parallel).toEqual({ kp: 3, ki: 1.5, kd: 1.5 });
    expect(parallelToStandard(parallel.kp, parallel.ki, parallel.kd)).toEqual({ kc: 3, ti: 2, td: .5 });
  });
  it("rejects singular inverse conversion", () => expect(() => parallelToStandard(2, 0, 1)).toThrow());
});
