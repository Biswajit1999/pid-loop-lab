"use client";

import katex from "katex";

export function Equation({ expression, block = false }: { expression: string; block?: boolean }) {
  return <span className={block ? "equation block" : "equation"} dangerouslySetInnerHTML={{ __html: katex.renderToString(expression, { throwOnError: false, displayMode: block }) }} />;
}
