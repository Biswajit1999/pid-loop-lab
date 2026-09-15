"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowsClockwise, Copy, DownloadSimple, FileCsv, Pause, Play, SkipForward, UploadSimple, Warning } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { EngineeringChart } from "./EngineeringChart";
import { useLabStore } from "@/lib/store";
import { calculateMetrics } from "@/lib/metrics";
import { decodeConfiguration, downloadText, encodeConfiguration, samplesToCsv } from "@/lib/export";
import { parseCsv } from "@/lib/csv";
import type { PIDConfig, PlantConfig, SimulationSample } from "@/lib/types";

function NumericControl({ label, value, min, max, step, onChange, help, log = false }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void; help?: string; log?: boolean }) {
  const safeValue = Number.isFinite(value) ? value : min;
  const sliderValue = log ? Math.log10(Math.max(safeValue, min)) : safeValue;
  const sliderMin = log ? Math.log10(min) : min;
  const sliderMax = log ? Math.log10(max) : max;
  return (
    <label className="numeric-control" title={help}>
      <span>{label}{help && <small aria-hidden="true">?</small>}</span>
      <div><input aria-label={`${label} slider`} type="range" min={sliderMin} max={sliderMax} step={log ? 0.01 : step} value={sliderValue} onChange={(event) => onChange(log ? 10 ** Number(event.target.value) : Number(event.target.value))} />
      <input aria-label={`${label} numeric value`} type="number" min={min} max={max} step={step} value={Number(safeValue.toPrecision(6))} onChange={(event) => onChange(Number(event.target.value))} /></div>
    </label>
  );
}

