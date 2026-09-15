"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, WaveSine } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const links = [
  ["/lab", "Simulator"],
  ["/autotune", "Auto tune"],
  ["/learn", "Learn PID"],
];

export function Header() {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("pid-theme");
    const initial = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = initial ? "dark" : "light";
    const timer = window.setTimeout(() => setDark(initial), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("pid-theme", next ? "dark" : "light");
  };
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="PID Loop Lab home">
        <span className="brand-mark" aria-hidden="true"><WaveSine weight="bold" /></span>
        <span>PID LOOP LAB</span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map(([href, label]) => (
          <Link key={href} className={pathname === href ? "nav-link active" : "nav-link"} href={href}>{label}</Link>
        ))}
      </nav>
      <button className="icon-button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} theme`}>
        {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      </button>
    </header>
  );
}
