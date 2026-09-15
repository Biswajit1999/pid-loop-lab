"use client";

import { create } from "zustand";
import { defaultPID } from "./pid";
import { defaultPlant } from "./plants";
import { defaultEffects, defaultSimulation, simulate } from "./simulation";
import type { EffectsConfig, PIDConfig, PlantConfig, SimulationConfig, SimulationResult } from "./types";

interface LabState {
  pid: PIDConfig;
  plant: PlantConfig;
  effects: EffectsConfig;
  simulation: SimulationConfig;
  result: SimulationResult;
  patchPid: (patch: Partial<PIDConfig>) => void;
  patchPlant: (patch: Partial<PlantConfig>) => void;
  patchEffects: (patch: Partial<EffectsConfig>) => void;
  patchSimulation: (patch: Partial<SimulationConfig>) => void;
  run: () => void;
  reset: () => void;
  load: (state: Partial<Pick<LabState, "pid" | "plant" | "effects" | "simulation">>) => void;
}

const initialResult = simulate(defaultPID, defaultPlant, defaultEffects, defaultSimulation);

export const useLabStore = create<LabState>((set, get) => ({
  pid: { ...defaultPID },
  plant: { ...defaultPlant },
  effects: { ...defaultEffects },
  simulation: { ...defaultSimulation },
  result: initialResult,
  patchPid: (patch) => set((state) => {
    const pid = { ...state.pid, ...patch };
    return { pid, result: simulate(pid, state.plant, state.effects, state.simulation) };
  }),
  patchPlant: (patch) => set((state) => {
    const plant = { ...state.plant, ...patch };
    return { plant, result: simulate(state.pid, plant, state.effects, state.simulation) };
  }),
  patchEffects: (patch) => set((state) => {
    const effects = { ...state.effects, ...patch };
    return { effects, result: simulate(state.pid, state.plant, effects, state.simulation) };
  }),
  patchSimulation: (patch) => set((state) => {
    const simulation = { ...state.simulation, ...patch };
    return { simulation, result: simulate(state.pid, state.plant, state.effects, simulation) };
  }),
  run: () => {
    const { pid, plant, effects, simulation } = get();
    set({ result: simulate(pid, plant, effects, simulation) });
  },
  reset: () => set({
    pid: { ...defaultPID }, plant: { ...defaultPlant }, effects: { ...defaultEffects }, simulation: { ...defaultSimulation }, result: initialResult,
  }),
  load: (loaded) => set((state) => {
    const pid = { ...state.pid, ...loaded.pid };
    const plant = { ...state.plant, ...loaded.plant };
    const effects = { ...state.effects, ...loaded.effects };
    const simulation = { ...state.simulation, ...loaded.simulation };
    return { pid, plant, effects, simulation, result: simulate(pid, plant, effects, simulation) };
  }),
}));
