"use client";

import { motion, useReducedMotion } from "motion/react";
import type { SimulationSample } from "@/lib/types";

const blocks = ["Setpoint", "Error", "PID", "Actuator", "Plant", "Sensor"];

export function BlockDiagram({ compact = false, sample }: { compact?: boolean; sample?: SimulationSample }) {
  const reduced = useReducedMotion();
  const state = sample?.saturated ? "saturated" : Math.abs(sample?.error ?? 0) < .025 ? "tracking" : (sample?.error ?? 0) >= 0 ? "positive" : "negative";
  return (
    <div className={compact ? "loop-diagram compact" : "loop-diagram"} aria-label="Closed-loop signal path: setpoint, error, PID, actuator, plant, sensor, and negative feedback">
      <div className="loop-track" aria-hidden="true">
        {!reduced && (
          <motion.span
            className={`signal-packet ${state}`}
            animate={{ offsetDistance: ["0%", "100%"] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
      <div className="loop-blocks">
        {blocks.map((block, index) => (
          <div className={block === "PID" ? "diagram-block accent" : "diagram-block"} key={block}>
            <small>{String(index + 1).padStart(2, "0")}</small>
            <strong>{block}</strong>
            {block === "Error" && <span>{sample ? `${sample.error >= 0 ? "+" : ""}${sample.error.toFixed(3)}` : "r − y"}</span>}
            {block === "PID" && <span>{sample ? `${sample.p.toFixed(2)} + ${sample.i.toFixed(2)} + ${sample.d.toFixed(2)}` : "P + I + D"}</span>}
            {block === "Actuator" && sample && <span>{sample.actuator.toFixed(3)}</span>}
            {block === "Plant" && sample && <span>y {sample.pv.toFixed(3)}</span>}
          </div>
        ))}
      </div>
      <div className="feedback-line" aria-hidden="true"><span>NEGATIVE FEEDBACK</span></div>
    </div>
  );
}
