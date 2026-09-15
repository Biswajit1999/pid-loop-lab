import type { Metadata } from "next";
import { TuningLab } from "@/components/TuningLab";

export const metadata: Metadata = { title: "Automatic PID Tuning Lab", description: "Compare validated FOPDT and ultimate-cycle PID tuning methods, including Ziegler–Nichols, Cohen–Coon, CHR, IMC, SIMC, Tyreus–Luyben, and simulated relay feedback." };

export default function AutoTunePage() {
  return <main id="main"><header className="page-title"><div className="eyebrow"><span>AUTOMATIC TUNING LAB</span><span>METHOD ELIGIBILITY ENFORCED</span></div><h1>TUNE THE MODEL.<br />COMPARE THE TRADE-OFF.</h1><p>Rules are applied only to the model classes they were derived for. Results are candidates for simulation—not universal answers and never automatic hardware approval.</p></header><div className="status-strip"><span>FORM <strong>IDEAL / ISA → PARALLEL</strong></span><span>MODEL <strong>FOPDT</strong></span><span>OVERLAY <strong>UP TO 4</strong></span><span>RELAY <strong>SIMULATED</strong></span></div><TuningLab /></main>;
}
