"use client";

import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TitleComponent, ToolboxComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowsOut, Table } from "@phosphor-icons/react";
import type { SimulationSample } from "@/lib/types";

echarts.use([LineChart, DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, TitleComponent, ToolboxComponent, TooltipComponent, SVGRenderer]);

type ChartMode = "response" | "terms" | "actuator" | "error";

const palette = ["#1f8a70", "#b85c38", "#536d9c", "#7a5c99", "#b8860b"];

const definitionsForMode = (mode: ChartMode) => mode === "response"
  ? [["Setpoint", "setpoint"], ["Process value", "pv"], ["Measured", "measured"]]
  : mode === "terms"
    ? [["P term", "p"], ["I term", "i"], ["D term", "d"]]
    : mode === "actuator"
      ? [["Unclamped", "unclamped"], ["Controller output", "output"], ["Actuator", "actuator"]]
      : [["Error", "error"]];

export function EngineeringChart({ samples, mode, title, height = 320, cursorTime, onCursor, onFocus }: { samples: SimulationSample[]; mode: ChartMode; title: string; height?: number; cursorTime?: number; onCursor?: (time: number) => void; onFocus?: () => void }) {
  const node = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const definitions = useMemo(() => definitionsForMode(mode), [mode]);
  useEffect(() => {
    if (!node.current) return;
    chart.current ??= echarts.init(node.current, undefined, { renderer: "svg" });
    chart.current.group = "pid-loop-lab";
    echarts.connect("pid-loop-lab");
    const isDark = document.documentElement.dataset.theme === "dark";
    const text = isDark ? "#bac5c3" : "#53605d";
    const grid = isDark ? "rgba(255,255,255,.08)" : "rgba(21,32,29,.1)";
    chart.current.setOption({
      animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      color: palette,
      title: { text: title, left: 12, top: 10, textStyle: { color: text, fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)" } },
      tooltip: { trigger: "axis", axisPointer: { type: "cross" }, valueFormatter: (value: unknown) => Number(value).toPrecision(5) },
      legend: { top: 36, right: 12, textStyle: { color: text }, selected: mode === "response" ? { Measured: false } : undefined },
      toolbox: { right: 8, top: 4, feature: { dataZoom: {}, restore: {}, saveAsImage: { name: `pid-loop-lab-${mode}`, type: "png", pixelRatio: 2 } }, iconStyle: { borderColor: text } },
      grid: { left: 58, right: 24, top: 74, bottom: 54 },
      dataZoom: [{ type: "inside" }, { type: "slider", height: 15, bottom: 10 }],
      xAxis: { type: "value", name: "time / s", nameLocation: "middle", nameGap: 28, axisLine: { lineStyle: { color: text } }, splitLine: { lineStyle: { color: grid } } },
      yAxis: { type: "value", name: mode === "error" ? "error" : "amplitude", axisLine: { lineStyle: { color: text } }, splitLine: { lineStyle: { color: grid } } },
      series: definitions.map(([name, key], index) => ({
        name,
        type: "line",
        showSymbol: false,
        sampling: "lttb",
        data: samples.map((sample) => [sample.t, sample[key as keyof SimulationSample] as number]),
        lineStyle: { width: index === 1 && mode === "response" ? 2.8 : 1.7, type: index === 0 && mode === "response" ? "dashed" : "solid" },
        markLine: index === 0 ? { silent: true, symbol: "none", label: { color: text, fontSize: 10 }, lineStyle: { color: grid, type: "dashed" }, data: [
          ...(cursorTime === undefined ? [] : [{ xAxis: cursorTime, name: "INSPECT" }]),
          ...(mode === "actuator" && samples.some((s) => s.saturated) ? [{ xAxis: samples.find((s) => s.saturated)?.t, name: "SATURATION" }] : []),
        ] } : undefined,
      })),
    }, true);
    chart.current.off("updateAxisPointer");
    chart.current.on("updateAxisPointer", (event: unknown) => {
      const payload = event as { axesInfo?: { value?: number }[] };
      const value = payload.axesInfo?.[0]?.value;
      if (typeof value === "number") onCursor?.(value);
    });
    const resize = new ResizeObserver(() => chart.current?.resize());
    resize.observe(node.current);
    return () => resize.disconnect();
  }, [samples, mode, title, cursorTime, onCursor, definitions]);
  useEffect(() => () => { chart.current?.dispose(); chart.current = null; }, []);
  const exportSvg = () => {
    if (!chart.current) return;
    const anchor = document.createElement("a");
    anchor.href = chart.current.getDataURL({ type: "svg" });
    anchor.download = `pid-loop-lab-${mode}.svg`;
    anchor.click();
  };
  return (
    <div className="chart-shell">
      <div ref={node} style={{ height }} role="img" aria-label={`${title}. Interactive time-series chart with zoom, pan, hover values, and export controls.`} />
      <button className="chart-svg-export" onClick={exportSvg} aria-label={`Export ${title} as SVG`}>SVG</button>
      {onFocus && <button className="chart-focus" onClick={onFocus} aria-label={`Open ${title} in focus mode`}><ArrowsOut aria-hidden="true" />Focus</button>}
      <button className="chart-table-toggle" aria-expanded={tableOpen} onClick={() => setTableOpen((open) => !open)}><Table aria-hidden="true" />{tableOpen ? "Hide data" : "Data table"}</button>
      {tableOpen && <div className="chart-data-wrap"><table className="chart-data-table"><caption>{title}. All {samples.length} simulation samples.</caption><thead><tr><th scope="col">Time / s</th>{definitions.map(([name]) => <th scope="col" key={name}>{name}</th>)}</tr></thead><tbody>{samples.map((sample, index) => <tr key={`${sample.t}-${index}`}><th scope="row">{sample.t.toFixed(3)}</th>{definitions.map(([name, key]) => <td key={name}>{Number(sample[key as keyof SimulationSample]).toPrecision(5)}</td>)}</tr>)}</tbody></table></div>}
      <p className="sr-only">{samples.length ? `${title}: ${samples.length} samples from ${samples[0].t.toFixed(2)} to ${samples.at(-1)!.t.toFixed(2)} seconds.` : `${title}: no data.`}</p>
    </div>
  );
}
