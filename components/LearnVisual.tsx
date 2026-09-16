type Tone = "green" | "orange" | "blue" | "ink";

type Curve = {
  label: string;
  tone: Tone;
  value: (time: number) => number;
};

type Marker = {
  time: number;
  value: number;
  label: string;
};

type Visual = {
  eyebrow: string;
  title: string;
  description: string;
  insight: string;
  yLabel: string;
  yRange?: [number, number];
  reference?: number | false;
  curves: Curve[];
  markers?: Marker[];
};

const TAU = Math.PI * 2;

function after(time: number, delay = 0.08) {
  return time <= delay ? 0 : (time - delay) / (1 - delay);
}

function firstOrder(time: number, speed = 4, final = 1, delay = 0.08) {
  const local = after(time, delay);
  return local <= 0 ? 0 : final * (1 - Math.exp(-speed * local));
}

function ringing(time: number, damping = 4.5, cycles = 1.45, final = 1, delay = 0.08) {
  const local = after(time, delay);
  return local <= 0 ? 0 : final * (1 - Math.exp(-damping * local) * Math.cos(TAU * cycles * local));
}

function loadRecovery(time: number, recovery = 5, depth = 0.36, delay = 0.32) {
  if (time <= delay) return 1;
  const local = (time - delay) / (1 - delay);
  return 1 - depth * Math.exp(-recovery * local);
}

function noise(time: number, amplitude = 0.08, frequency = 18) {
  return amplitude * Math.sin(TAU * frequency * time);
}

