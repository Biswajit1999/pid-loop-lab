import type { Metrics, PIDConfig, SimulationSample } from "./types";

export function downloadShareCard(samples: SimulationSample[], metrics: Metrics, pid: PIDConfig, label = "PID Loop Lab"): void {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const context = canvas.getContext("2d");
  if (!context || samples.length < 2) return;

  const ink = "#10201d";
  const muted = "#586660";
  const accent = "#1f8a70";
  const warm = "#c7673c";
  context.fillStyle = "#f2f0e9";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = ink;
  context.fillRect(0, 0, canvas.width, 88);
  context.fillStyle = "#f2f0e9";
  context.font = "700 25px ui-monospace, monospace";
  context.fillText("PID LOOP LAB", 54, 55);
  context.fillStyle = "#70d4b9";
  context.font = "600 15px ui-monospace, monospace";
  context.fillText(label.toUpperCase(), 920, 53);

  context.fillStyle = ink;
  context.font = "700 42px system-ui, sans-serif";
  context.fillText("Closed-loop experiment", 54, 152);
  context.fillStyle = muted;
  context.font = "18px system-ui, sans-serif";
  context.fillText(`Kp ${pid.kp.toFixed(3)}   Ki ${pid.ki.toFixed(3)}   Kd ${pid.kd.toFixed(3)}   Ts ${pid.sampleTime.toFixed(3)} s`, 56, 188);

  const plot = { x: 56, y: 226, width: 820, height: 388 };
  context.fillStyle = "#ffffff";
  context.fillRect(plot.x, plot.y, plot.width, plot.height);
  context.strokeStyle = "#ccd2ce";
  context.lineWidth = 1;
  for (let i = 0; i <= 5; i += 1) {
    const y = plot.y + (plot.height * i) / 5;
    context.beginPath(); context.moveTo(plot.x, y); context.lineTo(plot.x + plot.width, y); context.stroke();
  }
  const min = Math.min(0, ...samples.map((sample) => Math.min(sample.pv, sample.setpoint)));
  const max = Math.max(1, ...samples.map((sample) => Math.max(sample.pv, sample.setpoint)));
  const span = Math.max(1e-6, max - min);
  const xAt = (index: number) => plot.x + (index / (samples.length - 1)) * plot.width;
  const yAt = (v: number) => plot.y + plot.height - ((v - min) / span) * plot.height;
  const draw = (key: "pv" | "setpoint", color: string, dashed: boolean) => {
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = key === "pv" ? 4 : 2;
    context.setLineDash(dashed ? [12, 9] : []);
    samples.forEach((sample, index) => index ? context.lineTo(xAt(index), yAt(sample[key])) : context.moveTo(xAt(index), yAt(sample[key])));
    context.stroke();
  };
  draw("setpoint", warm, true);
  draw("pv", accent, false);
  context.setLineDash([]);
  context.fillStyle = muted;
  context.font = "14px ui-monospace, monospace";
  context.fillText("SETPOINT", plot.x, plot.y + plot.height + 28);
  context.fillStyle = warm; context.fillRect(plot.x + 86, plot.y + plot.height + 18, 28, 3);
  context.fillStyle = muted; context.fillText("PROCESS", plot.x + 150, plot.y + plot.height + 28);
  context.fillStyle = accent; context.fillRect(plot.x + 226, plot.y + plot.height + 18, 28, 3);

  const format = (number: number | null, suffix = "") => number === null ? "—" : `${Number(number.toPrecision(3))}${suffix}`;
  const cards = [
    ["OVERSHOOT", format(metrics.overshootPercent, "%")],
    ["SETTLING", format(metrics.settlingTime, " s")],
    ["IAE", format(metrics.iae)],
    ["SATURATION", format(metrics.saturationPercent, "%")],
  ];
  cards.forEach(([name, result], index) => {
    const y = 226 + index * 94;
    context.fillStyle = index === 0 ? ink : "#ffffff";
    context.fillRect(916, y, 310, 76);
    context.fillStyle = index === 0 ? "#9fb4ad" : muted;
    context.font = "600 13px ui-monospace, monospace";
    context.fillText(name, 938, y + 25);
    context.fillStyle = index === 0 ? "#ffffff" : ink;
    context.font = "700 25px ui-monospace, monospace";
    context.fillText(result, 938, y + 57);
  });
  context.fillStyle = ink;
  context.font = "600 16px system-ui, sans-serif";
  context.fillText("Reproduce this experiment at biswajit1999.github.io/pid-loop-lab", 56, 684);
  const anchor = document.createElement("a");
  anchor.download = `pid-loop-lab-${Date.now()}.png`;
  anchor.href = canvas.toDataURL("image/png");
  anchor.click();
}
