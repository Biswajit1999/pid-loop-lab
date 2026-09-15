# Tuning-method validation

## Strategy

Each rule is tested at a simple reference point where the expected standard-form and converted parallel-form values can be calculated independently. These are equation checks, not proofs of universal closed-loop performance.

Reference FOPDT case: `K = 2`, `τ = 5 s`, `θ = 1 s`.

| Rule | Controller | Expected standard form | Expected parallel form |
|---|---|---|---|
| ZN reaction | PID | `Kc = 3`, `Ti = 2 s`, `Td = 0.5 s` | `Kp = 3`, `Ki = 1.5 s⁻¹`, `Kd = 1.5 s` |
| Cohen–Coon | PI | `Kc = 2.291666…`, `Ti = 2.55… s` | `Ki = Kc/Ti`, `Kd = 0` |
| CHR 0% setpoint | PID | `Kc = 1.5`, `Ti = 5 s`, `Td = 0.5 s` | `Kp = 1.5`, `Ki = 0.3 s⁻¹`, `Kd = 0.75 s` |
| IMC, `λ = 2 s` | PI | `Kc = 5/[2(2+1)] = 0.833333…`, `Ti = 5 s` | `Ki = 0.166666… s⁻¹` |
| SIMC, `τc = 2 s` | PI | `Kc = 0.833333…`, `Ti = min(5,12) = 5 s` | `Ki = 0.166666… s⁻¹` |

Ultimate case: `Ku = 4`, `Pu = 3 s`.

| Rule | Controller | Expected standard form |
|---|---|---|
| ZN ultimate | PID | `Kc = 2.4`, `Ti = 1.5 s`, `Td = 0.375 s` |
| Tyreus–Luyben | PI | `Kc = 1.25`, `Ti = 6.6 s`, `Td = 0` |
| Relay estimate | — | with `d = 1`, `a = 0.5`: `Ku = 8/π` |

Automated assertions are in `tests/tuning.test.ts`.

## Applicability validation

The public API rejects:

- `K = 0`, non-positive `τ`, or non-positive `θ` for FOPDT correlations.
- non-positive or non-finite `λ` / `τc`.
- non-positive `Ku` or `Pu`.
- P-only Tyreus–Luyben requests.
- non-positive relay amplitude, response amplitude, or measured period.

## Controller-form validation

Round-trip tests verify `Kc, Ti, Td → Kp, Ki, Kd → Kc, Ti, Td` for valid non-zero P/I controllers. Conversion rejects missing divisions such as `Ki = 0` in the inverse mapping.

## Numerical validation boundaries

The tuning equations can be correct while their candidate response is poor because of plant mismatch, saturation, noise, delay error, or nonlinear dynamics. The comparison lab therefore reports metrics and warnings rather than ranking a universal winner.

## Source reconciliation notes

- ZN values correspond to the ideal/standard form reported in the 1942 paper and commonly reproduced tables.
- CHR has multiple tables (setpoint/disturbance and 0%/20% overshoot). The implementation names one explicit table: **0% overshoot setpoint**.
- The FOPDT SIMC implementation is PI. A UI PID request is reduced to PI and is visibly warned, not silently decorated with derivative action.
- The relay critical-gain estimate is a describing-function approximation from the 1984 Åström–Hägglund approach; it is not an exact nonlinear identification result.
