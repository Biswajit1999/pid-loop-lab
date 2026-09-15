"use client";

import { motion, useReducedMotion } from "motion/react";
import type { PlantConfig, SimulationSample } from "@/lib/types";

export function PlantVisual({ plant, sample }: { plant: PlantConfig; sample: SimulationSample }) {
  const reduced = useReducedMotion();
  const pv = Math.max(-1.5, Math.min(1.5, sample.pv));
  const target = Math.max(-1.5, Math.min(1.5, sample.setpoint));
  const x = 155 + pv * 62;
  const targetX = 155 + target * 62;
  const transition = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 190, damping: 28 };

  if (plant.kind === "mass-spring-damper") return (
    <div className="plant-visual" aria-label={`Mass spring damper. Target ${sample.setpoint.toFixed(2)}, position ${sample.pv.toFixed(2)}.`}>
      <div className="plant-visual-head"><span>MASS / SPRING / DAMPER</span><strong>x {sample.pv.toFixed(3)} m</strong></div>
      <svg viewBox="0 0 360 150" role="img">
        <path className="plant-wall" d="M32 25V126 M18 36L32 25 M18 52L32 41 M18 68L32 57 M18 84L32 73 M18 100L32 89 M18 116L32 105" />
        <path className="plant-rail" d="M32 115H340" />
        <path className="plant-target" d={`M${targetX} 20V126`} />
        <motion.g animate={{ x: x - 155 }} transition={transition}>
          <path className="plant-spring" d="M32 58H48L57 44L70 72L83 44L96 72L109 44L122 72L135 58H154" />
          <path className="plant-damper" d="M32 92H76V78H124V92H154 M92 78V106" />
          <rect className="plant-mass" x="154" y="38" width="72" height="72" />
          <text x="190" y="79" textAnchor="middle">M</text>
        </motion.g>
        <path className="plant-error" d={`M${Math.min(x, targetX)} 130H${Math.max(x, targetX)}`} />
      </svg>
    </div>
  );

  if (plant.kind === "thermal") {
    const heat = Math.max(0, Math.min(1, (pv + .2) / 1.4));
    return <div className="plant-visual" aria-label={`Thermal process. Target ${sample.setpoint.toFixed(2)}, measured ${sample.pv.toFixed(2)}, energy input ${sample.actuator.toFixed(2)}.`}>
      <div className="plant-visual-head"><span>THERMAL PROCESS</span><strong>T {sample.pv.toFixed(3)}</strong></div>
      <div className="thermal-stage"><div className="heater-flow" style={{ opacity: Math.max(.15, Math.min(1, Math.abs(sample.actuator))) }}><i /><i /><i /></div><motion.div className="thermal-body" animate={{ scaleY: .72 + heat * .28 }} transition={transition}><span>{(heat * 100).toFixed(0)}%</span></motion.div><div className="thermal-target" style={{ bottom: `${18 + Math.max(0, Math.min(1, target)) * 78}px` }}>TARGET</div></div>
    </div>;
  }

  if (plant.kind === "dc-motor") {
    return <div className="plant-visual" aria-label={`DC motor. Speed ${sample.pv.toFixed(2)} radians per second.`}>
      <div className="plant-visual-head"><span>DC MOTOR</span><strong>ω {sample.pv.toFixed(3)} rad/s</strong></div>
      <div className="motor-stage"><div className="motor-field">N</div><motion.div className="motor-rotor" animate={{ rotate: sample.t * sample.pv * 50 }} transition={{ duration: .08, ease: "linear" }}><i /><i /><b /></motion.div><div className="motor-field">S</div><span>i = {(sample.state[0] ?? 0).toFixed(3)} A</span></div>
    </div>;
  }

  return <div className="plant-visual process-visual" aria-label={`${plant.kind} process. Target ${sample.setpoint.toFixed(2)}, process value ${sample.pv.toFixed(2)}.`}>
    <div className="plant-visual-head"><span>{plant.kind.replaceAll("-", " ").toUpperCase()}</span><strong>y {sample.pv.toFixed(3)}</strong></div>
    <div className="process-stage"><div className="process-input"><small>ACTUATOR</small><b>{sample.actuator.toFixed(2)}</b></div><div className="process-core"><motion.i animate={{ scaleX: Math.max(.04, Math.min(1, Math.abs(sample.actuator) / Math.max(1, Math.abs(sample.setpoint)))) }} transition={transition} /><span>G(s)</span></div><div className="process-output"><small>PROCESS</small><b>{sample.pv.toFixed(2)}</b></div></div>
  </div>;
}
