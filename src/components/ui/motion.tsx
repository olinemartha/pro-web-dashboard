import * as React from "react";
import { cn } from "@/lib/utils";

/** Vrai si l'utilisateur a demandé de réduire les animations. */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Apparition douce (fondu + léger glissement vers le haut).
 * `delay` en millisecondes permet d'échelonner une série d'éléments.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  style,
  children,
  ...props
}: {
  as?: "div" | "section" | "li" | "aside";
  delay?: number;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn("animate-fade-up", className)}
      style={{ ...style, ["--delay" as string]: `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Compteur qui monte doucement jusqu'à la valeur (immédiat sous reduced-motion). */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = React.useState(() => (prefersReducedMotion() ? target : 0));

  React.useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const current = useCountUp(value);
  return (
    <span className="tabular-nums" aria-label={`${value}${suffix}`}>
      {current}
      {suffix}
    </span>
  );
}
