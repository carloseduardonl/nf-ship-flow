import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormStepperProps {
  currentStep: number;
  totalSteps: number;
}

export function FormStepper({ currentStep, totalSteps }: FormStepperProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  step < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : step === currentStep
                    ? "border-primary text-primary"
                    : "border-muted-foreground/25 text-muted-foreground"
                )}
              >
                {step < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
              </div>
              <p
                className={cn(
                  "text-xs mt-2 font-medium",
                  step === currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step === 1
                  ? "Dados da NF"
                  : step === 2
                  ? "Entrega"
                  : "Comprador"}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors",
                  step < currentStep
                    ? "bg-primary"
                    : "bg-muted-foreground/25"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
