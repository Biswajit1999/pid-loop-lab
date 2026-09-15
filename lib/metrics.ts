import type { Metrics, SimulationSample } from "./types";

const finiteOrNull = (value: number): number | null => Number.isFinite(value) ? value : null;

export function calculateMetrics(samples: SimulationSample[]): Metrics {
  const empty: Metrics = {
    riseTime: null, peakTime: null, overshootPercent: null, undershootPercent: null,
    settlingTime: null, steadyStateError: null, maximumAbsoluteError: null,
    iae: null, ise: null, itae: null, rmsError: null, rmsControllerEffort: null,
    totalControllerVariation: null, saturationPercent: null,
  };
  if (samples.length < 2) return empty;
  const target = samples.at(-1)?.setpoint ?? 0;
  const initial = samples[0].pv;
  const amplitude = target - initial;
  const duration = samples.at(-1)!.t - samples[0].t;
  if (!Number.isFinite(duration) || duration <= 0) return empty;
  const normalized = (value: number) => amplitude === 0 ? 0 : (value - initial) / amplitude;
  const ten = samples.find((s) => normalized(s.pv) >= 0.1)?.t;
  const ninety = samples.find((s) => normalized(s.pv) >= 0.9)?.t;
  const peakSample = amplitude >= 0
    ? samples.reduce((a, b) => b.pv > a.pv ? b : a)
    : samples.reduce((a, b) => b.pv < a.pv ? b : a);
  const oppositePeak = amplitude >= 0
    ? samples.reduce((a, b) => b.pv < a.pv ? b : a)
    : samples.reduce((a, b) => b.pv > a.pv ? b : a);
  const overshoot = amplitude === 0 ? null : Math.max(0, (normalized(peakSample.pv) - 1) * 100);
  const undershoot = amplitude === 0 ? null : Math.max(0, -normalized(oppositePeak.pv) * 100);
  const band = Math.max(Math.abs(amplitude) * 0.02, 1e-9);
  let settlingTime: number | null = null;
  for (let i = 0; i < samples.length; i += 1) {
    if (samples.slice(i).every((s) => Math.abs(s.pv - target) <= band)) {
      settlingTime = samples[i].t;
      break;
    }
  }
  const tail = samples.slice(Math.floor(samples.length * 0.95));
  const tailMean = tail.reduce((sum, s) => sum + s.pv, 0) / tail.length;
  let iae = 0;
  let ise = 0;
  let itae = 0;
  let effort2 = 0;
  let totalVariation = 0;
  let saturated = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1];
    const b = samples[i];
    const dt = b.t - a.t;
    iae += 0.5 * (Math.abs(a.error) + Math.abs(b.error)) * dt;
    ise += 0.5 * (a.error ** 2 + b.error ** 2) * dt;
    itae += 0.5 * (a.t * Math.abs(a.error) + b.t * Math.abs(b.error)) * dt;
    effort2 += 0.5 * (a.actuator ** 2 + b.actuator ** 2) * dt;
    totalVariation += Math.abs(b.actuator - a.actuator);
    if (b.saturated) saturated += 1;
  }
  return {
    riseTime: ten !== undefined && ninety !== undefined && ninety >= ten ? ninety - ten : null,
    peakTime: amplitude === 0 ? null : peakSample.t,
    overshootPercent: overshoot,
    undershootPercent: undershoot,
    settlingTime,
    steadyStateError: finiteOrNull(target - tailMean),
    maximumAbsoluteError: finiteOrNull(Math.max(...samples.map((s) => Math.abs(s.error)))),
    iae: finiteOrNull(iae),
    ise: finiteOrNull(ise),
    itae: finiteOrNull(itae),
    rmsError: finiteOrNull(Math.sqrt(ise / duration)),
    rmsControllerEffort: finiteOrNull(Math.sqrt(effort2 / duration)),
    totalControllerVariation: finiteOrNull(totalVariation),
    saturationPercent: finiteOrNull((saturated / (samples.length - 1)) * 100),
  };
}
