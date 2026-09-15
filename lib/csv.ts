export interface ImportedSeries {
  time: number[];
  setpoint?: number[];
  processValue: number[];
  controllerOutput?: number[];
}

export function parseCsv(text: string): ImportedSeries {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must contain a header and at least one data row.");
  const delimiter = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/[ _-]+/g, ""));
  const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const timeIndex = indexOf("time", "t", "seconds");
  const pvIndex = indexOf("processvalue", "pv", "measurement", "output");
  const spIndex = indexOf("setpoint", "sp", "reference");
  const uIndex = indexOf("controlleroutput", "controloutput", "mv", "u");
  if (timeIndex < 0 || pvIndex < 0) throw new Error("Map or name columns as time and process value (PV).");
  const result: ImportedSeries = { time: [], processValue: [] };
  if (spIndex >= 0) result.setpoint = [];
  if (uIndex >= 0) result.controllerOutput = [];
  for (const [rowIndex, line] of lines.slice(1).entries()) {
    const cells = line.split(delimiter).map((cell) => Number(cell.trim()));
    if (![cells[timeIndex], cells[pvIndex]].every(Number.isFinite)) throw new Error(`Row ${rowIndex + 2} contains a non-numeric required value.`);
    if (result.time.length && cells[timeIndex] <= result.time.at(-1)!) throw new Error(`Time must be strictly increasing (row ${rowIndex + 2}).`);
    result.time.push(cells[timeIndex]);
    result.processValue.push(cells[pvIndex]);
    if (result.setpoint) result.setpoint.push(cells[spIndex]);
    if (result.controllerOutput) result.controllerOutput.push(cells[uIndex]);
  }
  return result;
}
