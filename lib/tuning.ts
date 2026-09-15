import { standardToParallel } from "./pid";

export type TuningMethod = "manual" | "zn-reaction" | "cohen-coon" | "chr" | "imc" | "simc" | "zn-ultimate" | "tyreus-luyben" | "relay";
export type ControllerType = "P" | "PI" | "PID";

export interface FOPDTModel { gain: number; tau: number; deadTime: number; }
export interface UltimateModel { ultimateGain: number; ultimatePeriod: number; }
export interface TuningResult {
  method: TuningMethod;
  controller: ControllerType;
  kc: number;
  ti: number | null;
  td: number | null;
  kp: number;
  ki: number;
  kd: number;
  assumptions: string;
  sourceKey: string;
  warning: string | null;
}

function validateFOPDT(model: FOPDTModel): void {
  if (![model.gain, model.tau, model.deadTime].every(Number.isFinite) || model.gain === 0 || model.tau <= 0 || model.deadTime <= 0) {
    throw new Error("This rule requires an open-loop stable FOPDT model with K ≠ 0, τ > 0, and θ > 0.");
  }
}

function result(method: TuningMethod, controller: ControllerType, kc: number, ti: number | null, td: number | null, assumptions: string, sourceKey: string, warning: string | null = null): TuningResult {
  const parallel = controller === "P"
    ? { kp: kc, ki: 0, kd: 0 }
    : standardToParallel(kc, ti!, td ?? 0);
  return { method, controller, kc, ti, td, ...parallel, assumptions, sourceKey, warning };
}

export function tuneFOPDT(method: Exclude<TuningMethod, "manual" | "zn-ultimate" | "tyreus-luyben" | "relay">, controller: ControllerType, model: FOPDTModel, lambda = Math.max(model.tau, model.deadTime)): TuningResult {
  validateFOPDT(model);
  const { gain: k, tau, deadTime: theta } = model;
  const r = theta / tau;
  switch (method) {
    case "zn-reaction": {
      if (controller === "P") return result(method, controller, tau / (k * theta), null, null, "Open-loop, self-regulating FOPDT process; quarter-amplitude-decay target.", "ziegler-nichols-1942", "Aggressive historical baseline; verify robustness and actuator limits.");
      if (controller === "PI") return result(method, controller, 0.9 * tau / (k * theta), 3.33 * theta, 0, "Open-loop, self-regulating FOPDT process; ideal/ISA controller form.", "ziegler-nichols-1942", "Aggressive historical baseline; verify robustness and actuator limits.");
      return result(method, controller, 1.2 * tau / (k * theta), 2 * theta, 0.5 * theta, "Open-loop, self-regulating FOPDT process; ideal/ISA controller form.", "ziegler-nichols-1942", "Aggressive historical baseline; verify robustness and actuator limits.");
    }
    case "cohen-coon": {
      if (controller === "P") return result(method, controller, (tau / (k * theta)) * (1 + r / 3), null, null, "Open-loop, self-regulating FOPDT process; ideal/ISA form.", "cohen-coon-1953");
      if (controller === "PI") return result(method, controller, (tau / (k * theta)) * (0.9 + r / 12), theta * (30 + 3 * r) / (9 + 20 * r), 0, "Open-loop, self-regulating FOPDT process; ideal/ISA form.", "cohen-coon-1953", r > 1 ? "Dead-time-dominant case; use cautiously." : null);
      return result(method, controller, (tau / (k * theta)) * (4 / 3 + r / 4), theta * (32 + 6 * r) / (13 + 8 * r), theta * 4 / (11 + 2 * r), "Open-loop, self-regulating FOPDT process; ideal/ISA form.", "cohen-coon-1953", r > 1 ? "Dead-time-dominant case; use cautiously." : null);
    }
    case "chr": {
      if (controller === "P") return result(method, controller, 0.3 * tau / (k * theta), null, null, "CHR 0% overshoot setpoint rule for a self-regulating FOPDT process.", "chien-hrones-reswick-1952");
      if (controller === "PI") return result(method, controller, 0.35 * tau / (k * theta), 1.2 * tau, 0, "CHR 0% overshoot setpoint rule for a self-regulating FOPDT process; ideal/ISA form.", "chien-hrones-reswick-1952");
      return result(method, controller, 0.6 * tau / (k * theta), tau, 0.5 * theta, "CHR 0% overshoot setpoint rule for a self-regulating FOPDT process; ideal/ISA form.", "chien-hrones-reswick-1952");
    }
    case "imc": {
      if (!Number.isFinite(lambda) || lambda <= 0) throw new Error("IMC lambda must be positive and finite.");
      if (controller === "P") return result(method, controller, tau / (k * (lambda + theta)), null, null, "Direct-synthesis/IMC approximation for an open-loop stable FOPDT process.", "rivera-morari-skegestad-1986");
      if (controller === "PI") return result(method, controller, tau / (k * (lambda + theta)), tau, 0, "IMC PI for an open-loop stable FOPDT process; lambda is the desired closed-loop time scale.", "rivera-morari-skegestad-1986");
      return result(method, controller, (tau + theta / 2) / (k * (lambda + theta / 2)), tau + theta / 2, (tau * theta) / (2 * tau + theta), "IMC PID approximation for an open-loop stable FOPDT process; ideal/ISA form.", "rivera-morari-skegestad-1986");
    }
    case "simc": {
      if (!Number.isFinite(lambda) || lambda <= 0) throw new Error("SIMC closed-loop time constant must be positive and finite.");
      const ti = Math.min(tau, 4 * (lambda + theta));
      if (controller === "P") return result(method, controller, tau / (k * (lambda + theta)), null, null, "SIMC model-based rule for a stable FOPDT process.", "skogestad-2003");
      if (controller === "PI") return result(method, controller, tau / (k * (lambda + theta)), ti, 0, "SIMC PI for a stable FOPDT process; τc is the robustness/speed tuning parameter.", "skogestad-2003");
      return result(method, controller, tau / (k * (lambda + theta)), ti, 0, "SIMC first-order rule is PI; derivative action is intentionally zero for this model class.", "skogestad-2003", "PID request reduced to the published FOPDT SIMC PI structure.");
    }
  }
}

