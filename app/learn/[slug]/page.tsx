import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Equation } from "@/components/Equation";
import { LearnVisual } from "@/components/LearnVisual";
import { getLearnTopic, learnTopics } from "@/lib/learn-topics";

export const dynamicParams = false;

export function generateStaticParams() {
  return learnTopics.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const topic = getLearnTopic((await params).slug);
  if (!topic) return {};
  return {
    title: topic.title,
    description: topic.description,
    alternates: { canonical: `/learn/${topic.slug}/` },
    openGraph: { title: topic.title, description: topic.description, type: "article", images: [{ url: "/social-preview.png", width: 1280, height: 640, alt: "PID Loop Lab response curves" }] },
  };
}

export default async function LearnTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const topic = getLearnTopic((await params).slug);
  if (!topic) notFound();
  const related = learnTopics.filter((item) => item.slug !== topic.slug).slice(0, 3);
  return <main id="main" className="topic-page">
    <header className="topic-hero section-pad">
      <Link className="topic-back" href="/learn"><ArrowLeft aria-hidden="true" />All learning experiments</Link>
      <p className="section-kicker">{topic.eyebrow}</p>
      <h1>{topic.title}</h1>
      <p className="topic-lead">{topic.description}</p>
      <div className="topic-equation"><Equation expression={topic.equation} block /></div>
    </header>
    <article className="topic-body section-pad">
      <p className="topic-introduction">{topic.introduction}</p>
      {topic.sections.map((section, index) => <section key={section.heading}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{section.heading}</h2><p>{section.body}</p><LearnVisual topic={topic.slug} index={index} /></div></section>)}
      <aside className="topic-takeaways"><p className="section-kicker">KEEP THESE THREE IDEAS</p>{topic.takeaways.map((takeaway) => <div key={takeaway}><CheckCircle weight="fill" aria-hidden="true" /><span>{takeaway}</span></div>)}</aside>
      <div className="topic-actions"><Link className="button primary" href={topic.mission ? `/lab?mission=${topic.mission}` : "/autotune"}>Open the live experiment<ArrowRight aria-hidden="true" /></Link><Link className="button" href="/missions">Browse PID missions</Link></div>
    </article>
    <section className="related-topics section-pad"><p className="section-kicker">CONTINUE LEARNING</p><div>{related.map((item) => <Link href={`/learn/${item.slug}`} key={item.slug}><span>{item.eyebrow}</span><strong>{item.title}</strong><ArrowRight aria-hidden="true" /></Link>)}</div></section>
  </main>;
}
