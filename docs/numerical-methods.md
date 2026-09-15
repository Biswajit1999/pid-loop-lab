# Numerical methods

## Three clocks

1. `dt`: fixed plant integration step.
2. `Ts`: discrete controller sample period, constrained to `Ts ≥ dt`.
3. Browser render/playback interval: presentation only and never part of the numerical model.

The simulator first computes a deterministic batch. Play, pause, speed, scrub, and replay move through stored samples without changing the solution.

## Plant integration

Continuous state models use classical fixed-step fourth-order Runge–Kutta (RK4):

`x[k+1] = x[k] + dt/6 (k1 + 2k2 + 2k3 + k4)`.

Input is held constant across an RK4 step. The library includes first order, FOPDT, second order, integrating, mass–spring–damper, DC motor, generic thermal/inertial, and strictly proper transfer-function companion realizations.

## Dead time

FOPDT input dead time uses a circular sample buffer. The effective delay is rounded to the nearest integer number of plant steps: `N = round(θ/dt)`. Therefore the delay discretization error is at most `dt/2` before floating-point effects.

## Sensor and actuator path

- Sensor lag uses a fixed-step first-order update.
- Measurement noise is Gaussian from a seeded linear-congruential generator, making repeated runs reproducible.
- Quantization rounds to the configured interval.
- Controller timing jitter is seeded and changes the next update interval while respecting a minimum of one plant step.
- Slew limiting bounds the change in applied actuator command per plant step.
- A load disturbance is added at the plant input from its configured event time.

## Safety guards

The engine rejects non-positive/non-finite steps, `Ts < dt`, non-positive duration, over two million steps, invalid plant parameters, and improper transfer functions. It terminates with `divergent` status if state/output becomes non-finite or exceeds the configured magnitude guard.

The guard is a numerical containment measure. It is not a mathematical stability proof. A completed finite-duration run likewise does not prove stability.

## Convergence expectations

For a well-resolved smooth problem, RK4 global error decreases approximately with `dt^4`. Discontinuities from dead-time-buffer switching, relay output, saturation, quantization, or sampled control reduce that ideal behaviour. Validation therefore compares analytic plant cases and explicit implementation invariants rather than assuming fourth-order convergence everywhere.
