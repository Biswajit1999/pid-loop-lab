import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { LearnVisualPreview } from "@/components/LearnVisual";
import { TeachingLab } from "@/components/TeachingLab";
import { learnTopics } from "@/lib/learn-topics";

export const metadata: Metadata = { title: "Learn PID Visually", description: "Learn PID control through 32 original response diagrams, annotated comparisons, real simulation experiments, a time-constant explorer, and a second-order pole map.", alternates: { canonical: "/learn/" } };

export default function LearnPage() {
  return <main id="main"><header className="page-title"><div className="eyebrow"><span>CONTROL FROM FIRST PRINCIPLES</span><span>LIVE SIMULATION · ORIGINAL VISUAL GUIDES</span></div><h1>UNDERSTAND THE<br />LOOP FROM INSIDE.</h1><p>Isolate controller terms, create known failure modes, and connect equations to the signals they generate.</p></header><TeachingLab /><section id="visual-guides" className="learning-index section-pad"><div className="section-heading-row"><div><p className="section-kicker">SEARCHABLE FIELD NOTES</p><h2>Learn one mechanism at a time.</h2></div><p>Each guide connects the equation, the physical effect, and a reproducible experiment you can open in the lab.</p></div><div className="learning-index-grid">{learnTopics.map((topic, index) => <Link href={`/learn/${topic.slug}`} key={topic.slug}><span>{String(index + 1).padStart(2, "0")} · {topic.eyebrow}</span><LearnVisualPreview topic={topic.slug} /><strong>{topic.title}</strong><p>{topic.description}</p><b>Read visual guide <ArrowRight aria-hidden="true" /></b></Link>)}</div></section></main>;
}
