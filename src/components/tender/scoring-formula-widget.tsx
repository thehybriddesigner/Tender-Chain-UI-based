import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  priceWeight: number;
  timelineWeight: number;
  qualityWeight: number;
  className?: string;
  variant?: "full" | "compact";
}

const COLORS = {
  price: "var(--brand-purple)",
  timeline: "var(--brand-green)",
  quality: "var(--brand-sky)",
};

export function ScoringFormulaWidget({
  priceWeight,
  timelineWeight,
  qualityWeight,
  className,
  variant = "full",
}: Props) {
  const data = [
    { name: "Price", value: priceWeight, color: COLORS.price },
    { name: "Timeline", value: timelineWeight, color: COLORS.timeline },
    { name: "Quality", value: qualityWeight, color: COLORS.quality },
  ].filter((d) => d.value > 0);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4",
        variant === "full" && "flex items-center gap-4",
        className,
      )}
    >
      <div className="relative size-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={28}
              outerRadius={44}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Locked
          </span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Scoring Formula
        </div>
        <div className="mt-2 space-y-1.5 text-sm">
          <FormulaRow color={COLORS.price} label="Price" weight={priceWeight} />
          <FormulaRow color={COLORS.timeline} label="Timeline" weight={timelineWeight} />
          {qualityWeight > 0 && (
            <FormulaRow color={COLORS.quality} label="Quality" weight={qualityWeight} />
          )}
        </div>
        <p className="mt-2 text-[11px] leading-tight text-muted-foreground">
          Fixed on-chain at publication. Cannot be changed after bidding opens.
        </p>
      </div>
    </div>
  );
}

function FormulaRow({ color, label, weight }: { color: string; label: string; weight: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-foreground">{label}</span>
      </div>
      <span className="font-mono text-sm font-semibold">{weight}%</span>
    </div>
  );
}
