# Add a plant model

Plant models live in `lib/plants.ts` and share the `PlantModel` interface: state, output, derivative, and state replacement. The simulator integrates the derivative with RK4.

## Implementation path

1. Add the model name to `PlantKind` in `lib/types.ts`.
2. Add its configuration values to `PlantConfig` and safe defaults to `defaultPlant`.
3. Add a `createPlant` case. Validate every denominator, mass, time constant, or other quantity that must be positive.
4. Add labelled controls in `components/LabWorkspace.tsx`. Include units and realistic limits.
5. Add a visual representation only if it clarifies the state; the numerical model is the source of truth.
6. Add analytical or invariant tests in `tests/plants.test.ts` and a closed-loop test if the dynamics affect the simulator.
7. Document the governing equation, units, assumptions, and a primary reference.

## Review checklist

- State derivatives have consistent units.
- The zero-input and steady-state behaviour are tested.
- Invalid parameters fail clearly instead of returning fabricated data.
- Simulation remains deterministic for a fixed configuration and seed.
- The UI does not imply that an educational abstraction is a hardware-ready model.