export function tuneUltimate(method: "zn-ultimate" | "tyreus-luyben", controller: ControllerType, model: UltimateModel): TuningResult {
  const { ultimateGain: ku, ultimatePeriod: pu } = model;
  if (![ku, pu].every(Number.isFinite) || ku <= 0 || pu <= 0) throw new Error("Ultimate tuning requires Ku > 0 and Pu > 0.");
  if (method === "zn-ultimate") {
    if (controller === "P") return result(method, controller, 0.5 * ku, null, null, "Sustained-oscillation ultimate-gain experiment.", "ziegler-nichols-1942", "Ultimate-cycle testing can be unsafe on physical equipment; this lab only simulates it.");
    if (controller === "PI") return result(method, controller, 0.45 * ku, pu / 1.2, 0, "Sustained-oscillation ultimate-gain experiment; ideal/ISA form.", "ziegler-nichols-1942", "Aggressive historical baseline.");
    return result(method, controller, 0.6 * ku, pu / 2, pu / 8, "Sustained-oscillation ultimate-gain experiment; ideal/ISA form.", "ziegler-nichols-1942", "Aggressive historical baseline.");
  }
  if (controller === "P") throw new Error("Tyreus–Luyben is provided only for PI and PID controllers.");
  if (controller === "PI") return result(method, controller, ku / 3.2, 2.2 * pu, 0, "Ultimate-gain experiment; ideal/ISA form.", "tyreus-luyben", "Conservative closed-loop heuristic; confirm plant suitability.");
  return result(method, controller, ku / 2.2, 2.2 * pu, pu / 6.3, "Ultimate-gain experiment; ideal/ISA form.", "tyreus-luyben", "Conservative closed-loop heuristic; confirm plant suitability.");
}

export function estimateRelayUltimate(relayAmplitude: number, oscillationAmplitude: number, ultimatePeriod: number): UltimateModel {
  if (![relayAmplitude, oscillationAmplitude, ultimatePeriod].every(Number.isFinite) || relayAmplitude <= 0 || oscillationAmplitude <= 0 || ultimatePeriod <= 0) {
    throw new Error("Relay estimate requires positive relay amplitude, oscillation amplitude, and period.");
  }
  return { ultimateGain: (4 * relayAmplitude) / (Math.PI * oscillationAmplitude), ultimatePeriod };
}
