"use client";

import { useMemo, useState } from "react";
import { CheckCircle, Info, Pulse, Warning } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { ComparisonChart } from "./ComparisonChart";
import { defaultPID } from "@/lib/pid";
import { defaultPlant } from "@/lib/plants";
import { defaultEffects, defaultSimulation, simulate } from "@/lib/simulation";
import { calculateMetrics } from "@/lib/metrics";
import { estimateRelayUltimate, tuneFOPDT, tuneUltimate, type ControllerType, type TuningMethod } from "@/lib/tuning";

const methods: { id: TuningMethod; name: string; family: string; note: string; available: boolean }[] = [
  { id: "manual", name: "Manual", family: "Direct gains", note: "Your current Kp, Ki and Kd values.", available: true },
  { id: "zn-reaction", name: "Ziegler–Nichols", family: "Reaction curve", note: "Historical FOPDT baseline; usually aggressive.", available: true },
  { id: "cohen-coon", name: "Cohen–Coon", family: "Reaction curve", note: "Dead-time-aware FOPDT correlations.", available: true },
  { id: "chr", name: "CHR 0%", family: "Reaction curve", note: "Setpoint rule targeting no overshoot.", available: true },
  { id: "imc", name: "IMC / Lambda", family: "Model based", note: "Explicit speed–robustness parameter λ.", available: true },
  { id: "simc", name: "Skogestad SIMC", family: "Model based", note: "Simple robust PI rule for FOPDT models.", available: true },
  { id: "zn-ultimate", name: "ZN ultimate", family: "Ultimate cycle", note: "Requires Ku and Pu from sustained oscillation.", available: true },
  { id: "tyreus-luyben", name: "Tyreus–Luyben", family: "Ultimate cycle", note: "More conservative ultimate-cycle heuristic.", available: true },
  { id: "relay", name: "Relay feedback", family: "Simulated experiment", note: "Estimates Ku = 4d/(πa) and Pu.", available: true },
];

const fmt = (value: number | null) => value === null ? "—" : Number(value.toPrecision(4));

