import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  tone?: "primary" | "accent" | "success" | "warning";
}

const TONE_FILL: Record<NonNullable<ProgressProps["tone"]>, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value, tone = "primary", ...props }, ref) => (
  <div
    ref={ref}
    role="progressbar"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={100}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary-soft",
      className
    )}
    {...props}
  >
    <div
      className={cn("relative flex h-full overflow-hidden rounded-full", TONE_FILL[tone])}
      style={{ transform: `translatex(-${100 - (value ?? 0)}%)` }}
    >
      <span className="absolute left-0 full h-full" />
    </div>
  </div>
));
Progress.displayName = "Progress";

export { Progress };
