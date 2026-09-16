import { describe, expect, it } from "vitest";
import { calculateMetrics } from "../lib/metrics";
import { evaluateMission, missions } from "../lib/missions";
import { explainResponse } from "../lib/explain";
import { simulate } from "../lib/simulation";

describe("mission scoring and deterministic explanations", () => {
  it("scores every criterion without treating an undefined metric as a pass", () => {
    const mission = missions[0];
    const result = simulate(mission.configuration.pid, mission.configuration.plant, mission.configuration.effects, mission.configuration.simulation);
    const score = evaluateMission(mission, calculateMetrics(result.samples));
    expect(score.criteria).toHaveLength(mission.criteria.length);
    expect(score.criteria.every((criterion) => typeof criterion.passed === "boolean")).toBe(true);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });

  it("explains the dominant measured limitation and proposes a next test", () => {
    const mission = missions[0];
    const result = simulate(mission.configuration.pid, mission.configuration.plant, mission.configuration.effects, mission.configuration.simulation);
    const explanation = explainResponse(result, calculateMetrics(result.samples), mission.configuration.pid, mission.configuration.effects);
    expect(explanation.headline.length).toBeGreaterThan(12);
    expect(explanation.evidence.length).toBeGreaterThan(0);
    expect(explanation.nextAction.length).toBeGreaterThan(12);
  });

  it("reports an invalid simulation as a critical result", () => {
    const mission = missions[0];
    const result = simulate(mission.configuration.pid, mission.configuration.plant, mission.configuration.effects, { ...mission.configuration.simulation, dt: 0 });
    const explanation = explainResponse(result, calculateMetrics(result.samples), mission.configuration.pid, mission.configuration.effects);
    expect(explanation.status).toBe("critical");
    expect(explanation.summary).toContain("positive");
  });
});
