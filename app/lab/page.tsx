import type { Metadata } from "next";
import { LabWorkspace } from "@/components/LabWorkspace";

export const metadata: Metadata = { title: "PID Simulator Lab", description: "Run a deterministic PIDF simulation with plant models, non-ideal effects, live internal telemetry, metrics, and exports.", alternates: { canonical: "/lab/" } };

export default function LabPage() {
  return <main id="main"><header className="page-title"><div className="eyebrow"><span>INTERACTIVE WORKSTATION</span><span>SHORTCUTS · SPACE / R / N</span></div><h1>CONTROL LOOP WORKSPACE</h1><p>Plant integration, controller sampling, and visual playback use separate clocks. Change a parameter, run the model, and inspect every internal signal.</p></header><div className="status-strip"><span>ENGINE <strong>RK4</strong></span><span>PID <strong>DISCRETE PARALLEL PIDF</strong></span><span>NOISE <strong>SEEDED</strong></span><span>DATA <strong>LOCAL ONLY</strong></span></div><LabWorkspace /></main>;
}
