"use client";

import { motion, useReducedMotion } from "motion/react";

const blocks = ["Setpoint", "Error", "PID", "Actuator", "Plant", "Sensor"];

export function BlockDiagram({ compact = false }: { compact?: boolean }) {
  const reduced = useReducedMotion();
  return (
    <div className={compact ? "loop-diagram compact" : "loop-diagram"} aria-label="Closed-loop signal path: setpoint, error, PID, actuator, plant, sensor, and negative feedback">
      <div className="loop-track" aria-hidden="true">
        {!reduced && (
          <motion.span
            className="signal-packet"
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
            {block === "Error" && <span>r − y</span>}
            {block === "PID" && <span>P + I + D</span>}
          </div>
        ))}
      </div>
      <div className="feedback-line" aria-hidden="true"><span>NEGATIVE FEEDBACK</span></div>
    </div>
  );
}
