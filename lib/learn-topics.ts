export type LearnTopic = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  equation: string;
  introduction: string;
  sections: { heading: string; body: string }[];
  takeaways: string[];
  mission?: string;
};

export const learnTopics: LearnTopic[] = [
  {
    slug: "pid-controller",
    eyebrow: "FOUNDATIONS",
    title: "PID controller: the complete visual guide",
    description: "Understand proportional, integral and derivative control through the signals inside a real closed loop.",
    equation: "u(t)=K_p e(t)+K_i\\int e(t)\\,dt+K_d\\frac{de(t)}{dt}",
    introduction: "A PID controller repeatedly compares a desired setpoint with a measured process value. It combines the present error, accumulated error and rate of change into a command for the actuator.",
    sections: [
      { heading: "The feedback loop", body: "The controller is only one part of the system. The actuator applies its command to a plant, a sensor measures the result, and that measurement returns to the controller. Delay, saturation, noise and sample time all change what tuning can achieve." },
      { heading: "Three different jobs", body: "Proportional action supplies immediate correction. Integral action removes persistent offset. Derivative action adds damping by reacting to movement, but it must be filtered because measurements are never perfectly clean." },
      { heading: "A tuning is a trade-off", body: "A faster rise is not automatically better. A useful tuning balances tracking, disturbance rejection, overshoot, actuator effort, robustness and measurement sensitivity for the actual plant." },
    ],
    takeaways: ["Tune against a plant model, not gains in isolation.", "Inspect actuator limits as well as the response curve.", "Change one mechanism at a time and compare metrics."],
    mission: "first-stable-loop",
  },
  {
    slug: "proportional-control",
    eyebrow: "THE PRESENT",
    title: "Proportional control without the guesswork",
    description: "See how proportional gain changes speed, offset, damping and actuator demand in a feedback loop.",
    equation: "P(t)=K_p\\left(\\beta r(t)-y(t)\\right)",
    introduction: "Proportional action scales the current error. Increasing proportional gain usually makes the initial response stronger, but the plant dynamics decide when that extra authority becomes overshoot or oscillation.",
    sections: [
      { heading: "What Kp changes", body: "A larger proportional gain increases the immediate command for the same error. It can reduce rise time and improve disturbance rejection, while also reducing stability margin and increasing sensitivity to delay." },
      { heading: "Why offset remains", body: "On many self-regulating processes, a non-zero error is required to maintain a non-zero controller output. Proportional-only control therefore settles with offset when a constant load must be balanced." },
      { heading: "Setpoint weighting", body: "A two-degree-of-freedom controller can apply a weight to the setpoint inside the proportional term. This softens setpoint response without weakening the controller's reaction to disturbances in the measured process." },
    ],
    takeaways: ["Increase Kp until the response is authoritative but still well damped.", "Do not use integral action to hide an unstable proportional choice.", "Delay sharply limits safe proportional gain."],
    mission: "first-stable-loop",
  },
  {
    slug: "integral-windup",
    eyebrow: "THE MEMORY",
    title: "Integral windup and how to stop it",
    description: "Learn why an integral term keeps growing during saturation and compare practical anti-windup methods.",
    equation: "I(t)=K_i\\int_0^t e(\\tau)\\,d\\tau",
    introduction: "Integral action removes persistent error by accumulating it over time. During actuator saturation, however, the process cannot receive the requested command while the integrator may continue accumulating a correction that cannot be applied.",
    sections: [
      { heading: "The hidden mismatch", body: "Windup begins when the unclamped controller command differs from the applied actuator command. The response curve alone may not reveal this; plot both signals and the integral contribution." },
      { heading: "Conditional integration", body: "Clamping pauses integration when the output is saturated and the error would drive it farther into saturation. It is simple and often effective, but transitions can be abrupt." },
      { heading: "Back-calculation", body: "Back-calculation feeds the difference between limited and unlimited output into the integrator. The tracking gain controls how quickly the internal controller state follows the achievable actuator command." },
    ],
    takeaways: ["Always test the loop against realistic output limits.", "Anti-windup improves recovery; it does not create actuator authority.", "Compare unclamped output, applied output and integral state together."],
    mission: "stop-windup",
  },
  {
    slug: "derivative-noise",
    eyebrow: "THE DIRECTION",
    title: "Derivative control, filtering and noise",
    description: "Understand derivative kick, measurement mode and why an unfiltered derivative term amplifies sensor noise.",
    equation: "D(s)=K_d\\frac{s}{T_f s+1}",
    introduction: "Derivative action reacts to how quickly its input changes. It can add damping and anticipate motion, but differentiation also magnifies high-frequency measurement noise.",
    sections: [
      { heading: "Derivative on measurement", body: "Differentiating the measured process instead of the error avoids a large derivative kick when the setpoint changes instantly. The disturbance response remains useful because process movement is still visible." },
      { heading: "The filter time constant", body: "A first-order filter limits the derivative gain at high frequency. Too little filtering allows chatter; too much filtering removes the damping benefit and adds lag." },
      { heading: "Judge the actuator, not only the PV", body: "A process value can look smooth while the controller output moves rapidly. RMS effort and total controller variation reveal noise amplification that a response plot can hide." },
    ],
    takeaways: ["Use derivative on measurement for most setpoint-control applications.", "Keep the filter meaningful relative to sample time.", "Evaluate controller variation whenever measurement noise is present."],
    mission: "quiet-the-noise",
  },
  {
    slug: "ziegler-nichols",
    eyebrow: "CLASSIC TUNING",
    title: "Ziegler–Nichols PID tuning explained",
    description: "Use reaction-curve and ultimate-cycle tuning responsibly, with assumptions and limitations made explicit.",
    equation: "K_p=0.6K_u,\\quad T_i=0.5P_u,\\quad T_d=0.125P_u",
    introduction: "Ziegler–Nichols rules turn a few measured plant features into controller settings. They are historically important and useful as starting points, but often produce aggressive quarter-amplitude damping rather than a finished production tuning.",
    sections: [
      { heading: "Two different methods", body: "The reaction-curve method uses an open-loop FOPDT approximation. The ultimate-cycle method uses the gain and period of sustained closed-loop oscillation. Their inputs and risks are not interchangeable." },
      { heading: "Controller form matters", body: "Published coefficients may assume an ideal or standard PID form. PID Loop Lab converts results into its documented parallel PIDF form instead of silently copying gains between incompatible equations." },
      { heading: "Treat the result as a starting point", body: "After applying a rule, test output limits, delay uncertainty, noise and disturbances. A robust operating point usually needs less aggression than the textbook rule." },
    ],
    takeaways: ["Verify which Ziegler–Nichols method and PID form are being used.", "Do not force a real process to sustained oscillation without a safety plan.", "Compare classic rules with SIMC when robustness matters."],
  },
  {
    slug: "cohen-coon",
    eyebrow: "REACTION CURVE",
    title: "Cohen–Coon tuning for delayed processes",
    description: "Learn how Cohen–Coon uses process gain, time constant and dead time to tune an FOPDT model.",
    equation: "G(s)=\\frac{K e^{-\\theta s}}{\\tau s+1}",
    introduction: "Cohen–Coon tuning starts from a first-order-plus-dead-time model and adjusts its recommendation according to the ratio between delay and time constant.",
    sections: [
      { heading: "The model behind the rule", body: "The plant is summarized by process gain K, time constant τ and apparent delay θ. Identification quality matters as much as the arithmetic of the tuning rule." },
      { heading: "When it is useful", body: "The rule is intended for self-regulating processes and accounts for delay more explicitly than simple no-delay heuristics. It can still be aggressive when uncertainty or actuator constraints are large." },
      { heading: "Validation after tuning", body: "Use the proposed gains in a closed-loop simulation, then increase delay and vary process gain to see whether acceptable behavior survives model error." },
    ],
    takeaways: ["Fit the FOPDT model over the operating region that matters.", "Check the dead-time-to-time-constant ratio.", "Stress-test the result before deployment."],
    mission: "tame-the-delay",
  },
  {
    slug: "simc-tuning",
    eyebrow: "ROBUST TUNING",
    title: "SIMC tuning and the closed-loop time constant",
    description: "Understand how SIMC exposes the speed-versus-robustness decision through one interpretable parameter.",
    equation: "K_c=\\frac{1}{K}\\frac{\\tau}{\\tau_c+\\theta}",
    introduction: "SIMC tuning is attractive because it makes the desired closed-loop time constant explicit. A larger τc gives slower but more robust behavior; a smaller value increases speed and sensitivity.",
    sections: [
      { heading: "A visible design choice", body: "Instead of returning one apparently authoritative answer, SIMC lets the engineer select a response timescale. That makes the robustness trade-off easier to discuss and document." },
      { heading: "Default robustness", body: "A common conservative starting point relates τc to the process dead time. Very small τc values demand bandwidth that a delayed plant and real actuator may not provide safely." },
      { heading: "Beyond nominal performance", body: "Compare the nominal result with increased delay, sensor noise and actuator saturation. The best nominal IAE is rarely the only relevant objective." },
    ],
    takeaways: ["Treat τc as an engineering decision, not a hidden constant.", "Use slower tuning when dead time or uncertainty is significant.", "Document the model and design target with the gains."],
    mission: "tame-the-delay",
  },
  {
    slug: "first-order-system",
    eyebrow: "PLANT DYNAMICS",
    title: "First-order systems and time constants",
    description: "Connect gain and time constant to a process step response and closed-loop tuning decisions.",
    equation: "G(s)=\\frac{K}{\\tau s+1}",
    introduction: "A first-order model describes a process that moves exponentially toward a new steady value. Its gain determines how far it moves and its time constant determines how quickly.",
    sections: [
      { heading: "The 63.2 percent point", body: "After one time constant, an ideal first-order response has completed about 63.2 percent of its total change. After roughly four time constants it is close to steady state." },
      { heading: "Process gain", body: "The steady change in output divided by the applied input change estimates K. Its sign also determines whether increasing the actuator raises or lowers the measured process." },
      { heading: "Why delay changes everything", body: "Adding dead time does not change the final gain but postpones feedback. The controller acts without seeing the result, reducing the gain and bandwidth that remain safe." },
    ],
    takeaways: ["Estimate gain from steady-state change.", "Estimate τ from the shape after the response begins.", "Separate dead time from the dynamic time constant."],
    mission: "first-stable-loop",
  },
];

export function getLearnTopic(slug: string): LearnTopic | undefined {
  return learnTopics.find((topic) => topic.slug === slug);
}
