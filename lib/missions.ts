import { defaultPID } from "./pid";
import { defaultPlant } from "./plants";
import { defaultEffects, defaultSimulation } from "./simulation";
import type { EffectsConfig, Metrics, PIDConfig, PlantConfig, SimulationConfig } from "./types";

export type MissionCriterion = {
  label: string;
  metric: keyof Metrics;
  operator: "lte" | "gte";
  target: number;
  unit?: string;
};

export type Mission = {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  difficulty: "Starter" | "Intermediate" | "Advanced";
  description: string;
  lesson: string;
  accent: "green" | "orange" | "blue" | "violet";
  configuration: {
    pid: PIDConfig;
    plant: PlantConfig;
    effects: EffectsConfig;
    simulation: SimulationConfig;
  };
  criteria: MissionCriterion[];
};

const config = (
  pid: Partial<PIDConfig> = {},
  plant: Partial<PlantConfig> = {},
  effects: Partial<EffectsConfig> = {},
  simulation: Partial<SimulationConfig> = {},
) => ({
  pid: { ...defaultPID, ...pid },
  plant: { ...defaultPlant, ...plant },
  effects: { ...defaultEffects, ...effects },
  simulation: { ...defaultSimulation, ...simulation },
});

export const missions: Mission[] = [
  {
    id: "first-stable-loop",
    number: "01",
    title: "Build your first stable loop",
    shortTitle: "Stable loop",
    difficulty: "Starter",
    description: "Tune a delayed first-order process without trading stability for speed.",
    lesson: "Increase proportional action first, then use integral action to remove offset while watching overshoot.",
    accent: "green",
    configuration: config({ kp: 0.7, ki: 0.05, kd: 0 }, { kind: "fopdt", gain: 1, tau: 2.4, deadTime: 0.45 }),
    criteria: [
      { label: "Overshoot", metric: "overshootPercent", operator: "lte", target: 8, unit: "%" },
      { label: "Settling time", metric: "settlingTime", operator: "lte", target: 9, unit: " s" },
      { label: "Steady-state error", metric: "steadyStateError", operator: "lte", target: 0.03 },
    ],
  },
  {
    id: "reject-the-load",
    number: "02",
    title: "Reject an unexpected load",
    shortTitle: "Load rejection",
    difficulty: "Intermediate",
    description: "A process disturbance arrives after five seconds. Recover without violent actuator movement.",
    lesson: "Integral action is essential for rejecting a constant load, but too much creates oscillation and control effort.",
    accent: "blue",
    configuration: config({ kp: 1.2, ki: 0.15, kd: 0.08 }, { kind: "first-order", gain: 1, tau: 2 }, { loadDisturbance: -0.45, disturbanceTime: 5 }, { duration: 20 }),
    criteria: [
      { label: "Steady-state error", metric: "steadyStateError", operator: "lte", target: 0.04 },
      { label: "IAE", metric: "iae", operator: "lte", target: 2.5 },
      { label: "Controller variation", metric: "totalControllerVariation", operator: "lte", target: 8 },
    ],
  },
  {
    id: "stop-windup",
    number: "03",
    title: "Stop integral windup",
    shortTitle: "Anti-windup",
    difficulty: "Intermediate",
    description: "The actuator is tightly limited. Recover cleanly from saturation using an anti-windup strategy.",
    lesson: "Compare conditional integration and back-calculation while monitoring unclamped and applied output.",
    accent: "orange",
    configuration: config({ kp: 2.4, ki: 1.3, kd: 0.1, outputMin: -1, outputMax: 1, antiWindup: "off" }, { kind: "fopdt", tau: 2.2, deadTime: 0.3 }, {}, { setpoint: 1.4, duration: 20 }),
    criteria: [
      { label: "Overshoot", metric: "overshootPercent", operator: "lte", target: 12, unit: "%" },
      { label: "Saturation time", metric: "saturationPercent", operator: "lte", target: 35, unit: "%" },
      { label: "Settling time", metric: "settlingTime", operator: "lte", target: 13, unit: " s" },
    ],
  },
  {
    id: "quiet-the-noise",
    number: "04",
    title: "Quiet a noisy measurement",
    shortTitle: "Noise control",
    difficulty: "Advanced",
    description: "Tune a fast loop without letting derivative action amplify sensor noise into the actuator.",
    lesson: "Derivative filtering and measurement mode can preserve damping without turning noise into control chatter.",
    accent: "violet",
    configuration: config({ kp: 2, ki: 0.65, kd: 0.9, tf: 0.01 }, { kind: "second-order", omegaN: 1.5, zeta: 0.4 }, { noiseStd: 0.05 }, { duration: 18, seed: 31415 }),
    criteria: [
      { label: "Overshoot", metric: "overshootPercent", operator: "lte", target: 15, unit: "%" },
      { label: "RMS effort", metric: "rmsControllerEffort", operator: "lte", target: 2.5 },
      { label: "Controller variation", metric: "totalControllerVariation", operator: "lte", target: 140 },
    ],
  },
  {
    id: "tame-the-delay",
    number: "05",
    title: "Tame a dead-time process",
    shortTitle: "Dead time",
    difficulty: "Advanced",
    description: "Control a sluggish process whose measurement reveals the effect of an action long after it was applied.",
    lesson: "Dead time limits achievable bandwidth. A slower, more robust controller often wins.",
    accent: "orange",
    configuration: config({ kp: 2.8, ki: 1.1, kd: 0.15 }, { kind: "fopdt", gain: 1, tau: 3, deadTime: 1.5 }, {}, { duration: 28 }),
    criteria: [
      { label: "Overshoot", metric: "overshootPercent", operator: "lte", target: 10, unit: "%" },
      { label: "Settling time", metric: "settlingTime", operator: "lte", target: 20, unit: " s" },
      { label: "IAE", metric: "iae", operator: "lte", target: 5 },
    ],
  },
];

export function getMission(id: string | null | undefined): Mission | undefined {
  return missions.find((mission) => mission.id === id);
}

export function evaluateMission(mission: Mission, metrics: Metrics) {
  const criteria = mission.criteria.map((criterion) => {
    const raw = metrics[criterion.metric];
    const value = typeof raw === "number" && Number.isFinite(raw) ? Math.abs(raw) : null;
    const passed = value !== null && (criterion.operator === "lte" ? value <= criterion.target : value >= criterion.target);
    return { ...criterion, value, passed };
  });
  const passed = criteria.filter((criterion) => criterion.passed).length;
  return { criteria, passed, complete: passed === criteria.length, score: Math.round((passed / criteria.length) * 100) };
}
