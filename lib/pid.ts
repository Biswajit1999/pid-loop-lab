import type { PIDConfig, PIDOutput } from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const defaultPID: PIDConfig = {
  kp: 2,
  ki: 0.8,
  kd: 0.25,
  sampleTime: 0.05,
  derivativeMode: "measurement",
  tf: 0.08,
  outputMin: -10,
  outputMax: 10,
  integratorMin: -10,
  integratorMax: 10,
  antiWindup: "clamp",
  backCalculationGain: 1,
  beta: 1,
  gamma: 0,
};

export class DiscretePID {
  private integral = 0;
  private previousError = 0;
  private previousMeasurement = 0;
  private previousDerivativeInput = 0;
  private filteredDerivative = 0;
  private initialized = false;

  constructor(public config: PIDConfig) {}

  reset(): void {
    this.integral = 0;
    this.previousError = 0;
    this.previousMeasurement = 0;
    this.previousDerivativeInput = 0;
    this.filteredDerivative = 0;
    this.initialized = false;
  }

  update(setpoint: number, measurement: number, dt = this.config.sampleTime): PIDOutput {
    const c = this.config;
    if (!Number.isFinite(dt) || dt <= 0) throw new Error("PID sample time must be positive and finite.");
    const error = setpoint - measurement;
    const p = c.kp * (c.beta * setpoint - measurement);
    const derivativeInput = c.derivativeMode === "measurement"
      ? -measurement
      : c.gamma * setpoint - measurement;
    const rawDerivative = this.initialized
      ? (derivativeInput - this.previousDerivativeInput) / dt
      : 0;
    const alpha = c.tf <= 0 ? 0 : c.tf / (c.tf + dt);
    this.filteredDerivative = alpha * this.filteredDerivative + (1 - alpha) * rawDerivative;
    const d = c.kd * this.filteredDerivative;

    const candidateIntegral = clamp(
      this.integral + c.ki * error * dt,
      c.integratorMin,
      c.integratorMax,
    );
    const candidateUnclamped = p + candidateIntegral + d;
    const candidateOutput = clamp(candidateUnclamped, c.outputMin, c.outputMax);

    if (c.antiWindup === "clamp") {
      const drivesFurtherHigh = candidateUnclamped > c.outputMax && error > 0;
      const drivesFurtherLow = candidateUnclamped < c.outputMin && error < 0;
      if (!drivesFurtherHigh && !drivesFurtherLow) this.integral = candidateIntegral;
    } else if (c.antiWindup === "back-calculation") {
      this.integral = clamp(
        this.integral + (c.ki * error + c.backCalculationGain * (candidateOutput - candidateUnclamped)) * dt,
        c.integratorMin,
        c.integratorMax,
      );
    } else {
      this.integral = candidateIntegral;
    }

    const unclamped = p + this.integral + d;
    const output = clamp(unclamped, c.outputMin, c.outputMax);
    this.previousError = error;
    this.previousMeasurement = measurement;
    this.previousDerivativeInput = derivativeInput;
    this.initialized = true;

    return { p, i: this.integral, d, unclamped, output, saturated: output !== unclamped };
  }

  snapshot(): Readonly<{ integral: number; previousError: number; previousMeasurement: number }> {
    return {
      integral: this.integral,
      previousError: this.previousError,
      previousMeasurement: this.previousMeasurement,
    };
  }
}

export function standardToParallel(kc: number, ti: number, td: number): Pick<PIDConfig, "kp" | "ki" | "kd"> {
  if (![kc, ti, td].every(Number.isFinite) || ti <= 0 || td < 0) {
    throw new Error("Standard-form conversion requires finite Kc, Ti > 0, and Td >= 0.");
  }
  return { kp: kc, ki: kc / ti, kd: kc * td };
}

export function parallelToStandard(kp: number, ki: number, kd: number): { kc: number; ti: number; td: number } {
  if (![kp, ki, kd].every(Number.isFinite) || kp === 0 || ki === 0) {
    throw new Error("Parallel-to-standard conversion requires finite, non-zero Kp and Ki.");
  }
  return { kc: kp, ti: kp / ki, td: kd / kp };
}
