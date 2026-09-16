import type { EffectsConfig, Metrics, PIDConfig, SimulationResult } from "./types";

export type ResponseExplanation = {
  status: "good" | "watch" | "critical";
  headline: string;
  summary: string;
  evidence: { label: string; detail: string }[];
  nextAction: string;
};

const value = (metric: number | null, suffix = "") => metric === null ? "not defined" : `${Number(metric.toPrecision(3))}${suffix}`;

export function explainResponse(result: SimulationResult, metrics: Metrics, pid: PIDConfig, effects: EffectsConfig): ResponseExplanation {
  if (result.status !== "complete") return {
    status: "critical",
    headline: "The loop did not complete safely.",
    summary: result.message,
    evidence: [{ label: "Numerical guard", detail: "The run stopped before invalid values could be presented as a valid response." }],
    nextAction: "Reduce the gains, shorten the integration step, or verify the plant parameters before running again.",
  };

  const overshoot = metrics.overshootPercent ?? 0;
  const saturation = metrics.saturationPercent ?? 0;
  const variation = metrics.totalControllerVariation ?? 0;
  const steady = Math.abs(metrics.steadyStateError ?? 0);
  const evidence: ResponseExplanation["evidence"] = [];

  if (saturation > 8) evidence.push({ label: "Actuator saturation", detail: `The output was limited for ${value(saturation, "%")} of the run. The requested command and applied command were not the same.` });
  if (overshoot > 12) evidence.push({ label: "Overshoot", detail: `${value(overshoot, "%")} overshoot indicates an aggressive or weakly damped loop.` });
  if (steady > 0.03) evidence.push({ label: "Remaining offset", detail: `The final error is about ${value(steady)}. More integral action may help if saturation is controlled.` });
  if (effects.noiseStd > 0 && variation > 100) evidence.push({ label: "Noise sensitivity", detail: `Controller variation reached ${value(variation)} with sensor noise enabled. Derivative action is likely amplifying measurement movement.` });
  if (pid.ki > pid.kp * 1.2 && overshoot > 8) evidence.push({ label: "Integral pressure", detail: "Integral gain is large relative to proportional gain, which can keep pushing after the process is already approaching the target." });
  if (pid.kd > 0 && pid.tf < pid.sampleTime) evidence.push({ label: "Derivative filtering", detail: "The derivative filter is faster than the controller sample period, so high-frequency measurement changes receive little attenuation." });

  if (!evidence.length) return {
    status: "good",
    headline: "This is a controlled, well-behaved response.",
    summary: `Overshoot is ${value(overshoot, "%")}, steady-state error is ${value(steady)}, and the actuator remains mostly available.`,
    evidence: [
      { label: "Tracking", detail: `Rise time ${value(metrics.riseTime, " s")} and settling time ${value(metrics.settlingTime, " s")}.` },
      { label: "Control effort", detail: `RMS effort is ${value(metrics.rmsControllerEffort)} with ${value(saturation, "%")} saturation.` },
    ],
    nextAction: "Stress the loop with a disturbance, noise, or additional dead time before accepting the tuning as robust.",
  };

  const primary = evidence[0].label.toLowerCase();
  return {
    status: saturation > 30 || overshoot > 35 ? "critical" : "watch",
    headline: `The response is mainly limited by ${primary}.`,
    summary: `The measured response shows ${value(overshoot, "%")} overshoot, ${value(metrics.settlingTime, " s")} settling time, and ${value(saturation, "%")} saturation.`,
    evidence: evidence.slice(0, 3),
    nextAction: saturation > 8
      ? "Enable clamp or back-calculation anti-windup, then reduce integral gain if recovery remains slow."
      : effects.noiseStd > 0 && variation > 100
        ? "Increase derivative filtering or reduce derivative gain, then compare RMS effort and total variation."
        : overshoot > 12
          ? "Reduce proportional or integral gain, or add carefully filtered derivative action to increase damping."
          : "Make one gain change at a time and compare the before/after metrics.",
  };
}
