# References

Stable links and identifiers used for implementation decisions. Accessed 15 September 2026 unless otherwise noted.

## Primary and peer-reviewed sources

1. J. G. Ziegler and N. B. Nichols, “Optimum Settings for Automatic Controllers,” *Transactions of the ASME*, vol. 64, pp. 759–768, 1942. [Authorised reproduction](https://files.engineering.com/files/70fa8133-77a7-449c-9f6b-6981918a352e/Optimum_Settings_for_Automatic_Controllers_-_Zeigler-Nichols.pdf).
2. G. H. Cohen and G. A. Coon, “Theoretical Consideration of Retarded Control,” *Transactions of the ASME*, vol. 75, pp. 827–834, 1953. [Scanned paper](https://skoge.folk.ntnu.no/puublications_others/1953_Cohen%20and%20Coon%20-%20Theoretical%20Consideration%20of%20Retarded%20Control.pdf).
3. K. L. Chien, J. A. Hrones, and J. B. Reswick, “On the Automatic Control of Generalized Passive Systems,” *Transactions of the ASME*, vol. 74, pp. 175–185, 1952.
4. D. E. Rivera, M. Morari, and S. Skogestad, “Internal Model Control. 4. PID Controller Design,” *Industrial & Engineering Chemistry Process Design and Development*, 25(1), 252–265, 1986. [doi:10.1021/i200032a041](https://doi.org/10.1021/i200032a041); [author-hosted paper](https://skoge.folk.ntnu.no/publications/1986/Rivera86/Rivera86.pdf).
5. S. Skogestad, “Simple analytic rules for model reduction and PID controller tuning,” *Journal of Process Control*, 13(4), 291–309, 2003. [doi:10.1016/S0959-1524(02)00062-8](https://doi.org/10.1016/S0959-1524(02)00062-8); [author manuscript](https://skoge.folk.ntnu.no/publications/2003/tuningPID/more/old-final_submiited_to_journal_sep2002/tuningshort.pdf).
6. K. J. Åström and T. Hägglund, “Automatic tuning of simple regulators with specifications on phase and amplitude margins,” *Automatica*, 20(5), 645–651, 1984. [doi:10.1016/0005-1098(84)90014-1](https://doi.org/10.1016/0005-1098(84)90014-1); [Lund University repository](https://lup.lub.lu.se/search/ws/files/6340936/8509157.pdf).
7. K. J. Åström and R. M. Murray, *Feedback Systems: An Introduction for Scientists and Engineers*, Princeton University Press, 2008. [CaltechAUTHORS](https://authors.library.caltech.edu/records/yzs24-xsx88).
8. K. J. Åström and T. Hägglund, *Advanced PID Control*, ISA, 2006. Cited by MathWorks’ anti-windup implementation notes.

## University and industrial documentation

9. MathWorks, [PID Tuner](https://www.mathworks.com/help/control/ref/pidtuner-app.html), including controller types, forms, time/frequency analysis, and plant eligibility.
10. MathWorks, [Parallel-form PID model](https://www.mathworks.com/help/control/ref/pid.html), including derivative-filter time constant `Tf`.
11. MathWorks, [Two-degree-of-freedom PID controllers](https://www.mathworks.com/help/control/ug/two-degree-of-freedom-2-dof-pid-controllers.html), including `b`/`c` setpoint weights and parallel/standard forms.
12. MathWorks, [Anti-windup control using a PID controller](https://www.mathworks.com/help/simulink/slref/anti-windup-control-using-a-pid-controller.html), including clamping and back-calculation.
13. MathWorks, [PI-D and I-PD controllers](https://www.mathworks.com/help/slcontrol/ug/create-i-pd-and-pi-d-controllers.html), including setpoint-step effects on proportional and derivative action.
14. NI, [The PID Controller & Theory Explained](https://www.ni.com/en/shop/labview/pid-theory-explained.html), including output limiting, anti-windup, and bumpless behaviour in practical implementations.
15. APMonitor/BYU, [Temperature Control Lab](https://apmonitor.com/che436/uploads/Main/temperature_control_lab.pdf), an experimental example connecting process response, tuning, and implementation.
16. Control Guru, [PID control and derivative on measurement](https://controlguru.com/pid-control-and-derivative-on-measurement/), used as a practical explanatory source for derivative kick; the governing controller form is cross-checked against MathWorks 2-DOF documentation.

## Software landscape

17. [TURIX Lab PID Tuning](https://turixlab.com/landing/pid-tuning).
18. [PID-tuner.com](https://www.pid-tuner.com/).
19. [Neutron STEM Control System Simulator](https://neutronstemlab.com/tools/controls/control-system-simulator/).
20. [Control Loop Lab](https://stevenfoerster.com/lab/control-loop/).
21. [Control Playground](https://control.terrypacker.com/).
22. [Skythinker616/pid-simulator-web](https://github.com/Skythinker616/pid-simulator-web).

## Citation policy

Formulas in the application are not attributed to search snippets or informal summaries. A rule is implemented only when its original or authoritative source and controller form can be reconciled. Secondary sources are used for UX landscape and plain-language explanation, not to silently override primary equations.
