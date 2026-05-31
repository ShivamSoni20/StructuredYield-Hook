import { CheckCircle2, Circle } from "lucide-react";

const steps = ["Deposit", "Fee accrual", "IL coverage", "Maturity"];

export function MaturityTimeline() {
  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {steps.map((step, index) => {
        const complete = index < 2;
        const Icon = complete ? CheckCircle2 : Circle;

        return (
          <li key={step} className="rounded-lg border bg-card p-4">
            <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">{step}</p>
            <p className="mt-1 text-xs text-muted-foreground">{complete ? "Complete" : "Pending"}</p>
          </li>
        );
      })}
    </ol>
  );
}