const visuals: Record<string, Visual[]> = {
  "pid-controller": [
    {
      eyebrow: "SIGNAL VIEW 01",
      title: "P, I and D leave different fingerprints",
      description: "The same unit error creates an immediate proportional push, a growing integral contribution, and a short derivative pulse.",
      insight: "P reacts now · I remembers · D anticipates movement",
      yLabel: "Term contribution",
      yRange: [-0.15, 1.25],
      reference: false,
      curves: [
        { label: "Proportional", tone: "green", value: (t) => 0.72 * Math.exp(-2.8 * t) },
        { label: "Integral", tone: "orange", value: (t) => 0.92 * (1 - Math.exp(-2.4 * t)) },
        { label: "Derivative", tone: "blue", value: (t) => 1.1 * Math.exp(-14 * t) - 0.08 * Math.exp(-2 * t) },
      ],
    },
    {
      eyebrow: "RESPONSE VIEW 02",
      title: "Three tunings, three recognizable shapes",
      description: "Low gains are calm but slow, a balanced loop settles quickly, and an aggressive loop trades speed for overshoot and ringing.",
      insight: "The fastest rise is not automatically the best loop",
      yLabel: "Process value",
      curves: [
        { label: "Too soft", tone: "blue", value: (t) => firstOrder(t, 2.2, 0.9) },
        { label: "Balanced", tone: "green", value: (t) => ringing(t, 6.5, 1.1) },
        { label: "Aggressive", tone: "orange", value: (t) => ringing(t, 2.2, 2.15) },
      ],
      markers: [{ time: 0.28, value: 1.22, label: "overshoot" }],
    },
    {
      eyebrow: "LOOP VIEW 03",
      title: "The controller acts before the plant catches up",
      description: "After a setpoint step, controller output moves first. The process value follows the plant dynamics while the error closes toward zero.",
      insight: "Read controller output and process value together",
      yLabel: "Normalized signal",
      yRange: [-0.2, 1.45],
      reference: false,
      curves: [
        { label: "Setpoint", tone: "ink", value: (t) => (t < 0.1 ? 0 : 1) },
        { label: "Controller output", tone: "orange", value: (t) => (t < 0.1 ? 0 : 0.58 + 0.76 * Math.exp(-4.8 * (t - 0.1))) },
        { label: "Process value", tone: "green", value: (t) => firstOrder(t, 5.2, 1, 0.13) },
        { label: "Error", tone: "blue", value: (t) => (t < 0.1 ? 0 : 1 - firstOrder(t, 5.2, 1, 0.13)) },
      ],
    },
  ],
  "proportional-control": [
    {
      eyebrow: "GAIN VIEW 01",
      title: "More Kp makes the first move stronger",
      description: "Higher proportional gain shortens rise time and reduces offset until the plant loses enough damping to overshoot.",
      insight: "Increase authority only while damping remains acceptable",
      yLabel: "Process value",
      curves: [
        { label: "Kp = 0.5", tone: "blue", value: (t) => firstOrder(t, 2.3, 0.72) },
        { label: "Kp = 1.0", tone: "green", value: (t) => firstOrder(t, 4.2, 0.88) },
        { label: "Kp = 2.0", tone: "orange", value: (t) => ringing(t, 2.7, 1.8, 0.97) },
      ],
    },
    {
      eyebrow: "OFFSET VIEW 02",
      title: "Proportional-only control needs some error",
      description: "When a constant load arrives, the loop recovers quickly but settles below the setpoint because error is needed to hold controller output.",
      insight: "A remaining gap is proportional offset—not slow settling",
      yLabel: "Process value",
      curves: [
        { label: "Low Kp", tone: "blue", value: (t) => loadRecovery(t, 3.2, 0.38) - (t > 0.32 ? 0.17 * (1 - Math.exp(-4 * (t - 0.32))) : 0) },
        { label: "Medium Kp", tone: "green", value: (t) => loadRecovery(t, 5.2, 0.3) - (t > 0.32 ? 0.08 * (1 - Math.exp(-5 * (t - 0.32))) : 0) },
        { label: "High Kp", tone: "orange", value: (t) => loadRecovery(t, 5.5, 0.26) + (t > 0.32 ? 0.1 * Math.exp(-3 * (t - 0.32)) * Math.sin(38 * (t - 0.32)) : 0) },
      ],
      markers: [{ time: 0.88, value: 0.91, label: "offset" }],
    },
    {
      eyebrow: "DELAY VIEW 03",
      title: "Dead time converts gain into oscillation",
      description: "With more delay, the controller keeps correcting an error before it can see the result of its previous action.",
      insight: "Delay limits safe Kp even when the plant itself is simple",
      yLabel: "Process value",
      curves: [
        { label: "Short delay", tone: "green", value: (t) => ringing(t, 6.4, 1.05, 1, 0.06) },
        { label: "Moderate delay", tone: "blue", value: (t) => ringing(t, 3.2, 1.65, 1, 0.14) },
        { label: "Long delay", tone: "orange", value: (t) => ringing(t, 1.35, 2.4, 1, 0.22) },
      ],
    },
  ],
  "integral-windup": [
    {
      eyebrow: "SATURATION VIEW 01",
      title: "Requested output can exceed the real actuator",
      description: "The internal PID request continues above the physical limit while the applied output is clipped at 100 percent.",
      insight: "Windup begins in the gap between requested and applied output",
      yLabel: "Controller output",
      yRange: [-0.05, 1.7],
      reference: false,
      curves: [
        { label: "Raw PID request", tone: "orange", value: (t) => (t < 0.1 ? 0 : 1.58 - 0.35 * (1 - Math.exp(-1.8 * (t - 0.1)))) },
        { label: "Actuator limit", tone: "ink", value: (t) => (t < 0.1 ? 0 : 1) },
        { label: "Applied output", tone: "green", value: (t) => (t < 0.1 ? 0 : Math.min(1, 1.58 - 0.35 * (1 - Math.exp(-1.8 * (t - 0.1))))) },
      ],
      markers: [{ time: 0.42, value: 1, label: "saturated" }],
    },
    {
      eyebrow: "STATE VIEW 02",
      title: "The integrator remembers an impossible command",
      description: "Without protection, integral state keeps climbing during saturation. Clamping pauses it; back-calculation actively tracks what the actuator can deliver.",
      insight: "Anti-windup manages hidden controller state",
      yLabel: "Integral state",
      yRange: [-0.05, 1.45],
      reference: false,
      curves: [
        { label: "No anti-windup", tone: "orange", value: (t) => 1.34 * (1 - Math.exp(-3.5 * t)) },
        { label: "Clamping", tone: "blue", value: (t) => Math.min(0.72, 1.6 * t) },
        { label: "Back-calculation", tone: "green", value: (t) => 0.62 * (1 - Math.exp(-7 * t)) + 0.16 * Math.exp(-4 * t) },
      ],
    },
    {
      eyebrow: "RECOVERY VIEW 03",
      title: "Anti-windup changes recovery, not actuator power",
      description: "All cases hit the same output limit, but protected integrators unwind sooner and return the process to target with less overshoot.",
      insight: "Compare the curve after it leaves saturation",
      yLabel: "Process value",
      curves: [
        { label: "No anti-windup", tone: "orange", value: (t) => ringing(t, 1.8, 1.35, 1, 0.12) },
        { label: "Clamping", tone: "blue", value: (t) => ringing(t, 4.4, 1.05, 1, 0.12) },
        { label: "Back-calculation", tone: "green", value: (t) => ringing(t, 6, 0.95, 1, 0.12) },
      ],
    },
  ],
  "derivative-noise": [
    {
      eyebrow: "NOISE VIEW 01",
      title: "Differentiation magnifies fast measurement changes",
      description: "A small ripple on the measured process becomes a much larger high-frequency derivative contribution.",
      insight: "A smooth-looking PV can still create actuator chatter",
      yLabel: "Normalized signal",
      yRange: [-0.75, 1.25],
      reference: false,
      curves: [
        { label: "Measured PV", tone: "green", value: (t) => firstOrder(t, 5.4, 0.8) + noise(t, 0.035, 17) },
        { label: "Raw derivative", tone: "orange", value: (t) => 0.46 * Math.sin(TAU * 17 * t) * (1 - Math.exp(-8 * t)) },
        { label: "Underlying trend", tone: "blue", value: (t) => firstOrder(t, 5.4, 0.8) },
      ],
    },
    {
      eyebrow: "FILTER VIEW 02",
      title: "The derivative filter trades chatter for lag",
      description: "Filtering reduces rapid output movement while preserving enough early derivative action to add damping.",
      insight: "Filter enough to quiet noise—not enough to erase D",
      yLabel: "D contribution",
      yRange: [-0.7, 1.1],
      reference: false,
      curves: [
        { label: "Unfiltered", tone: "orange", value: (t) => 0.72 * Math.exp(-5 * t) + noise(t, 0.34, 20) },
        { label: "Light filter", tone: "blue", value: (t) => 0.64 * Math.exp(-4.6 * t) + noise(t, 0.1, 16) },
        { label: "Practical filter", tone: "green", value: (t) => 0.54 * Math.exp(-4 * t) + noise(t, 0.035, 12) },
      ],
    },
    {
      eyebrow: "KICK VIEW 03",
      title: "Derivative on measurement avoids setpoint kick",
      description: "Differentiating error sees an ideal setpoint step as an enormous slope. Differentiating measurement responds only when the process actually begins moving.",
      insight: "Measurement mode separates setpoint commands from damping",
      yLabel: "D contribution",
      yRange: [-0.8, 1.5],
      reference: false,
      curves: [
        { label: "D on error", tone: "orange", value: (t) => 1.38 * Math.exp(-70 * Math.abs(t - 0.12)) - 0.2 * Math.exp(-5 * t) },
        { label: "D on measurement", tone: "green", value: (t) => -0.55 * Math.exp(-7 * Math.max(0, t - 0.16)) * (t < 0.16 ? 0 : 1) },
      ],
      markers: [{ time: 0.12, value: 1.38, label: "kick" }],
    },
  ],
  "ziegler-nichols": [
    {
      eyebrow: "IDENTIFICATION VIEW 01",
      title: "Read gain, delay and slope from a reaction curve",
      description: "An open-loop step reveals the process gain and the delayed S-shaped rise used by the reaction-curve method.",
      insight: "Identification quality sets the ceiling for tuning quality",
      yLabel: "Process output",
      reference: false,
      curves: [
        { label: "Measured response", tone: "green", value: (t) => firstOrder(t, 4.6, 1, 0.2) },
        { label: "Tangent estimate", tone: "orange", value: (t) => Math.max(0, Math.min(1.15, (t - 0.15) * 2.15)) },
      ],
      markers: [{ time: 0.2, value: 0, label: "delay L" }, { time: 0.62, value: 0.9, label: "slope" }],
    },
    {
      eyebrow: "ULTIMATE VIEW 02",
      title: "Ku is the edge of sustained oscillation",
      description: "At the ultimate gain, proportional-only control produces an approximately constant-amplitude cycle with period Pu.",
      insight: "This test deliberately approaches instability",
      yLabel: "Process value",
      yRange: [0.45, 1.55],
      curves: [
        { label: "At Ku", tone: "orange", value: (t) => 1 + 0.34 * Math.sin(TAU * 3.1 * Math.max(0, t - 0.08)) * (t < 0.08 ? 0 : 1) },
        { label: "Below Ku", tone: "green", value: (t) => 1 + 0.3 * Math.exp(-2.4 * t) * Math.sin(TAU * 3.1 * t) },
      ],
      markers: [{ time: 0.49, value: 1.05, label: "period Pu" }],
    },
    {
      eyebrow: "TUNING VIEW 03",
      title: "Classic Z–N is intentionally aggressive",
      description: "Quarter-amplitude damping settles through repeated oscillations. Reducing the gains usually gives a calmer production starting point.",
      insight: "A rule returns a starting point, not a finished design",
      yLabel: "Process value",
      curves: [
        { label: "Classic Z–N", tone: "orange", value: (t) => ringing(t, 2.2, 2.15) },
        { label: "Softened gains", tone: "green", value: (t) => ringing(t, 5.2, 1.15) },
        { label: "Conservative", tone: "blue", value: (t) => firstOrder(t, 3.4, 1) },
      ],
    },
  ],
  "cohen-coon": [
    {
      eyebrow: "MODEL VIEW 01",
      title: "FOPDT compresses a process into three numbers",
      description: "Process gain K sets the final change, dead time θ postpones motion, and time constant τ sets the speed after motion begins.",
      insight: "Separate the silent delay from the dynamic rise",
      yLabel: "Process output",
      reference: false,
      curves: [
        { label: "Measured plant", tone: "green", value: (t) => firstOrder(t, 4.5, 1, 0.2) + 0.018 * Math.sin(31 * t) },
        { label: "FOPDT fit", tone: "orange", value: (t) => firstOrder(t, 4.2, 1, 0.2) },
      ],
      markers: [{ time: 0.2, value: 0.02, label: "θ" }, { time: 0.43, value: 0.63, label: "τ → 63%" }],
    },
    {
      eyebrow: "RATIO VIEW 02",
      title: "The delay-to-time-constant ratio changes the problem",
      description: "Plants with the same final gain can be easy or difficult to control depending on how much of the response is pure delay.",
      insight: "A large θ/τ ratio means less feedback information",
      yLabel: "Open-loop output",
      reference: false,
      curves: [
        { label: "θ/τ = 0.1", tone: "green", value: (t) => firstOrder(t, 4, 1, 0.04) },
        { label: "θ/τ = 0.5", tone: "blue", value: (t) => firstOrder(t, 5, 1, 0.2) },
        { label: "θ/τ = 1.0", tone: "orange", value: (t) => firstOrder(t, 7, 1, 0.38) },
      ],
    },
    {
      eyebrow: "ROBUSTNESS VIEW 03",
      title: "A nominal fit can hide delay uncertainty",
      description: "The Cohen–Coon recommendation may look good on the fitted model and ring when the real plant has more dead time than expected.",
      insight: "Stress-test delay before trusting nominal performance",
      yLabel: "Process value",
      curves: [
        { label: "Nominal model", tone: "green", value: (t) => ringing(t, 5.1, 1.2, 1, 0.13) },
        { label: "+20% delay", tone: "blue", value: (t) => ringing(t, 3.2, 1.65, 1, 0.18) },
        { label: "+40% delay", tone: "orange", value: (t) => ringing(t, 1.75, 2.1, 1, 0.24) },
      ],
    },
  ],
  "simc-tuning": [
    {
      eyebrow: "DESIGN VIEW 01",
      title: "τc is a visible speed-versus-robustness dial",
      description: "A short closed-loop time constant responds faster but uses more bandwidth. A larger τc gives a slower, more forgiving loop.",
      insight: "Choose τc as an engineering decision",
      yLabel: "Process value",
      curves: [
        { label: "τc = θ", tone: "orange", value: (t) => ringing(t, 3.8, 1.35) },
        { label: "τc = 2θ", tone: "green", value: (t) => firstOrder(t, 5, 1) },
        { label: "τc = 4θ", tone: "blue", value: (t) => firstOrder(t, 2.5, 1) },
      ],
    },
    {
      eyebrow: "EFFORT VIEW 02",
      title: "Faster loops ask more from the actuator",
      description: "The quickest tuning produces a larger initial command and more corrective movement; conservative tuning spreads effort over time.",
      insight: "Performance has an actuator cost",
      yLabel: "Controller output",
      yRange: [-0.05, 1.6],
      reference: false,
      curves: [
        { label: "Fast τc", tone: "orange", value: (t) => 0.5 + 0.95 * Math.exp(-5.5 * t) + 0.08 * Math.exp(-2 * t) * Math.sin(32 * t) },
        { label: "Balanced τc", tone: "green", value: (t) => 0.5 + 0.55 * Math.exp(-4 * t) },
        { label: "Slow τc", tone: "blue", value: (t) => 0.5 + 0.3 * Math.exp(-2.4 * t) },
      ],
    },
    {
      eyebrow: "UNCERTAINTY VIEW 03",
      title: "Robust tuning survives model mismatch",
      description: "When real dead time is larger than the model, aggressive tuning loses damping first while a balanced SIMC choice stays usable.",
      insight: "Judge a tuning on perturbed plants, not one perfect model",
      yLabel: "Process value",
      curves: [
        { label: "Aggressive + delay", tone: "orange", value: (t) => ringing(t, 1.8, 2.2, 1, 0.2) },
        { label: "Balanced + delay", tone: "green", value: (t) => ringing(t, 4.5, 1.25, 1, 0.2) },
        { label: "Conservative + delay", tone: "blue", value: (t) => firstOrder(t, 2.6, 1, 0.2) },
      ],
    },
  ],
  "first-order-system": [
    {
      eyebrow: "TIME VIEW 01",
      title: "One time constant means 63.2 percent complete",
      description: "Changing τ stretches or compresses the same exponential shape without changing the final process gain.",
      insight: "τ controls speed; it does not control final value",
      yLabel: "Process output",
      reference: false,
      curves: [
        { label: "Fast τ", tone: "green", value: (t) => firstOrder(t, 7, 1, 0) },
        { label: "Medium τ", tone: "blue", value: (t) => firstOrder(t, 4, 1, 0) },
        { label: "Slow τ", tone: "orange", value: (t) => firstOrder(t, 2.2, 1, 0) },
      ],
      markers: [{ time: 0.25, value: 0.632, label: "1τ = 63.2%" }],
    },
    {
      eyebrow: "GAIN VIEW 02",
      title: "Process gain changes how far the output moves",
      description: "The response shape stays first-order while K scales the steady change produced by the same input step.",
      insight: "Estimate K from steady output change ÷ input change",
      yLabel: "Process output",
      yRange: [-0.05, 1.55],
      reference: false,
      curves: [
        { label: "K = 0.5", tone: "blue", value: (t) => firstOrder(t, 4, 0.5, 0) },
        { label: "K = 1.0", tone: "green", value: (t) => firstOrder(t, 4, 1, 0) },
        { label: "K = 1.5", tone: "orange", value: (t) => firstOrder(t, 4, 1.5, 0) },
      ],
    },
    {
      eyebrow: "DELAY VIEW 03",
      title: "Dead time adds a silent interval before the rise",
      description: "These plants have the same gain and time constant. Only the start of the response moves, but that waiting period strongly limits feedback control.",
      insight: "θ is not part of τ—measure both",
      yLabel: "Process output",
      reference: false,
      curves: [
        { label: "No delay", tone: "green", value: (t) => firstOrder(t, 5, 1, 0) },
        { label: "Medium θ", tone: "blue", value: (t) => firstOrder(t, 5, 1, 0.16) },
        { label: "Large θ", tone: "orange", value: (t) => firstOrder(t, 5, 1, 0.32) },
      ],
      markers: [{ time: 0.32, value: 0, label: "dead time θ" }],
    },
  ],
};

