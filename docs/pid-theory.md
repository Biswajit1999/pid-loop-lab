# PID theory and practical interpretation

## The loop

Negative feedback compares setpoint `r` and measured output `y`, forming `e = r − y`. The controller produces `u`; an actuator modifies that command; a plant evolves; and a sensor closes the loop.

PID Loop Lab records these separately because controller output and physical actuator input are not interchangeable when saturation or slew limits are present.

## Proportional action

`uP = Kp(βr − y)` responds to current weighted error. Increasing `Kp` increases proportional loop gain, but the resulting rise time, overshoot, stability, and control effort depend on the plant and the rest of the loop. The application therefore shows a real computed response instead of a universal “more P does X” animation.

## Integral action

`uI[k] = clamp(uI[k−1] + Ki e[k] Ts)` accumulates sampled error. It can remove steady-state offset when the closed loop is stable and the actuator has enough authority. During saturation, an unconstrained integral state can keep growing—windup—delaying recovery. The lab exposes the integral contribution and supports conditional and back-calculation anti-windup.

## Derivative action

Ideal differentiation amplifies high-frequency noise. The implementation filters the derivative and allows differentiation of measurement rather than error. A step in setpoint has an impulsive ideal derivative; setting derivative setpoint weight `γ = 0` avoids that direct kick. See [MathWorks’ PI-D/I-PD explanation](https://www.mathworks.com/help/slcontrol/ug/create-i-pd-and-pi-d-controllers.html).

## Delay and sampling

Dead time contributes phase lag without changing steady-state gain. A sampled controller observes and acts only at discrete instants, holding its output between updates. A plant can therefore evolve substantially between samples even when the chart renders smoothly. Plant step, sample time, and frame rate are separate in this project.

## Metrics

- Rise time: first 10% to first 90% crossing, for a non-zero final step amplitude.
- Peak time: time of the extremum in the commanded direction.
- Overshoot: amount the directional peak exceeds the final setpoint, normalized by step amplitude.
- Settling time: first time after which all remaining samples stay inside a 2% band around the final setpoint.
- Steady-state error: final setpoint minus mean PV over the last 5% of samples.
- `IAE = ∫|e|dt`, `ISE = ∫e²dt`, `ITAE = ∫t|e|dt`.
- RMS error and RMS applied actuator effort use time-integrated squares.
- Total controller variation is `Σ|u[k] − u[k−1]|` for the applied actuator signal.
- Saturation percentage counts controller samples whose unclamped sum differs from the bounded output.

Undefined conditions return “not defined.” A finite number is never manufactured merely to fill a card.

## Limits of interpretation

The simulator is a deterministic numerical model. Results are conditional on equations, parameters, discretization, and runtime limits. They are not direct evidence that a physical loop is stable, safe, robust, or correctly instrumented.
