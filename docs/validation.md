# Validation details

See the repository-level [VALIDATION.md](../VALIDATION.md) for the release gate and command results.

## Automated coverage map

| Area | Test evidence |
|---|---|
| First-order plant | Open-loop numerical result against `1 − exp(−t/τ)` |
| Second-order plant | Finite, directionally correct step response and damping behavior |
| PID terms | P-only output, integral accumulation, derivative-on-measurement calculation |
| Filtering | Derivative response is attenuated for `Tf > 0` |
| Constraints | Output saturation, conditional anti-windup, back-calculation, integrator limits, slew rate |
| Delay | FOPDT remains unchanged before its discrete delay elapses |
| Form conversion | Standard/parallel equation identities and invalid-input rejection |
| Metrics | Rise/settling/error integrals and undefined cases |
| Tuning | Published-correlation equation cases plus eligibility rejection |
| CSV | Required mapping, increasing time, delimiter handling, malformed input |

## Manual release checks

- Desktop workstation layout at 1440 px and 1280 px.
- Tablet restructuring at 1024 px and 768 px.
- Mobile stacking at 375 px with no document-level horizontal overflow.
- Light and dark themes.
- Keyboard: `Space` play/pause, `R` reset timeline, `N` single step when focus is outside a form control.
- Reduced-motion media query.
- Chart hover/crosshair, legend toggles, zoom/pan, reset, PNG export, CSV/JSON export.
- Invalid transfer-function, sample-time, and divergence states render an explanatory message instead of `NaN`.

## Known validation gaps

- No certified reference implementation is used for bit-identical industrial controller comparison.
- No browser matrix beyond current Chromium is automated in v1.
- Advanced frequency-domain features are documented but intentionally not represented as complete.
- CSV-based FOPDT identification is withheld pending a validated optimization and residual-analysis workflow.
