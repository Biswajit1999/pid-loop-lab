# Research landscape

Research pass completed 15 September 2026. The audit prioritized product owners, universities, original papers, and industrial documentation. This is a product comparison, not an endorsement or a claim that every capability of a third-party tool was exhaustively tested.

## Existing tools

| Tool | What it does well | Opportunity for PID Loop Lab |
|---|---|---|
| [MathWorks PID Tuner](https://www.mathworks.com/help/control/ref/pidtuner-app.html) | Serious SISO LTI workflow; time- and frequency-domain targets; 1-DOF/2-DOF controller forms; controller effort and robustness analysis; plant identification when companion products are present. | Make internal discrete signals and implementation non-idealities legible in a free, offline-capable browser lab. State explicitly that our v1 is narrower than the mature MathWorks analysis stack. |
| [TURIX Lab PID workspace](https://turixlab.com/landing/pid-tuning) | Browser access, transfer-function entry, and a wider teaching suite spanning PID, LQR, root locus, and frequency response. | Put the feedback loop and P/I/D/actuator telemetry at the centre, with practical saturation and sampling experiments. |
| [PID-tuner.com](https://www.pid-tuner.com/) | Industrial model identification from CSV/OPC data, vendor controller forms, FOTD/SOTD models, setpoint weights, feedforward, and multi-loop features. | Remain free and general-purpose; clearly separate simulated learning from plant commissioning and avoid claims of guaranteed real-plant success. |
| [APMonitor / BYU Temperature Control Lab](https://apmonitor.com/che436/uploads/Main/temperature_control_lab.pdf) | A strong bridge from model equations and tuning to a real benchtop thermal experiment. | Preserve the experiment-first teaching style without presenting one device as the universal PID plant. |
| [Neutron STEM control simulator](https://neutronstemlab.com/tools/controls/control-system-simulator/) | Browser-local block-diagram environment, documented assumptions, state-space/transfer-function modelling, Bode analysis, URL state, and JSON export. | Differentiate through detailed PID internals, actuator/electrical view, non-idealities, and tuning-method applicability. |
| [Control Loop Lab](https://stevenfoerster.com/lab/control-loop/) | Browser-native RK4 simulation with step, Bode, root-locus, and Nyquist views. | Treat frequency-domain breadth as a staged scientific capability; never display invented margins for nonlinear or unsupported cases. |
| [Control Playground](https://control.terrypacker.com/) | A compact browser process-control environment with FOPDT/SOPDT/ARX modelling, sampling, noise, delay, and model fitting. | Offer a more structured beginner path plus source-audited formula and validation documentation. |
| [Skythinker616/pid-simulator-web](https://github.com/Skythinker616/pid-simulator-web) and other GitHub projects | Inspectable code, easy deployment, and focused visual experiments. | Ship a cohesive repository with numerical unit tests, validation boundaries, citation metadata, accessible charts, and production documentation. |

## Design conclusions

1. **One source of numerical truth.** The lab, teaching presets, autotuning comparisons, metrics, and exports call the same deterministic TypeScript engine.
2. **Controller internals are first-class data.** Every simulation sample records the weighted P term, accumulated I term, filtered D term, unclamped command, applied actuator value, saturation state, disturbance, noise, and physical state.
3. **Applicability is part of the tuning result.** A tuning method is not merely a formula. It has a controller form, model class, units, assumptions, source, and limitations.
4. **Non-idealities are causal experiments.** Noise, dead time, load, output limits, slew limits, sensor lag, quantization, and sample jitter are explicit model elements rather than decorative toggles.
5. **Education and engineering share a core but not a claim.** The project is useful for study, preliminary exploration, and reproducible examples. It is not a hardware safety case, certified plant model, or commissioning substitute.

## Scope decisions for v1

- Implement deterministic batch simulation in the browser and decouple it from visual playback.
- Implement verified FOPDT and ultimate-cycle tuning candidates, with form conversion to parallel gains.
- Accept experimental CSV data only for validation and preview. Do not claim robust system identification until a residual-based fitting workflow has its own validation corpus.
- Do not show gain margin, phase margin, bandwidth, Bode, Nyquist, or pole-zero results for cases where the current implementation cannot justify them.
- Export simulation CSV, complete experiment JSON, chart PNG, and encoded share state. ECharts uses its SVG renderer, preserving vector plots in the DOM.

## Product risks identified

- Similar controller parameter names can represent different algorithms. Every export must state controller form and units.
- Apparent stability over a short simulation is not proof of closed-loop stability.
- Fixed-step integration can hide or introduce error if `dt` is poorly selected; convergence checks are therefore part of validation, not a one-time assertion.
- Relay and ultimate-gain methods can be unsafe on real plants. This project performs a simulated educational experiment only.
- A generic voltage/current calculation does not model all actuators. The UI labels that view accordingly.
