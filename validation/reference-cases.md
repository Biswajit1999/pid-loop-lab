# Reference cases

Machine-readable tests are in `tests/`; this directory records the human-readable numerical corpus.

## First-order unit step

- Model: `G(s) = 1/(2s+1)`
- Input: unit step
- Expected at `t = 2 s`: `1 − exp(−1) = 0.6321205588`
- Numerical method: RK4, `dt = 0.01 s`
- Assertion tolerance: 7 decimal places

## FOPDT delay

- Model: `G(s) = exp(−0.5s)/(2s+1)`
- Plant step: `0.01 s`
- Expected: output remains exactly at the initial value before the delayed input leaves the circular buffer.

## Controller form

- Standard: `Kc = 3`, `Ti = 2 s`, `Td = 0.5 s`
- Parallel: `Kp = 3`, `Ki = 1.5 s⁻¹`, `Kd = 1.5 s`

## Relay estimate

- Relay amplitude: `d = 1`
- Process oscillation amplitude: `a = 0.5`
- Expected critical gain: `Ku = 4d/(πa) = 8/π`
