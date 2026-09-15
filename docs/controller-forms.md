# Controller forms and units

## Signals

- `r`: setpoint, in process-variable units.
- `y`: measured process value, in the same units as `r`.
- `e = r − y`: control error.
- `u`: controller command, in actuator-command units.

## Parallel form implemented by the engine

The unfiltered conceptual controller is

`u = Kp(βr − y) + Ki ∫(r − y)dt + Kd d(γr − y)/dt`.

For a dimensional plant:

- `Kp`: actuator units / process-variable units.
- `Ki`: actuator units / (process-variable units · second).
- `Kd`: actuator units · second / process-variable units.
- `Tf`: seconds.
- `β`, `γ`: dimensionless.

The filtered derivative is a first-order low-pass realization of `Kd s/(Tf s + 1)`. Discrete integration uses a forward rectangular update at the controller sample period. The plant continues to integrate at its independent RK4 step while the controller output is held.

## Standard / ISA form

`u = Kc[(βr − y) + (1/Ti)∫(r − y)dt + Td d(γr − y)/dt]`.

When all required parameters are finite and `Ti > 0`, conversion to the parallel gains is:

- `Kp = Kc`
- `Ki = Kc / Ti`
- `Kd = Kc Td`

The inverse conversion requires `Kp ≠ 0` and `Ki ≠ 0`:

- `Kc = Kp`
- `Ti = Kp / Ki`
- `Td = Kd / Kp`

This conversion is algebraic only. It does not reconcile vendor-specific proportional-band scaling, dependent/interacting algorithms, discrete integration conventions, or derivative-filter definitions.

## Derivative modes

- **On measurement**: derivative input is `−y`; this avoids derivative kick from a setpoint step.
- **On weighted error**: derivative input is `γr − y`; `γ = 1` is derivative on error and `γ = 0` is derivative on measurement.

See MathWorks’ [2-DOF PID representation](https://www.mathworks.com/help/control/ug/two-degree-of-freedom-2-dof-pid-controllers.html) and [PI-D/I-PD note](https://www.mathworks.com/help/slcontrol/ug/create-i-pd-and-pi-d-controllers.html).

## Saturation and anti-windup

The engine computes an unclamped sum and a bounded controller output. It then applies an independent actuator slew limit.

- **Off**: the integrator continues inside its own bounds.
- **Conditional/clamping**: integration pauses when the unsaturated command is beyond a limit and the error would drive it farther into that limit.
- **Back-calculation**: the integral update includes `Kb(usaturated − uunclamped)`; `Kb` has inverse-time units in this realization.

These structures follow the qualitative algorithms documented by MathWorks. They are not claimed to reproduce bit-for-bit behaviour of any PLC or vendor controller.
