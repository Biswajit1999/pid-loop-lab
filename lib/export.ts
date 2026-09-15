import type { SimulationSample } from "./types";

export function samplesToCsv(samples: SimulationSample[]): string {
  const columns: (keyof SimulationSample)[] = ["t", "setpoint", "pv", "measured", "error", "p", "i", "d", "unclamped", "output", "actuator", "disturbance", "noise", "saturated", "voltage", "current", "power"];
  return [columns.join(","), ...samples.map((sample) => columns.map((key) => sample[key]).join(","))].join("\n");
}

export function downloadText(filename: string, content: string, type = "text/plain"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function encodeConfiguration(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeConfiguration<T>(encoded: string): T {
  const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
