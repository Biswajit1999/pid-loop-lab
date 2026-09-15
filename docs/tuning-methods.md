# PID tuning methods

All correlations below return the **standard/ideal form** `Kc`, `Ti`, `Td` and are converted for simulation with `Kp = Kc`, `Ki = Kc/Ti`, `Kd = Kc Td`. Time parameters are seconds; gains inherit the plant input/output scaling. A change of units or controller algorithm changes the numerical settings.

## FOPDT model

`G(s) = K exp(−θs)/(τs + 1)` with non-zero process gain `K`, time constant `τ > 0`, and dead time `θ > 0`.

| Method | Controller | `Kc` | `Ti` | `Td` | Assumptions and limitations |
|---|---|---:|---:|---:|---|
| Ziegler–Nichols reaction curve | P | `τ/(Kθ)` | — | — | Open-loop stable, monotonic reaction curve; quarter-amplitude-decay historical target. Aggressive baseline. |
|  | PI | `0.9τ/(Kθ)` | `3.33θ` | `0` | Same model and form. |
|  | PID | `1.2τ/(Kθ)` | `2θ` | `0.5θ` | Same model and form. |
| Cohen–Coon | P | `(τ/Kθ)(1 + θ/3τ)` | — | — | Single-capacity self-regulating process with delay; intended to account for delay ratio. |
|  | PI | `(τ/Kθ)(0.9 + θ/12τ)` | `θ(30+3θ/τ)/(9+20θ/τ)` | `0` | Caution for very dead-time-dominant, noisy, nonlinear, or constrained plants. |
|  | PID | `(τ/Kθ)(4/3 + θ/4τ)` | `θ(32+6θ/τ)/(13+8θ/τ)` | `4θ/(11+2θ/τ)` | Same limitations. |
| CHR 0% overshoot, setpoint | P | `0.3τ/(Kθ)` | — | — | Self-regulating FOPDT; one specific CHR objective, not the disturbance or 20% table. |
|  | PI | `0.35τ/(Kθ)` | `1.2τ` | `0` | Standard/ideal form. |
|  | PID | `0.6τ/(Kθ)` | `τ` | `0.5θ` | Standard/ideal form. |
| IMC / Lambda | PI | `τ/[K(λ+θ)]` | `τ` | `0` | Stable FOPDT approximation; `λ > 0` selects nominal speed/robustness. Model mismatch and constraints still matter. |
| IMC approximation | PID | `(τ+θ/2)/[K(λ+θ/2)]` | `τ+θ/2` | `τθ/(2τ+θ)` | Stable FOPDT and stated approximation. |
| Skogestad SIMC | PI | `τ/[K(τc+θ)]` | `min[τ, 4(τc+θ)]` | `0` | Stable FOPDT; `τc > 0`. The modified integral time improves disturbance behaviour. |

Sources: Ziegler & Nichols (1942); Cohen & Coon (1953); Chien, Hrones & Reswick (1952); Rivera, Morari & Skogestad (1986), [doi:10.1021/i200032a041](https://doi.org/10.1021/i200032a041); Skogestad (2003), [doi:10.1016/S0959-1524(02)00062-8](https://doi.org/10.1016/S0959-1524(02)00062-8).

## Ultimate-cycle methods

These require a measured/simulated ultimate gain `Ku > 0` and period `Pu > 0`. A real sustained-oscillation experiment can be unsafe. PID Loop Lab uses it only in simulation.

| Method | Controller | `Kc` | `Ti` | `Td` | Limitations |
|---|---|---:|---:|---:|---|
| Ziegler–Nichols ultimate | P | `0.5Ku` | — | — | Requires a meaningful ultimate cycle; aggressive historical target. |
|  | PI | `0.45Ku` | `Pu/1.2` | `0` | Ideal/ISA form. |
|  | PID | `0.6Ku` | `Pu/2` | `Pu/8` | Ideal/ISA form. |
| Tyreus–Luyben | PI | `Ku/3.2` | `2.2Pu` | `0` | Conservative heuristic; the project does not apply it to P-only control. |
|  | PID | `Ku/2.2` | `2.2Pu` | `Pu/6.3` | Verify plant class, robustness, noise, and constraints. |

## Relay-feedback estimate

For a symmetric ideal relay with output amplitude `d` producing an approximately sinusoidal process oscillation of amplitude `a`, the describing-function estimate is:

`Ku = 4d/(πa)` and `Pu = measured oscillation period`.

This is based on Åström & Hägglund (1984), [doi:10.1016/0005-1098(84)90014-1](https://doi.org/10.1016/0005-1098(84)90014-1). The approximation can be biased by hysteresis, nonsinusoidal response, noise, asymmetry, drift, higher harmonics, saturation, or process nonlinearity.

## Methods deliberately not generalized

- SIMC is exposed for the implemented stable FOPDT PI case. Asking for PID retains the published first-order PI structure with `Kd = 0` and emits a warning.
- AMIGO is not shipped in v1 because it needs a separate audited implementation and validation set.
- Frequency-response and model-identification tuning are not inferred from imported CSV data in v1.
- No method is declared the universal winner. The comparison table reports response and effort measures so users can judge a purpose-specific trade-off.
