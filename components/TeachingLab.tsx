"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Eye, Function, Lightbulb } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { EngineeringChart } from "./EngineeringChart";
import { Equation } from "./Equation";
import { defaultPID } from "@/lib/pid";
import { defaultPlant } from "@/lib/plants";
import { defaultEffects, defaultSimulation, simulate } from "@/lib/simulation";

const presets = [
  { id: "p", name: "P only", change: "Ki = 0, Kd = 0", watch: "Residual offset and control effort", why: "With finite loop gain, a type-0 plant may retain steady-state error.", pid: { kp: 2, ki: 0, kd: 0 } },
  { id: "pi", name: "PI", change: "Integral action added", watch: "Error area and settling", why: "The integrator accumulates persistent error, but also adds phase lag.", pid: { kp: 1.5, ki: .7, kd: 0 } },
  { id: "pd", name: "PD", change: "Filtered derivative added", watch: "D contribution near fast changes", why: "Rate feedback can add damping; derivative filtering limits high-frequency amplification.", pid: { kp: 2.5, ki: 0, kd: .7 } },
  { id: "pid", name: "PID", change: "All terms active", watch: "Trade-off across tracking and effort", why: "The terms interact through the plant; their effects are not independent slogans.", pid: { kp: 2, ki: .8, kd: .25 } },
  { id: "windup", name: "Integrator windup", change: "Narrow output limits; anti-windup off", watch: "Unclamped output separating from actuator", why: "The integrator continues accumulating while the actuator cannot apply the requested command.", pid: { kp: 2, ki: 2.2, kd: 0, outputMin: -.6, outputMax: .6, antiWindup: "off" as const } },
  { id: "antiwindup", name: "Anti-windup", change: "Conditional integration enabled", watch: "Recovery after leaving saturation", why: "Integration pauses when error would push the saturated command further into its limit.", pid: { kp: 2, ki: 2.2, kd: 0, outputMin: -.6, outputMax: .6, antiWindup: "clamp" as const } },
  { id: "noise", name: "Noisy D", change: "Measurement noise + low Tf", watch: "Derivative contribution and actuator variation", why: "Differentiation emphasizes rapid measurement changes.", pid: { kp: 2, ki: .5, kd: 1.2, tf: .005 }, effects: { noiseStd: .05 } },
  { id: "sampling", name: "Slow sampling", change: "Ts = 0.5 s", watch: "Stair-step control and degraded response", why: "The controller holds its command between samples while the plant continues evolving.", pid: { kp: 2, ki: .8, kd: .25, sampleTime: .5 } },
  { id: "delay", name: "Long dead time", change: "θ = 2.0 s", watch: "Delayed feedback and oscillation risk", why: "The controller acts on information that no longer represents the plant's current state.", pid: { kp: 2, ki: .8, kd: .25 }, plant: { deadTime: 2 } },
] as const;