export function getLearnVisualCount(topic: string) {
  return visuals[topic]?.length ?? 0;
}

function curvePath(curve: Curve, yRange: [number, number]) {
  const [minimum, maximum] = yRange;
  const left = 58;
  const top = 22;
  const width = 622;
  const height = 238;
  return Array.from({ length: 121 }, (_, index) => {
    const time = index / 120;
    const raw = curve.value(time);
    const value = Math.max(minimum, Math.min(maximum, raw));
    const x = left + time * width;
    const y = top + (1 - (value - minimum) / (maximum - minimum)) * height;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function pointPosition(time: number, value: number, yRange: [number, number]) {
  const [minimum, maximum] = yRange;
  return {
    x: 58 + time * 622,
    y: 22 + (1 - (value - minimum) / (maximum - minimum)) * 238,
  };
}

const dashPatterns = [undefined, "11 7", "3 6", "15 5 3 5"];

export function LearnVisual({ topic, index }: { topic: string; index: number }) {
  const visual = visuals[topic]?.[index];
  if (!visual) return null;
  const yRange = visual.yRange ?? [-0.05, 1.45];
  const titleId = `visual-${topic}-${index}-title`;
  const descriptionId = `visual-${topic}-${index}-description`;

  return <figure className="learn-visual">
    <div className="learn-visual-heading">
      <span>{visual.eyebrow}</span>
      <h3>{visual.title}</h3>
      <p>{visual.description}</p>
    </div>
    <div className="learn-visual-legend" aria-hidden="true">
      {visual.reference !== false && <span><i className="visual-reference" />Setpoint</span>}
      {visual.curves.map((curve, curveIndex) => <span key={curve.label}><i className={`visual-swatch series-${curve.tone} dash-${curveIndex}`} />{curve.label}</span>)}
    </div>
    <svg className="learn-plot" viewBox="0 0 720 310" role="img" aria-labelledby={`${titleId} ${descriptionId}`}>
      <title id={titleId}>{visual.title}</title>
      <desc id={descriptionId}>{visual.description} Series shown: {visual.curves.map((curve) => curve.label).join(", ")}. Key insight: {visual.insight}.</desc>
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => <g key={`x-${tick}`}>
        <line className="plot-grid" x1={58 + tick * 622} y1="22" x2={58 + tick * 622} y2="260" />
        <text className="plot-tick" x={58 + tick * 622} y="280" textAnchor="middle">{Math.round(tick * 100)}</text>
      </g>)}
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const value = yRange[0] + tick * (yRange[1] - yRange[0]);
        const y = 260 - tick * 238;
        return <g key={`y-${tick}`}><line className="plot-grid" x1="58" y1={y} x2="680" y2={y} /><text className="plot-tick" x="48" y={y + 4} textAnchor="end">{value.toFixed(1)}</text></g>;
      })}
      <line className="plot-axis" x1="58" y1="260" x2="680" y2="260" />
      <line className="plot-axis" x1="58" y1="22" x2="58" y2="260" />
      {visual.reference !== false && (() => {
        const position = pointPosition(0, visual.reference ?? 1, yRange);
        return <line className="plot-reference" x1="58" y1={position.y} x2="680" y2={position.y} />;
      })()}
      {visual.curves.map((curve, curveIndex) => <path key={curve.label} className={`learn-series series-${curve.tone}`} d={curvePath(curve, yRange)} strokeDasharray={dashPatterns[curveIndex]} />)}
      {visual.markers?.map((marker) => {
        const position = pointPosition(marker.time, marker.value, yRange);
        return <g className="plot-marker" key={marker.label} transform={`translate(${position.x} ${position.y})`}>
          <circle r="5" />
          <line y1="-8" y2="-25" />
          <text y="-31" textAnchor="middle">{marker.label}</text>
        </g>;
      })}
      <text className="plot-label" x="369" y="303" textAnchor="middle">Normalized time →</text>
      <text className="plot-label" transform="translate(15 142) rotate(-90)" textAnchor="middle">{visual.yLabel}</text>
    </svg>
    <figcaption><strong>READ THE PLOT</strong><span>{visual.insight}</span></figcaption>
  </figure>;
}

export function LearnVisualPreview({ topic }: { topic: string }) {
  const visual = visuals[topic]?.[0];
  if (!visual) return null;
  const yRange = visual.yRange ?? [-0.05, 1.45];
  return <svg className="learn-topic-preview" viewBox="58 22 622 238" aria-hidden="true" focusable="false">
    {[0, 0.5, 1].map((tick) => <line key={`x-${tick}`} className="plot-grid" x1={58 + tick * 622} y1="22" x2={58 + tick * 622} y2="260" />)}
    {[0, 0.5, 1].map((tick) => <line key={`y-${tick}`} className="plot-grid" x1="58" y1={260 - tick * 238} x2="680" y2={260 - tick * 238} />)}
    {visual.reference !== false && (() => {
      const position = pointPosition(0, visual.reference ?? 1, yRange);
      return <line className="plot-reference" x1="58" y1={position.y} x2="680" y2={position.y} />;
    })()}
    {visual.curves.map((curve, curveIndex) => <path key={curve.label} className={`learn-series series-${curve.tone}`} d={curvePath(curve, yRange)} strokeDasharray={dashPatterns[curveIndex]} />)}
  </svg>;
}
