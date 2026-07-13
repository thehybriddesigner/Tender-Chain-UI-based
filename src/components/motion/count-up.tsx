// Animated numeric counter — respects prefers-reduced-motion via useCountUp.
import * as React from "react";
import { useCountUp } from "@/hooks/use-count-up";

interface Props {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({ value, duration = 1200, format, prefix, suffix, className }: Props) {
  const animated = useCountUp(value, duration);
  const rendered = format
    ? format(animated)
    : Math.round(animated).toLocaleString("en-US");
  return (
    <span className={className}>
      {prefix}
      {rendered}
      {suffix}
    </span>
  );
}