export function TuningLab() {
  const [model, setModel] = useState({ gain: 1, tau: 2, deadTime: .35 });
  const [lambda, setLambda] = useState(1.2);
  const [controller, setController] = useState<ControllerType>("PID");
  const [selected, setSelected] = useState<TuningMethod[]>(["manual", "zn-reaction", "cohen-coon", "simc"]);
  const [relay, setRelay] = useState({ d: 1, a: .32, pu: 2.6 });
  const reduced = useReducedMotion();
  const ultimate = useMemo(() => estimateRelayUltimate(relay.d, relay.a, relay.pu), [relay]);
  const comparisons = useMemo(() => selected.map((method) => {
    try {
      const tuning = method === "manual"
        ? { kp: defaultPID.kp, ki: defaultPID.ki, kd: defaultPID.kd, kc: defaultPID.kp, ti: defaultPID.kp / defaultPID.ki, td: defaultPID.kd / defaultPID.kp, warning: null, assumptions: "Manual parallel-form gains.", sourceKey: "manual" }
        : method === "zn-ultimate" || method === "tyreus-luyben"
          ? tuneUltimate(method, controller, ultimate)
          : method === "relay"
            ? tuneUltimate("zn-ultimate", controller, ultimate)
            : tuneFOPDT(method, controller, model, lambda);
      const pid = { ...defaultPID, kp: tuning.kp, ki: tuning.ki, kd: tuning.kd };
      const plant = { ...defaultPlant, kind: "fopdt" as const, ...model };
      const result = simulate(pid, plant, defaultEffects, { ...defaultSimulation, duration: 18 });
      return { method, name: methods.find((m) => m.id === method)?.name ?? method, tuning, result, metrics: calculateMetrics(result.samples), error: null };
    } catch (error) {
      return { method, name: method, tuning: null, result: { samples: [], status: "invalid" as const, message: "" }, metrics: calculateMetrics([]), error: error instanceof Error ? error.message : "Unavailable" };
    }
  }), [selected, controller, model, lambda, ultimate]);
  const toggle = (method: TuningMethod) => setSelected((current) => current.includes(method) ? current.filter((item) => item !== method) : current.length < 4 ? [...current, method] : current);
  return (
    <div className="tuning-layout">
      <aside className="tuning-controls">
        <p className="panel-kicker">PLANT MODEL / FOPDT</p><h2>Identify the process</h2>
        {([[
          "gain", "Process gain K", .05, 10, .05], ["tau", "Time constant τ / s", .05, 30, .05], ["deadTime", "Dead time θ / s", .01, 15, .01], ["lambda", "Closed-loop target λ / s", .05, 30, .05],
        ] as const).map(([key, label, min, max, step]) => <label className="stacked-number" key={key}><span>{label}</span><input type="number" value={key === "lambda" ? lambda : model[key]} min={min} max={max} step={step} onChange={(event) => key === "lambda" ? setLambda(Number(event.target.value)) : setModel({ ...model, [key]: Number(event.target.value) })} /></label>)}
        <label className="stacked-number"><span>Controller structure</span><select value={controller} onChange={(event) => setController(event.target.value as ControllerType)}><option>P</option><option>PI</option><option>PID</option></select></label>
        <div className="eligibility"><CheckCircle aria-hidden="true" /><div><strong>Eligible model</strong><span>Open-loop stable, self-regulating FOPDT with K ≠ 0, τ &gt; 0 and θ &gt; 0.</span></div></div>
        <div className="relay-controls"><p className="panel-kicker">RELAY EXPERIMENT</p><h3>Simulated ultimate cycle</h3>{([[
          "d", "Relay amplitude d"], ["a", "Oscillation amplitude a"], ["pu", "Ultimate period Pu / s"],
        ] as const).map(([key, label]) => <label key={key}><span>{label}</span><input type="number" min="0.01" step="0.01" value={relay[key]} onChange={(event) => setRelay({ ...relay, [key]: Number(event.target.value) })} /></label>)}<dl><div><dt>Estimated Ku</dt><dd>{ultimate.ultimateGain.toFixed(3)}</dd></div><div><dt>Measured Pu</dt><dd>{ultimate.ultimatePeriod.toFixed(3)} s</dd></div></dl></div>
      </aside>
      <section className="tuning-main">
        <div className="method-heading"><div><p className="panel-kicker">SELECT UP TO FOUR</p><h2>Tuning methods</h2></div><span>{selected.length} / 4 active</span></div>
        <div className="method-grid">
          {methods.map((method) => { const active = selected.includes(method.id); return <button key={method.id} className={active ? "method-card active" : "method-card"} onClick={() => toggle(method.id)} disabled={!active && selected.length >= 4}><span>{method.family}</span><strong>{method.name}</strong><small>{method.note}</small><i aria-hidden="true">{active ? "ACTIVE" : "SELECT"}</i></button>; })}
        </div>
        <div className="compare-heading"><div><p className="panel-kicker">RESPONSE OVERLAY</p><h2>No universal winner.</h2></div><p>Compare speed, overshoot, integrated error, actuator activity, and robustness. A lower value is not automatically a better engineering choice.</p></div>
        <ComparisonChart results={comparisons.filter((item) => item.result.samples.length).map((item) => ({ name: item.name, result: item.result }))} />
        <div className="comparison-table-wrap"><table className="comparison-table"><caption>Selected tuning parameters and response metrics</caption><thead><tr><th scope="col">Method</th><th scope="col">Kp</th><th scope="col">Ki</th><th scope="col">Kd</th><th scope="col">Rise / s</th><th scope="col">Overshoot / %</th><th scope="col">IAE</th><th scope="col">TV(u)</th></tr></thead><tbody>{comparisons.map((item) => <tr key={item.method}><th scope="row">{item.name}{item.error && <span title={item.error}><Warning aria-hidden="true" />Ineligible</span>}</th><td>{item.tuning ? fmt(item.tuning.kp) : "—"}</td><td>{item.tuning ? fmt(item.tuning.ki) : "—"}</td><td>{item.tuning ? fmt(item.tuning.kd) : "—"}</td><td>{fmt(item.metrics.riseTime)}</td><td>{fmt(item.metrics.overshootPercent)}</td><td>{fmt(item.metrics.iae)}</td><td>{fmt(item.metrics.totalControllerVariation)}</td></tr>)}</tbody></table></div>
        <section className="relay-visual">
          <div><p className="panel-kicker">ÅSTRÖM–HÄGGLUND STYLE</p><h2>Relay feedback experiment</h2><p>A symmetric relay of amplitude <em>d</em> drives a limit cycle. From process oscillation amplitude <em>a</em> and period <em>Pu</em>, the describing-function estimate gives <strong>Ku = 4d/(πa)</strong>. This is simulated autotuning; do not transfer it to hardware without a safety review.</p></div>
          <div className="relay-scope" aria-label="Animated relay output and resulting process oscillation">
            <motion.svg viewBox="0 0 600 220" role="img" aria-label="Relay square wave above a sinusoidal process response">
              <path className="scope-grid" d="M0 55H600M0 110H600M0 165H600M100 0V220M200 0V220M300 0V220M400 0V220M500 0V220" />
              <motion.path className="relay-line" d="M0 45H75V95H150V45H225V95H300V45H375V95H450V45H525V95H600" initial={reduced ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 1.4 }} />
              <motion.path className="process-line" d="M0 170 C38 125 75 125 112 170 S188 215 225 170 S300 125 337 170 S412 215 450 170 S525 125 562 170 S600 215 600 170" initial={reduced ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 2 }} />
            </motion.svg>
            <div><span><i className="relay-dot" />Relay output</span><span><i className="process-dot" />Process oscillation</span><span><Pulse aria-hidden="true" />Ku {ultimate.ultimateGain.toFixed(3)}</span></div>
          </div>
        </section>
        <div className="tuning-note"><Info aria-hidden="true" /><p>Controller gains shown in the simulation are parallel-form values: <strong>Ki = Kc/Ti</strong> and <strong>Kd = Kc·Td</strong>. Each rule’s source, assumptions, units, and limitations are documented in <code>docs/tuning-methods.md</code> and <code>docs/method-validation.md</code>.</p></div>
      </section>
    </div>
  );
}