function SelectControl<T extends string>({ label, value, onChange, options, help }: { label: string; value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; help?: string }) {
  return <label className="select-control" title={help}><span>{label}{help && <small aria-hidden="true">?</small>}</span><select value={value} onChange={(event) => onChange(event.target.value as T)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

const fmt = (value: number | null, suffix = "") => value === null ? "not defined" : `${Number(value.toPrecision(4))}${suffix}`;

function Telemetry({ sample }: { sample: SimulationSample }) {
  const contributions = [
    ["P", sample.p, "p"], ["I", sample.i, "i"], ["D", sample.d, "d"],
  ] as const;
  const scale = Math.max(1, ...contributions.map(([, value]) => Math.abs(value)));
  return (
    <div className="telemetry">
      <div className="telemetry-grid">
        <span><small>SETPOINT</small><strong>{sample.setpoint.toFixed(3)}</strong></span>
        <span><small>PROCESS</small><strong>{sample.pv.toFixed(3)}</strong></span>
        <span><small>ERROR</small><strong>{sample.error.toFixed(3)}</strong></span>
        <span><small>TIME</small><strong>{sample.t.toFixed(2)} s</strong></span>
      </div>
      <div className="term-bars" aria-label="Current P, I and D contribution magnitudes">
        {contributions.map(([name, value, className]) => <div key={name}><span>{name}</span><div><motion.i className={className} animate={{ scaleX: Math.min(1, Math.abs(value) / scale) }} style={{ transformOrigin: "left" }} /></div><strong>{value.toFixed(3)}</strong></div>)}
      </div>
      <div className={sample.saturated ? "saturation-card active" : "saturation-card"}>
        <span>{sample.saturated ? "LIMIT ACTIVE" : "ACTUATOR IN RANGE"}</span>
        <strong>{sample.actuator.toFixed(3)}</strong>
        <motion.div animate={{ x: `${Math.max(-46, Math.min(46, sample.actuator * 4.6))}%` }} />
      </div>
    </div>
  );
}

type CodeLanguage = "python" | "cpp" | "arduino" | "matlab";

function codeExample(pid: PIDConfig, language: CodeLanguage): string {
  const values = `${pid.kp}, ${pid.ki}, ${pid.kd}`;
  const warning = "Educational implementation example; validate timing, scaling, fail-safes, and limits before hardware use.";
  if (language === "python") return `# ${warning}\nKp, Ki, Kd = ${values}\ndt, Tf = ${pid.sampleTime}, ${pid.tf}\nu_min, u_max = ${pid.outputMin}, ${pid.outputMax}\nI = Df = prev_y = 0.0\n\ndef update(setpoint, measured):\n    global I, Df, prev_y\n    error = setpoint - measured\n    P = Kp * error\n    I += Ki * error * dt\n    raw_d = -(measured - prev_y) / dt\n    Df = Tf/(Tf+dt)*Df + dt/(Tf+dt)*raw_d\n    unclamped = P + I + Kd * Df\n    output = min(u_max, max(u_min, unclamped))\n    ${pid.antiWindup === "back-calculation" ? `I += ${pid.backCalculationGain} * (output - unclamped) * dt` : pid.antiWindup === "clamp" ? "# Apply conditional integration when saturated." : "# Anti-windup is disabled."}\n    prev_y = measured\n    return output`;
  if (language === "matlab") return `% ${warning}\nfunction [u,state] = pid_step(r,y,state)\nKp=${pid.kp}; Ki=${pid.ki}; Kd=${pid.kd}; Ts=${pid.sampleTime}; Tf=${pid.tf};\ne=r-y; P=Kp*e; state.I=state.I+Ki*e*Ts;\nrawD=-(y-state.prevY)/Ts; state.D=Tf/(Tf+Ts)*state.D+Ts/(Tf+Ts)*rawD;\nu0=P+state.I+Kd*state.D; u=min(${pid.outputMax},max(${pid.outputMin},u0));\n${pid.antiWindup === "back-calculation" ? `state.I=state.I+${pid.backCalculationGain}*(u-u0)*Ts;` : "% Apply the selected anti-windup policy here."}\nstate.prevY=y;\nend`;
  const prefix = language === "arduino" ? `// Arduino-style C++\n// Call pidStep() every ${(pid.sampleTime * 1000).toFixed(1)} ms from a deterministic scheduler.` : "// ISO C/C++ core; provide a deterministic caller at Ts.";
  return `${prefix}\n// ${warning}\nstruct PIDState { double I, Df, prevY; };\nconst double Kp=${pid.kp}, Ki=${pid.ki}, Kd=${pid.kd};\nconst double Ts=${pid.sampleTime}, Tf=${pid.tf};\n\ndouble pidStep(double r, double y, PIDState &s) {\n  const double e=r-y, P=Kp*e;\n  s.I += Ki*e*Ts;\n  const double rawD=-(y-s.prevY)/Ts;\n  s.Df=Tf/(Tf+Ts)*s.Df+Ts/(Tf+Ts)*rawD;\n  const double u0=P+s.I+Kd*s.Df;\n  const double u=u0>${pid.outputMax}?${pid.outputMax}:(u0<${pid.outputMin}?${pid.outputMin}:u0);\n  ${pid.antiWindup === "back-calculation" ? `s.I += ${pid.backCalculationGain}*(u-u0)*Ts;` : "/* Apply the selected anti-windup policy here. */"}\n  s.prevY=y; return u;\n}`;
}

export function LabWorkspace() {
  const store = useLabStore();
  const [running, setRunning] = useState(false);
  const [cursor, setCursor] = useState(store.result.samples.length - 1);
  const [speed, setSpeed] = useState(1);
  const [tab, setTab] = useState<"plots" | "metrics" | "advanced" | "import">("plots");
  const [importMessage, setImportMessage] = useState("No experimental file loaded.");
  const [copied, setCopied] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>("python");
  const [actuatorMode, setActuatorMode] = useState<"normalized" | "pwm" | "dc-load" | "dc-motor">("dc-load");
  const metrics = useMemo(() => calculateMetrics(store.result.samples), [store.result.samples]);
  const sample = store.result.samples[Math.max(0, Math.min(cursor, store.result.samples.length - 1))] ?? ({ t: 0, setpoint: 0, pv: 0, measured: 0, error: 0, p: 0, i: 0, d: 0, unclamped: 0, output: 0, actuator: 0, disturbance: 0, noise: 0, saturated: false, state: [], voltage: 0, current: 0, power: 0 } satisfies SimulationSample);

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("config");
    if (encoded) {
      try { store.load(decodeConfiguration(encoded)); } catch { /* Ignore malformed shared state and retain validated defaults. */ }
    }
    // URL hydration intentionally runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === "Space") { event.preventDefault(); setRunning((value) => !value); }
      if (event.key.toLowerCase() === "r") { setRunning(false); setCursor(0); }
      if (event.key.toLowerCase() === "n") setCursor((value) => Math.min(store.result.samples.length - 1, value + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store.result.samples.length]);

  useEffect(() => {
    if (!running || !store.result.samples.length) return;
    let frame = 0;
    let last = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - last) / 1000;
      const increment = Math.max(1, Math.round((elapsed * speed) / store.simulation.dt));
      if (now - last > 45) {
        last = now;
        setCursor((value) => {
          const next = value + increment;
          if (next >= store.result.samples.length - 1) { setRunning(false); return store.result.samples.length - 1; }
          return next;
        });
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [running, speed, store.result.samples.length, store.simulation.dt]);

  const run = () => {
    store.run();
    setCursor(0);
    setRunning(useLabStore.getState().result.status === "complete");
  };
  const reset = () => { store.reset(); setRunning(false); setCursor(0); };
  const copyConfig = async () => {
    const encoded = encodeConfiguration({ pid: store.pid, plant: store.plant, effects: store.effects, simulation: store.simulation });
    const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };
  const loadCsv = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseCsv(await file.text());
      setImportMessage(`${file.name}: ${parsed.time.length} valid rows, ${parsed.time[0]}–${parsed.time.at(-1)} s. Analysis preview accepted; model identification is intentionally not claimed in v1.`);
    } catch (error) { setImportMessage(error instanceof Error ? error.message : "Could not parse CSV."); }
  };

  const plantOptions: { value: PlantConfig["kind"]; label: string }[] = [
    { value: "first-order", label: "First order" }, { value: "fopdt", label: "FOPDT" }, { value: "second-order", label: "Second order" },
    { value: "integrator", label: "Integrating process" }, { value: "mass-spring-damper", label: "Mass–spring–damper" }, { value: "dc-motor", label: "DC motor" },
    { value: "thermal", label: "Generic thermal" }, { value: "transfer-function", label: "Transfer function" },
  ];

  return (
    <>
      <div className="transport-bar" role="toolbar" aria-label="Simulation transport controls">
        <button className="button primary small" onClick={run}><Play aria-hidden="true" />Run simulation</button>
        <button className="button small" onClick={() => setRunning(!running)}>{running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}{running ? "Pause" : "Play"}</button>
        <button className="button small" onClick={() => setCursor((value) => Math.min(store.result.samples.length - 1, value + 1))}><SkipForward aria-hidden="true" />Single step</button>
        <button className="button small" onClick={reset}><ArrowsClockwise aria-hidden="true" />Reset</button>
        <label className="speed-select">Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{[.25,.5,1,2,5].map((value) => <option key={value} value={value}>×{value}</option>)}</select></label>
        <span className={`run-status ${store.result.status}`}>{store.result.status.toUpperCase()} · {store.result.message}</span>
      </div>

      <div className="lab-grid">
        <aside className="control-panel left-panel" aria-label="Plant and simulation controls">
          <section><p className="panel-kicker">01 / PLANT</p><h2>Plant model</h2>
            <SelectControl label="Model" value={store.plant.kind} onChange={(kind) => store.patchPlant({ kind })} options={plantOptions} help="The dynamic system driven by the actuator output." />
            {!["second-order", "mass-spring-damper", "dc-motor", "transfer-function"].includes(store.plant.kind) && <><NumericControl label="Process gain K" value={store.plant.gain} min={.05} max={10} step={.05} onChange={(gain) => store.patchPlant({ gain })} /><NumericControl label="Time constant τ / s" value={store.plant.tau} min={.05} max={20} step={.05} log onChange={(tau) => store.patchPlant({ tau })} /></>}
            {store.plant.kind === "fopdt" && <NumericControl label="Dead time θ / s" value={store.plant.deadTime} min={0} max={10} step={.01} onChange={(deadTime) => store.patchPlant({ deadTime })} />}
            {store.plant.kind === "second-order" && <><NumericControl label="Gain K" value={store.plant.gain} min={.05} max={5} step={.05} onChange={(gain) => store.patchPlant({ gain })} /><NumericControl label="Natural frequency ωn / rad s⁻¹" value={store.plant.omegaN} min={.1} max={10} step={.1} onChange={(omegaN) => store.patchPlant({ omegaN })} /><NumericControl label="Damping ratio ζ" value={store.plant.zeta} min={0} max={3} step={.01} onChange={(zeta) => store.patchPlant({ zeta })} /></>}
            {store.plant.kind === "mass-spring-damper" && <><NumericControl label="Mass M / kg" value={store.plant.mass} min={.05} max={20} step={.05} onChange={(mass) => store.patchPlant({ mass })} /><NumericControl label="Damping C / N·s m⁻¹" value={store.plant.damping} min={0} max={20} step={.05} onChange={(damping) => store.patchPlant({ damping })} /><NumericControl label="Spring k / N m⁻¹" value={store.plant.spring} min={.05} max={30} step={.05} onChange={(spring) => store.patchPlant({ spring })} /></>}
            {store.plant.kind === "dc-motor" && <><NumericControl label="Resistance R / Ω" value={store.plant.resistance} min={.05} max={20} step={.05} onChange={(resistance) => store.patchPlant({ resistance })} /><NumericControl label="Inductance L / H" value={store.plant.inductance} min={.001} max={5} step={.001} log onChange={(inductance) => store.patchPlant({ inductance })} /><NumericControl label="Motor constant / SI" value={store.plant.motorConstant} min={.001} max={2} step={.001} onChange={(motorConstant) => store.patchPlant({ motorConstant })} /></>}
            {store.plant.kind === "transfer-function" && <><label className="text-control"><span>Numerator coefficients</span><input value={store.plant.numerator.join(", ")} onChange={(event) => store.patchPlant({ numerator: event.target.value.split(/[ ,]+/).map(Number) })} /></label><label className="text-control"><span>Denominator coefficients</span><input value={store.plant.denominator.join(", ")} onChange={(event) => store.patchPlant({ denominator: event.target.value.split(/[ ,]+/).map(Number) })} /></label><p className="helper">Descending powers of s. Strictly proper models only.</p></>}
          </section>
          <section><p className="panel-kicker">02 / CLOCK</p><h2>Simulation</h2>
            <NumericControl label="Setpoint" value={store.simulation.setpoint} min={-10} max={10} step={.1} onChange={(setpoint) => store.patchSimulation({ setpoint })} />
            <NumericControl label="Duration / s" value={store.simulation.duration} min={1} max={120} step={1} onChange={(duration) => store.patchSimulation({ duration })} />
            <NumericControl label="Plant step dt / s" value={store.simulation.dt} min={.001} max={.1} step={.001} log onChange={(dt) => store.patchSimulation({ dt })} help="RK4 integration step; distinct from controller sample time and render rate." />
          </section>
        </aside>

        <section className="workspace-center" aria-label="Primary simulation visualization">
          <div className="primary-chart"><EngineeringChart samples={store.result.samples} mode="response" title="SETPOINT + PROCESS RESPONSE" height={420} /></div>
          <div className="timeline"><span>t = {sample.t.toFixed(2)} s</span><input aria-label="Simulation timeline" type="range" min={0} max={Math.max(0, store.result.samples.length - 1)} value={Math.max(0, cursor)} onChange={(event) => { setRunning(false); setCursor(Number(event.target.value)); }} /><span>{store.simulation.duration.toFixed(1)} s</span></div>
          <div className="experiment-row" aria-label="Controlled experiment shortcuts">
            <button onClick={() => { store.patchEffects({ noiseStd: store.effects.noiseStd ? 0 : .05 }); store.run(); }}>Add sensor noise</button>
            <button onClick={() => { store.patchPid({ outputMin: store.pid.outputMin === -1 ? -10 : -1, outputMax: store.pid.outputMax === 1 ? 10 : 1 }); store.run(); }}>Force saturation</button>
            <button onClick={() => { store.patchPlant({ deadTime: Math.max(.1, store.plant.deadTime * 2) }); store.run(); }}>Double dead time</button>
            <button onClick={() => { store.patchPid({ sampleTime: Math.min(1, store.pid.sampleTime * 2) }); store.run(); }}>Slow sample rate</button>
            <button onClick={() => { store.patchEffects({ loadDisturbance: store.effects.loadDisturbance ? 0 : -.35 }); store.run(); }}>Inject load</button>
          </div>
          {store.result.status !== "complete" && <div className="error-banner" role="alert"><Warning aria-hidden="true" />{store.result.message}</div>}
        </section>

        <aside className="control-panel right-panel" aria-label="PID settings and live telemetry">
          <section><p className="panel-kicker">03 / CONTROLLER</p><h2>Parallel PIDF</h2>
            <NumericControl label="Kp" value={store.pid.kp} min={0} max={50} step={.01} onChange={(kp) => store.patchPid({ kp })} />
            <NumericControl label="Ki / s⁻¹" value={store.pid.ki} min={0} max={50} step={.01} onChange={(ki) => store.patchPid({ ki })} />
            <NumericControl label="Kd · s" value={store.pid.kd} min={0} max={20} step={.01} onChange={(kd) => store.patchPid({ kd })} />
            <NumericControl label="Sample period Ts / s" value={store.pid.sampleTime} min={.001} max={2} step={.001} log onChange={(sampleTime) => store.patchPid({ sampleTime })} />
            <NumericControl label="Derivative filter Tf / s" value={store.pid.tf} min={0} max={2} step={.001} onChange={(tf) => store.patchPid({ tf })} />
            <SelectControl label="Derivative" value={store.pid.derivativeMode} onChange={(derivativeMode) => store.patchPid({ derivativeMode })} options={[{ value: "measurement", label: "On measurement" }, { value: "error", label: "On weighted error" }]} />
            <SelectControl label="Anti-windup" value={store.pid.antiWindup} onChange={(antiWindup) => store.patchPid({ antiWindup })} options={[{ value: "off", label: "Off" }, { value: "clamp", label: "Conditional / clamp" }, { value: "back-calculation", label: "Back calculation" }]} />
            <details><summary>Limits + 2-DOF weights</summary><NumericControl label="Output minimum" value={store.pid.outputMin} min={-100} max={0} step={.1} onChange={(outputMin) => store.patchPid({ outputMin })} /><NumericControl label="Output maximum" value={store.pid.outputMax} min={0} max={100} step={.1} onChange={(outputMax) => store.patchPid({ outputMax })} /><NumericControl label="P weight β" value={store.pid.beta} min={0} max={1.5} step={.01} onChange={(beta) => store.patchPid({ beta })} /><NumericControl label="D weight γ" value={store.pid.gamma} min={0} max={1} step={.01} onChange={(gamma) => store.patchPid({ gamma })} /></details>
          </section>
          <section><p className="panel-kicker">04 / LIVE SIGNALS</p><Telemetry sample={sample} /></section>
        </aside>
      </div>

      <section className="analysis-dock">
        <div className="dock-tabs" role="tablist" aria-label="Engineering analysis views">
          {(["plots", "metrics", "advanced", "import"] as const).map((name) => <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>{name === "import" ? "Data import" : name}</button>)}
          <div className="dock-actions"><button onClick={() => downloadText("pid-loop-lab.csv", samplesToCsv(store.result.samples), "text/csv")}><FileCsv aria-hidden="true" />CSV</button><button onClick={() => downloadText("pid-loop-lab.json", JSON.stringify({ configuration: { pid: store.pid, plant: store.plant, effects: store.effects, simulation: store.simulation }, result: store.result }, null, 2), "application/json")}><DownloadSimple aria-hidden="true" />JSON</button><button onClick={copyConfig}><Copy aria-hidden="true" />{copied ? "Copied" : "Copy configuration"}</button></div>
        </div>
        {tab === "plots" && <div className="secondary-grid"><EngineeringChart samples={store.result.samples} mode="terms" title="P / I / D CONTRIBUTIONS" /><EngineeringChart samples={store.result.samples} mode="actuator" title="COMMAND + ACTUATOR" /><EngineeringChart samples={store.result.samples} mode="error" title="CONTROL ERROR" /></div>}
        {tab === "metrics" && <div className="metrics-grid">{([
          ["Rise time", metrics.riseTime, " s"], ["Peak time", metrics.peakTime, " s"], ["Overshoot", metrics.overshootPercent, "%"], ["Settling time", metrics.settlingTime, " s"],
          ["Steady-state error", metrics.steadyStateError, ""], ["Maximum |error|", metrics.maximumAbsoluteError, ""], ["IAE", metrics.iae, ""], ["ISE", metrics.ise, ""], ["ITAE", metrics.itae, ""],
          ["RMS error", metrics.rmsError, ""], ["RMS effort", metrics.rmsControllerEffort, ""], ["Total variation", metrics.totalControllerVariation, ""], ["Saturated", metrics.saturationPercent, "%"],
        ] as const).map(([name, value, suffix]) => <article key={name}><small>{name}</small><strong>{fmt(value, suffix)}</strong></article>)}</div>}
        {tab === "advanced" && <div className="advanced-grid"><article><p className="panel-kicker">ACTUATOR VIEW</p><h3>Command becomes physics</h3><label className="select-control"><span>Actuator mode</span><select value={actuatorMode} onChange={(event) => setActuatorMode(event.target.value as typeof actuatorMode)}><option value="normalized">Normalized command</option><option value="pwm">PWM actuator</option><option value="dc-load">DC electrical load</option><option value="dc-motor">DC motor state</option></select></label><dl><div><dt>Command</dt><dd>{(100 * sample.output / Math.max(Math.abs(store.pid.outputMax), 1e-9)).toFixed(1)}%</dd></div>{actuatorMode === "pwm" && <div><dt>PWM duty</dt><dd>{Math.max(0, Math.min(100, 50 + 50 * sample.output / Math.max(Math.abs(store.pid.outputMax), 1e-9))).toFixed(1)}%</dd></div>}{actuatorMode === "dc-load" && <><div><dt>Voltage</dt><dd>{sample.voltage.toFixed(3)} V</dd></div><div><dt>Current</dt><dd>{sample.current.toFixed(3)} A</dd></div><div><dt>Power</dt><dd>{sample.power.toFixed(3)} W</dd></div></>}{actuatorMode === "dc-motor" && <><div><dt>Armature current</dt><dd>{(sample.state[0] ?? 0).toFixed(3)} A</dd></div><div><dt>Angular speed</dt><dd>{(sample.state[1] ?? 0).toFixed(3)} rad/s</dd></div></>}<div><dt>Saturation</dt><dd>{sample.saturated ? "active" : "inactive"}</dd></div></dl><p className="helper">The normalized and electrical views are educational abstractions; select the DC motor plant for its documented electromechanical state equations.</p></article><article><p className="panel-kicker">CODE EXPORT</p><h3>Implementation example</h3><label className="select-control"><span>Language</span><select value={codeLanguage} onChange={(event) => setCodeLanguage(event.target.value as CodeLanguage)}><option value="python">Python</option><option value="cpp">C / C++</option><option value="arduino">Arduino-style C++</option><option value="matlab">MATLAB</option></select></label><pre><code>{codeExample(store.pid, codeLanguage)}</code></pre><button className="button small" onClick={() => { const ext = codeLanguage === "python" ? "py" : codeLanguage === "matlab" ? "m" : "cpp"; downloadText(`pid_controller.${ext}`, codeExample(store.pid, codeLanguage), "text/plain"); }}><DownloadSimple aria-hidden="true" />Download</button></article><article><p className="panel-kicker">FREQUENCY DOMAIN</p><h3>Eligibility guard</h3><p>Gain margin, phase margin, bandwidth, Bode, Nyquist, and pole-zero calculations are intentionally reported only when a supported linear continuous-time model can be transformed without nonlinear saturation, slew rate, noise, jitter, or quantization. The v1 interface does not fabricate these values.</p><p className="helper">See the documented scientific limitations and validation report.</p></article></div>}
        {tab === "import" && <div className="import-panel"><UploadSimple aria-hidden="true" /><div><h3>Analyze experimental response CSV</h3><p>Accepted columns: time, process value (PV), optional setpoint and controller output. Time must be strictly increasing.</p><label className="button small">Choose CSV<input className="sr-only" type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={(event) => loadCsv(event.target.files?.[0])} /></label><p className="import-status" aria-live="polite">{importMessage}</p></div></div>}
      </section>
    </>
  );
}
