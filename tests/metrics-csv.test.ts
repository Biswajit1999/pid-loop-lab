import { describe, expect, it } from "vitest";
import { calculateMetrics } from "../lib/metrics";
import { parseCsv } from "../lib/csv";
import type { SimulationSample } from "../lib/types";

const sample = (t: number, pv: number): SimulationSample => ({ t, pv, measured: pv, setpoint: 1, error: 1 - pv, p: 0, i: 0, d: 0, unclamped: 0, output: 0, actuator: 0, disturbance: 0, noise: 0, saturated: false, state: [pv], voltage: 0, current: 0, power: 0 });

describe("metrics", () => {
  it("computes error integrals and a settling time", () => {
    const metrics = calculateMetrics([sample(0, 0), sample(1, .5), sample(2, .91), sample(3, .99), sample(4, 1)]);
    expect(metrics.iae).toBeGreaterThan(0);
    expect(metrics.ise).toBeGreaterThan(0);
    expect(metrics.settlingTime).toBe(3);
    expect(metrics.overshootPercent).toBe(0);
  });
  it("returns undefined metrics for insufficient data", () => expect(calculateMetrics([]).riseTime).toBeNull());
});

describe("CSV parser", () => {
  it("maps common column names", () => {
    const parsed = parseCsv("time,setpoint,pv,mv\n0,1,0,0\n1,1,.5,.7");
    expect(parsed.processValue).toEqual([0, .5]);
    expect(parsed.controllerOutput).toEqual([0, .7]);
  });
  it("rejects non-increasing time", () => expect(() => parseCsv("time,pv\n0,0\n0,1")).toThrow(/strictly increasing/));
  it("accepts tab-delimited input", () => expect(parseCsv("time\tpv\n0\t0\n1\t1").time).toEqual([0, 1]));
});
