# Contributing

Thank you for improving PID Loop Lab.

## Before opening a pull request

1. Open an issue for substantial numerical, architecture, or UX changes.
2. Keep each pull request focused.
3. Run `npm run validate`.
4. Describe how the change was manually checked at desktop, tablet, and mobile widths when it affects UI.

## Scientific requirements

New models or tuning rules must state:

- governing equations and controller form;
- assumptions and applicable plant class;
- units and scaling conventions;
- primary or authoritative source;
- known limitations and failure modes;
- at least one independently calculated reference case when possible.

Do not add a numerical feature that only looks plausible. Unsupported values should remain unavailable and be explained.

## Code style

- Keep the deterministic numerical layer in `lib/` independent of React.
- Avoid tying plant step, controller sample period, and animation frame rate together.
- Preserve seeded reproducibility for stochastic effects.
- Add accessible names, visible labels, focus states, and a non-colour indicator for interactive states.
- Respect reduced motion and avoid re-rendering chart component trees per sample.

By contributing, you agree that your contribution is licensed under the MIT License.
