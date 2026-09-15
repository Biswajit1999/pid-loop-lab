import { describe, expect, it } from "vitest";
import { defaultPID } from "../lib/pid";
import { defaultPlant } from "../lib/plants";
import { defaultEffects, defaultSimulation, simulate } from "../lib/simulation";

describe("closed-loop simulation", () => {
  it("is deterministic for a fixed seed", () => {
    const effects = { ...defaultEffects, noiseStd: .05, sampleJitter: .1 };
    const a = simulate(defaultPID, defaultPlant, effects, defaultSimulation);
    const b = simulate(defaultPID, defaultPlant, effects, defaultSimulation);
    expect(a.samples.map((s) => s.measured)).toEqual(b.samples.map((s) => s.measured));
  });
  it("holds a FOPDT plant at zero before dead time", () => {
    const result = simulate({ ...defaultPID, kp: 1, ki: 0, kd: 0 }, { ...defaultPlant, kind: "fopdt", deadTime: .5 }, defaultEffects, { ...defaultSimulation, dt: .01, duration: 1 });
    expect(result.samples.find((s) => s.t === .49)?.pv).toBe(0);
    expect(result.samples.at(-1)!.pv).toBeGreaterThan(0);
  });
  it("applies an actuator slew-rate limit", () => {
    const result = simulate({ ...defaultPID, kp: 10, ki: 0, kd: 0 }, defaultPlant, { ...defaultEffects, slewRate: 1 }, { ...defaultSimulation, dt: .01, duration: .1 });
    expect(result.samples[1].actuator - result.samples[0].actuator).toBeCloseTo(.01);
  });
  it("rejects controller sampling faster than the plant step", () => {
    const result = simulate({ ...defaultPID, sampleTime: .001 }, defaultPlant, defaultEffects, { ...defaultSimulation, dt: .01 });
    expect(result.status).toBe("invalid");
  });
});
