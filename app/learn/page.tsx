import type { Metadata } from "next";
import { TeachingLab } from "@/components/TeachingLab";

export const metadata: Metadata = { title: "Learn PID Visually", description: "Explore proportional, integral and derivative control with real simulation experiments, a first-order time constant explorer, and a second-order pole map." };

export default function LearnPage() {
  return <main id="main"><header className="page-title"><div className="eyebrow"><span>CONTROL FROM FIRST PRINCIPLES</span><span>REAL SIMULATION · NO FIXED CURVES</span></div><h1>UNDERSTAND THE<br />LOOP FROM INSIDE.</h1><p>Isolate controller terms, create known failure modes, and connect equations to the signals they generate.</p></header><TeachingLab /></main>;
}
