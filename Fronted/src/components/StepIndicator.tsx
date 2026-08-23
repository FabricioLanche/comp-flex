interface Props {
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
  onStepClick: (step: 1 | 2 | 3) => void;
}

const STEPS = [
  { num: 1 as const, label: 'Definir Tokens' },
  { num: 2 as const, label: 'Revisar Tokens' },
  { num: 3 as const, label: 'Probar Scanner' },
];

export default function StepIndicator({ currentStep, completedSteps, onStepClick }: Props) {
  return (
    <div className="px-10 pt-8 pb-5 shrink-0 border-b border-border">
      <div className="flex items-center justify-center">
        {STEPS.map((step, i) => {
          const isCompleted = completedSteps.includes(step.num);
          const isCurrent = step.num === currentStep;
          const isClickable = isCompleted || isCurrent;

          return (
            <div key={step.num} className="flex items-center">
              {/* Step circle + label */}
              <button
                onClick={() => isClickable && onStepClick(step.num)}
                disabled={!isClickable}
                className={`
                  flex flex-col items-center gap-2 group outline-none
                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {/* Circle */}
                <div
                  className={`
                    relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-200 border-2
                    ${isCompleted
                      ? 'bg-success border-success text-bg-deep'
                      : isCurrent
                        ? 'bg-accent border-accent text-white shadow-[0_0_0_4px_rgba(0,122,204,0.2)]'
                        : 'bg-transparent border-border text-text-muted'
                    }
                    ${isClickable && !isCurrent ? 'group-hover:border-text-secondary group-hover:text-text-secondary' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-4.5 h-4.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3.5 8 6.5 11 12.5 5" />
                    </svg>
                  ) : (
                    step.num
                  )}

                  {/* Pulse ring on current step */}
                  {isCurrent && (
                    <span className="absolute inset-0 rounded-full border-2 border-accent animate-ping opacity-20" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-[10px] font-medium tracking-wide whitespace-nowrap
                    sm:text-[11px]
                    ${isCurrent
                      ? 'text-accent'
                      : isCompleted
                        ? 'text-success'
                        : 'text-text-muted'
                    }
                    ${isClickable && !isCurrent ? 'group-hover:text-text-secondary' : ''}
                  `}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line (not after last step) */}
              {i < STEPS.length - 1 && (
                <div className="relative w-10 sm:w-16 h-0.5 mx-2 mb-5">
                  {/* Background line */}
                  <div className="absolute inset-0 bg-border rounded-full" />
                  {/* Filled line */}
                  <div
                    className={`
                      absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out
                      ${isCompleted ? 'w-full bg-success' : isCurrent ? 'w-1/2 bg-accent' : 'w-0'}
                    `}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
