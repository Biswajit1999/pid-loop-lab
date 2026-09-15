export type PlantKind =
  | "first-order"
  | "fopdt"
  | "second-order"
  | "integrator"
  | "mass-spring-damper"
  | "dc-motor"
  | "thermal"
  | "transfer-function";

export type DerivativeMode = "measurement" | "error";
export type AntiWindupMode = "off" | "clamp" | "back-calculation";

export interface PIDConfig {
  kp: number;
  ki: number;
  kd: number;
  sampleTime: number;
  derivativeMode: DerivativeMode;
  tf: number;
  outputMin: number;
  outputMax: number;
  integratorMin: number;
  integratorMax: number;
  antiWindup: AntiWindupMode;
  backCalculationGain: number;
  beta: number;
  gamma: number;
}

export interface PlantConfig {
  kind: PlantKind;
  gain: number;
  tau: number;
  deadTime: number;
  omegaN: number;
  zeta: number;
  mass: number;
  damping: number;
  spring: number;
  resistance: number;
  inductance: number;
  motorConstant: number;
  inertia: number;
  numerator: number[];
  denominator: number[];
}

export interface EffectsConfig {
  noiseStd: number;
  loadDisturbance: number;
  disturbanceTime: number;
  sensorTau: number;
  quantization: number;
  slewRate: number;
  sampleJitter: number;
}

export interface SimulationConfig {
  duration: number;
  dt: number;
  setpoint: number;
  setpointMode: "step" | "ramp";
  rampRate: number;
  seed: number;
  divergenceLimit: number;
}

export interface SimulationSample {
  t: number;
  setpoint: number;
  pv: number;
  measured: number;
  error: number;
  p: number;
  i: number;
  d: number;
  unclamped: number;
  output: number;
  actuator: number;
  disturbance: number;
  noise: number;
  saturated: boolean;
  state: number[];
  voltage: number;
  current: number;
  power: number;
}

export interface SimulationResult {
  samples: SimulationSample[];
  status: "complete" | "divergent" | "invalid";
  message: string;
}

export interface PIDOutput {
  p: number;
  i: number;
  d: number;
  unclamped: number;
  output: number;
  saturated: boolean;
}

export interface Metrics {
  riseTime: number | null;
  peakTime: number | null;
  overshootPercent: number | null;
  undershootPercent: number | null;
  settlingTime: number | null;
  steadyStateError: number | null;
  maximumAbsoluteError: number | null;
  iae: number | null;
  ise: number | null;
  itae: number | null;
  rmsError: number | null;
  rmsControllerEffort: number | null;
  totalControllerVariation: number | null;
  saturationPercent: number | null;
}
