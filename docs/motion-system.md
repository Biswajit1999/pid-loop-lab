# Motion and interaction system

PID Loop Lab uses motion to expose causality, preserve spatial context, and make changing signals legible. It does not use motion as decoration.

## Principles

1. **Input produces response.** Gain and plant controls recompute the actual model; animated values only interpolate between simulation states.
2. **Signals travel.** The loop pulse communicates direction and changes identity for positive error, negative error, stable tracking, and saturation.
3. **Space preserves context.** Progressive controller levels, the command palette, and focus mode use restrained opacity, transform, and layout transitions.
4. **Time stays inspectable.** Plot cursors, the playback scrubber, event markers, plant visuals, and the loop inspector share a selected simulation time.
5. **Reduced motion preserves information.** `prefers-reduced-motion` removes repeated and transitional movement while leaving state, colour, text, and final values intact.

## Tokens

| Purpose | Value | Use |
| --- | --- | --- |
| Immediate feedback | 160 ms | hover, press, border and colour response |
| State transition | 240 ms | disclosure, compact overlay changes |
| Entrance | 500–550 ms | major first-view hierarchy only |
| Loop pulse | 5.8 s linear | signal direction around the closed loop |
| Plant response spring | stiffness 190, damping 28 | state-linked physical plant motion |
| Standard easing | `ease-out` | non-physical UI transitions |

High-frequency visuals prefer `transform` and `opacity`. The simulation, playback cursor, chart rendering, and Motion animation state remain separate so the numerical model does not depend on display frame rate.

## Interaction contract

- Buttons respond on hover, press and focus without displacing adjacent controls.
- Important numeric controls support range dragging, typed entry, keyboard stepping, Shift+Arrow fine stepping, and double-click reset when a default is defined.
- `Space`, `R`, `N`, `F`, `C`, `A`, `?`, `Escape`, and Ctrl/Cmd+K are documented in the interface and ignored during ordinary form typing where appropriate.
- Focus mode is a spatial expansion of the response plot, not an unrelated modal destination.
- Colour is semantic: setpoint, process value, error, P, I, D, controller output, disturbance, warning and failure identities remain consistent.

## Performance boundaries

- The hero uses one deterministic batch simulation and a display cursor; it does not integrate the plant on every animation frame.
- ECharts uses SVG rendering, LTTB sampling, `ResizeObserver`, and synchronized axis pointers.
- Plant visuals use small DOM/SVG compositions driven by the selected sample.
- Reduced-motion users receive static signal location and immediate layout changes rather than looping travel or spring movement.
