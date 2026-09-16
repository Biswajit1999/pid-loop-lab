import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Gauge, Target } from "@phosphor-icons/react/dist/ssr";
import { missions } from "@/lib/missions";

export const metadata: Metadata = {
  title: "PID Tuning Missions",
  description: "Learn PID tuning through scored, reproducible control challenges covering stability, load rejection, windup, noise and dead time.",
  alternates: { canonical: "/missions/" },
};

export default function MissionsPage() {
  return <main id="main">
    <header className="page-title mission-hero">
      <div className="eyebrow"><span>PID GYM / FIVE CONTROL CHALLENGES</span><span>LOCAL · REPRODUCIBLE · NO SIGN-IN</span></div>
      <div className="mission-hero-grid"><div><h1>TUNE WITH<br />A PURPOSE.</h1><p>Every mission starts with a real control problem, measurable constraints, and a loop you can inspect from the inside.</p></div><div className="mission-score-demo" aria-label="Example mission scoring"><span>MISSION STANDARD</span><strong>3 / 3</strong><div><CheckCircle weight="fill" /><span>Overshoot</span><b>PASS</b></div><div><CheckCircle weight="fill" /><span>Settling</span><b>PASS</b></div><div><CheckCircle weight="fill" /><span>Effort</span><b>PASS</b></div></div></div>
    </header>
    <section className="mission-list section-pad" aria-labelledby="mission-list-title">
      <div className="section-heading-row"><div><p className="section-kicker">CHOOSE A FAILURE MODE</p><h2 id="mission-list-title">Five loops. Five lessons.</h2></div><p>Scores use the simulator’s measured response metrics. Adjust the controller, rerun the plant, and watch each constraint respond.</p></div>
      <div className="mission-grid">
        {missions.map((mission) => <article className={`mission-card ${mission.accent}`} key={mission.id}>
          <div className="mission-card-head"><span>{mission.number}</span><b>{mission.difficulty}</b></div>
          <Target aria-hidden="true" />
          <h2>{mission.title}</h2>
          <p>{mission.description}</p>
          <ul>{mission.criteria.map((criterion) => <li key={criterion.label}><span>{criterion.label}</span><strong>{criterion.operator === "lte" ? "≤" : "≥"} {criterion.target}{criterion.unit}</strong></li>)}</ul>
          <Link className="mission-start" href={`/lab?mission=${mission.id}`}><Gauge aria-hidden="true" />Start mission<ArrowRight aria-hidden="true" /></Link>
        </article>)}
      </div>
    </section>
  </main>;
}
