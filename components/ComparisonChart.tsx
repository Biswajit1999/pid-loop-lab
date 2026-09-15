"use client";

import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { DataZoomComponent, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent } from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";
import type { SimulationResult } from "@/lib/types";

echarts.use([LineChart, DataZoomComponent, GridComponent, LegendComponent, ToolboxComponent, TooltipComponent, SVGRenderer]);

export function ComparisonChart({ results }: { results: { name: string; result: SimulationResult }[] }) {
  const node = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!node.current) return;
    const chart = echarts.init(node.current, undefined, { renderer: "svg" });
    const dark = document.documentElement.dataset.theme === "dark";
    const color = dark ? "#bac5c3" : "#53605d";
    chart.setOption({
      animationDuration: 450,
      color: ["#167a68", "#ad5334", "#536d9c", "#7a5c99"],
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      legend: { top: 12, textStyle: { color } },
      toolbox: { top: 4, right: 8, feature: { dataZoom: {}, restore: {}, saveAsImage: { name: "pid-tuning-comparison", pixelRatio: 2 } }, iconStyle: { borderColor: color } },
      grid: { left: 58, right: 24, top: 56, bottom: 56 },
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 10, height: 16 }],
      xAxis: { type: "value", name: "time / s", nameLocation: "middle", nameGap: 28, axisLabel: { color }, axisLine: { lineStyle: { color } } },
      yAxis: { type: "value", name: "process value", axisLabel: { color }, axisLine: { lineStyle: { color } } },
      series: [
        { name: "Setpoint", type: "line", showSymbol: false, lineStyle: { type: "dashed", width: 1.4, color }, data: results[0]?.result.samples.map((s) => [s.t, s.setpoint]) ?? [] },
        ...results.map(({ name, result }) => ({ name, type: "line", showSymbol: false, lineStyle: { width: 2.2 }, data: result.samples.map((s) => [s.t, s.pv]) })),
      ],
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(node.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [results]);
  return <div className="chart-shell"><div ref={node} style={{ height: 430 }} role="img" aria-label={`Overlay comparison of ${results.map((r) => r.name).join(", ")} PID tuning responses.`} /></div>;
}