export function TeachingLab() {
  const [preset, setPreset] = useState(3);
  const [tau, setTau] = useState(2);
  const [gain, setGain] = useState(1);
  const [omegaN, setOmegaN] = useState(1.5);
  const [zeta, setZeta] = useState(.55);
  const selected = presets[preset];
  const result = useMemo(() => simulate(
    { ...defaultPID, ...selected.pid },
    { ...defaultPlant, kind: "fopdt", ...("plant" in selected ? selected.plant : {}) },
    { ...defaultEffects, ...("effects" in selected ? selected.effects : {}) },
    { ...defaultSimulation, duration: 14 },
  ), [selected]);
  const firstOrderPoints = Array.from({ length: 121 }, (_, index) => {
    const t = index * tau * 5 / 120;
    return [t, gain * (1 - Math.exp(-t / tau))] as const;
  });
  const x = zeta < 1 ? -zeta * omegaN : -omegaN * (zeta - Math.sqrt(Math.max(0, zeta ** 2 - 1)));
  const y = zeta < 1 ? omegaN * Math.sqrt(1 - zeta ** 2) : 0;
  const dampingLabel = zeta < .999 ? "underdamped" : zeta <= 1.001 ? "critically damped" : "overdamped";
  return (
    <>
      <section className="theory-section section-pad">
        <div className="section-heading-row"><div><p className="section-kicker">THE FEEDBACK LAW</p><h2>Error becomes action.</h2></div><div className="equation-stack"><Equation expression="e(t)=r(t)-y(t)" block /><Equation expression="u(t)=K_p(\beta r-y)+K_i\int(r-y)dt+K_d\frac{d(\gamma r-y)}{dt}" block /></div></div>
        <div className="theory-grid">
          <article id="p"><span>01 / P</span><h3>Present</h3><Equation expression="u_P=K_p(\beta r-y)" block /><p>Proportional action scales current weighted error. Its practical effect depends on plant gain, dynamics, delay, and all other loop elements.</p></article>
          <article id="i"><span>02 / I</span><h3>Past</h3><Equation expression="u_I=K_i\sum e[k]T_s" block /><p>Integral action accumulates sampled error. It can remove offset, yet needs explicit limits or anti-windup when actuators saturate.</p></article>
          <article id="d"><span>03 / D</span><h3>Rate</h3><Equation expression="u_D=K_d\,\frac{T_s}{T_f+T_s}\,\dot{x}_D" block /><p>Filtered derivative estimates rate. Using measurement avoids a derivative kick from a setpoint step when γ = 0.</p></article>
        </div>
      </section>
      <section className="explorer-section section-pad">
        <div className="section-heading-row"><div><p className="section-kicker">PID TERM EXPLORER</p><h2>Change one idea at a time.</h2></div><p>The plots below come from the same deterministic engine as the main lab. Select a controlled experiment and inspect its stated mechanism.</p></div>
        <div className="preset-tabs" role="tablist" aria-label="PID teaching experiments">{presets.map((item, index) => <button key={item.id} role="tab" aria-selected={preset === index} onClick={() => setPreset(index)}>{item.name}</button>)}</div>
        <div className="teaching-workspace">
          <EngineeringChart samples={result.samples} mode="response" title={selected.name.toUpperCase()} height={390} />
          <aside>
            <span className="lesson-number">{String(preset + 1).padStart(2, "0")} / {String(presets.length).padStart(2, "0")}</span>
            <h3>{selected.name}</h3>
            <div><Function aria-hidden="true" /><p><strong>What changed?</strong>{selected.change}</p></div>
            <div><Eye aria-hidden="true" /><p><strong>What should I watch?</strong>{selected.watch}</p></div>
            <div><Lightbulb aria-hidden="true" /><p><strong>Why does this happen?</strong>{selected.why}</p></div>
            <a href="/lab">Open in full lab <ArrowRight aria-hidden="true" /></a>
          </aside>
        </div>
      </section>
      <section className="constant-explorer section-pad">
        <div><p className="section-kicker">TIME CONSTANT EXPLORER</p><h2>One τ is 63.2% of the journey.</h2><p>For a first-order step response, <Equation expression="y(t)=K(1-e^{-t/\tau})" />. At 5τ the response is about 99.3% of its final value.</p><label>Time constant τ / s<input type="range" min=".2" max="8" step=".1" value={tau} onChange={(event) => setTau(Number(event.target.value))} /><strong>{tau.toFixed(1)}</strong></label><label>Process gain K<input type="range" min=".2" max="3" step=".1" value={gain} onChange={(event) => setGain(Number(event.target.value))} /><strong>{gain.toFixed(1)}</strong></label></div>
        <div className="tau-chart" role="img" aria-label={`First-order response with time constant ${tau} seconds and gain ${gain}.`}><svg viewBox="0 0 640 330"><path className="axis" d="M50 20V285H620" />{[1,2,3,4,5].map((multiple) => { const px = 50 + multiple * 114; return <g key={multiple}><line className="tau-line" x1={px} x2={px} y1="20" y2="285" /><text x={px} y="310" textAnchor="middle">{multiple}τ</text></g>; })}<motion.path className="tau-response" d={firstOrderPoints.map(([t, value], index) => `${index ? "L" : "M"}${(50 + (t / (5 * tau)) * 570).toFixed(3)},${(285 - (value / Math.max(gain, .001)) * 240).toFixed(3)}`).join(" ")} initial={false} animate={{ pathLength: 1 }} transition={{ duration: .7 }} /><line className="steady-line" x1="50" x2="620" y1="45" y2="45" /><text x="60" y="39">K = {gain.toFixed(1)}</text></svg></div>
      </section>
      <section className="second-explorer section-pad">
        <div className="pole-map"><svg viewBox="0 0 440 330" role="img" aria-label={`Pole map for a ${dampingLabel} second-order system.`}><path className="axis" d="M20 165H420M220 20V310" /><text x="390" y="154">Re</text><text x="228" y="34">Im</text><line className="omega-circle" x1="220" y1="165" x2={220 + x * 95} y2={165 - y * 95} /><g className="pole"><path d={`M${220 + x * 95 - 7},${165 - y * 95 - 7}l14,14m0,-14l-14,14`} />{y > .001 && <path d={`M${220 + x * 95 - 7},${165 + y * 95 - 7}l14,14m0,-14l-14,14`} />}</g></svg></div>
        <div><p className="section-kicker">SECOND-ORDER EXPLORER</p><h2>{dampingLabel}</h2><p>Poles move as natural frequency and damping ratio change. For ζ &lt; 1, the complex pole pair produces an oscillatory mode; ζ = 1 is the repeated critical boundary.</p><label>Natural frequency ωn / rad s⁻¹<input type="range" min=".2" max="3" step=".05" value={omegaN} onChange={(event) => setOmegaN(Number(event.target.value))} /><strong>{omegaN.toFixed(2)}</strong></label><label>Damping ratio ζ<input type="range" min="0" max="2" step=".01" value={zeta} onChange={(event) => setZeta(Number(event.target.value))} /><strong>{zeta.toFixed(2)}</strong></label><Equation expression="s_{1,2}=-\zeta\omega_n\pm\omega_n\sqrt{\zeta^2-1}" block /></div>
      </section>
    </>
  );
}
