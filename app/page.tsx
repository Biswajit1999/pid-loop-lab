"use client";

import Link from "next/link";
import { ArrowRight, Flask, Gauge, GraduationCap, Pulse, ShieldCheck, SlidersHorizontal } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { BlockDiagram } from "@/components/BlockDiagram";
import { Equation } from "@/components/Equation";

const cards = [
  { term: "P", name: "PROPORTIONAL", line: "React to the error now.", note: "Scales the present weighted error. More gain is not universally better; stability depends on the plant.", color: "p" },
  { term: "I", name: "INTEGRAL", line: "Remember error from the past.", note: "Accumulates error to remove offset, but saturation can produce windup without protection.", color: "i" },
  { term: "D", name: "DERIVATIVE", line: "React to how quickly the signal changes.", note: "Adds rate information. Measurement mode and filtering limit setpoint kick and noise amplification.", color: "d" },
];

export default function Home() {
  const reduced = useReducedMotion();
  return (
    <main id="main">
      <section className="hero section-pad">
        <div className="eyebrow"><span>OPEN CONTROL LAB</span><span>v1.0 · DETERMINISTIC</span></div>
        <motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <h1>PID <span>LOOP</span> LAB</h1>
          <p className="hero-subtitle">Interactive PID Tuning &amp; Control-System Simulator</p>
          <p className="hero-copy">Explore proportional, integral and derivative control from first principles to practical loop tuning. See the complete feedback loop—not just three sliders.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/lab"><Flask aria-hidden="true" />Launch simulator<ArrowRight aria-hidden="true" /></Link>
            <Link className="button" href="/learn"><GraduationCap aria-hidden="true" />Learn PID</Link>
            <Link className="button ghost" href="/autotune"><Gauge aria-hidden="true" />Auto tune</Link>
          </div>
        </motion.div>
        <div className="hero-diagram"><BlockDiagram /></div>
      </section>

      <section className="manifesto section-pad split-section">
        <div>
          <p className="section-kicker">THE CENTRAL IDEA</p>
          <h2>See what the controller is thinking.</h2>
        </div>
        <div className="manifesto-copy">
          <p>A response curve tells you what happened. PID Loop Lab also shows why: error, individual P/I/D contributions, the unclamped command, actuator limits, plant state, disturbance, and measurement path.</p>
          <div className="signal-list">
            {["Setpoint + process value", "P / I / D contribution", "Unclamped + applied output", "Noise + disturbance markers"].map((item) => <span key={item}><Pulse aria-hidden="true" />{item}</span>)}
          </div>
        </div>
      </section>

      <section className="pid-intro section-pad">
        <div className="section-heading-row">
          <div><p className="section-kicker">FROM EQUATION TO MOTION</p><h2>What is PID?</h2></div>
          <div className="equation-stack"><Equation expression="e(t)=r(t)-y(t)" block /><Equation expression="u(t)=K_p e(t)+K_i\int e(t)\,dt+K_d\frac{de(t)}{dt}" block /></div>
        </div>
        <div className="term-grid">
          {cards.map((card, index) => (
            <motion.article className={`term-card ${card.color}`} key={card.term} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
              <div className="term-symbol">{card.term}</div>
              <p className="term-name">{card.name}</p>
              <h3>{card.line}</h3>
              <p>{card.note}</p>
              <Link href={`/learn#${card.term.toLowerCase()}`}>Isolate this term <ArrowRight aria-hidden="true" /></Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="capabilities section-pad">
        <div className="section-heading-row">
          <div><p className="section-kicker">ENGINEERING, NOT THEATRE</p><h2>Built around the loop.</h2></div>
          <p>Every feature exists to answer a control question: What caused the response? Which assumption does a tuning rule make? What did the actuator actually receive?</p>
        </div>
        <div className="capability-grid">
          <article><SlidersHorizontal aria-hidden="true" /><strong>Practical PID</strong><span>Derivative filter, setpoint weighting, saturation, slew limits, and two anti-windup modes.</span></article>
          <article><Gauge aria-hidden="true" /><strong>Validated tuning</strong><span>FOPDT and ultimate-cycle methods with eligibility checks, controller forms, warnings, and references.</span></article>
          <article><ShieldCheck aria-hidden="true" /><strong>Numerical guards</strong><span>Separate plant step and controller sample time, RK4 integration, seeded noise, and divergence stops.</span></article>
        </div>
        <div className="closing-cta">
          <span className="diagram-index">01—08</span>
          <div><h2>Build a loop. Stress it. Explain it.</h2><p>Start from a stable FOPDT process, then add noise, delay, saturation, and slow sampling one effect at a time.</p></div>
          <Link className="button primary" href="/lab">Open the lab<ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
