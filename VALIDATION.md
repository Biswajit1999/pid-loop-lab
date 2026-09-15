# Validation report

Release: 1.0.0  
Owner: Biswajit Jana  
Date: 15 September 2026

## Quality gates

The release is accepted only when all commands succeed from a clean dependency install:

```text
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Release gate result on Node.js 24.19.0:

| Command | Result |
|---|---|
| `npm install` | passed; 409 packages audited, 0 vulnerabilities |
| `npm run lint` | passed; 0 errors, 0 warnings |
| `npm run typecheck` | passed |
| `npm test` | passed; 5 files, 26 tests |
| `npm run build` | passed; 5 application routes statically prerendered |

## Validated claims

- Plant dynamics are integrated from explicit state derivatives with fixed-step RK4.
- Controller sampling is independent of the plant integration step.
- Noise and jitter reproduce exactly for the same seed and configuration.
- Dead time uses a circular buffer with a documented step-quantization error.
- P, I, filtered D, unclamped output, bounded output, and slew-limited actuator are distinct signals.
- Conditional and back-calculation anti-windup alter the integral state in their documented direction.
- Tuning method reference cases match independently calculated equations.
- Invalid configurations return a controlled error state; divergence returns a controlled divergent state.

## Important non-claims

This validation is software verification against documented equations and reference cases. It is not certification for a safety-related controller, formal proof of closed-loop stability, validation against every vendor PID form, or evidence that a candidate tuning is safe for a physical plant.

## Manual inspection matrix

| Check | Target |
|---|---|
| Desktop | 1440 × 900 and 1280 × 800 |
| Tablet | 1024 × 768 and 768 × 1024 |
| Mobile | 375 × 812 |
| Themes | light and dark |
| Motion | normal and `prefers-reduced-motion` |
| Keyboard | tab order, focus visibility, Space/R/N shortcuts |
| Charts | hover, crosshair, zoom, pan, legend toggle, reset, PNG export |
| Export | CSV, JSON, share URL, Python example |
| Guard states | invalid `dt`, invalid transfer function, divergent response |

Manual Chromium QA passed at 1440-class desktop, 768 × 1024 tablet, and 375 × 812 mobile viewports. The inspection included the landing page, responsive main lab, saturation preset, metrics panel, transfer-function rejection, autotuning selection limit and overlay update, PID teaching preset, theme rendering, document-width overflow checks, and post-fix browser console review.

See [docs/validation.md](docs/validation.md) and [docs/method-validation.md](docs/method-validation.md) for the test map and equation cases.
