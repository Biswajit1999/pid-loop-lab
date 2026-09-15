import { describe, expect, it } from "vitest";
import { estimateRelayUltimate, tuneFOPDT, tuneUltimate } from "../lib/tuning";

const fopdt = { gain: 2, tau: 5, deadTime: 1 };

describe("FOPDT tuning equations", () => {
  it("validates the ZN reaction-curve PID reference case", () => {
    const tuning = tuneFOPDT("zn-reaction", "PID", fopdt);
    expect(tuning.kc).toBeCloseTo(3);
    expect(tuning.ti).toBeCloseTo(2);
    expect(tuning.td).toBeCloseTo(.5);
    expect(tuning.ki).toBeCloseTo(1.5);
    expect(tuning.kd).toBeCloseTo(1.5);
  });
  it("validates Cohen–Coon PI", () => {
    const tuning = tuneFOPDT("cohen-coon", "PI", fopdt);
    expect(tuning.kc).toBeCloseTo(2.2916666667);
    expect(tuning.ti).toBeCloseTo(30.6 / 13);
  });
  it("validates CHR, IMC and SIMC reference cases", () => {
    expect(tuneFOPDT("chr", "PID", fopdt)).toMatchObject({ kc: 1.5, ti: 5, td: .5, ki: .3, kd: .75 });
    expect(tuneFOPDT("imc", "PI", fopdt, 2).ki).toBeCloseTo(1 / 6);
    expect(tuneFOPDT("simc", "PI", fopdt, 2).ti).toBe(5);
  });
  it("rejects an invalid FOPDT model", () => expect(() => tuneFOPDT("simc", "PI", { ...fopdt, deadTime: 0 })).toThrow());
});

describe("ultimate-cycle tuning", () => {
  it("validates ZN and Tyreus–Luyben", () => {
    expect(tuneUltimate("zn-ultimate", "PID", { ultimateGain: 4, ultimatePeriod: 3 })).toMatchObject({ kc: 2.4, ti: 1.5, td: .375 });
    const tyreus = tuneUltimate("tyreus-luyben", "PI", { ultimateGain: 4, ultimatePeriod: 3 });
    expect(tyreus.kc).toBeCloseTo(1.25);
    expect(tyreus.ti).toBeCloseTo(6.6);
    expect(tyreus.td).toBe(0);
  });
  it("validates the relay describing-function estimate", () => expect(estimateRelayUltimate(1, .5, 3).ultimateGain).toBeCloseTo(8 / Math.PI));
});
