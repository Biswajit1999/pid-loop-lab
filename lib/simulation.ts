import { DiscretePID, defaultPID } from "./pid";
import { createPlant, defaultPlant, rk4Step } from "./plants";
import type { EffectsConfig, PIDConfig, PIDOutput, PlantConfig, SimulationConfig, SimulationResult } from "./types";

export const defaultEffects: EffectsConfig = {
  noiseStd: 0,
  loadDisturbance: 0,
  disturbanceTime: 5,
  sensorTau: 0,
  quantization: 0,
  slewRate: 0,
  sampleJitter: 0,
};

export const defaultSimulation: SimulationConfig = {
  duration: 16,
  dt: 0.01,
  setpoint: 1,
  setpointMode: "step",
  rampRate: 0.1,
  seed: 4187,
  divergenceLimit: 1e6,
};

function seededRandom(seed: number): () => number {
  let value = Math.abs(Math.trunc(seed)) || 1;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function gaussian(random: () => number): number {
  const u = Math.max(random(), Number.EPSILON);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const zeroOutput: PIDOutput = { p: 0, i: 0, d: 0, unclamped: 0, output: 0, saturated: false };

export function simulate(
  pidConfig: PIDConfig = defaultPID,
  plantConfig: PlantConfig = defaultPlant,
  effects: EffectsConfig = defaultEffects,
  simulation: SimulationConfig = defaultSimulation,
): SimulationResult {
  try {
    if (!Number.isFinite(simulation.dt) || simulation.dt <= 0) throw new Error("Simulation dt must be positive and finite.");
    if (!Number.isFinite(simulation.duration) || simulation.duration <= 0) throw new Error("Duration must be positive and finite.");
    if (pidConfig.sampleTime < simulation.dt) throw new Error("Controller sample time must be greater than or equal to simulation dt.");
    if (simulation.duration / simulation.dt > 2_000_000) throw new Error("Simulation exceeds the two-million-step safety guard.");

    const plant = createPlant(plantConfig);
    const controller = new DiscretePID(pidConfig);
    const random = seededRandom(simulation.seed);
    const delay = plantConfig.kind === "fopdt" ? Math.max(0, plantConfig.deadTime) : 0;
    const delaySteps = Math.max(0, Math.round(delay / simulation.dt));
    const delayBuffer = Array(delaySteps + 1).fill(0) as number[];
    let delayIndex = 0;
    let controllerOutput = zeroOutput;
    let actuator = 0;
    let sensor = 0;
    let nextControlTime = 0;
    const samples: SimulationResult["samples"] = [];
    const totalSteps = Math.floor(simulation.duration / simulation.dt);

    for (let step = 0; step <= totalSteps; step += 1) {
      const t = step * simulation.dt;
      const setpoint = simulation.setpointMode === "ramp"
        ? Math.min(simulation.setpoint, simulation.rampRate * t)
        : simulation.setpoint;
      const pv = plant.output();
      if (effects.sensorTau > 0) sensor += ((pv - sensor) / effects.sensorTau) * simulation.dt;
      else sensor = pv;
      const noise = effects.noiseStd > 0 ? gaussian(random) * effects.noiseStd : 0;
      let measured = sensor + noise;
      if (effects.quantization > 0) measured = Math.round(measured / effects.quantization) * effects.quantization;

      if (t + simulation.dt * 1e-6 >= nextControlTime) {
        controllerOutput = controller.update(setpoint, measured, pidConfig.sampleTime);
        const jitter = effects.sampleJitter > 0 ? (2 * random() - 1) * effects.sampleJitter : 0;
        nextControlTime += Math.max(simulation.dt, pidConfig.sampleTime * (1 + jitter));
      }

      const maxDelta = effects.slewRate > 0 ? effects.slewRate * simulation.dt : Number.POSITIVE_INFINITY;
      const requestedDelta = controllerOutput.output - actuator;
      actuator += Math.max(-maxDelta, Math.min(maxDelta, requestedDelta));
      const disturbance = t >= effects.disturbanceTime ? effects.loadDisturbance : 0;
      const plantInputNow = actuator + disturbance;
      delayBuffer[delayIndex] = plantInputNow;
      const readIndex = (delayIndex + 1) % delayBuffer.length;
      const delayedInput = delayBuffer[readIndex];
      delayIndex = readIndex;

      const voltage = actuator;
      const current = plantConfig.resistance > 0 ? voltage / plantConfig.resistance : 0;
      const power = voltage * current;
      samples.push({
        t,
        setpoint,
        pv,
        measured,
        error: setpoint - measured,
        ...controllerOutput,
        actuator,
        disturbance,
        noise,
        state: [...plant.state],
        voltage,
        current,
        power,
      });

      if (![pv, measured, actuator, ...plant.state].every(Number.isFinite) || Math.abs(pv) > simulation.divergenceLimit) {
        return { samples, status: "divergent", message: `Simulation stopped at t=${t.toFixed(3)} s after exceeding the numerical stability guard.` };
      }
      if (step < totalSteps) rk4Step(plant, delayedInput, simulation.dt);
    }
    return { samples, status: "complete", message: "Simulation completed deterministically." };
  } catch (error) {
    return { samples: [], status: "invalid", message: error instanceof Error ? error.message : "Invalid simulation configuration." };
  }
}
